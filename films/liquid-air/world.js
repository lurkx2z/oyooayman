/* =====================================================================
   WORLD — the film's one set: your living room on the fifth floor (room.js), the street, the park and the church
   (street.js), your neighbours and the birds (cast.js), and the sky turned liquid (liquid.js). A clear Saturday
   afternoon in late October; at 3:00 the sky starts to fall. Every shot (shots.js) is a mode: story time s comes from
   the one clock (script.js: laStoryAt), the world is posed with it (pure), and the mode places the camera.
   The light: the sun (gone within a second of 3:00: the falling sky is a cloud kilometres thick; back at 3:10:12 in a
   black sky), the sky's diffuse light (dusk in the deluge), the street lamps and your lamps; under the surface the
   liquid's own blue-green murk (fog), and from 3:10 the sun's shafts and ripple-light on the bottom.
   ===================================================================== */

const laAdd = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const _laC = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k);
const LA_COL3 = { skyDay: ['#4a7fc4', '#ecd9c0', '#8c8a84'], skyDusk: ['#20262c', '#3a4148', '#2a2c2e'], skyBlack: ['#000000', '#010203', '#020203'] };

LA_SETS.world = (app) => {
  const S = laSet(app, { sky: '#a9c3dc', fov: 50, near: 0.02, far: 6000, hemi: ['#d6e2ef', '#6f6252', 0.6], sun: [LA_SUN[0] * 60, LA_SUN[1] * 60, LA_SUN[2] * 60], sunI: 3.6, sunColor: '#ffe2bc', shadow: 2048, shadowR: 10, shadowFar: 300, env: ['#8db4dc', '#ead8c0', '#6c6256'] });
  const scene = S.scene, cam = S.camera, sun = S.sun;
  scene.fog = new THREE.FogExp2('#d9d2c6', 0.0012);
  const sky = laSky(scene, ...LA_COL3.skyDay, { sunDir: LA_SUN, sunGlow: '#ffcf9a', hw: 0.3, r: 4000 });
    const R = laBuildRoom(S), T = laBuildStreet(S), C = laBuildCast(S), Lq = laBuildLiquid(S);
  const envDay = scene.environment;
  // ---- the street lamps' light where we look (the four posts nearest the camera)
  const lampL = Array.from({ length: 4 }, () => { const l = new THREE.PointLight('#ffd49a', 0, 22, 1.5); scene.add(l); return l; });
  // ---- the line on your block: where the surface will be at 3:10 (11.8 m), in the [weight]/[floor] shots
  const ghost = new THREE.Mesh(new THREE.PlaneGeometry(44.4, 0.07), new THREE.MeshBasicMaterial({ color: '#ffcf8a', transparent: true, opacity: 0, depthWrite: false, fog: false }));
  ghost.position.set(0, LAP.D, -0.06); ghost.renderOrder = 9; scene.add(ghost);
  // ---- a football afloat by you (it went soft: the air in it turned, and it floats on what's left in it)
  const fb = (() => { const geo = new THREE.SphereGeometry(0.11, 18, 12), m = laMesh(geo, laStd('#ffffff', 0.5, 0, { map: laTex(laBallCanvas(), { repeat: false }) }), 1.7, 0.1, -4.7, scene); return { m, base: Float32Array.from(geo.attributes.position.array) }; })();
  const motes = laPuffs(scene, 1200, { soft: 1.2 });
  const inRoom = (x, y, z) => x > 1.4 && x < 6.6 && y > 11.9 && y < 14.7 && z > 0.1 && z < 4.4;
  const set = {
    scene, camera: cam, R, T, C, Lq,
    cuts() { return LA.subCuts || []; },
    frame(t, shot) {
      const m = shot.mode, s = laStoryAt(t);
      this._s = s; this._shot = shot;
      // ------------------------------------------------------------------ pose the world first (some cameras follow things)
      T.update(s, {});
      C.update(s, {});
      R.update(s, { lights: 1 });
      { const d = laDepth(s), k = laSealed(s, 1.8).squash, p = fb.m.geometry.attributes.position;
        if (Math.abs((fb._k ?? -1) - k) > 0.01) { for (let i = 0; i < p.count; i++) { const x = fb.base[i * 3], y = fb.base[i * 3 + 1], z = fb.base[i * 3 + 2], f = 1 + 0.28 * k * (1 - Math.abs(y) / 0.11); p.setXYZ(i, x * f, y * (1 - 0.5 * k * (0.5 + 0.5 * y / 0.11)), z * f); } p.needsUpdate = true; fb.m.geometry.computeVertexNormals(); fb._k = k; }
        const afloat = d > 0.16; fb.m.position.set(1.7 + (afloat ? 0.4 * Math.sin(s * 0.05) : 0), afloat ? d - 0.04 + 0.012 * Math.sin(s * 1.7) : 0.11, -4.7 + (afloat ? 0.3 * Math.cos(s * 0.04) : 0)); fb.m.rotation.set(0.1 * Math.sin(s * 0.8), s * 0.1, 0); fb.m.visible = s < 600 || s > 3500; }
      // ------------------------------------------------------------------ the camera
      const k = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      const RL = (x, y, z) => R.toWorld(x, y, z).toArray();
      const v = { p: [0, 2, -5], at: [0, 1, 0], fov: 50, drift: 0.004, sh: { f: null, R: 14 }, inside: false, far: 6000, refl: false, ghost: 0 };
      laShotCam(this, m, s, t, k, shot, v, RL);
      const dr = v.drift ? laDrift(t, v.drift, 0.3, 11) : [0, 0, 0];
      // the slam at 3:10:10 (the last of the sky landing): a jolt
      if (s > 610.1 && s < 611.2) { const j = 0.06 * Math.exp(-(s - 610.1) / 0.25); dr[0] += j * Math.sin(s * 91); dr[1] += j * Math.sin(s * 77 + 1); dr[2] += j * Math.sin(s * 83 + 2); }
      const near = v.near || (v.inside ? 0.02 : 0.05); if (cam.near !== near) cam.near = near;
      if (cam.far !== v.far) cam.far = v.far;
      laCam(cam, laAdd(v.p, dr), laAdd(v.at, dr), v.fov, v.roll || 0);
      this._inside = v.inside; this._refl = v.refl; this._expo = v.expo || 0;
      // ------------------------------------------------------------------ the light
      const d = laDepth(s), level = Math.max(0.004, d), below = cam.position.y < level, dusk = laDusk(s), black = laBlack(s), sunK = laSunOut(s);
      this._below = below; this._dusk = dusk; this._black = black;
      const pre = s < 0 ? 1 : 0;                                  // (before 3:00: a clear day)
      const dk = Math.min(1, dusk);
      // the sky: day → the deluge's dusk → black (from 3:10:12)
      { const U = sky.material.uniforms, a = LA_COL3.skyDay, b = LA_COL3.skyDusk, c = LA_COL3.skyBlack;
        for (const [key, j] of [['a', 0], ['b', 1], ['c', 2]]) U[key].value.copy(_laC(a[j], b[j], dk)).lerp(new THREE.Color(c[j]), black);
        U.sc.value.set('#ffcf9a').multiplyScalar(0.45 * laSunK(Math.max(0, s)) * (1 - black) + 0.0 * black); }
      sun.intensity = 3.6 * sunK * (below ? 0.85 : 1);
      sun.color.set(black > 0.5 ? '#fff4e6' : '#ffe2bc');
      const amb = (1 - 0.8 * dk) * (1 - black) + 0.16 * black;      // the sky's light (none from a black sky: what's left is bounce)
      S.hemi.intensity = (v.inside ? 0.34 : 0.62) * amb + (below ? 0.12 : 0);
      S.hemi.color.copy(_laC('#d6e2ef', '#7d8a96', dk)).lerp(new THREE.Color('#9fb2b8'), black);
      S.hemi.groundColor.set(below ? '#3c5a5a' : '#6f6252');
      scene.environmentIntensity = (v.inside ? 0.45 : 0.85) * Math.max(0.12, amb);
      // the fog: above, the deluge (visibility drops as it gets heavier), nothing after 3:10 (a vacuum); below, the liquid
      const rate = laRate(s);
      if (below) {
        const c0 = black > 0.5 ? _laC('#0f3a44', '#2a6e78', sunK) : _laC('#1f5560', '#0a2a32', dk);
        scene.fog.color.copy(c0); scene.fog.density = (s < 600 ? 0.075 : 0.026) * (v.fogK ?? 1);
      } else {
        scene.fog.color.copy(_laC('#d9d2c6', '#2c3238', dk)).lerp(new THREE.Color('#000000'), black);
        scene.fog.density = s < 600 ? (0.0012 + MathX.clamp(rate * 12, 0, 0.03) * (s > 0 ? 1 : 0)) * (v.fogK ?? 1) : 0.0;
        if (v.inside && s < 600) scene.fog.density *= 0.15;
      }
      const uwCol = black > 0.5 ? _laC('#163e48', '#2e6a72', sunK) : _laC('#2c4a50', '#13262c', dk);
      // the street lamps: the posts nearest the camera (on from ≈ 3:00:15)
      { const on = laSm(s, 14, 20), cp = cam.position, P = T.posts.slice().sort((a, b) => Math.hypot(a[0] - cp.x, a[1] - cp.z) - Math.hypot(b[0] - cp.x, b[1] - cp.z));
        lampL.forEach((l, i) => { const q = P[i]; l.position.set(q[0], 5.85, q[1] + q[2] * 0.85); l.intensity = v.inside ? 0 : 26 * on * (s < 600 ? 1 : 0.7); }); }
      ghost.material.opacity = v.ghost;
      // under it: motes drifting in the liquid round the camera; the street lamps' halos (light scattered in it)
      motes.begin();
      if (below) { const cp = cam.position, n = 900;
        for (let i = 0; i < n; i++) { const RR = 7, x = cp.x + (((laR(i, 201) * 2 * RR - cp.x + 0.07 * s * laR(i, 205)) % (2 * RR)) + 2 * RR) % (2 * RR) - RR, z = cp.z + (((laR(i, 202) * 2 * RR - cp.z) % (2 * RR)) + 2 * RR) % (2 * RR) - RR, y = laR(i, 203) * level + 0.03 * Math.sin(s * 0.4 + i);
          motes.add(x, y, z, 0.014 + 0.02 * laR(i, 204), 0.28, 0.8, 0.92, 0.95); } }
      { const on = laSm(s, 14, 20), cp = cam.position;
        for (const q of T.posts) { const x = q[0], z = q[1] + q[2] * 0.85, dd = Math.hypot(x - cp.x, z - cp.z); if (dd > 70 || v.inside) continue;
          const sub = 5.9 < level ? 1 : 0, a = on * (sub ? 0.45 : 0.22) * Math.exp(-dd / (sub ? 30 : 60));
          motes.add(x, 5.92, z, sub ? 2.6 : 1.4, a, 1.0, 0.82, 0.55); } }
      motes.end();
      // the liquid: surface, rain, drops in your room, the crash, bubbles, shafts, stars
      Lq.update(s, cam, { sunDir: LA_SUN, sunUW: LA_SUN_UW, uwCol, fogCol: scene.fog.color, fogD: scene.fog.density, room: v.room ? R : null, inRoom, noRain: v.noRain, rainK: v.rainK, rainR: v.rainR, rainA: v.rainA, dropK: v.dropK, dropA: v.dropA, bubbles: laBubbleSources(this, s, v), refl: v.refl, surface: v.surface, causticK: v.causticK, starK: v.starK });
      // ------------------------------------------------------------------ the sun's shadow round what we look at
      const f = v.sh.f || v.at, D = 150;
      sun.position.set(f[0] + LA_SUN[0] * D, f[1] + LA_SUN[1] * D, f[2] + LA_SUN[2] * D); sun.target.position.set(f[0], f[1], f[2]); sun.target.updateMatrixWorld();
      { const c = sun.shadow.camera; if (c.right !== v.sh.R) { c.left = -v.sh.R; c.right = v.sh.R; c.top = v.sh.R; c.bottom = -v.sh.R; c.updateProjectionMatrix(); } }
      sun.shadow.bias = v.sh.R > 20 ? -0.0006 : -0.0003; sun.shadow.normalBias = v.sh.R > 20 ? 0.06 : 0.02;
      sun.castShadow = sunK > 0.02;
      this._pre = pre;
    },
    prerender(app2) { if (this._refl) Lq.renderRefl(app2.renderer, scene, cam); },
    labels(t) { return laLabels(this, t); },
    grade(t, p, shot) {
      const s = this._s, dk = Math.min(1, this._dusk || 0), black = this._black || 0;
      // exposure follows the light the way an eye (or a camera) adapts: the deluge's dusk is lifted to readable
      p.exposure = this._inside ? 1.25 + 0.25 * dk : 1.0 + 0.9 * dk * (1 - black);
      if (this._expo) p.exposure *= this._expo;
      if (this._below) { p.exposure = (s < 600 ? 1.45 + 0.3 * dk : 1.25); p.saturation = s < 600 ? 0.92 : 1.0; p.warmth = s < 600 ? -0.12 : -0.04; p.vignette = 0.58; p.bloom = 0.42; p.bloomThreshold = 0.82; p.grain = 0.03; }
      else { p.saturation = 1.04 - 0.25 * dk * (1 - black); p.warmth = 0.04 - 0.06 * dk; p.vignette = 0.48; p.bloom = 0.3; }
      if (black > 0.5 && !this._below) { p.contrast = 1.12; p.bloom = 0.45; p.bloomThreshold = 0.9; }
      if (shot.mode === 'ears') { p.edgeBlur = 0.28 + 0.2 * Math.sin(t * 1.1); p.vignette = 0.6; }
      // the crash: a white churn, a kick as it hits
      if (s > 599.5 && s < 612) { const u = laSm(s, 599.5, 601) * (1 - laSm(s, 609.5, 612)); p.contrast = 1.06 + 0.08 * u; p.smear.set(0, -0.004 * u); if (s > 606 && s < 610) p.chroma = Math.max(p.chroma || 0, 0.25 * u); }
      // under it: a haze of its colour (murky in the deluge, clear blue-green once the sun is out)
      if (this._below) { p.flash = s < 600 ? 0.3 : 0.08; if (s < 600) p.flashColor.setRGB(0.04, 0.17, 0.2); else p.flashColor.setRGB(0.2, 0.5, 0.55); }
      // 4:00: the froth (more gas than liquid after a second): the water goes white
      if (s > LAP.back) { const w = 0.55 * laSm(s, LAP.back + 0.6, LAP.back + 5); if (w > (p.flash || 0) * 0.5) { p.flash = Math.max(p.flash || 0, w); p.flashColor.setRGB(0.8, 0.92, 0.94); } }
      if (s > 609 && s < 614) { p.flashColor.setRGB(1, 1, 1); } if (s > 609 && s < 614) p.flash = Math.max(p.flash || 0, 0.35 * Math.exp(-Math.abs(s - 611.2) / 0.5) * (this._below ? 1 : 0.4));
    },
  };
  return set;
};

// the bubbles: your first breath out (3:07:30), the girl's (LA.kidBreath), the glass boiling in your empty flat, the fizz
function laBubbleSources(set, s, v) {
  const out = [], C = set.C;
  if (s > 445 && s < 452) out.push({ x: 0.8, y: 1.45, z: -3.55, n: Math.round(220 * (1 - laSm(s, 447, 452))), r: 0.08, life: 1.6, h: 1.2, size: 0.03, grow: 1.5, seed: 81 });
  const kb = LA.kidBreath || 478;
  if (s > kb - 0.3 && s < kb + 5 && C.kid.root.visible) { const h = laHeadOf(C.kid); out.push({ x: h.x, y: h.y + 0.05, z: h.z + 0.08, n: Math.round(160 * (1 - laSm(s, kb + 1, kb + 5))), r: 0.05, life: 1.3, h: 1.6, size: 0.026, grow: 1.2, seed: 87 }); }
  if (s >= LA_BOIL.s0 && s < LA_BOIL.freeze1 + 10 && v.inside) {
    const w = set.R.toWorld(-0.88, 0.4375 + 0.03, -0.02), k = 1 - laSm(s, LA_BOIL.freeze0, LA_BOIL.freeze1);
    out.push({ x: w.x, y: w.y, z: w.z, n: Math.round(60 * k), r: 0.025, life: 0.5, h: 0.08, size: 0.004, grow: 0.6, seed: 91, air: true });
  }
  // 4:00: the liquid in everyone's lungs turns back too: they breathe it out as streams of bubbles
  if (s > LAP.back - 0.2) { const cp = set.camera.position;
    [...C.folk, C.mum, C.kid].forEach((P, i) => { if (!P.root.visible) return; const h = laHeadOf(P); if (Math.hypot(h.x - cp.x, h.z - cp.z) > 18) return;
      out.push({ x: h.x, y: h.y, z: h.z + 0.1, n: Math.round(110 * laSm(s, LAP.back + 0.2, LAP.back + 1.2)), r: 0.08, life: 1.0, h: 2.8, size: 0.05, grow: 1.8, seed: 120 + i }); }); }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERAS: one per mode. v = { p, at, fov, drift, sh: { f, R }, inside, far, refl, ghost, room, fogK, … }.
// RL(x, y, z): room → world. You stand at [0.8, 0, −3.4] in the street (your eyes 1.62 m up)
// ---------------------------------------------------------------------------------------------------------------------
const LA_YOU = [0.8, 0, -3.4];
function laShotCam(set, m, s, t, k, shot, v, RL) {
  const into = (a, b, u) => laV(a, b, Ease.inOutSine(u)), Y = LA_YOU, d = laDepth(s), E = (x, y, z) => [Y[0] + x, y, Y[2] + z];
  const room = () => { v.inside = true; v.room = true; v.sh = { f: RL(0, 1, -1), R: 5 }; v.drift = 0.0015; };
  const head = (P) => { const h = laHeadOf(P); return [h.x, h.y, h.z]; };
  switch (m) {
    // ---- 1: your living room
    case 'title': room(); v.p = into(RL(2.15, 1.75, 1.7), RL(1.95, 1.7, 1.45), k); v.at = RL(-0.5, 0.95, -1.5); v.fov = 58; break;
    case 'drops': room(); v.p = into(RL(-0.42, 0.78, 0.62), RL(-0.48, 0.74, 0.55), k); v.at = RL(-0.86, 0.5, -0.02); v.fov = 38; v.near = 0.02; v.dropK = 1.6; break;
    case 'room1': room(); v.p = into(RL(0.15, 1.6, -1.2), RL(0.2, 1.62, -1.45), k); v.at = [-6, 3, -50]; v.fov = 56; v.sh = { f: [0, 0, -10], R: 30 }; break;
    case 'real': room(); v.p = into(RL(-0.4, 1.62, -1.55), RL(-0.2, 1.6, -1.35), k); v.at = RL(1.1, 1.0, 1.6); v.fov = 60; break;
    case 'dark': room(); v.p = into(RL(0.3, 1.5, -1.8), RL(0.35, 1.52, -1.86), k); v.at = [-24, 14, -70]; v.fov = 60; v.sh = { f: [0, 0, -12], R: 30 }; v.expo = 1 - 0.5 * laSm(t, laC('dark', 0) - 0.4, laC('dark', 0) + 1.6); break;
    case 'weight': v.p = into([8, 1.7, -27], [7, 1.75, -25.5], k); v.at = [1.5, 8.2, 0]; v.fov = 58; v.ghost = 0.85 * laSm(t, laC('weight', 1) - 0.3, laC('weight', 1) + 0.6); v.sh = { f: [0, 6, 0], R: 30 }; v.drift = 0.003; v.rainR = 18; break;
    case 'floor': room(); v.p = into(RL(0.25, 1.5, -2.32), RL(0.25, 1.52, -2.36), k); v.at = [2.5, 0, -8.5]; v.fov = 62; v.sh = { f: [3, 0, -5], R: 14 }; break;
    case 'ears': room(); v.p = into(RL(-1.6, 1.42, 0.95), RL(-1.5, 1.38, 0.85), k); v.at = RL(0.5, 1.15, -1.6); v.fov = 54; v.roll = 2.5 * Math.sin(t * 0.7); break;
    case 'packet': room(); v.p = into(RL(-0.52, 0.66, 0.42), RL(-0.56, 0.63, 0.38), k); v.at = RL(-0.8, 0.47, 0.18); v.fov = 34; v.near = 0.02; v.dropK = 0.8; break;
    case 'go': room(); v.p = into(RL(-1.0, 1.62, -0.9), RL(0.6, 1.62, 0.9), k); v.at = RL(1.6, 1.15, 2.2); v.fov = 60; break;
    // ---- 2: the street fills
    case 'stairs': v.p = into([-1.2, 1.5, -7.6], [-1.6, 1.5, -7.2], k); v.at = [-4.2, 1.2, -1.0]; v.fov = 50; v.sh = { f: [-4, 1, -2], R: 10 }; break;
    case 'street': v.p = into([9, 1.62, -5.6], [8, 1.62, -5.4], k); v.at = [-30, 1.0, -3.8]; v.fov = 56; v.sh = { f: [0, 0, -4], R: 20 }; break;
    case 'lamps': v.p = into([-7, 2.7, -5.2], [-5.5, 2.7, -5.2], k); v.at = [86, 7, -12]; v.fov = 48; v.sh = { f: [30, 0, -5], R: 40 }; v.rainR = 20; break;
    case 'cars': v.p = into([0.4, 0.75, -5.0], [0.8, 0.8, -5.1], k); v.at = [4.5, 0.6, -7.95]; v.fov = 50; v.sh = { f: [4, 0.5, -8], R: 8 }; break;
    case 'light': v.p = into([-0.6, 1.45, -2.4], [-0.9, 1.4, -2.5], k); v.at = [-3.0, 0.9, -4.3]; v.fov = 50; v.sh = { f: [-3, 1, -4], R: 8 }; break;
    case 'rising': v.p = E(0, 1.62, 0); v.at = into(E(0.4, 0.6, -1.6), E(0.6, 0.7, -2.4), k); v.fov = 62; v.sh = { f: E(0, 1, -1), R: 8 }; break;
    case 'ball': v.p = into(E(0.4, d + 0.45, -0.6), E(0.5, d + 0.4, -0.7), k); v.at = [1.8, d, -4.7]; v.fov = 46; v.sh = { f: [2, d, -5], R: 8 }; break;
    case 'chin': v.p = E(0, 1.6 + 0.01 * Math.sin(t * 1.3), 0); v.at = E(0.2, 1.48, -6); v.fov = 64; v.sh = { f: E(0, 1, -3), R: 10 }; v.rainR = 10; break;
    case 'breathe': v.p = into(E(0, 1.42, 0), E(0, 1.4, -0.1), k); v.at = E(-0.6, 3.4, -3.4); v.fov = 66; v.sh = { f: E(0, 1, -2), R: 8 }; break;
    case 'first': { const h = head(set.C.kid); v.p = into([h[0] - 0.3, h[1] - 0.12, h[2] - 1.35], [h[0] - 0.25, h[1] - 0.1, h[2] - 1.15], k); v.at = [h[0], h[1] + 0.12, h[2]]; v.fov = 44; v.sh = { f: h, R: 6 }; break; }
    case 'under': v.p = into([7.5, 1.3, -6.6], [6.5, 1.3, -6.4], k); v.at = [-20, 2.2, -3.8]; v.fov = 60; v.sh = { f: [0, 1, -5], R: 20 }; break;
    case 'voice': { const h = head(set.C.folk[0]); v.p = into([h[0] + 1.1, h[1] + 0.05, h[2] - 1.0], [h[0] + 1.0, h[1] + 0.04, h[2] - 0.9], k); v.at = [h[0], h[1] - 0.1, h[2]]; v.fov = 42; v.sh = { f: h, R: 6 }; break; }
    case 'sink': { const st = laCarState('car3', s); v.p = into([-8.6, 0.8, -4.0], [-8.9, 0.8, -4.1], k); v.at = [-12 + st.x, st.y + 0.6, -7.95 + st.z]; v.fov = 54; v.sh = { f: [-12, 1, -8], R: 10 }; break; }
    case 'last': v.p = into([-2, d + 0.7, -5.5], [0, d + 0.75, -5.5], k); v.at = [60, d + 3.5, -4]; v.fov = 56; v.sh = { f: [20, d, -4], R: 30 }; v.rainR = 18; break;
    // ---- the crash (real time), the sun
    case 'crash0': v.p = E(0, 1.45, 0); v.at = into(E(-1.5, 6, -6), E(-1.8, 7, -5), k); v.fov = 70; v.sh = { f: E(0, 1, -3), R: 12 }; break;
    case 'crash1': v.p = into([9, 1.0, -7.2], [8.5, 1.0, -7.0], k); v.at = [1, 8.5, 0]; v.fov = 66; v.sh = { f: [2, 6, 0], R: 20 }; break;
    case 'sun': { v.p = E(0, 1.45, 0); const dz = laN3(laV([0, 1, 0], LA_SUN_UW, 0.65)); v.at = laAdd(v.p, dz, 10); v.fov = 74; v.sh = { f: E(0, 0, -3), R: 14 }; v.refl = true; break; }
    // ---- 3: at the bottom of the sky
    case 'deep': v.p = into([-6, 2.4, -8.2], [-4, 2.5, -8.0], k); v.at = [30, 6.5, -3]; v.fov = 60; v.sh = { f: [10, 0, -5], R: 30 }; break;
    case 'flat': room(); v.expo = 1.35; v.p = into(RL(1.7, 1.55, 1.3), RL(1.55, 1.5, 1.15), k); v.at = RL(-0.75, 0.55, -0.3); v.fov = 56; v.sh = { f: RL(-0.5, 0.5, -1), R: 4 }; break;
    case 'glass': room(); v.p = into(RL(-0.62, 0.6, 0.2), RL(-0.65, 0.58, 0.17), k); v.at = RL(-0.88, 0.5, -0.02); v.fov = 30; v.near = 0.01; v.sh = { f: RL(-0.88, 0.5, 0), R: 2 }; break;
    case 'snell': v.p = into([2, 1.2, -15], [2.1, 1.2, -15.3], k); v.at = [2 + LA_SUN_UW[0] * 1.6, 11, -15 + LA_SUN_UW[2] * 1.6]; v.fov = 104; v.roll = 14 * k; v.sh = { f: [2, 0, -15], R: 20 }; v.refl = true; v.fogK = 0.75; break;
    case 'moon': v.p = into([2.5, 1.1, -9.6], [1.5, 1.1, -9.6], k); v.at = [-0.5, 1.2, -4.8]; v.fov = 56; v.sh = { f: [0, 1, -5], R: 10 }; break;
    case 'float': v.p = into([39.5, 7.0, -7.5], [40.3, 7.2, -7.2], k); v.at = [43.5, 11.6, -4.0]; v.fov = 64; v.sh = { f: [46, 6, -1], R: 14 }; break;
    case 'bins': v.p = into([-6.2, 1.0, -3.3], [-6.6, 0.95, -3.1], k); v.at = [-12, 0.5, -0.7]; v.fov = 52; v.sh = { f: [-10, 0, -1], R: 8 }; break;
    case 'pond': { const q = laBirdState(0, s, 'duck').pos; v.p = into([q[0] + 1.5, 0.5, q[2] + 1.3], [q[0] + 1.2, 0.42, q[2] + 1.0], k); v.at = [q[0], 0.08, q[2]]; v.fov = 44; } v.sh = { f: [-4, 0, -52], R: 14 }; break;
    case 'birds': { const b = laBirdState(0, s, 'pigeon'); v.p = into([-1.0, 2.6, -15.0], [-0.6, 2.7, -15.4], k); v.at = laV([2, 4, -20], b.pos, 0.6); v.fov = 48; v.sh = { f: [2, 3, -20], R: 10 }; break; }
    case 'bell': v.p = into([64, 12.5, -33], [65.5, 12.6, -32], k); v.at = [88, 16.5, -20.5]; v.fov = 44; v.sh = { f: [88, 14, -20], R: 16 }; break;      // (above it, in the vacuum)
    case 'bell2': v.p = into([80.5, 1.2, -25], [81, 1.25, -24.5], k); v.at = [86, 9.5, -20.5]; v.fov = 62; v.sh = { f: [86, 5, -20], R: 14 }; v.fogK = 0.8; break;
    case 'top': v.p = into([-3, 10.35, -2.6], [-2.6, 10.45, -2.7], k); v.at = [3, 12.6, -9]; v.fov = 62; v.sh = { f: [0, 10, -3], R: 10 }; v.refl = true; break;
    case 'cold': v.p = into([2.3, 1.35, -1.6], [2.1, 1.35, -1.7], k); v.at = [-1.0, 0.95, -3.8]; v.fov = 52; v.sh = { f: [0, 1, -3], R: 8 }; break;
    case 'work': { const h = head(set.C.folk[9]); v.p = into([h[0] - 1.3, h[1] + 0.02, h[2] + 1.0], [h[0] - 1.2, h[1], h[2] + 0.9], k); v.at = [h[0], h[1] - 0.12, h[2]]; v.fov = 40; v.sh = { f: h, R: 6 }; break; }
    // ---- 4: 4:00
    case 'back': v.p = into([-12, 2.5, -6.2], [-10.5, 2.4, -6.0], k); v.at = [12, 1.6, -4.2]; v.fov = 56; v.sh = { f: [0, 1, -4], R: 20 }; break;
    case 'count': laCountCam(set, s, t, v, RL); break;
    case 'fizz': v.p = E(0, 1.45, 0); v.at = into(E(-1, 3.0, -6), E(-1, 6, -4), k); v.fov = 68; v.sh = { f: E(0, 1, -3), R: 12 }; v.refl = true; break;
    case 'question': v.p = into([8, 1.4, -7.0], [7, 1.45, -6.8], k); v.at = [-12, 3.6, -3]; v.fov = 60; v.sh = { f: [0, 1, -4], R: 20 }; break;
  }
}
// the last ten seconds: quick cuts (LA.subCuts) round everyone
function laCountCam(set, s, t, v, RL) {
  const n = (LA.subCuts || []).filter((c) => t >= c).length, Y = LA_YOU; set._sub = n;
  const head = (P) => { const h = laHeadOf(P); return [h.x, h.y, h.z]; };
  if (n === 0) { const h = head(set.C.kid); v.p = [h[0] + 0.8, h[1], h[2] - 1.1]; v.at = h; v.fov = 44; }
  else if (n === 1) { v.p = [6, 1.0, -7.5]; v.at = [0, 10, 0]; v.fov = 62; }
  else if (n === 2) { const h = head(set.C.mum); v.p = [h[0] - 0.9, h[1] + 0.05, h[2] - 1.0]; v.at = h; v.fov = 44; }
  else if (n === 3) { v.p = [Y[0], 1.45, Y[2]]; v.at = [Y[0] - 1, 12, Y[2] - 5]; v.fov = 78; v.refl = true; }
  else if (n === 4) { const h = head(set.C.folk[3]); v.p = [h[0] + 1.0, h[1], h[2] - 0.9]; v.at = h; v.fov = 44; }
  else { v.p = [-9, 1.4, -6.0]; v.at = [10, 1.6, -4]; v.fov = 56; }
  v.drift = 0.003; v.sh = { f: v.at, R: 12 };
}

// labels pinned in the scene: [{ p, text, sub, a, side }]
function laLabels(set, t) {
  const shot = laShotAt(t), m = shot.mode, out = [], W = StoryHUD.win, R = set.R;
  const RL = (x, y, z) => R.toWorld(x, y, z).toArray();
  if (m === 'weight') {
    out.push({ p: RL(0.2, 1.3, -2.1), text: 'YOUR FLOOR', sub: '12.0 m UP', a: W(t, shot.t0 + 0.5, shot.t1 - 0.2, 0.3, 0.2), side: 'r' });
    out.push({ p: [-14, LAP.D, -0.1], text: 'THE SURFACE AT 3:10', sub: '11.8 m', a: W(t, laC('weight', 1) + 0.3, shot.t1 - 0.2, 0.3, 0.2) });
  }
  if (m === 'top') out.push({ p: [2.5, LAP.D - LAP.armstrong / 2, -8], text: 'THE TOP 70 cm', sub: 'BLOOD WOULD BOIL', a: W(t, laC('top', 1) - 0.2, shot.t1 - 0.2, 0.3, 0.2) });
  if (m === 'deep') out.push({ p: [14, LAP.D, -6], text: 'THE SURFACE', sub: '11.8 m UP', a: W(t, shot.t0 + 0.8, shot.t1 - 0.3, 0.3, 0.3) });
  if (m === 'pond') out.push({ p: [LA_ST.pond.x + 3, 0.1, LA_ST.pond.z + 4], text: 'THE POND', sub: 'WATER, UNDER THE SKY', a: W(t, shot.t0 + 0.6, shot.t1 - 0.3, 0.3, 0.3) });
  if (m === 'sink') out.push({ p: [-12, 3.0, -7.95], text: 'FILLING', sub: 'IT SINKS', a: W(t, shot.t0 + 0.6, shot.t1 - 0.4, 0.3, 0.3), side: 'r' });
  return out;
}
