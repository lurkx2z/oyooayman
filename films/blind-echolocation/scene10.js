/* =====================================================================
   SCENE 10 — "The sound of rain" (city.js + rain.js). The same street, a few minutes on: the clouds close, it rains.
     J1   "Then it starts raining.": from the far corner as she finishes crossing: the sky closes, the light goes grey,
          the first drops
     J2   "And the entire soundscape changes.": SLOW MOTION macro: one drop meets the metal guard rail
     J3   "Drops strike pavement, metal, leaves, umbrellas, glass.": five inserts, each on its word (slowed, labelled)
     J4a  "Thousands of tiny impacts…": the storm from high above the street (a flash of lightning far off)
     J4b  "…create new sounds across the environment.": the same view as sound: thousands of tiny rings
     J5   "But rain doesn't simply reveal a perfect map.": with her, walking in the rain
     J6   "It can also drown out quieter echoes.": the sound view behind her: her click, lost among the rain's rings
     J7   "Every environment has its own acoustic character.": the sound view: the open street hisses, the scaffold's
          boards drum, the arcade is sheltered (only the drips along its edge)
     J8   "…when to trust a clue, when to check it, and when to slow down.": the arcade opens on her right; her cane
          finds its column; she slows and stops
     J9a  (no narration) from straight above: a sheet of heavier rain sweeps along the street
     J9b  (no narration) under the arcade: she steps in out of the rain; the sound changes at once
   ===================================================================== */
Object.assign(GB_LOOKS, {
  rainA: { skin: '#a8765a', lip: '#5a2f2a', top: '#3d4a3a', topDark: '#2f3a2c', pants: '#2a2a33', shoes: '#2b2622', sole: '#141212', hair: '#3a2a22', hairStyle: 'short', build: 1.0, head: 1.0 },
  rainB: { skin: '#5a3a2c', lip: '#2e1a18', top: '#8a3a46', topDark: '#702e38', pants: '#22242e', shoes: '#3a2f2a', sole: '#161212', hair: '#120c0a', hairStyle: 'pony', build: 0.94, head: 0.98 },
  rainC: { skin: '#d0a080', lip: '#7a4a40', top: '#6f6488', topDark: '#5a506f', pants: '#3a3438', shoes: '#4a3a30', sole: '#1a1414', hair: '#7a5a3a', hairStyle: 'short', build: 1.05, head: 1.0 },
});

BE.j2 = bnE(10, 'and').start - 0.1;
BE.j3a = bnE(10, 'drops').start - 0.25;
BE.j3b = bnE(10, 'metal').start - 0.12;
BE.j3c = bnE(10, 'leaves').start - 0.12;
BE.j3d = bnE(10, 'umbrellas').start - 0.12;
BE.j3e = bnE(10, 'glass').start - 0.12;
BE.j4a = bnE(10, 'thousands').start - 0.2;
BE.j4b = bnE(10, 'create').start - 0.1;
BE.j5 = bnE(10, 'but').start - 0.25;
BE.j6 = bnE(10, 'it', 30).start - 0.25;
BE.j7 = bnE(10, 'every').start - 0.25;
BE.j8 = bnE(10, 'and', 30).start - 0.25;
BE.j8b = bnE(10, 'trust').start - 0.45;
BE.j9 = BN_CLIP[10].speechEnd + 0.2;
BE.j9b = BE.j9 + 3.4;
BE.s11 = BN_SC[11].start;
BE.jW = { pavement: bnE(10, 'pavement').start, metal: bnE(10, 'metal').start, leaves: bnE(10, 'leaves').start, umbrellas: bnE(10, 'umbrellas').start, glass: bnE(10, 'glass').start,
  trust: bnE(10, 'trust').start, check: bnE(10, 'check').start, slow: bnE(10, 'slow').start };
BE.rain0 = bnE(10, 'raining').start - 0.3;                 // the first drops
BE.jRail = BE.j2 + 1.15;                                     // the macro drop meets the rail
BE.jFlash = BE.j4a + 0.75;                                   // lightning, far off (thunder follows in the sound)
BE.j6Clicks = [BE.j6 + 0.35, bnE(10, 'quieter').start - 0.05];
BE.jTap = BE.jW.check + 0.2;                                 // her cane meets the column
BE.jStop = BE.jW.slow + 0.4;                                 // she has slowed to a stop
BE.jIn = [BE.j9b - 0.6, BE.j9b + 1.8];                       // she steps in under the arcade

function beRainK(t) { return 0.12 * MathX.smooth(t, BE.rain0 - 0.2, BE.rain0 + 0.4) + 0.88 * MathX.smooth(t, BE.rain0 + 0.6, BE.j3a); }
function beStormK(t) { return MathX.smooth(t, BE.s10 - 0.2, BE.rain0 + 0.8); }
function beWetK(t) { return MathX.smooth(t, BE.rain0, BE.j3a + 1.2); }
// the sheet of rain in the gap (J9a): a band of heavier rain moving along +x
function beRainFront(t) { const k = MathX.ramp(t, BE.j9 - 0.6, BE.j9b + 0.3); return [MathX.lerp(22, 62, k), 4.5, MathX.window(t, BE.j9 - 0.6, BE.j9b + 0.4, 0.6, 0.5)]; }
// the slow-motion rate of each shot (rain time runs at this rate inside the shot)
function beRainTime(t, shot) { const r = shot && shot.rate ? shot.rate : 1; return r === 1 ? t : shot.t0 + (t - shot.t0) * r; }

// ---- the props, the extra walkers, the weather
BE_SET_BUILDERS.push((app, cast) => {
  const c = app.sets.city, R = c.root, r = new RNG(1010);
  const rain = c.rain = new BeRain(c.scene);
  // a pedestrian guard rail along the kerb past the crossing (galvanised steel): the macro drop lands on it
  const railM = c.railM = gbMat('#9aa2a8', { rough: 0.35, metal: 0.85, name: 'beCityRailMetal' });
  for (const x of [41.0, 42.8, 44.6]) gbAdd(R, new THREE.CylinderGeometry(0.03, 0.03, 1.0, 10), railM, x, 0.5, 7.35);
  for (const y of [1.0, 0.32]) gbAdd(R, new THREE.CylinderGeometry(0.024, 0.024, 3.6, 12), railM, 42.8, y, 7.35, { rz: Math.PI / 2 });
  c.railTop = { x0: 41.0, x1: 44.6, y: 1.024, z: 7.35 };
  // drops already sitting on the rail (beads), visible in the macro
  c.beads = new THREE.Group(); R.add(c.beads);
  const beadM = c.beadM = new THREE.MeshStandardMaterial({ color: '#9fb0bd', roughness: 0.03, metalness: 0.1, transparent: true, opacity: 0.5, envMapIntensity: 2.6, name: 'beCityWaterBead' });
  for (let i = 0; i < 26; i++) { const b = gbAdd(c.beads, new THREE.SphereGeometry(1, 12, 8), beadM, 41.8 + r.range(0, 0.45), 1.0 + 0.024 - 0.0004, 7.35 + r.range(-0.012, 0.012), { cast: false, s: [1, 0.55, 1] }); b.scale.multiplyScalar(r.range(0.0012, 0.0028)); b.userData.y0 = b.position.y; }
  rain.addSurface(R, new THREE.Vector3(41.0, 1.024, 7.335), new THREE.Vector3(3.6, 0, 0), new THREE.Vector3(0, 0, 0.03), new THREE.Vector3(0, 1, 0), 160, { size: 0.032, period: 0.5, drops: 5 });
  // the macro drop and its crown (built once; posed by the shot)
  const md = c.macro = { g: new THREE.Group() }; R.add(md.g);
  md.drop = gbAdd(md.g, new THREE.SphereGeometry(0.0024, 20, 14), beadM, 0, 0, 0, { cast: false });
  md.crown = []; for (let i = 0; i < 16; i++) md.crown.push(gbAdd(md.g, new THREE.SphereGeometry(1, 10, 8), beadM, 0, 0, 0, { cast: false }));
  md.sheet = gbAdd(md.g, new THREE.TorusGeometry(1, 0.18, 8, 28), beadM, 0, 0, 0, { cast: false, rx: Math.PI / 2 });
  md.film = gbAdd(md.g, new THREE.SphereGeometry(1, 20, 10), beadM, 0, 0, 0, { cast: false });
  md.g.visible = false;
  // a planter with a leafy shrub at the arcade's edge (the leaves the rain strikes)
  const pl = new THREE.Group(); pl.position.set(54.5, 0, 11.25); R.add(pl); c.planter = pl;
  beBox(pl, 1.6, 0.5, 0.6, 0, 0.25, 0, gbMat('#6f6a62', { rough: 0.8, name: 'beCityPlanterConcrete' }));
  beBox(pl, 1.5, 0.04, 0.5, 0, 0.49, 0, gbMat('#2e241c', { rough: 0.95, name: 'beCityPlanterSoil' }), { cast: false });
  { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.quadraticCurveTo(0.03, 0.035, 0, 0.1); sh.quadraticCurveTo(-0.03, 0.035, 0, 0);
    const lg = new THREE.ShapeGeometry(sh, 4), lm = c.leafM = new THREE.MeshStandardMaterial({ color: '#3f6a2e', roughness: 0.5, side: THREE.DoubleSide, name: 'beCityShrubLeaf', envMapIntensity: 0.8 });
    const n = 320, im = c.leaves = new THREE.InstancedMesh(lg, lm, n); im.castShadow = true; pl.add(im);
    c.leafBase = [];
    const stems = []; for (let j = 0; j < 7; j++) { const x = -0.6 + j * 0.2 + r.range(-0.05, 0.05), z = r.range(-0.15, 0.15), h = r.range(0.45, 0.75); stems.push([x, z, h]); gbAdd(pl, new THREE.CylinderGeometry(0.008, 0.014, h, 5), gbMat('#4a3a2a', { rough: 0.9, name: 'beCityShrubStem' }), x, 0.5 + h / 2, z, { cast: false }); }
    for (let i = 0; i < n; i++) {
      const [sx, sz, sh] = stems[i % stems.length], a = r.range(0, Math.PI * 2), rr = r.range(0.03, 0.2), y = 0.5 + sh * r.range(0.45, 1.05);
      const p = new THREE.Vector3(sx + Math.cos(a) * rr, y, sz + Math.sin(a) * rr * 0.8);
      const e = new THREE.Euler(r.range(-1.0, -0.3), a + r.range(-0.6, 0.6), r.range(-0.4, 0.4), 'YXZ');
      c.leafBase.push({ p, e, s: r.range(0.75, 1.3), ph: r.next(), per: r.range(0.35, 0.9) });
    }
  }
  // the shop window the rain runs down (block A, x 22): a glass layer with beads, impacts and rivulets
  { const u = c.glassU = { uT: { value: 0 }, uWet: { value: 0 } };
    const m = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: BE_RAIN_GLSL + /* glsl */`
        uniform float uT, uWet; varying vec2 vP;
        // one bead: a lens of water: a dark refracting rim, a bright highlight up-left, a soft caustic below
        vec4 bead(vec2 d, float R){ float r = length(d) / R; if (r > 1.0) return vec4(0.0);
          float rim = smoothstep(0.6, 1.0, r), hl = smoothstep(0.35, 0.0, length(d / R - vec2(-0.32, 0.36))), ca = smoothstep(0.5, 0.0, length(d / R - vec2(0.1, -0.45)));
          return vec4(mix(vec3(0.08, 0.1, 0.12), vec3(0.85, 0.9, 0.95), hl) + ca * 0.25, 0.25 + 0.55 * rim + 0.6 * hl); }
        void main(){
          vec4 acc = vec4(0.0); vec2 p = vP;
          // static beads on a jittered grid (cells 4 cm), appearing as the glass gets wet
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
            vec2 cell = floor(p / 0.04) + vec2(float(i), float(j)), h = h21(cell * 1.7 + 3.1);
            if (h.x > uWet * 0.75) continue;
            vec2 c = (cell + 0.2 + 0.6 * h) * 0.04; float R = 0.004 + 0.009 * h.y * h.y;
            vec4 b = bead(p - c, R); acc = mix(acc, b, b.a);
          }
          // rivulets: a drop runs down, wavering, leaving a wet trail
          for (int k = 0; k < 7; k++) {
            float fk = float(k), per = 2.4 + 1.3 * h11(fk * 7.1), ph = h11(fk * 3.3) * per, cyc = floor((uT + ph) / per), age = mod(uT + ph, per);
            float x0 = (h11(cyc * 1.31 + fk * 9.7) - 0.5) * 2.2, y0 = 1.0 - 0.5 * h11(cyc * 2.7 + fk);
            float y = y0 - age * (0.35 + 0.25 * h11(fk * 5.1)), x = x0 + 0.02 * sin(y * 23.0 + fk);
            float tr = smoothstep(0.004, 0.0015, abs(p.x - (x0 + 0.02 * sin(p.y * 23.0 + fk)))) * step(y, p.y) * step(p.y, y0) * 0.35;
            acc = mix(acc, vec4(0.7, 0.78, 0.85, 1.0), tr * uWet);
            vec4 b = bead(p - vec2(x, y), 0.008); acc = mix(acc, b, b.a * uWet);
          }
          // fresh impacts: a splat that flattens and leaves a bead
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
            vec2 cell = floor(p / 0.09) + vec2(float(i), float(j)); float per = 0.9, ph = h11(dot(cell, vec2(1.3, 7.7))) * per, cyc = floor((uT + ph) / per), age = mod(uT + ph, per);
            vec2 h = h21(cell + cyc * 0.37); if (h.x > uWet * 0.8) continue;
            vec2 c = (cell + h) * 0.09; float R = mix(0.002, 0.009, smoothstep(0.0, 0.06, age));
            vec4 b = bead(p - c, R); b.a *= 1.0 - smoothstep(0.5, 0.9, age); acc = mix(acc, b, b.a);
          }
          if (acc.a < 0.01) discard;
          gl_FragColor = vec4(acc.rgb, acc.a * 0.8);
        }`,
    });
    const g = gbAdd(R, new THREE.PlaneGeometry(2.4, 2.2), m, 22.0, 1.45, 11.955, { ry: Math.PI, cast: false, receive: false }); g.userData.beSkip = true; g.renderOrder = 3; c.glass = g; }
  // puddles (they fill as the street gets wet)
  { const pm = c.puddleM = new THREE.MeshStandardMaterial({ color: '#3d434a', roughness: 0.06, metalness: 0, transparent: true, opacity: 0, envMapIntensity: 1.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, name: 'beCityPuddleWater' });
    for (const [x, z, s] of [[37.6, 6.8, 1.0], [44.2, 6.6, 1.4], [50.5, 6.7, 1.1], [58, 6.6, 1.6], [34.5, 8.4, 0.7], [41.5, 10.4, 0.8], [53.4, 9.9, 0.9], [61, 9.3, 0.7], [47.5, 2.3, 1.8], [56, -1.6, 1.5], [31, -4, 1.2], [39, 4.2, 1.3], [64, 3.6, 1.6], [46.2, -9.6, 0.9]]) {
      const n = 28, pts = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = s * (0.55 + 0.25 * Math.sin(a * 2 + x) + 0.12 * Math.sin(a * 5 + z)); pts.push(new THREE.Vector2(Math.cos(a) * rr * 1.4, Math.sin(a) * rr * 0.7)); }
      const y = Math.abs(z) < 7 ? BE_CITY.roadY + 0.003 : 0.005;
      gbAdd(R, new THREE.ShapeGeometry(new THREE.Shape(pts)), pm, x, y, z, { rx: -Math.PI / 2, cast: false }); } }
  // the extra walkers: two under umbrellas, one dry under the arcade
  for (const [id, look] of [['u1', 'rainA'], ['u2', 'rainB'], ['u3', 'rainC']]) { const P = c.peds[id] = new GbCharacter(c.scene, look, { name: id }); beAcousticScene(P.root, 'hero'); P.J.hc.traverse((o) => { if (o.isMesh) o.receiveShadow = false; }); }
  c.umb = { u1: beUmbrella('#22324a'), u2: beUmbrella('#7a2a30'), p4: beUmbrella('#2e2e30') };
  for (const k in c.umb) { c.scene.add(c.umb[k]); beAcousticScene(c.umb[k], 'hero'); c.umb[k].visible = false; }
  rain.addSurface(c.umb.u1, new THREE.Vector3(-0.42, 0.98, -0.42), new THREE.Vector3(0.84, 0, 0), new THREE.Vector3(0, 0, 0.84), new THREE.Vector3(0, 1, 0), 90, { size: 0.03, period: 0.4, cone: [0.98, 0.38], drops: 5 });
  // the wet look: the materials that darken and turn glossy (collected once, their dry values kept)
  c.wetList = [];
  c.root.traverse((o) => { if (!o.isMesh || !o.material || o.userData.beSkip) return; for (const m of [].concat(o.material)) {
    if (!m.isMeshStandardMaterial || m._beWet) continue; const nm = m.name || '';
    const k = /Asphalt|RoadPaint|Pave|Kerb|Tactile|Planter/.test(nm) ? 1 : /Wall|Roof|Column|Bench|Bin|Pole|Scaffold|Barrier|Rail|Awning|Bike|Grate|Leaf|Bark/.test(nm) ? 0.5 : 0;
    if (!k) continue; m._beWet = { k, col: m.color.clone(), rough: m.roughness, env: m.envMapIntensity ?? 1 }; c.wetList.push(m); } });
  c.heads = new Set(); c.cars.forEach((q) => q.v.group.traverse((o) => { if (o.isMesh && /head/i.test(o.material.name || '')) c.heads.add(o.material); }));
  c.envDry = c.scene.environment; c.envWet = beEnvFor(app.renderer, '#c9d1d8', '#8a9198', '#2e3034');
  c.extra = beRainExtra;
  const fx0 = c.fx; c.fx = function (app, t, shot, L) { fx0.call(this, app, t, shot, L); if (t > BE.s10 - 0.5) beRainFx.call(this, app, t, shot, L); };
});

// the weather, every frame (a pure function of t; resets to dry before scene 10)
function beRainExtra(t, L, cam, shot) {
  const c = this, k = beRainK(t), st = beStormK(t), wet = beWetK(t), ac = L.ac > 0.5 ? 1 : 0;
  c.skyU.uCloud.value = MathX.lerp(0.25, 0.97, st);
  const fl = Math.max(0, MathX.window(t, BE.jFlash, BE.jFlash + 0.09, 0.01, 0.05), 0.7 * MathX.window(t, BE.jFlash + 0.16, BE.jFlash + 0.3, 0.01, 0.1));
  c.skyU.uFlash.value = fl * 1.6;
  if (!ac) {
    c.sun.intensity = MathX.lerp(3.6, 0.3, st); c.hemi.intensity = MathX.lerp(0.5, 1.15, st) + fl * 2.5;
    c.hemi.color.set('#d6e4f2').lerp(new THREE.Color('#c3ccd6'), st); c.hemi.groundColor.set('#8a7a68').lerp(new THREE.Color('#4a4846'), st);
    const fc = new THREE.Color('#c9d3dc').lerp(new THREE.Color('#8e98a2'), st);
    c.scene.fog.color.copy(fc); c.scene.background.copy(fc);
    if (!shot.fogD) c.scene.fog.density = MathX.lerp(0.005, 0.011, st) * (shot.fogK ?? 1);
  }
  c.scene.environment = st > 0.5 ? c.envWet : c.envDry;
  for (const m of c.wetList) { const W = m._beWet, q = wet * W.k; m.color.copy(W.col).multiplyScalar(1 - 0.38 * q); m.roughness = MathX.lerp(W.rough, Math.min(W.rough, 0.14), q); m.envMapIntensity = W.env * (1 + 1.6 * q); }
  c.puddleM.opacity = 0.7 * MathX.smooth(wet, 0.3, 1);
  for (const m of c.heads) m.emissiveIntensity = MathX.lerp(0.6, 2.2, st);
  c.streetLampM.emissiveIntensity = 1.4 * MathX.smooth(t, BE.rain0 + 2, BE.rain0 + 4);
  const lamp = MathX.smooth(t, BE.rain0 + 1, BE.rain0 + 3); c.arcadeLamps.forEach((p) => { p.intensity = 7 * lamp * (ac ? 0 : 1); });
  c.glassU.uT.value = beRainTime(t, shot); c.glassU.uWet.value = wet;
  c.beads.visible = wet > 0.2;
  // the shrub's leaves bob under the drops (each leaf: hashed hits in rain time, a damped spring)
  { const rt = beRainTime(t, shot), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), e = new THREE.Euler();
    c.leafBase.forEach((b, i) => {
      let dip = 0;
      if (k > 0.05) for (let j = 0; j < 2; j++) { const cyc = Math.floor((rt + b.ph * b.per) / b.per) - j, th = cyc * b.per - b.ph * b.per + 0.37 * b.per * _beH(cyc * 7.3 + i); const a = rt - th; if (a > 0 && _beH(cyc * 3.1 + i * 1.7) < k * 0.8) dip += 0.5 * Math.exp(-a / 0.3) * Math.sin(2 * Math.PI * 3.2 * a + 0.4); }
      e.set(b.e.x + dip, b.e.y, b.e.z, 'YXZ'); q.setFromEuler(e); s.setScalar(b.s); m4.compose(b.p, q, s); c.leaves.setMatrixAt(i, m4);
    });
    c.leaves.instanceMatrix.needsUpdate = true; }
  // the rain itself
  if (k < 0.001 || t < BE.s10 - 0.5) { c.rain.hide(); c.macro.g.visible = false; return; }
  const rate = shot.rate || 1, S = FILM._S;
  c.rain.update(t, FILM._app.camera, { k, rt: beRainTime(t, shot), rate, ac: L.ac, wind: [0.7, 0.3], front: beRainFront(t), center: S ? S.at : null,
    dens: shot.rainDens ?? 0.6, splash: shot.splash ?? 0.7, half: shot.rainHalf ?? 16, alpha: shot.rainAlpha, fog: shot.rainFog ?? 0.012,
    splashSize: shot.splashSize, splashAlpha: shot.splashAlpha, curtain: shot.curtain });
  beRainMacro(c, t, shot);
}
const _beH = (x) => { const s = Math.sin(x * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// J2: the macro drop, in slow motion: falls, meets the rail, throws a crown of droplets, spreads into a film
function beRainMacro(c, t, shot) {
  const M = c.macro, on = shot.id === 'J2'; M.g.visible = on; if (!on) return;
  const R = c.railTop, x = 42.02, z = R.z - 0.004, rate = shot.rate, tau = (t - BE.jRail) * rate;   // real seconds since impact
  M.g.position.set(x, R.y, z);
  M.drop.visible = tau < 0; if (tau < 0) M.drop.position.set(0, 0.0024 - tau * 8.5, 0), M.drop.scale.set(1, 1.18, 1);
  const vis = tau >= 0;
  M.crown.forEach((d, i) => { d.visible = vis && tau < 0.09; if (!d.visible) return;
    const a = (i / M.crown.length) * Math.PI * 2 + 0.2 * _beH(i), vh = 0.55 + 0.6 * _beH(i * 3.1), vv = 0.55 + 0.7 * _beH(i * 5.7), ta = tau;
    d.position.set(Math.cos(a) * vh * ta, vv * ta - 4.9 * ta * ta, Math.sin(a) * vh * ta * 0.6); d.scale.setScalar(0.0006 + 0.0007 * _beH(i * 9.1));
    if (d.position.y < -0.03) d.visible = false; });
  const sk = MathX.ramp(tau, 0, 0.012); M.sheet.visible = vis && tau < 0.02; M.sheet.scale.set(0.002 + 0.01 * sk, 0.002 + 0.01 * sk, 0.002 + 0.004 * (1 - sk)); M.sheet.position.y = 0.001 + 0.003 * sk;
  M.film.visible = vis; const fk = MathX.ramp(tau, 0, 0.03); M.film.scale.set(0.002 + 0.007 * fk, 0.0015 * (1 - 0.6 * fk) + 0.0004, 0.002 + 0.004 * fk);
  c.beads.children.forEach((b) => { b.position.y = b.userData.y0 + (vis && tau < 0.05 ? 0.0004 * Math.sin(tau * 400) * Math.exp(-tau * 60) : 0); });
}

// the sound view in the rain: her clicks; the scaffold boards drumming; drips along the arcade's edge (J7)
function beRainFx(app, t, shot, L) {
  if (L.ac < 0.5) return;
  const set = this, R = set.rings;
  if (shot.id === 'J7' || shot.id === 'J6') {
    // the scaffold's boards (north side, x 48–64): a fast, heavy drumming (bigger rings on the boards)
    for (let i = 0; i < 26; i++) { const per = 0.22 + 0.2 * _beH(i * 1.3), ph = _beH(i * 7.7) * per, k = Math.floor((t + ph) / per), tt = k * per - ph;
      const p = new THREE.Vector3(48.5 + 15 * _beH(i * 3.3 + k * 0.17), 2.05 + 2.0 * Math.floor(_beH(i * 5.1) * 2), -11.0 + 0.6 * _beH(i * 9.9 + k));
      R.source(p, [tt], t, { r: 0.6, a: 0.75 * (shot.id === 'J7' ? 1 : 0.5), dur: 0.5, col: '#ffcf8a', th: 0.07 }); }
    // the arcade's edge: a line of drips falling off the roof (small, regular rings along z 11.9)
    for (let i = 0; i < 30; i++) { const per = 0.5 + 0.4 * _beH(i * 2.9), ph = _beH(i * 4.4) * per, k = Math.floor((t + ph) / per), tt = k * per - ph;
      const p = new THREE.Vector3(43.4 + i * 1.05, 0.02, 11.88); R.source(p, [tt], t, { r: 0.28, a: 0.65, dur: 0.6, col: '#9ff6ff', th: 0.08, squash: 0.35 }); }
  }
  for (const q of app.pulses.list) {
    if (q.set !== 'city' || !q.click || q.shot !== shot.id) continue;
    if (t > q.t && t < q.t + 0.45) R.source(q.p, [q.t], t, { r: 0.07, a: 0.8, dur: 0.45, col: '#9ff6ff' });
    if (t > q.t && t < q.t + 1.5) set.waves.click(q, t, [], { speed: q.speed, life: 1.4, a: 0.12 });
  }
}

// ---- blocking: she finishes crossing and waits as the rain starts; walks on; clicks; walks to the arcade; steps in
const _beSlowEnd = beEaseWalk(0.12, 0.45);
{
  const V = (x, z) => new THREE.Vector3(x, 0, z), B = BE, P = BE_CITY.path, end = BE_HERO_CITY[BE_HERO_CITY.length - 1];
  const a = V(41.6, P), b = V(44.0, P), c = V(52.0, 11.0), d = V(50.6, 13.25);
  const turnIn = Math.atan2(d.x - c.x, d.z - c.z);
  BE_HERO_CITY.push(
    { t0: end.t1, p0: a, yaw: Math.PI / 2, cane: true, face: 'focus', hdY: (t) => 10 * MathX.window(t, B.rain0 + 0.4, B.j5 - 0.5, 0.8, 0.8) },
    { t0: B.j5 - 0.2, t1: B.j6 + 0.3, p0: a, p1: b, cane: true, step: 0.46, face: 'focus' },
    { t0: B.j6 + 0.3, p0: b, yaw: Math.PI / 2, cane: true, face: 'focus', hdY: (t) => 14 * MathX.window(t, B.j6Clicks[0] - 0.3, B.j7, 0.4, 0.5) },
    { t0: B.j7 + 0.3, t1: B.jStop, p0: b, p1: c, cane: true, step: 0.45, face: 'focus', ease: _beSlowEnd,
      hdY: (t) => -22 * MathX.window(t, B.jW.trust - 0.3, B.jStop + 0.4, 0.4, 0.5),
      sweepAdd: (t) => -1.1 * MathX.window(t, B.jTap - 0.35, B.jTap + 0.45, 0.25, 0.3), lift: (t) => 0.06 * MathX.window(t, B.jTap - 0.2, B.jTap + 0.35, 0.15, 0.2), tipStop: { c: new THREE.Vector3(52.5, 0, 11.95), r: 0.3 } },
    { t0: B.jStop, p0: c, cane: true, face: 'focus', yaw: (t) => MathX.lerp(Math.atan2(c.x - b.x, c.z - b.z), turnIn, MathX.smooth(t, B.j9 + 1.2, B.jIn[0])),
      hdY: (t) => -16 * MathX.window(t, B.jStop - 0.2, B.j9 + 1.6, 0.3, 0.6) },
    { t0: B.jIn[0], t1: B.jIn[1], p0: c, p1: d, cane: true, step: 0.42, face: 'focus' },
    { t0: B.jIn[1], p0: d, cane: true, face: 'focus', yaw: (t) => MathX.lerp(turnIn, Math.PI / 2, MathX.smooth(t, B.jIn[1], B.jIn[1] + 1.6)) },
  );
  // the walkers in the rain
  const hold = (id) => (H, t) => beHoldUmbrella(H, FILM._app.sets.city.umb[id], t);
  BE_PEDS_CITY.u1 = [{ t0: -1, t1: B.s10 + 3.3, p0: V(64, 8.5), p1: V(63.9, 8.5), pose: 'stand', face: 'neutral' },
    { t0: B.s10 + 3.3, t1: B.s11 + 1.5, p0: V(63.9, 8.5), p1: V(20, 8.5), pose: 'stand', step: 0.62, face: 'neutral', ease: (k) => k, after: hold('u1') }];
  BE_PEDS_CITY.u2 = [{ t0: -1, t1: B.s11 + 2, p0: V(18, -9.2), p1: V(70, -9.2), pose: 'stand', step: 0.6, face: 'neutral', ease: (k) => k, after: hold('u2') }];
  BE_PEDS_CITY.u3 = [{ t0: -1, t1: B.s11 + 4, p0: V(52, 14.0), p1: V(92, 14.0), pose: 'stand', step: 0.6, face: 'neutral', ease: (k) => k }];
  // the man who crossed with her opens an umbrella and heads for the arcade; the far walkers keep going
  const p4 = BE_PEDS_CITY.p4, last = p4[p4.length - 1];
  last.t1 = B.rain0 + 2.6; last.p1 = V(43.6, 10.8); last.ease = (k) => k;
  p4.push({ t0: last.t1, t1: B.s11 + 6, p0: V(43.6, 10.8), p1: V(44.3, 13.6), pose: 'stand', step: 0.64, face: 'neutral' });
  p4[p4.length - 1].t1 = last.t1 + 3; p4.push({ t0: last.t1 + 3, t1: B.s11 + 8, p0: V(44.3, 13.6), p1: V(78, 13.6), pose: 'stand', step: 0.64, face: 'neutral', ease: (k) => k });
  BE_PEDS_CITY.p2.push({ t0: B.s9 + 44, t1: B.s11 + 10, p0: V(42, -9.6), p1: V(90, -9.6), pose: 'stand', step: 0.6, face: 'neutral', ease: (k) => k });
  BE_PEDS_CITY.p3.push({ t0: B.s9 + 44, t1: B.s11 + 10, p0: V(-2, -10.4), p1: V(-50, -10.4), pose: 'stand', step: 0.58, face: 'neutral', ease: (k) => k });
}
// a walker holds an umbrella: the right hand in front of the chest, the shaft upright (tilted into the walk)
function beHoldUmbrella(H, U, t) {
  if (!U) return; const k = beRainK(t); U.visible = k > 0.02;
  if (!U.visible) return;
  const yaw = H.root.rotation.y, f = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), rt = new THREE.Vector3(-f.z, 0, f.x);
  const hd = H.worldOf('hd'), hand = hd.clone().add(new THREE.Vector3(0, -0.36, 0)).addScaledVector(f, 0.26).addScaledVector(rt, -0.06);
  H.solveArm('R', hand, hd.clone().addScaledVector(rt, -0.5).add(new THREE.Vector3(0, -0.6, 0)), 1);
  U.position.copy(hand); U.rotation.set(0, 0, 0); U.rotateOnWorldAxis(new THREE.Vector3(f.z, 0, -f.x), -0.12); U.updateMatrixWorld(true);
}

// ---- the sound view's pulses: her clicks in J6 (the rain swallows their echo)
BE_SCHEDULERS.push((app) => {
  const P = app.pulses, set = app.sets.city, H = set.hero;
  const mouthAt = (t) => { FILM._shot = beShotAt(t); beActor(H, t, BE_HERO_CITY, { cane: set.cane }); return beMouth(H); };
  for (const t of BE.j6Clicks) P.add({ t, p: mouthAt(t + 0.01), kind: 0, speed: 4.5, w: 0.1, life: 1.4, str: 0.6, set: 'city', shot: 'J6', click: true });
  FILM._shot = null;
});

// ---- the shots
(function () {
  const V = (x, y, z) => new THREE.Vector3(x, y, z), B = BE;
  const ct = () => FILM._app.sets.city;
  const head = () => ct().hero.worldOf('hd').add(V(0, 0.08, 0));
  const hero = () => ct().hero.root.position;
  const ac = (w = 0.05, h = 0.3) => ({ ac: 1, world: w, hero: h, glow: 0.05 });
  const lab = (p, html, a) => ({ p, html, a });
  const S = [
    // J1: from the far corner, low: she finishes crossing toward us; above the street the sky closes; the first drops
    { id: 'J1', t0: B.s10, t1: B.j2, set: 'city', look: () => BE_REAL, fogK: 0.8,
      cam: beMove(B.s10, B.j2, [V(42.2, 0.75, 8.2), V(30, 4.6, 10.4), 48], [V(42.0, 0.7, 8.25), V(30, 5.2, 10.2), 50], { dof: 0.08, focus: () => 6.5 }) },
    // J2: SLOW MOTION macro: one drop meets the metal guard rail
    { id: 'J2', t0: B.j2, t1: B.j3a, set: 'city', look: () => BE_REAL, rate: 1 / 30, tag: 'SLOW MOTION', splash: 0.5, rainDens: 0.5, rainAlpha: 0.5,
      cam: (t) => { const k = MathX.ramp(t, B.j2, B.j3a); return { pos: V(42.02 - 0.012 + 0.012 * k, 1.034, 7.35 - 0.13 + 0.01 * k), at: V(42.02, 1.029, 7.35), fov: 21, focus: 0.13, dof: 1.8 }; } },
    // J3: the inserts, each on its word
    { id: 'J3a', t0: B.j3a, t1: B.j3b, set: 'city', look: () => BE_REAL, rate: 1 / 6, tag: 'SLOW MOTION', splash: 1.0, rainHalf: 5, splashSize: 1.5, splashAlpha: 0.9,
      cam: (t) => { const k = MathX.ramp(t, B.j3a, B.j3b); return { pos: V(45.4 + 0.25 * k, 0.2, 8.6), at: V(47.0 + 0.25 * k, 0.0, 9.4), fov: 40, focus: 1.6, dof: 0.9 }; } },
    { id: 'J3b', t0: B.j3b, t1: B.j3c, set: 'city', look: () => BE_REAL, rate: 1 / 4, tag: 'SLOW MOTION', splash: 1.0, splashAlpha: 0.9,
      cam: (t) => { const k = MathX.ramp(t, B.j3b, B.j3c); return { pos: V(43.9 - 0.2 * k, 1.25, 7.0), at: V(42.4, 1.0, 7.35), fov: 34, focus: 1.55, dof: 0.8 }; } },
    { id: 'J3c', t0: B.j3c, t1: B.j3d, set: 'city', look: () => BE_REAL, rate: 1 / 4, tag: 'SLOW MOTION',
      cam: (t) => { const k = MathX.ramp(t, B.j3c, B.j3d); return { pos: V(54.0 + 0.1 * k, 1.4, 10.5), at: V(54.5, 0.98, 11.25), fov: 40, focus: 0.9, dof: 0.9 }; } },
    { id: 'J3d', t0: B.j3d, t1: B.j3e, set: 'city', look: () => BE_REAL, rate: 1 / 4, tag: 'SLOW MOTION', splashAlpha: 1.0,
      cam: (t) => { const u = ct().umb.u1, p = u.position.clone().add(V(0, 0.92, 0)); return { pos: p.clone().add(V(-0.7, 0.62, 0.62)), at: p.clone().add(V(0.1, 0, 0)), fov: 40, focus: 1.1, dof: 0.7 }; } },
    { id: 'J3e', t0: B.j3e, t1: B.j4a, set: 'city', look: () => BE_REAL,
      cam: (t) => { const k = MathX.ramp(t, B.j3e, B.j4a); return { pos: V(22.25 - 0.1 * k, 1.5, 11.42), at: V(22.0, 1.42, 11.96), fov: 40, focus: 0.55, dof: 1.0 }; } },
    // J4a: the storm from high above the street (lightning, far off); J4b: the same street as sound
    { id: 'J4a', t0: B.j4a, t1: B.j4b, set: 'city', look: () => BE_REAL, fogD: 0.009, rainHalf: 34, rainFog: 0.006, rainAlpha: 0.5,
      cam: beMove(B.j4a, B.j4b, [V(14, 30, -16), V(50, 0, 8), 44], [V(16, 28, -15), V(50, 0, 8), 44], { dof: 0 }) },
    { id: 'J4b', t0: B.j4b, t1: B.j5, set: 'city', tag: true, look: () => ac(0.06, 0.4), rainHalf: 34, splash: 1.0, decay: 0.5, gain: 1.2, heroGain: 0.5, noise: 0.6, shells: false,
      cam: beMove(B.j4b, B.j5, [V(16, 28, -15), V(50, 0, 8), 44], [V(18, 26, -14), V(50, 0, 8), 44], { dof: 0 }),
      labels: (t) => [lab(V(38, 1.5, 9.5), '<div class="k">EVERY DROP IS A TINY SOUND</div>', MathX.smooth(t, B.j4b + 0.4, B.j4b + 0.9))] },
    // J5: with her, walking in the rain (front three-quarter, tracking)
    { id: 'J5', t0: B.j5, t1: B.j6, set: 'city', look: () => BE_REAL,
      cam: (t) => { const p = hero(), k = MathX.ramp(t, B.j5, B.j6); return { pos: V(p.x + 2.6 - 0.2 * k, 1.45, p.z - 1.55), at: V(p.x, 1.25, p.z), fov: 38, focus: 3.0, dof: 0.15 }; } },
    // J6: the sound view close behind her: her clicks go out into the rain's thousand small sounds
    { id: 'J6', t0: B.j6, t1: B.j7, set: 'city', tag: true, look: () => ac(0.06, 0.4), splash: 1.0, rainHalf: 10, decay: 0.45, gain: 1.3, heroGain: 0.5, noise: 0.5, shells: false,
      cam: (t) => { const h = head(), k = MathX.ramp(t, B.j6, B.j7); return { pos: V(h.x - 2.2 - 0.3 * k, h.y + 0.6, h.z - 1.0), at: V(h.x + 3, h.y - 0.7, h.z + 0.8), fov: 54, focus: 2.5, dof: 0 }; },
      labels: (t) => [lab(V(hero().x + 2.6, 0.9, 11.6), '<div class="k">HER ECHO</div><div class="s">LOST IN THE RAIN</div>', MathX.smooth(t, B.j6Clicks[1] + 0.3, B.j6Clicks[1] + 0.8))] },
    // J7: the sound view, wider, looking east: three places, three characters
    { id: 'J7', t0: B.j7, t1: B.j8, set: 'city', tag: true, look: () => ac(0.06, 0.4), splash: 1.0, rainHalf: 18, decay: 0.5, gain: 1.2, heroGain: 0.5, noise: 0.5, shells: false,
      cam: beMove(B.j7, B.j8, [V(35.5, 4.4, 1.2), V(55, 0.6, 1.6), 60], [V(36.5, 4.2, 1.3), V(55, 0.6, 1.8), 58], { dof: 0 }),
      labels: (t) => { const a = (t0) => MathX.smooth(t, t0, t0 + 0.4); return [
        lab(V(46, 0.6, 1.5), '<div class="k">OPEN STREET</div><div class="s">A STEADY HISS</div>', a(B.j7 + 0.4)),
        lab(V(57, 4.2, -10.6), '<div class="k">SCAFFOLD BOARDS</div><div class="s">DRUMMING</div>', a(B.j7 + 1.0)),
        lab(V(54, 2.6, 13.5), '<div class="k">THE ARCADE</div><div class="s">SHELTERED · DRIPS AT THE EDGE</div>', a(B.j7 + 1.6))]; } },
    // J8: she walks on toward the arcade; on "trust" her head turns to its opening; on "check" the cane finds the column
    { id: 'J8a', t0: B.j8, t1: B.j8b, set: 'city', look: () => BE_REAL,
      cam: (t) => { const p = hero(), k = MathX.ramp(t, B.j8, B.j8b); return { pos: V(p.x + 0.4 - 0.3 * k, 1.05, 6.7), at: V(p.x + 0.6, 1.0, p.z + 1.0), fov: 40, focus: p.z - 6.7, dof: 0.15 }; } },
    { id: 'J8b', t0: B.j8b, t1: B.j9, set: 'city', look: () => BE_REAL,
      cam: (t) => { const k = Ease.inOutSine(MathX.ramp(t, B.j8b, B.j9)); return { pos: V(53.9 - 0.2 * k, 0.95, 10.0 - 0.1 * k), at: V(52.0, 0.55, 11.5), fov: 46, focus: 2.2, dof: 0.2 }; } },
    // J9a: (no narration) from straight above, tracking: a sheet of heavier rain sweeps along the street
    { id: 'J9a', t0: B.j9, t1: B.j9b, set: 'city', look: () => BE_REAL, rainHalf: 22, splash: 0.75, splashSize: 2.2, rainAlpha: 0.6, fogD: 0.006, curtain: 0.6,
      cam: beMove(B.j9, B.j9b, [V(41.0, 17.5, -1.2), V(49.6, 0, 10.2), 46], [V(44.0, 16.5, -0.5), V(51.4, 0, 10.9), 46], { dof: 0 }) },
    // J9b: (no narration) under the arcade, looking out: she steps in from the rain; the drips fall from the roof's edge
    { id: 'J9b', t0: B.j9b, t1: B.s11, set: 'city', look: () => BE_REAL, rainAlpha: 0.6,
      cam: beMove(B.j9b, B.s11, [V(48.9, 1.45, 14.75), V(51.6, 1.15, 11.2), 46], [V(49.1, 1.45, 14.8), V(51.1, 1.2, 12.0), 46], { dof: 0.12, focus: (t, pos) => pos.distanceTo(hero()) + 0.1 }) },
  ];
  const i = BE_SHOTS.findIndex((s) => s.id === 'X');
  BE_SHOTS.splice(i, 0, ...S);
  BE_SHOTS[BE_SHOTS.length - 1].t0 = B.s11;
})();
