/* =====================================================================
   WORLD — the film's one set: your living room on the fifth floor (room.js; its window looks south over the park),
   the street, the park and the church (street.js), your neighbours and the birds (cast.js), and the sky: the sun
   (dsSunDir: it rises down your street at its east end and sets down it at the west end, past the church: an equinox
   week; world axes x west, y up, z north), the Moon, the stars wheeling round the Pole Star (35° up, due north, behind
   your block). Every shot
   (shots.js) is a mode: story time s comes from the one clock (script.js: dsStoryAt), the world is posed with it (pure),
   and the mode places the camera. From Friday on, "down" leans south far enough to see: people stand along it, and so
   does the camera (you feel the new down as down), so the ground seems to slope up to the north.
   ===================================================================== */

const dsAdd = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const _dsC = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k);

// ---- the sky dome: day / twilight / night, the sun's disc and glow, a warm band along the horizon at sunrise/sunset
function dsSkyDome(scene) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(4800, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { sd: { value: new THREE.Vector3(0, 1, 0) }, day: { value: 1 }, twi: { value: 0 }, k: { value: 1 },
      zD: { value: new THREE.Color('#3f74b8') }, hD: { value: new THREE.Color('#c9dcec') }, zN: { value: new THREE.Color('#03060d') }, hN: { value: new THREE.Color('#0d1626') },
      tw: { value: new THREE.Color('#ff8a3c') }, tw2: { value: new THREE.Color('#7a4a7a') }, gnd: { value: new THREE.Color('#5a5650') } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform vec3 sd, zD, hD, zN, hN, tw, tw2, gnd; uniform float day, twi, k; varying vec3 vD;
      void main(){
        vec3 d = normalize(vD);
        float h = d.y, hp = max(h, 0.0);
        vec3 zen = mix(zN, zD, day), hor = mix(hN, hD, day);
        vec3 col = mix(hor, zen, pow(smoothstep(0.0, 1.0, hp), 0.55));
        // the twilight band: warm towards the sun's side of the horizon, violet away from it
        vec2 a = normalize(d.xz + 1e-5), b = normalize(sd.xz + 1e-5); float face = 0.5 + 0.5 * dot(a, b);
        float band = exp(-hp * 7.0) * twi;
        col = mix(col, mix(tw2, tw, pow(face, 3.0)), band * 0.85);
        col += tw * pow(face, 12.0) * exp(-hp * 3.0) * twi * 0.35;
        // the sun: a glow and the disc (its real size, 0.53° across: the 9-second sunset is timed on it)
        float g = max(dot(d, sd), 0.0), ang = dot(d, sd) > 0.0 ? length(cross(d, normalize(sd))) : 3.0;
        col += vec3(1.0, 0.86, 0.62) * (pow(g, 18.0) * 0.25 + pow(g, 300.0) * 0.9 + exp(-ang / 0.012) * 0.8 * mix(0.15, 1.0, smoothstep(0.0, 0.12, sd.y))) * (0.4 + 0.6 * day);
        col = mix(col, vec3(1.6, 1.45, 1.15) * mix(vec3(2.4, 1.3, 0.55), vec3(1.0), smoothstep(0.0, 0.18, sd.y)), 1.0 - smoothstep(0.00434, 0.00492, ang));
        // below the horizon: the ground's colour (the far town hides most of it)
        if (h < 0.0) col = mix(hor, gnd * (0.15 + 0.85 * day), smoothstep(0.0, -0.08, h));
        gl_FragColor = vec4(col * k, 1.0); }`,
  }));
  m.renderOrder = -10; m.frustumCulled = false; scene.add(m);
  return m;
}
// ---- the stars: 2,400 of them on a sphere, turning round the Pole Star; the Pole Star itself a little brighter
function dsStars(scene) {
  const N = 2400, r = new RNG(77), pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const u = r.range(-1, 1), a = r.range(0, 6.283), q = Math.sqrt(1 - u * u), b = Math.pow(r.next(), 3);
    pos.set([q * Math.cos(a) * 4500, u * 4500, q * Math.sin(a) * 4500], i * 3);
    const w = 0.35 + 0.65 * b, tint = r.next(); col.set([w * (0.85 + 0.15 * tint), w * 0.92, w * (1.05 - 0.2 * tint)], i * 3);
  }
  // the Pole Star (on the axis) and the Plough round it, so the turning reads
  pos.set([0, 0, 4500], 0); col.set([1, 1, 1], 0);
  const plough = [[0.42, 0.32], [0.48, 0.42], [0.47, 0.55], [0.43, 0.66], [0.52, 0.74], [0.62, 0.71], [0.6, 0.6]];
  plough.forEach(([dx, dy], k) => { const v = new THREE.Vector3(dx * 0.62, dy * 0.62, 1).normalize().multiplyScalar(4500); pos.set([v.x, v.y, v.z], (k + 1) * 3); col.set([1, 0.97, 0.9], (k + 1) * 3); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 2.6, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 1, depthWrite: false, fog: false });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = -9;
  // the group's z axis is the pole: tilt it up to the Pole Star (35° up, north = +z)
  const grp = new THREE.Group(); grp.add(pts); grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...DS_POLE)); scene.add(grp);
  return { grp, pts, mat };
}
// ---- the Moon: a waxing gibbous disc (a sprite, drawn ~3 × its real size so it reads on a phone)
function dsMoon(scene) {
  const c = dsCanvas(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#eae6da'; g.beginPath(); g.arc(w / 2, h / 2, w / 2 - 6, 0, 6.283); g.fill();
    const r = new RNG(9); for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(120,118,110,${r.range(0.12, 0.3)})`; g.beginPath(); g.arc(r.range(40, 216), r.range(40, 216), r.range(6, 26), 0, 6.283); g.fill(); }
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,0.93)'; g.beginPath(); g.ellipse(w / 2 - 70, h / 2, w / 2 - 20, h / 2 - 2, 0, 0, 6.283); g.fill(); });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dsTex(c, { repeat: false }), transparent: true, depthWrite: false, fog: false })); sp.scale.setScalar(150); sp.renderOrder = -8; scene.add(sp);
  return sp;
}

DS_SETS.world = (app) => {
  const S = dsSet(app, { sky: '#a9c3dc', fov: 50, near: 0.02, far: 6000, hemi: ['#d6e2ef', '#6f6252', 0.6], sun: [0, 60, -40], sunI: 3.4, sunColor: '#ffe2bc', shadow: 2048, shadowR: 10, shadowFar: 320, env: ['#8db4dc', '#ead8c0', '#6c6256'] });
  const scene = S.scene, cam = S.camera, sun = S.sun;
  scene.fog = new THREE.FogExp2('#d9d2c6', 0.0011);
  const sky = dsSkyDome(scene), stars = dsStars(scene), moon = dsMoon(scene);
  const R = dsBuildRoom(S), T = dsBuildStreet(S), C = dsBuildCast(S); C.T = T;
  // ---- the street lamps' light where we look (the four posts nearest the camera)
  const lampL = Array.from({ length: 4 }, () => { const l = new THREE.PointLight('#ffd49a', 0, 22, 1.5); scene.add(l); return l; });
  const dust = dsPuffs(scene, 1400, { soft: 1.4 });
  const set = {
    scene, camera: cam, R, T, C,
    cuts() { return []; },
    frame(t, shot) {
      const m = shot.mode, s = dsStoryAt(t), rate = dsRateAt(t);
      this._s = s; this._shot = shot; this._rate = rate;
      const th = dsTilt(s);
      // ------------------------------------------------------------------ pose the world first (some cameras follow things)
      T.update(s, { t, rate, mode: m });
      C.update(s, { t, rate, mode: m });
      R.update(s, { t, rate, mode: m });
      // ------------------------------------------------------------------ the camera
      const k = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      const RL = (x, y, z) => R.toWorld(x, y, z).toArray();
      const v = { p: [0, 2, -5], at: [0, 1, 0], fov: 50, drift: 0.004, sh: { f: null, R: 14 }, inside: false, far: 6000, align: 1, shake: 0 };
      dsShotCam(this, m, s, t, k, shot, v, RL);
      const dr = v.drift ? dsDrift(t, v.drift, 0.3, 11) : [0, 0, 0];
      // the quakes: a shake
      const q = dsQuake(s); if (q > 0 || v.shake) { const j = 0.035 * q + (v.shake || 0); dr[0] += j * Math.sin(t * 71) * Math.sin(t * 13.3); dr[1] += j * 0.6 * Math.sin(t * 57 + 1); dr[2] += j * Math.sin(t * 63 + 2) * Math.sin(t * 9.1); }
      const near = v.near || (v.inside ? 0.02 : 0.05); if (cam.near !== near) cam.near = near;
      if (cam.far !== v.far) cam.far = v.far;
      dsCam(cam, dsAdd(v.p, dr), dsAdd(v.at, dr), v.fov, v.roll || 0, v.align ? th * v.align : 0);
      this._inside = v.inside; this._expo = v.expo || 0;
      // ------------------------------------------------------------------ the light: the sun, the sky, the night
      const sd = dsSunDir(s), alt = Math.asin(MathX.clamp(sd[1], -1, 1)) * 180 / Math.PI, day = dsDaylight(s), twi = dsTwilight(s);
      this._day = day; this._twi = twi;
      { const U = sky.material.uniforms; U.sd.value.set(sd[0], sd[1], sd[2]); U.day.value = day; U.twi.value = twi; }
      // the sun light: above the horizon only, warmer and weaker when low
      const sunUp = dsSm(alt, -0.5, 3.0), low = 1 - dsSm(alt, 2, 22);
      sun.intensity = 3.4 * sunUp * (1 - 0.45 * low);
      sun.color.copy(_dsC('#fff0dc', '#ff9a52', low));
      // the moon light (weak, blue) when the sun is down
      const md = dsSky(dsMoonH(s)), moonUp = dsSm(md[1], -0.02, 0.1) * (1 - day);
      const useMoon = sunUp < 0.05;
      const L = useMoon ? md : sd;
      if (useMoon) { sun.intensity = 0.32 * moonUp; sun.color.set('#9fb4e0'); }
      S.hemi.intensity = (v.inside ? 0.3 : 0.55) * (0.08 + 0.92 * day) + 0.05;
      S.hemi.color.copy(_dsC('#5a6a8a', '#d6e2ef', day)).lerp(new THREE.Color('#ffb27a'), twi * 0.35);
      S.hemi.groundColor.copy(_dsC('#20242c', '#6f6252', day));
      scene.environmentIntensity = (v.inside ? 0.4 : 0.8) * (0.1 + 0.9 * day);
      scene.fog.color.copy(_dsC('#0c1220', '#d9d2c6', day)).lerp(new THREE.Color('#e0a070'), twi * 0.4);
      scene.fog.density = (v.inside ? 0.0004 : 0.0011) * (v.fogK ?? 1);
      // the stars and the Moon
      { const a = dsStarAngle(s); stars.grp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...DS_POLE));
        stars.grp.rotateZ(-a); stars.grp.position.copy(cam.position); stars.mat.opacity = MathX.clamp(1 - day * 1.6, 0, 1) * (v.starK ?? 1);
        moon.position.set(cam.position.x + md[0] * 4300, cam.position.y + md[1] * 4300, cam.position.z + md[2] * 4300); moon.material.opacity = dsSm(md[1], -0.03, 0.04) * (0.55 + 0.45 * (1 - day)); moon.visible = md[1] > -0.05; }
      // the street lamps (light sensors: on when it's dark; a lamp takes a second or two to come up)
      const lampOn = T.lampOn;
      { const cp = cam.position, P = T.posts.slice().sort((a, b) => Math.hypot(a[0] - cp.x, a[1] - cp.z) - Math.hypot(b[0] - cp.x, b[1] - cp.z));
        lampL.forEach((l, i) => { const p = P[i]; l.position.set(p[0], 5.85, p[1] + p[2] * 0.85); l.intensity = v.inside ? 0 : 24 * lampOn; }); }
      // dust: shaken out of the walls in a quake, and kicked up by things sliding
      dust.begin();
      if (q > 0.05 && v.inside) { const cp = cam.position; for (let i = 0; i < 260; i++) { const x = cp.x + (dsR(i, 31) - 0.5) * 4, z = cp.z + (dsR(i, 32) - 0.5) * 4, y = cp.y + 1.0 - ((t * (0.15 + 0.3 * dsR(i, 33)) + dsR(i, 34) * 3) % 3); dust.add(x, y, z, 0.006 + 0.01 * dsR(i, 35), 0.5 * q, 0.95, 0.9, 0.82); } }
      for (const P of T.dust || []) dust.add(P[0], P[1], P[2], P[3], P[4], 0.78, 0.74, 0.68);
      dust.end();
      // ------------------------------------------------------------------ the sun's shadow round what we look at
      const f = v.sh.f || v.at, D = 160;
      sun.position.set(f[0] + L[0] * D, f[1] + Math.max(0.02, L[1]) * D, f[2] + L[2] * D); sun.target.position.set(f[0], f[1], f[2]); sun.target.updateMatrixWorld();
      { const c = sun.shadow.camera; if (c.right !== v.sh.R) { c.left = -v.sh.R; c.right = v.sh.R; c.top = v.sh.R; c.bottom = -v.sh.R; c.updateProjectionMatrix(); } }
      sun.shadow.bias = v.sh.R > 20 ? -0.0006 : -0.0003; sun.shadow.normalBias = v.sh.R > 20 ? 0.06 : 0.02;
      sun.castShadow = sun.intensity > 0.05;
    },
    labels(t) { return dsLabels(this, t); },
    grade(t, p, shot) {
      const day = this._day ?? 1, twi = this._twi || 0, night = 1 - day;
      // the eye adapts: night is lifted to readable, the room at night by its lamps
      p.exposure = (this._inside ? 1.2 + 0.25 * night : 1.0 + 0.85 * night) * (this._expo || 1);
      p.saturation = 1.04 - 0.18 * night + 0.06 * twi; p.warmth = 0.03 + 0.08 * twi - 0.06 * night; p.vignette = 0.5 + 0.08 * night; p.bloom = 0.3 + 0.18 * night; p.bloomThreshold = 0.92 - 0.1 * night;
      // the quakes: a little chroma on the hits
      const q = dsQuake(this._s); if (q > 0.3) p.chroma = Math.max(p.chroma || 0, 0.18 * q);
    },
  };
  return set;
};

// the quakes (0 … 1): Sunday 11:40 PM (the first), Wednesday 8:10 PM (stronger), and the ground trembling from Friday
function dsQuake(s) {
  const hit = (s0, d, a) => (s > s0 && s < s0 + d ? a * Math.sin(Math.PI * (s - s0) / d) ** 0.6 * (0.7 + 0.3 * Math.sin(s * 3.1)) : 0);
  return Math.max(hit(DS.sQuake, 9, 0.75), hit(dsAt(3, 20, 10, 2), 10, 1.0), s > dsAt(6, 0, 0) ? 0.08 + 0.12 * dsSm(s, dsAt(6, 0, 0), DS_LIFT) : 0);
}

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERAS: one per mode. v = { p, at, fov, drift, sh: { f, R }, inside, far, align (0…1: the camera's up follows the
// new down), fogK, starK, expo, shake }. RL(x, y, z): room → world. The street: you stand on your pavement at z −1;
// the road z −9…−2; the park railings at z −12.35; the church on the corner at x 86; sunsets down the street to the west
// (+x, past the church), sunrises down it to the east (−x)
// ---------------------------------------------------------------------------------------------------------------------
// a direction in the new frame (up = the new up, leaning north by th): A from east (0) towards the new south horizontal
// (π/2), P downwards from the new horizontal. (On Saturday the new south horizontal points up into the old sky, and the
// new down runs south along the old ground: looking "down" is looking out over the drop.)
function dsNewDir(th, A, P) { const e = [-1, 0, 0], so = [0, Math.sin(th), -Math.cos(th)], dn = [0, -Math.cos(th), -Math.sin(th)], cA = Math.cos(A), sA = Math.sin(A), cP = Math.cos(P), sP = Math.sin(P);
  return dsN3([cP * (cA * e[0] + sA * so[0]) + sP * dn[0], cP * (cA * e[1] + sA * so[1]) + sP * dn[1], cP * (cA * e[2] + sA * so[2]) + sP * dn[2]]); }
function dsShotCam(set, m, s, t, k, shot, v, RL) {
  const into = (a, b, u) => dsV(a, b, Ease.inOutSine(u));
  const room = () => { v.inside = true; v.sh = { f: RL(0, 1, -1), R: 6 }; v.drift = 0.0015; };
  const head = (P) => { const h = dsHeadOf(P); return [h.x, h.y, h.z]; };
  const dirTo = (p, d, L = 200) => [p[0] + d[0] * L, p[1] + d[1] * L, p[2] + d[2] * L];
  switch (m) {
    // ---- 1: Sunday
    // the title: in the park, looking south up at the sun as it races west (18 minutes a second), the trees' shadows swinging
    case 'title': v.p = into([-8, 1.5, -20], [-8.8, 1.5, -20.3], k); v.at = [6, 45, -109]; v.fov = 68; v.sh = { f: [-6, 0, -34], R: 30 }; v.expo = 0.85; break;
    case 'park': room(); v.p = into(RL(0.2, 1.62, -1.55), RL(0.25, 1.64, -1.7), k); v.at = [-2, 1.5, -52]; v.fov = 60; v.sh = { f: [0, 0, -40], R: 40 }; v.fogK = 0.8; break;
    case 'street': v.p = into([10, 1.65, -10.9], [8.5, 1.66, -10.9], k); v.at = [-60, 3.0, -4.5]; v.fov = 56; v.sh = { f: [-5, 0, -6], R: 26 }; break;
    // the Moon: Sunday evening, from your pavement: it crosses the sky south-west over the park in 12 seconds
    case 'moon': v.p = into([-4, 1.6, -1.3], [-4.8, 1.6, -1.4], k); v.at = [38, 51.6, -77.1]; v.fov = 66; v.sh = { f: [-6, 0, -8], R: 26 }; break;
    // the dish: from the balcony behind it, along its aim: the beam runs out to a point in empty sky
    case 'dish': { const D = set.T.dishShot; v.p = into(D.c0, D.c1, k); v.at = D.at; v.fov = 60; v.near = 0.04; v.sh = { f: D.d, R: 6 }; break; }
    case 'tv': room(); v.p = into(RL(0.75, 1.15, 0.45), RL(0.55, 1.12, 0.35), k); v.at = RL(-2.25, 0.95, 0.25); v.fov = 48; v.sh = { f: RL(-1.5, 0.6, 0), R: 4 }; break;
    case 'sunset': v.p = into([-24, 1.6, -5.5], [-22, 1.6, -5.5], k); v.at = [400, 2.0, -5.5]; v.fov = 22; v.sh = { f: [20, 0, -6], R: 40 }; break;
    case 'quake': room(); v.p = into(RL(1.65, 1.55, 1.4), RL(1.55, 1.52, 1.3), k); v.at = RL(-0.9, 0.85, -0.7); v.fov = 60; break;
    case 'sunrise': v.p = into([30, 1.6, -5.5], [28, 1.6, -5.5], k); v.at = [-400, 2.6, -5.5]; v.fov = 28; v.sh = { f: [0, 0, -6], R: 40 }; break;
    case 'news': room(); v.p = into(RL(1.0, 1.35, 1.25), RL(0.85, 1.3, 1.05), k); v.at = RL(-2.25, 0.95, -0.95); v.fov = 52; v.sh = { f: RL(-1.5, 0.6, 0), R: 4 }; break;
    // ---- 2: Tuesday to Thursday
    case 'clock': room(); v.p = into(RL(-0.35, 1.72, 0.95), RL(-0.4, 1.75, 1.15), k); v.at = RL(-0.6, 1.86, 2.0); v.fov = 46; break;
    case 'awake': v.p = into([-12.5, 1.6, -2.7], [-11.5, 1.6, -2.8], k); v.at = [3, 1.1, -4.0]; v.fov = 52; v.sh = { f: [-3, 0, -4], R: 16 }; break;
    case 'birds': v.p = into([-6, 1.55, -13.8], [-6.5, 1.6, -14.4], k); v.at = [-26, 7.5, -36]; v.fov = 58; v.sh = { f: [-20, 3, -30], R: 26 }; break;
    case 'lamps': v.p = into([-12, 2.2, -1.1], [-10.5, 2.2, -1.2], k); v.at = [200, 3.5, -6.0]; v.fov = 44; v.sh = { f: [30, 0, -5], R: 40 }; break;
    case 'wed': room(); v.p = RL(1.95, 1.35, 1.7); v.at = RL(-0.35, 0.75, -1.9); v.fov = 70; v.drift = 0.0; v.sh = { f: RL(0, 0.5, -1), R: 6 }; break;
    case 'scale': room(); v.p = into(RL(-0.4, 0.82, 0.62), RL(-0.43, 0.8, 0.58), k); v.at = RL(-0.62, 0.47, 0.22); v.fov = 36; v.near = 0.02; v.sh = { f: RL(-0.6, 0.45, 0.2), R: 2 }; break;
    case 'push': room(); v.p = into(RL(-0.4, 1.62, -1.2), RL(-0.3, 1.62, -1.45), k); v.at = [-8, 4, -60]; v.fov = 58; v.sh = { f: [0, 0, -30], R: 40 }; break;
    // the marble: a low, still camera behind it: it rolls away from you, south, all the way to the radiator
    case 'marble': room(); { const m0 = set.R.marble0; v.p = RL(0.68, 0.075, m0 + 0.42); v.at = RL(0.58, 0.03, m0 - 1.6); v.fov = 34; v.near = 0.01; v.drift = 0.0004; v.sh = { f: RL(0.6, 0, m0 - 0.6), R: 1.6 }; } break;
    case 'quake2': v.p = into([6, 1.65, -6.2], [5.6, 1.65, -6.0], k); v.at = [-16, 4.0, 1.5]; v.fov = 58; v.sh = { f: [-5, 2, -2], R: 22 }; break;
    // the pond: low on its north bank, looking south down its length: the north gauge close, the south one far off
    case 'pond': v.p = into([5.0, 1.62, -39.4], [4.4, 1.6, -39.7], k); v.at = [0.8, -0.6, -55]; v.fov = 50; v.sh = { f: [1, 0, -49], R: 16 }; break;
    case 'car': v.p = into([19, 1.6, -5.2], [19.8, 1.6, -5.5], k); v.at = [29, 0.8, -1]; v.fov = 52; v.sh = { f: [28, 0, -4], R: 16 }; break;
    case 'car2': { const z = set.T.rollCarZ(); v.p = into([37.5, 1.5, -6.0], [37.2, 1.5, -6.3], k); v.at = [26.4, 0.7, z - 1.5]; v.fov = 48; v.sh = { f: [28, 0, -8], R: 14 }; break; }
    // ---- 3: Friday
    case 'friday': v.p = [9, 1.75, -5.2]; v.at = [-300, 7, -5.4]; v.fov = 50; v.drift = 0; v.sh = { f: [-15, 0, -5], R: 30 }; v.align = 0; break;
    case 'swings': v.p = into([37.2, 1.55, -24.6], [37.8, 1.55, -24.5], k); v.at = [46, 1.25, -24.2]; v.fov = 46; v.sh = { f: [46, 1, -24], R: 10 }; v.align = 0; break;
    case 'lighter': v.p = into([5.5, 1.65, -5.2], [4.5, 1.65, -5.2], k); v.at = [-12, 1.2, -5.0]; v.fov = 50; v.sh = { f: [-6, 0, -5], R: 16 }; break;
    case 'jump': { const h = head(set.C.kid); v.p = into([h[0] + 3.2, 1.3, h[2] - 2.2], [h[0] + 2.9, 1.3, h[2] - 2.0], k); v.at = [h[0], 1.2, h[2]]; v.fov = 48; v.sh = { f: h, R: 8 }; break; }
    // the glass: level with the table first (the water sits crooked), then the camera rolls to the new down: the water
    // is level, and the table isn't
    case 'glass': room(); v.p = into(RL(-0.52, 0.52, -0.02), RL(-0.55, 0.515, -0.02), k); v.at = RL(-0.88, 0.47, -0.02); v.fov = 30; v.near = 0.01; v.sh = { f: RL(-0.88, 0.5, 0), R: 2 }; v.align = dsSm(t, dsC('glass', 1) - 0.8, dsC('glass', 1) + 1.0); break;
    // ---- 4: Saturday
    case 'sat': v.p = into([12, 1.65, -1.4], [10.5, 1.65, -1.5], k); v.at = [-40, 2.5, -8]; v.fov = 56; v.sh = { f: [-5, 0, -5], R: 22 }; break;
    case 'slide': room(); v.p = into(RL(1.85, 1.6, 1.75), RL(1.75, 1.58, 1.65), k); v.at = RL(-0.2, 0.55, -0.9); v.fov = 64; break;
    // the spire: wide enough to hold the whole fall, from the tower top to the churchyard
    case 'spire': v.p = into([50, 1.65, -10.8], [50.8, 1.66, -10.9], k); v.at = [135.2, 35.9, -50.5]; v.fov = 58; v.sh = { f: [90, 10, -32], R: 34 }; v.align = 0.25; break;
    case 'lean': v.p = into([0.5, 1.55, -4.0], [-0.2, 1.55, -4.2], k); v.at = [-8, 0.9, -11.0]; v.fov = 56; v.sh = { f: [-5, 0, -9], R: 14 }; break;
    case 'cars': v.p = into([-17, 1.7, -0.8], [-18, 1.7, -0.9], k); v.at = [-31, 0.6, -8.5]; v.fov = 56; v.sh = { f: [-28, 0, -7], R: 16 }; break;
    // the equator: the street west to the church (its spire lying in the churchyard), the diagram over it
    case 'equator': v.p = into([36, 1.4, -2.6], [37.5, 1.4, -2.7], k); v.at = [95, 9, -16]; v.fov = 56; v.sh = { f: [70, 0, -10], R: 34 }; break;
    // the 9-second sunset: a long lens down the street to the west, low and steady, exposed for the disc
    case 'sunset2': v.p = into([-6, 1.1, -5.6], [-5.9, 1.1, -5.6], k); v.at = [430, 1.6, -5.6]; v.fov = 9; v.drift = 0.0008; v.sh = { f: [40, 0, -8], R: 40 }; v.align = 0.4; v.expo = 0.45; v.fogK = 0.35; break;
    case 'stars': v.p = into([2, 1.0, -34], [2, 1.02, -33.8], k); v.at = [2, 1.0 + 100 * DS_SL * 0.85, -34 + 100 * DS_CL]; v.fov = 78; v.sh = { f: [0, 5, -20], R: 30 }; v.align = 0.25; v.starK = 1.25; break;
    // the last sunrise: the street is a cliff: you look out along it to the sunrise and down the drop to the south
    // the last sunrise: along the new horizon, into the sun coming up in the east, down a street that is now a cliff face:
    // your neighbours cling to the railings in silhouette; we drift along the face towards them
    case 'dawn': { const u = Ease.inOutSine(dsSm(t, dsC('dawn', 1) - 2.2, dsC('dawn', 1) + 0.8)); v.p = into([16.8, 1.0, -9.4], [13.2, 0.9, -10.1], k);
      const d = dsNewDir(dsTilt(s), 0.1, 0.06 + 0.1 * u); v.at = dirTo(v.p, d, 60); v.fov = 46; v.sh = { f: [6, 0, -12], R: 30 }; v.expo = 0.62; v.fogK = 0.5; break; }
    // the question: close on a mother holding her child to the railings
    case 'question': { v.p = into([11.9, 2.3, -11.0], [11.4, 2.2, -11.05], k); v.at = [8.8, 0.3, -11.4]; v.fov = 52; v.sh = { f: [8.8, 0, -12], R: 10 }; v.expo = 0.62; v.fogK = 0.5; break; }
  }
  // before Friday, down leans too little to feel: the camera stays level
  if (s < dsAt(5, 0, 0)) v.align = 0;
}

// labels pinned in the scene: [{ p, text, sub, a, side }]
function dsLabels(set, t) {
  const shot = dsShotAt(t), m = shot.mode, out = [], W = StoryHUD.win, s = set._s;
  if (m === 'dish') { const D = set.T.dishShot, a = W(t, shot.t0 + 0.6, shot.t1 - 0.2, 0.3, 0.2), off = dsH(s) - 2 * Math.PI * s / 86400;
    out.push({ p: D.aimPt, text: 'THE DISH IS AIMED HERE', sub: 'EMPTY SKY', a, side: 'r' });
    out.push({ p: D.satAt(off), text: 'THE SATELLITE', sub: (off * 180 / Math.PI).toFixed(1) + '° WEST · THE BEAM IS ONLY ~1.5° WIDE', a: a * dsSm(t, shot.t0 + 1.4, shot.t0 + 2.0), side: 'l' }); }
  if (m === 'pond') for (const G of set.T.gauges) { const d = Math.round(100 * Math.abs(G.dz) * Math.tan(Math.min(dsTilt(s), 0.25))); out.push({ p: [G.x, 0.55, G.z], text: G.dz > 0 ? 'NORTH END' : 'SOUTH END', sub: (G.dz > 0 ? 'WATER DOWN ' : 'WATER UP ') + d + ' cm', a: W(t, shot.t0 + 0.6, shot.t1 - 0.3, 0.3, 0.3), side: G.dz > 0 ? 'r' : 'l' }); }
  if (m === 'marble') { const R = set.R; out.push({ p: R.toWorld(0.6, 0.12, -DS_ROOM.D / 2 + 0.1).toArray(), text: 'SOUTH', sub: 'TOWARDS THE EQUATOR', a: W(t, shot.t0 + 0.6, shot.t1 - 0.3, 0.3, 0.3) }); }
  if (m === 'car2') out.push({ p: [26.4, 1.9, set.T.rollCarZ()], text: 'NO HANDBRAKE', sub: '', a: W(t, shot.t0 + 0.4, shot.t1 - 0.3, 0.3, 0.3), side: 'r' });
  if (m === 'swings') out.push({ p: [46, 0.6, -24.2 - 1.9 * Math.sin(dsTilt(s))], text: 'HANGING STRAIGHT DOWN', sub: dsTiltDeg(s).toFixed(0) + '° FROM THE OLD DOWN', a: W(t, shot.t0 + 0.8, shot.t1 - 0.3, 0.3, 0.3), side: 'r' });
  if (m === 'stars') out.push({ p: [0, 4500 * DS_SL, 4500 * DS_CL].map((x, i) => x + set.camera.position.getComponent(i)), text: 'THE POLE STAR', sub: 'IT STAYS PUT', a: W(t, shot.t0 + 1.0, shot.t1 - 0.3, 0.3, 0.3) });
  return out;
}
