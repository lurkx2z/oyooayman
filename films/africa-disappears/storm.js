/* =====================================================================
   SET · STORM — a container ship in the churned Atlantic as the ocean pours toward the basin. A heavy swell (crests
   ~12 m above the troughs), wind-torn foam, low spindrift (no rain: the sea is churned by the currents, not a
   storm). The ship pitches into the seas and the bow throws up walls of spray.
   This shot carries the film's first narration-free beat (3 s of water, ship and music).
   The sea is a sum of Gerstner waves, evaluated identically on the GPU (the surface) and the CPU (the ship's motion,
   the spray), so everything stays a pure function of time.
   ===================================================================== */

// [direction (deg, the way the wave travels), wavelength (m), height amplitude (m)]
const AF_WAVES = [[188, 170, 5.6], [200, 112, 3.6], [170, 74, 2.3], [215, 46, 1.25], [160, 27, 0.6], [195, 15, 0.3]];
const AF_G = 9.81;
function afWaveParams() {
  return AF_WAVES.map(([deg, L, A]) => { const k = 2 * Math.PI / L, a = MathX.deg(deg); return { dx: Math.cos(a), dz: Math.sin(a), k, c: Math.sqrt(AF_G / k), A, Q: 0.85 }; });
}
const AF_WP_ = afWaveParams();
// displacement of the surface point that started at (x, z)
function afWaveDisp(x, z, t, out) {
  let dx = 0, dy = 0, dz = 0;
  for (const w of AF_WP_) { const f = w.k * (w.dx * x + w.dz * z - w.c * t), cf = Math.cos(f); dx += w.Q * w.A * w.dx * cf; dz += w.Q * w.A * w.dz * cf; dy += w.A * Math.sin(f); }
  out[0] = dx; out[1] = dy; out[2] = dz; return out;
}
// the surface height above (x, z) (one fixed-point step inverts the horizontal displacement)
const _afD = [0, 0, 0];
function afWaveH(x, z, t) {
  afWaveDisp(x, z, t, _afD); const x1 = x - _afD[0], z1 = z - _afD[2];
  afWaveDisp(x1, z1, t, _afD); const x2 = x1 - (x1 + _afD[0] - x), z2 = z1 - (z1 + _afD[2] - z);
  return afWaveDisp(x2, z2, t, _afD)[1];
}

// the ship's motion on the waves (190 m × 30 m, 5.5 m/s): heave, pitch, roll and the bow's water height. Shared by
// the set and the sound (the bow slams are heard when they are seen)
function afShipPose(t) {
  const L = 190, B = 30, x0 = 5.5 * t, pts = [[L * 0.42, 0], [-L * 0.42, 0], [0, B * 0.45], [0, -B * 0.45], [0, 0], [L * 0.2, 0], [-L * 0.2, 0]];
  const hs = pts.map(([a, b]) => afWaveH(x0 + a, b, t));
  const heave = (hs[4] * 2 + hs[0] + hs[1] + hs[2] + hs[3] + hs[5] + hs[6]) / 8;
  const pitch = Math.atan2((hs[0] + hs[5]) / 2 - (hs[1] + hs[6]) / 2, L * 0.62) * 0.9;
  const roll = Math.atan2(hs[2] - hs[3], B * 0.9) * 0.6 + 0.04 * Math.sin(t * 0.7);
  return { x: x0, y: heave - 1.5, pitch, roll, bowH: hs[0] };
}
// how hard the bow is hitting the sea at time t (0…~2): the spray and the slam sounds both follow it
function afShipSlam(t) {
  const P = afShipPose(t), dropV = afShipPose(t + 0.1).bowH - P.bowH;
  return MathX.clamp((P.bowH - P.y - 1.0) / 4, 0, 1) + MathX.clamp(-dropV, 0, 1);
}

AF_SET_BUILDERS.storm = (app) => {
  const S = afSet(app, { sky: '#4a545c', fog: 0.0022, fogColor: '#58626a', fov: 46, sun: [-300, 220, -500], sunColor: '#c9d2da', sunI: 1.1,
    hemi: ['#8a96a2', '#202a30', 0.85], far: 9000, env: ['#7a8792', '#59646c', '#1e262c'] });
  const { scene, camera } = S;
  afSky(scene, '#2f383f', '#6d7880', '#3a444a', { sunDir: [-0.45, 0.25, -0.86], sunGlow: '#56606a', r: 6000 });
  // ---- the sea
  const NW = AF_WP_.length;
  const U = {
    uT: { value: 0 }, uCam: { value: new THREE.Vector2() }, uFogC: { value: new THREE.Color('#58626a') }, uFog: { value: 0.0022 },
    uW: { value: AF_WP_.map((w) => new THREE.Vector4(w.dx, w.dz, w.k, w.c)) }, uA: { value: AF_WP_.map((w) => new THREE.Vector2(w.A, w.Q)) },
    uSun: { value: new THREE.Vector3(-0.45, 0.25, -0.86).normalize() }, uShip: { value: new THREE.Vector4(0, 0, 1, 0) }, uSky: { value: new THREE.Color('#6d7880') },
  };
  const WAVE_GLSL = `
    uniform float uT; uniform vec4 uW[${NW}]; uniform vec2 uA[${NW}];
    vec3 waveDisp(vec2 p, out vec3 nrm, out float jac){
      vec3 d = vec3(0.0); vec3 tx = vec3(1.0, 0.0, 0.0), tz = vec3(0.0, 0.0, 1.0);
      float jx = 1.0, jz = 1.0, jxz = 0.0;
      for (int i = 0; i < ${NW}; i++){
        vec2 dir = uW[i].xy; float k = uW[i].z, c = uW[i].w, A = uA[i].x, Q = uA[i].y;
        float f = k * (dot(dir, p) - c * uT), cf = cos(f), sf = sin(f);
        d += vec3(Q * A * dir.x * cf, A * sf, Q * A * dir.y * cf);
        // tangent derivatives
        tx += vec3(-Q * A * dir.x * dir.x * k * sf, A * dir.x * k * cf, -Q * A * dir.x * dir.y * k * sf);
        tz += vec3(-Q * A * dir.x * dir.y * k * sf, A * dir.y * k * cf, -Q * A * dir.y * dir.y * k * sf);
      }
      nrm = normalize(cross(tz, tx));
      jac = tx.x * tz.z - tx.z * tz.x;
      return d;
    }`;
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 560, 560), new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: WAVE_GLSL + `
      uniform vec2 uCam; varying vec3 vW; varying vec2 vP; varying float vJac; varying vec3 vN0;
      void main(){
        vec2 u = position.xy; vec2 g = sign(u) * pow(abs(u), vec2(2.0)) * 5200.0; g.y = -g.y;   // (flip so the grid faces up)
        vec2 p = g + floor(uCam / 8.0) * 8.0;
        vec3 n; float j; vec3 d = waveDisp(p, n, j);
        float fade = 1.0 - smoothstep(900.0, 2600.0, length(g));          // flatten far away (no aliasing at the horizon)
        vec3 w = vec3(p.x + d.x * fade, d.y * fade, p.y + d.z * fade);
        vW = w; vP = p; vJac = mix(1.0, j, fade); vN0 = normalize(mix(vec3(0.0, 1.0, 0.0), n, fade));
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: WAVE_GLSL + `
      uniform vec3 uFogC, uSun, uSky; uniform float uFog; uniform vec4 uShip;
      varying vec3 vW; varying vec2 vP; varying float vJac; varying vec3 vN0;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1,0)), f.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), f.x), f.y); }
      float fb(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * n2(p); p = p * 2.07 + 3.1; a *= 0.5; } return v; }
      void main(){
        vec3 nrm; float jac; waveDisp(vP, nrm, jac);
        float dist = length(cameraPosition - vW);
        nrm = normalize(mix(nrm, vN0, smoothstep(600.0, 2400.0, dist)));
        // chop: small wind ripples as a normal perturbation that fades with distance
        vec2 q = vP * 0.35 + vec2(uT * 0.6, uT * 0.2);
        float c1 = fb(q), c2 = fb(q + vec2(0.37, 0.0)), c3 = fb(q + vec2(0.0, 0.37));
        nrm = normalize(nrm + vec3(c1 - c2, 0.0, c1 - c3) * 2.4 * (1.0 - smoothstep(60.0, 500.0, dist)));
        vec3 v = normalize(cameraPosition - vW);
        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(nrm, v), 0.0), 5.0);
        vec3 deep = vec3(0.012, 0.03, 0.035), sss = vec3(0.04, 0.12, 0.1);
        float crest = smoothstep(2.0, 9.0, vW.y);
        vec3 col = mix(deep, sss, crest * 0.7 * max(dot(-v, uSun) * 0.5 + 0.5, 0.0));
        vec3 r = reflect(-v, nrm); r.y = abs(r.y);
        vec3 skyR = mix(uSky * 0.9, uSky * 0.55, smoothstep(0.0, 0.6, r.y));
        col = mix(col, skyR, fres);
        col += vec3(0.6, 0.65, 0.7) * pow(max(dot(r, uSun), 0.0), 60.0) * 0.25;
        // foam: where the surface folds (crests breaking), wind streaks, and the ship's wake
        float fold = smoothstep(0.62, 0.25, vJac);
        float streak = fb(vec2(vP.x * 0.03 + vP.y * 0.012, vP.y * 0.11 - vP.x * 0.02) + uT * 0.05);
        float foam = fold * (0.55 + 0.6 * fb(vP * 0.25 + uT * 0.3)) + smoothstep(0.62, 0.8, streak) * 0.35 * (0.4 + crest);
        vec2 sp = vP - uShip.xy; float along = dot(sp, vec2(uShip.z, uShip.w)), across = dot(sp, vec2(-uShip.w, uShip.z));
        float wake = smoothstep(26.0 + 0.12 * max(-along, 0.0), 6.0, abs(across)) * step(along, 70.0) * smoothstep(-900.0, -60.0, along);
        foam += wake * (0.5 + 0.5 * fb(vP * 0.2 - uT * 0.5)) * 0.9;
        foam = clamp(foam, 0.0, 1.0) * (1.0 - smoothstep(400.0, 1600.0, dist));
        col = mix(col, vec3(0.62, 0.66, 0.68), foam * 0.9);
        float fg = min(1.0 - exp(-uFog * dist * 1.3), 0.94);
        col = mix(col, uFogC, fg);
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  sea.frustumCulled = false; scene.add(sea);
  // ---- the ship: a 190 m container ship (hull narrowing to a bow, deck stacks, the bridge aft)
  const ship = new THREE.Group(); scene.add(ship);
  const L = 190, B = 30;
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-L / 2, -B / 2); hullShape.lineTo(L / 2 - 38, -B / 2); hullShape.quadraticCurveTo(L / 2 - 6, -B / 2 + 2, L / 2, 0);
  hullShape.quadraticCurveTo(L / 2 - 6, B / 2 - 2, L / 2 - 38, B / 2); hullShape.lineTo(-L / 2, B / 2); hullShape.lineTo(-L / 2, -B / 2);
  const hullG = new THREE.ExtrudeGeometry(hullShape, { depth: 22, bevelEnabled: false }); hullG.rotateX(-Math.PI / 2); hullG.translate(0, -12, 0);
  const hullM = afMat('#26364a', { roughness: 0.5 }), redM = afMat('#6b211c', { roughness: 0.7 }), whiteM = afMat('#d7d5cf', { roughness: 0.6 });
  const hull = new THREE.Mesh(hullG, hullM); hull.castShadow = true; ship.add(hull);
  const boot = new THREE.Mesh(hullG, redM); boot.scale.set(1.004, 0.45, 1.01); boot.position.y = -6.6; ship.add(boot);
  const deckCols = ['#2d4a66', '#7a3029', '#bdbab2', '#3f5a4c', '#9a5a30', '#646a70', '#2a3448', '#857a44'];
  const cb = new THREE.BoxGeometry(12.2, 2.6, 2.44), cm = afMat('#ffffff', { roughness: 0.7 });
  const ci = new THREE.InstancedMesh(cb, cm, 1600), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), c = new THREE.Color();
  let n = 0;
  for (let bay = 0; bay < 10; bay++) for (let row = 0; row < 11; row++) {
    const x = -L / 2 + 42 + bay * 13.2, tiers = 3 + Math.floor(afR(bay * 20 + row, 2) * 4);
    const narrow = x > L / 2 - 45 ? Math.max(0, Math.floor((x - (L / 2 - 45)) / 6)) : 0;
    if (row < narrow || row > 10 - narrow) continue;
    for (let k = 0; k < tiers; k++) { ci.setMatrixAt(n, m4.compose(v.set(x, 10 + 1.3 + k * 2.6, -12.2 + row * 2.44), q, one)); ci.setColorAt(n, c.set(deckCols[Math.floor(afR(n, 5) * 8)]).multiplyScalar(0.6 + 0.2 * afR(n, 6))); n++; }
  }
  ci.count = n; ci.castShadow = true; ship.add(ci);
  afBox(14, 26, 28, whiteM, -L / 2 + 22, 23, 0, ship); afBox(10, 4, 34, whiteM, -L / 2 + 22, 34, 0, ship);
  afBox(8, 10, 6, afMat('#2a2f33'), -L / 2 + 10, 28, 0, ship);
  afBox(3, 18, 3, afMat('#3a4045'), L / 2 - 22, 18, 0, ship);    // the foremast
  const navR = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), new THREE.MeshBasicMaterial({ color: '#ff3a2a' })); navR.position.set(-L / 2 + 22, 36.5, -17.5); ship.add(navR);
  const navG = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), new THREE.MeshBasicMaterial({ color: '#3aff7a' })); navG.position.set(-L / 2 + 22, 36.5, 17.5); ship.add(navG);
  const lampW = new THREE.PointLight('#ffe0b0', 0, 60, 1.6); lampW.position.set(-L / 2 + 28, 30, 0); ship.add(lampW);
  // spray, and spindrift torn off the crests
  const spray = new BillboardSystem(scene, 1400, false), drift = new StreakSystem(scene, 600);
  // a torn, cloudy spray puff (not a round dot)
  spray.uniforms.uMap.value = (() => {
    const c = Tex.canvas(128, 128), x = c.getContext('2d'), rng = new RNG(7);
    x.fillStyle = '#000'; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 70; i++) {
      const a = rng.next() * Math.PI * 2, r = Math.pow(rng.next(), 0.7) * 44, px = 64 + Math.cos(a) * r, py = 64 + Math.sin(a) * r, rr = 4 + rng.next() * 14;
      const g = x.createRadialGradient(px, py, 0, px, py, rr); g.addColorStop(0, `rgba(255,255,255,${0.25 + rng.next() * 0.35})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, rr, 0, Math.PI * 2); x.fill();
    }
    return Tex.tex(c, { repeat: false, srgb: false });
  })();
  const HEAD = new THREE.Vector2(1, 0), shipPose = afShipPose;
  return {
    scene, camera,
    frame(t) {
      U.uT.value = t;
      const P = shipPose(t);
      ship.position.set(P.x, P.y, 0); ship.rotation.set(P.roll, 0, P.pitch, 'XYZ'); ship.updateMatrixWorld(true);
      U.uShip.value.set(P.x, 0, HEAD.x, HEAD.y);
      // the camera: ahead of the ship, low, the bow coming at us over the swell; in the silent beat it drops and closes in
      const k = afK(t, AF.ship, AF.forest, Ease.inOutSine), kq = afK(t, AF.silence - 0.8, AF.forest, Ease.inOutCubic);
      const cx = P.x + afLerp(270, 245, k) + afLerp(0, -75, kq), cz = afLerp(-60, -52, k) + afLerp(0, 18, kq);
      const cy = Math.max(afWaveH(cx, cz, t) * 0.6 + afLerp(18, 10, kq), 5) + 0.8 * Math.sin(t * 1.3);
      afCam(camera, [cx, cy, cz], [P.x + afLerp(70, 90, kq), P.y + afLerp(14, 12, kq), afLerp(8, 4, kq)], afLerp(40, 44, kq), 3 * Math.sin(t * 0.6));
      U.uCam.value.set(cx, cz);
      // bow spray: puffs born when the bow drops into a sea, thrown forward and up, falling back
      spray.begin(scene.fog);
      for (let i = 0; i < 160; i++) {
        const b = Math.floor(t * 70) - i, tb = b / 70, age = t - tb; if (age < 0 || age > 2.2) continue;
        const Pb = shipPose(tb), slam = afShipSlam(tb);
        if (slam < 0.25) continue;
        const h1 = hash2(b, 3), h2 = hash2(b, 5), h3 = hash2(b, 7);
        const side = h1 < 0.5 ? -1 : 1, vx = 4 + 10 * h2, vy = 8 + 18 * h3 * Math.min(slam, 1.2), vz = side * (6 + 14 * Math.abs(h1 - 0.5) * 2);
        const x = Pb.x + L / 2 - 6 + vx * age, y = Pb.y + 6 + vy * age - 4.9 * age * age, z = vz * age;
        if (y < -4) continue;
        const sz = 2.5 + 7 * age, a = 0.5 * Math.min(slam, 1) * (1 - age / 2.2) * Math.min(1, age * 8);
        spray.push(x, y, z, sz, b, a, 1.0, 0.8, 0.84, 0.86);
      }
      spray.end();
      // spindrift: short streaks skimming the water around the camera, blown along with the swell
      drift.begin();
      for (let i = 0; i < 520; i++) {
        const h1 = afR(i, 1), h2 = afR(i, 2), h3 = afR(i, 3), ph = (h3 + t * 0.55) % 1;
        const rx = cx - 30 + (h1 - 0.5) * 160 - 60 + ph * 140, rz = cz + 20 + (h2 - 0.5) * 140;
        const ry = afWaveH(rx, rz, t) + 0.4 + 2.2 * h2, fade = Math.sin(Math.PI * ph);
        drift.push(rx, ry, rz, rx - 3.2, ry - 0.15, rz + 0.5, 0.82, 0.86, 0.88, 0.22 * fade, 0.05);
      }
      drift.end();
      lampW.intensity = 6;
    },
    grade(t, p) { p.warmth = -0.08; p.saturation = 0.78; p.contrast = 1.12; p.vignette = 0.75; p.grain = 0.035; },
  };
};
