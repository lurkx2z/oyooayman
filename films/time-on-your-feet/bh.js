/* =====================================================================
   BH — Sagittarius A* (4.3 million suns): the fall and the platform. The sky is exact (space.js tfLensDome: every
   pixel's light ray traced round a non-rotating hole for the camera's height); everything near you is in metres.
     cold     the cold open (5 mm above the edge, a year by your head): your head's clock, your feet's (nearly
              stopped), then up: the whole universe is one bright point overhead
     approach the flight in from 40 radii: the shadow and its glowing gas, as the Event Horizon Telescope saw it
     board    the platform (pretend): you step on            sphere   the photon sphere: half the sky is black
     lower    the sky shrinks to a circle overhead           floor    10 m → 2.6 m above the edge: the deck's glow
                                                                      reddens (its light climbs to your eyes)
     two      your own height: ×2; the glow is gone          toes     your toes, in slow motion
     eleven   17 cm: ×11                                     day      5 mm: a day at your feet, a year at your head
     outside  up: the universe in fast-forward               edge     the edge itself: your feet slow and freeze
     feet     from your feet: your head racing
   What you see on the platform: the deck's own glow reaches your eyes stretched by head : feet (physics.js
   tfShiftRGB), so it reddens and fades into infrared. Your feet and the deck stay visible by the pole's lamp at head
   height: its light falls to your feet (bluer) and climbs back (redder), no net change. At the very edge, light from
   your feet takes longer and longer to climb out: they slow, freeze and fade.
   ===================================================================== */

// the edge's darkness: surfaces fade towards the floor as the platform reaches the edge (uniform shared by them all)
const TF_EDGE = { value: 0 };
function tfEdgePatch(mat) {
  if (mat.userData.tfEdge) return; mat.userData.tfEdge = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    sh.uniforms.uTfEdge = TF_EDGE;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vTfY;').replace('#include <project_vertex>', '#include <project_vertex>\nvTfY = (modelMatrix * vec4(transformed, 1.0)).y;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uTfEdge; varying float vTfY;')
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb *= mix(1.0, smoothstep(0.0, 0.32, vTfY - 0.36 * (1.0 - uTfEdge)), uTfEdge);');
  };
  mat.needsUpdate = true;
}

// the deck's glowing tiles (hexagons with dark seams)
function tfDeckCanvas() {
  return tfCanvas(1024, 1024, (g, w, h) => {
    g.fillStyle = '#050505'; g.fillRect(0, 0, w, h);
    const R = 46, dx = R * Math.sqrt(3), dy = R * 1.5;
    for (let row = -1; row * dy < h + R; row++) for (let col = -1; col * dx < w + dx; col++) {
      const cx = col * dx + (row % 2 ? dx / 2 : 0), cy = row * dy, v = 0.82 + 0.18 * hash2(row + 50, col + 50);
      g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3, rr = R - 4; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath();
      const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R); gr.addColorStop(0, `rgb(${255 * v},${255 * v},${255 * v})`); gr.addColorStop(1, `rgb(${215 * v},${215 * v},${215 * v})`);
      g.fillStyle = gr; g.fill();
    }
  });
}

TF_SETS.bh = (app) => {
  const S = tfSet(app, { sky: '#000000', hemi: ['#000000', '#000000', 0], near: 0.01, far: 9000, fov: 55 });
  const { scene, camera: cam } = S;
  scene.environment = tfEnv(app.renderer, '#0a0c10', '#14161a', '#050505');
  const lens = tfLensDome(scene, { ring: true });
  // the star map turned so the Milky Way's band arches overhead (the platform's sky) or crosses behind the hole (the approach)
  const ROT_UP = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 2)), ROT_AHEAD = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().makeRotationX(-0.3));
  // the bright point overhead (the whole universe, squeezed), and its halo
  const dot = tfGlowSprite(scene, '#dfe8ff', 1), halo = tfGlowSprite(scene, '#8fb0ff', 1);
  // (in fast-forward: flashes round it, each a frame or two long: stars and galaxies living whole lives in a blink)
  const sparks = Array.from({ length: 10 }, () => tfGlowSprite(scene, '#ffffff', 1));
  const hsh = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  halo.material.opacity = 0.5;
  // ---- the platform: a glowing deck of hexagonal tiles, a dark metal rim with small lights, four pods underneath
  const plat = new THREE.Group(); scene.add(plat);
  const metal = tfStd('#2a2d31', 0.42, 0.85), dark = tfStd('#121316', 0.6, 0.5);
  const deckTex = tfTex(tfDeckCanvas()); deckTex.repeat.set(2.2, 2.2);
  const deckM = tfStd('#26272a', 0.5, 0.1, { emissive: new THREE.Color(1, 1, 1), emissiveMap: deckTex, emissiveIntensity: 0.8 });
  const deck = new THREE.Mesh(new THREE.CircleGeometry(1.35, 96).rotateX(-Math.PI / 2), deckM); deck.receiveShadow = true; plat.add(deck);
  deck.position.y = 0.0;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.045, 16, 128).rotateX(Math.PI / 2), metal); rim.position.y = -0.005; rim.castShadow = rim.receiveShadow = true; plat.add(rim);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.3, 0.22, 96, 1, true), dark); band.position.y = -0.12; plat.add(band);
  const under = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 0.55, 0.38, 64), dark); under.position.y = -0.42; plat.add(under);
  const lightsM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.4, 0.7) });
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, l = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), lightsM); l.position.set(Math.cos(a) * 1.42, -0.06, Math.sin(a) * 1.42); plat.add(l); }
  const podM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.8, 2.4) });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4, p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.24, 24), metal); p.position.set(Math.cos(a) * 1.05, -0.5, Math.sin(a) * 1.05); plat.add(p);
    const n = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24).rotateX(Math.PI / 2), podM); n.position.set(Math.cos(a) * 1.05, -0.625, Math.sin(a) * 1.05); plat.add(n);
  }
  // you and your pole
  const rig = tfRig(plat);
  // the deck's glow on your feet and the pole (from below); a faint fill so the metal reads; the ring's light (far away)
  const glowL = new THREE.HemisphereLight('#000000', '#ffffff', 0); scene.add(glowL);
  const fill = new THREE.AmbientLight('#8a96b0', 0.0); scene.add(fill);
  const ringL = new THREE.DirectionalLight('#ffb070', 0); ringL.position.set(-3, -2, -4); scene.add(ringL); scene.add(ringL.target);
  plat.traverse((o) => { if (o.isMesh && o.material && (o.material.isMeshStandardMaterial || o.material.isMeshBasicMaterial)) tfEdgePatch(o.material); });

  const E = TF_EYE, AH = tfAim(E, rig.head), AF = tfAim(E, rig.feet), AFEET = tfAim(E, [0.02, 0.03, -0.3]), AUP = [AH[0], 1.48];
  const W = tfWin, K = tfK;
  // the hole for the approach: ahead and a little below; on the platform: straight down
  const HOLE_AHEAD = tfN3([0.12, -0.32, -1]), HOLE_DOWN = [0, -1, 0];
  // the toes' wiggle, run on your feet's own time (slower by head : feet)
  let TF_FEET_TAU = null;
  function feetTau(t) {
    if (!TF_FEET_TAU) { const t0 = TF.ten - 2, n = Math.ceil((TF.real - t0) * 60) + 2, a = new Float64Array(n); let s = 0; for (let i = 0; i < n; i++) { a[i] = s; s += (1 / tfBhRatio(tfRho(t0 + i / 60))) / 60; } TF_FEET_TAU = { t0, a }; }
    const x = MathX.clamp((t - TF_FEET_TAU.t0) * 60, 0, TF_FEET_TAU.a.length - 1.001), i = Math.floor(x);
    return TF_FEET_TAU.a[i] + (TF_FEET_TAU.a[i + 1] - TF_FEET_TAU.a[i]) * (x - i);
  }
  // a wiggle: both feet, a beat apart, at about one curl a second (of the feet's own time)
  const wiggle = (tau, on) => ({ toeL: on * Math.max(0, Math.sin(tau * 5.2)) ** 2, toeR: on * Math.max(0, Math.sin(tau * 5.2 - 1.3)) ** 2 });

  const CAM = {
    cold(t) {
      const a = TF.coldUp, b = TF.coldSky, k1 = K(t, a - 0.3, a + 1.5), k2 = K(t, b, b + 2.6), dr = tfDrift(t, 0.006, 0.4, 3);
      let aim = tfAimLerp([AH[0] + 0.06, AH[1] + 0.06], [tfLerp(AF[0], AFEET[0], 0.45), tfLerp(AF[1], AFEET[1], 0.45)], k1);
      aim = tfAimLerp(aim, [AH[0] + 0.25, 1.2], k2);
      const fov = tfLerp(tfLerp(36 - 2 * K(t, -1, a), 50, k1), 64, k2);
      tfLook(cam, [E[0] + dr[0], E[1] + dr[1], E[2] + dr[2]], aim[0] + dr[0] * 2, aim[1] + dr[1] * 2, fov);
    },
    approach(t) {
      const k = K(t, TF.bh, TF.board), dr = tfDrift(t, 1, 0.12, 5);
      const d = tfN3([HOLE_AHEAD[0] + 0.05 * dr[0] + 0.06 * (1 - k), HOLE_AHEAD[1] + 0.04 * dr[1] + 0.05 * (1 - k), HOLE_AHEAD[2]]);
      tfCam(cam, [0, 1.6, 0], [d[0], 1.6 + d[1], d[2]], tfLerp(50, 62, k), tfLerp(-6, 4, k));
    },
    board(t) {
      const k = K(t, TF.board, TF.board + 4.2), dr = tfDrift(t, 0.01, 0.3, 7);
      const p = tfV([2.3, 3.4, 3.1], [E[0], E[1], E[2]], k), at = tfV([0, 0.3, -0.2], [-0.25, 0.9, -1.9], K(t, TF.board + 2.5, TF.board + 4.6));
      tfCam(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], at, 58);
    },
    sphere(t) {
      const k = K(t, TF.sphere, TF.lower), dr = tfDrift(t, 0.008, 0.3, 9);
      tfLook(cam, [E[0] + dr[0], E[1] + dr[1], E[2] + dr[2]], 1.0 - 0.6 * k, tfLerp(-0.32, 0.02, K(t, TF.sphere, TF.sphere + 4)), 70);   // (turning, but never round to the pole)
    },
    lower(t) {
      const k = K(t, TF.lower, TF.lower + 4.5), dr = tfDrift(t, 0.006, 0.3, 11);
      tfLook(cam, [E[0] + dr[0], E[1] + dr[1], E[2] + dr[2]], 0.4 + 0.1 * k, tfLerp(0.02, 1.42, k), tfLerp(70, 60, k));
    },
    floor(t) {
      const dr = tfDrift(t, 0.006, 0.35, 13), k = K(t, TF.ten, TF.ten + 6);
      const aim = tfAimLerp([AFEET[0] + 0.25, -0.5], [AFEET[0] + 0.1, AFEET[1] + 0.12], k);
      tfLook(cam, [E[0] + dr[0], E[1] + dr[1], E[2] + dr[2]], aim[0], aim[1], 56);
    },
    two(t) {
      const dr = tfDrift(t, 0.006, 0.35, 15), c1 = tfCap('two', 1).show, c2 = tfCap('two', 2).show;
      let aim = tfAimLerp([AFEET[0] + 0.1, AFEET[1] + 0.12], [AH[0] + 0.06, AH[1] + 0.07], K(t, TF.two + 0.2, c1 - 0.2));
      aim = tfAimLerp(aim, [tfLerp(AF[0], AFEET[0], 0.4), tfLerp(AF[1], AFEET[1], 0.4) + 0.06], K(t, c2 - 0.6, c2 + 1.4));
      tfLook(cam, [E[0] + dr[0], E[1] + dr[1], E[2] + dr[2]], aim[0], aim[1], tfLerp(48, 42, K(t, c1 - 0.2, c1 + 1)) + 8 * K(t, c2 - 0.6, c2 + 1.4));
    },
    toes(t) {
      const dr = tfDrift(t, 0.004, 0.35, 17);
      tfLook(cam, [E[0] + dr[0], E[1] + dr[1], E[2] + dr[2]], AFEET[0] + 0.02, AFEET[1] + 0.02, tfLerp(40, 30, K(t, TF.slow, TF.eleven)));
    },
    eleven(t) {
      const dr = tfDrift(t, 0.005, 0.35, 19);
      const aim = tfAimLerp([AFEET[0], AFEET[1] + 0.05], [AF[0] + 0.03, AF[1] + 0.02], K(t, TF.eleven, TF.eleven + 1.6));
      tfLook(cam, [E[0] + dr[0], E[1] + dr[1], E[2] + dr[2]], aim[0] + 0.06 * K(t, TF.eleven, TF.eleven + 2), aim[1], tfLerp(36, 32, K(t, TF.eleven, TF.eleven + 2)));
    },
    day(t) {
      const dr = tfDrift(t, 0.005, 0.35, 21), c1 = tfCap('day', 1).show;
      let aim = tfAimLerp([AH[0] + 0.06, AH[1] + 0.07], [AF[0] + 0.1, AF[1] + 0.03], K(t, c1 + 0.2, c1 + 1.9));
      tfLook(cam, [E[0] + dr[0], E[1] + dr[1], E[2] + dr[2]], aim[0], aim[1], tfLerp(42, 40, K(t, c1, c1 + 2)));
    },
    outside(t) {
      const dr = tfDrift(t, 0.005, 0.3, 23), k = K(t, TF.outside - 0.4, TF.outside + 2.6);
      const aim = tfAimLerp([AF[0], AF[1]], [AH[0] + 0.5, 1.4], k);
      tfLook(cam, [E[0] + dr[0], E[1] + dr[1], E[2] + dr[2]], aim[0], aim[1], tfLerp(36, 56, k));
    },
    edge(t) {
      // (a cut straight down to your feet, slowly closer)
      const dr = tfDrift(t, 0.004, 0.3, 25), k = K(t, TF.edge, TF.freeze + 2);
      tfLook(cam, [E[0] + dr[0], E[1] + dr[1], E[2] + dr[2]], AFEET[0] + 0.12, AFEET[1] + 0.1, tfLerp(46, 38, k));
    },
    feet(t) {
      // your feet's eye: on the deck by your toes, looking up the pole at your head's clock
      const k = K(t, TF.feetView, TF.real), dr = tfDrift(t, 0.004, 0.3, 27);
      const n = rig.n, p = [rig.feet[0] + n[0] * 0.5 - 0.12 + dr[0], 0.08 + dr[1], rig.feet[2] + n[2] * 0.5 + dr[2]];
      tfCam(cam, p, tfV([rig.feet[0], 0.6, rig.feet[2]], [rig.head[0], rig.head[1] - 0.03, rig.head[2]], K(t, TF.feetView - 0.2, TF.feetView + 2.2)), tfLerp(58, 26, K(t, TF.feetView, TF.feetView + 2.6)));
    },
  };

  const PLATFORM = ['cold', 'floor', 'two', 'toes', 'eleven', 'day', 'outside', 'edge', 'feet'];
  const set = {
    scene, camera: cam,
    frame(t, shot) {
      const m = shot.mode;
      (CAM[m] || CAM.cold)(t);
      const onPlat = PLATFORM.includes(m), near = onPlat;
      // ---- the sky
      lens.mesh.visible = !near;
      if (!near) {
        const r = tfBhR(t);
        lens.update(cam, m === 'approach' ? HOLE_AHEAD : HOLE_DOWN, r, 1);
        const bl = 1 / Math.sqrt(1 - 1 / r);
        lens.U.uTint.value.setRGB(...tfBlueTint(bl));
        lens.U.uK.value = Math.min(2.6, bl) * 1.1;
        // (the gas glows round the hole; once you're down among it, the ring model no longer applies: it fades)
        lens.U.uRingK.value = (m === 'approach' ? 1.4 : 1.0) * MathX.smooth(r, 3.4, 7);
        lens.U.uRingAx.value.set(1, 0.3, 0).normalize();
        lens.U.uStarRot.value.copy(m === 'approach' ? ROT_AHEAD : ROT_UP);
      }
      dot.visible = halo.visible = near;
      if (near) {
        const up = [cam.position.x, cam.position.y + 3000, cam.position.z];
        dot.position.set(...up); halo.position.set(...up);
        const ff = m === 'outside', fr = Math.floor(t * 30), fl = ff ? 0.75 + 0.6 * hsh(fr) + 0.2 * Math.sin(t * 53 + 1) : 1;
        dot.scale.setScalar(90 * fl); halo.scale.setScalar(520 * (0.8 + 0.2 * fl));
        // its colour shimmers in fast-forward (blue-white ↔ gold), frame by frame
        const hc = ff ? hsh(fr + 0.5) : 0.5;
        dot.material.color.setRGB(0.85 + 0.15 * hc, 0.88 + 0.06 * hc, 1.0 - 0.3 * hc);
        halo.material.color.setRGB(0.5 + 0.45 * hc, 0.66 + 0.1 * hc, 1.0 - 0.45 * hc);
        sparks.forEach((sp, i) => {
          const f2 = Math.floor(t * 30 / (1 + (i % 2))), on = ff && hsh(f2 * 13 + i * 7) > 0.55;
          sp.visible = on; if (!on) return;
          const ang = hsh(f2 * 3 + i) * 6.283, rad = 60 + 260 * hsh(f2 * 5 + i * 11);
          sp.position.set(up[0] + Math.cos(ang) * rad, up[1], up[2] + Math.sin(ang) * rad);
          sp.scale.setScalar(25 + 60 * hsh(f2 + i * 3));
          sp.material.color.setRGB(1, 0.75 + 0.25 * hsh(i + f2), 0.6 + 0.4 * hsh(i * 2 + f2));
        });
      } else sparks.forEach((sp) => { sp.visible = false; });
      // ---- the platform, you, the clocks
      plat.visible = m !== 'approach';
      const c = tfClock(t), F = tfFmtClock(c);
      if (m === 'feet') {
        // from your feet, your head's clock races (by head : feet; shown at the 5 mm figure, 365×, so it can be read)
        const H = TFP.year + (t - TF.feetView) * 365 * 40;
        const s = Math.floor(H), d = (x) => { const hh = Math.floor(x / 3600) % 24, mm = Math.floor(x / 60) % 60, ss = Math.floor(x) % 60; return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`; };
        F.head = { big: d(s), small: '.' + String(Math.floor((H - s) * 1000)).padStart(3, '0') };
      }
      const ratio = onPlat ? tfBhRatio(m === 'cold' ? TF.rhoDay : tfRho(t)) : 1;
      // the toes: a wiggle on your feet's own time; frozen at the edge
      let toes = { toeL: 0, toeR: 0 };
      if (m === 'toes' || m === 'eleven') toes = wiggle(feetTau(t), K(t, TF.wiggle - 0.2, TF.wiggle + 0.3));
      if (m === 'edge') { const tau = feetTau(Math.min(t, TF.freeze)); toes = wiggle(tau, 1); }
      rig.update(F, { lamp: onPlat ? (m === 'feet' ? 2 : 2.6) : 0, ...toes, headCol: m === 'feet' ? [170, 190, 255] : null });
      rig.pole.bulb.material.color.setRGB(...(m === 'feet' ? [1.3, 1.7, 3.2] : [2.4, 2.2, 1.9]));
      rig.pole.lamp.color.set(m === 'feet' ? '#c4d0ff' : '#ffe7c4');
      // (the feet's-eye shot: the head's clock tipped a little towards the floor so it can be read from down there)
      rig.pole.units.head.tg.rotation.x = m === 'feet' ? 0.5 : 0;
      // ---- the deck's glow: white at rest; on the platform scenes stretched by head : feet
      const sh = tfShiftRGB(ratio), base = onPlat ? 0.8 : 0.5;
      sh[1] = Math.min(sh[1], sh[0] * tfLerp(1, 0.75, MathX.smooth(ratio, 1.02, 1.12)));   // (warm white, not lime: the lamp's exact spectrum is ours to pick)
      deckM.emissive.setRGB(sh[0], sh[1], sh[2]); deckM.emissiveIntensity = base;
      glowL.groundColor.setRGB(sh[0], sh[1], sh[2]); glowL.intensity = 1.1;
      fill.intensity = onPlat ? 0.05 : 0.12;
      ringL.intensity = !onPlat ? 0.8 * (1 - K(t, TF.lower, TF.lower + 3)) : 0;
      // ---- the edge: below your knees, the picture slows and fades
      TF_EDGE.value = m === 'edge' ? K(t, TF.freeze - 1.2, TF.freeze + 3.2) : 0;
      // (the board shot comes down from above: you appear once the camera reaches your eyes)
      rig.body.g.visible = m !== 'board' || t > TF.board + 3.6;
      this._ratio = ratio;
    },
    grade(t, p, shot) {
      const m = shot.mode;
      p.vignette = 0.6; p.bloom = 0.42; p.bloomThreshold = 0.9; p.grain = 0.03; p.contrast = 1.08; p.blackLift = 0.004; p.saturation = 1.06;
      if (m === 'cold') p.fade = Math.max(p.fade, 1 - MathX.smooth(t, -0.2, 0.7));
      if (m === 'approach') { p.bloom = 0.55; p.bloomThreshold = 0.7; p.exposure = 1.1; }
      if (m === 'outside') { p.bloom = 0.7; p.bloomThreshold = 0.6; }
    },
    labels(t) {
      const s = tfShotAt(t), m = s.mode, c = cam.position;
      if (m === 'approach') { const d = HOLE_AHEAD; return [{ p: [c.x + d[0] * 50, c.y + d[1] * 50 + 9, c.z + d[2] * 50], text: 'SAGITTARIUS A*', sub: '4.3 MILLION SUNS · 27,000 LIGHT-YEARS', a: W(t, tfCap('bh', 1).show, TF.bh2 - 0.2, 0.5, 0.4) }]; }
      if (m === 'toes') return [{ p: [0.0, 0.08, -0.2], text: 'YOUR TOES', sub: 'AT HALF SPEED', a: W(t, TF.wiggle + 0.8, TF.eleven - 0.2, 0.4, 0.3) }];
      if (m === 'eleven') return [{ p: [rig.feet[0] + 0.0, rig.feet[1] + 0.13, rig.feet[2]], text: 'YOUR FEET\'S CLOCK', sub: '11× SLOWER', a: W(t, TF.eleven + 1.8, TF.day - 0.2, 0.4, 0.3) }];
      if (m === 'outside') return [{ p: [c.x - 260, c.y + 3000, c.z + 120], text: 'THE WHOLE UNIVERSE', sub: '470 YEARS GO BY EVERY SECOND', a: W(t, TF.outside + 2.4, TF.edge - 0.2, 0.5, 0.3) }];
      return [];
    },
  };
  return set;
};

// a colour multiplier for starlight squeezed by k (> 1 bluer): its hue from tfShiftRGB (without its brightness change)
// starlight squeezed by k: bluer, then a cool white (what we'd see started as infrared and radio light: the sky's
// real spectrum isn't flat, so this is a hue, not a calculation)
function tfBlueTint(k) {
  const w = MathX.smooth(k, 1.0, 2.2);
  return [tfLerp(1, 0.72, w), tfLerp(1, 0.84, w), 1];
}
