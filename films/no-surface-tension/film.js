/* =====================================================================
   FILM — "What if water lost all surface tension?" (see js/main.js for the hook order)
     build: the kitchen + the garden in one scene (you walk out the back door), hands, props, HUD, soundtrack
     update: the active set, your hands (aimed at the lever, the clip, the bottle and its cap, the can), the finale's
             flown camera (one leaf → down its thread → the waterline), the lens at the waterline
     grade: a bright ordinary morning → inside the stem → the time-lapse → the rain
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// hands: right-hand poses (aimed ones carry `aim`: the palm point, in the hand's frame X = thumb side, Y = fingers, Z = palm)
// ---------------------------------------------------------------------------------------------------------------------
const NST_HAND_POSES = {
  tapReach: { p: [0.12, -0.2, -0.42], F: [0, -0.3, -1], N: [-1, 0, 0], curl: [0.35, 0.45, 0.55, 0.6], thumb: [0.55, 0.2], aim: [0.0, 0.07, 0.025] },
  tapTurn: { p: [0.12, -0.2, -0.42], F: [0, -0.3, -1], N: [-1, 0, 0], curl: [0.75, 0.95, 1.05, 1.1], thumb: [0.35, 0.45], aim: [0.0, 0.07, 0.025] },
  clipHold: { p: [0.08, -0.2, -0.4], F: [0, -0.6, -0.8], N: [0, -0.8, 0.6], curl: [0.55, 0.95, 1.15, 1.25], thumb: [0.25, 0.55], aim: [0.012, 0.085, 0.012] },
  clipOpen: { p: [0.08, -0.2, -0.4], F: [0, -0.6, -0.8], N: [0, -0.8, 0.6], curl: [0.2, 0.45, 0.6, 0.7], thumb: [0.55, 0.2], aim: [0.012, 0.085, 0.012] },
  tapPush: { p: [0.12, -0.2, -0.42], F: [0, -0.3, -1], N: [-1, 0, 0], curl: [0.85, 1.05, 1.15, 1.2], thumb: [0.3, 0.5], aim: [0.0, 0.07, 0.025] },
  capHold: { p: [0.06, -0.15, -0.35], F: [0, -0.5, -0.8], N: [0, -1, 0], curl: [0.95, 1.05, 1.1, 1.15], thumb: [0.5, 0.6], aim: [0.004, 0.068, 0.03] },
  capTwist: { p: [0.06, -0.15, -0.35], F: [0, -0.5, -0.8], N: [0, -1, 0], curl: [1.05, 1.15, 1.2, 1.25], thumb: [0.45, 0.7], aim: [0.004, 0.068, 0.03] },
  capOff: { p: [0.06, -0.15, -0.35], F: [0, -0.5, -0.8], N: [0, -1, 0], curl: [1.0, 1.1, 1.15, 1.2], thumb: [0.45, 0.65], aim: [0.004, 0.068, 0.03] },
  bottleHold: { p: [0.1, -0.2, -0.4], F: [0, 0, -1], N: [-1, 0, 0], curl: [1.0, 1.1, 1.15, 1.2], thumb: [0.55, 0.6], aim: [0.0, 0.06, 0.016] },     // (left hand)
  canHold: { p: [0.18, -0.3, -0.42], F: [0, 0, -1], N: [-1, 0, 0], curl: [1.25, 1.3, 1.35, 1.35], thumb: [0.15, 0.75], aim: [0.0, 0.05, 0.03] },
};
const NST_HAND_BLEND = { tapReach: 0.4, tapTurn: 0.25, tapPush: 0.35, clipHold: 0.4, clipOpen: 0.12, capHold: 0.3, capTwist: 0.4, capOff: 0.1, bottleHold: 0.3, canHold: 0.35, hidden: 0.4 };
for (const k of Object.keys(NST_HAND_POSES)) { NST_HAND_POSES[k + '!'] = NST_HAND_POSES[k]; NST_HAND_BLEND[k + '!'] = 0.02; }
NST_HAND_POSES['hidden!'] = HAND_POSES.hidden; NST_HAND_BLEND['hidden!'] = 0.02;

const _nstAim = { y: new THREE.Vector3(), z: new THREE.Vector3(), x: new THREE.Vector3(), c: new THREE.Vector3(), q: new THREE.Quaternion() };
function nstAimHand(name, camera, world, Fw, Nw, side = 1) {
  const P = NST_HAND_POSES[name], A = _nstAim;
  A.q.copy(camera.quaternion).invert();
  A.y.copy(Fw).normalize().applyQuaternion(A.q); A.y.x *= side; P.F = [A.y.x, A.y.y, A.y.z];
  A.z.copy(Nw).normalize().applyQuaternion(A.q); A.z.x *= side; P.N = [A.z.x, A.z.y, A.z.z];
  A.y.set(...P.F).normalize(); A.z.set(...P.N); A.z.addScaledVector(A.y, -A.z.dot(A.y)).normalize(); A.x.crossVectors(A.y, A.z);
  A.c.copy(world).applyMatrix4(camera.matrixWorldInverse); A.c.x *= side;
  const l = P.aim; for (let i = 0; i < 3; i++) P.p[i] = A.c.getComponent(i) - (A.x.getComponent(i) * l[0] + A.y.getComponent(i) * l[1] + A.z.getComponent(i) * l[2]);
}

// which set the story is in
function nstSeg(t) { return t < NST.pond ? 'kitchen' : t < NST.bench ? 'pond' : t < NST.stem ? 'bench' : t < NST.lapse ? 'stem' : 'garden'; }

// the finale's camera, relative to the bowed leaf's tip (x, y, z offsets in metres; the waterline keys are snapped to the
// pond's surface): the close-up → down the thread → at the waterline → on the last line, a tilt up to the sunflower
const NST_FIN = {
  a0: [0.3, 0.02, 0.1], la0: [0.0, -0.04, 0.0], a1: [0.27, 0.01, 0.09], la1: [0.0, -0.05, 0.0], fov0: 40, fov1: 37,
  bc: [0.75, -0.45, -0.55], lbc: [0.0, -0.5, 0.0],
  c0: [0.5, 0, -1.5], lc0: [0.0, -0.61, 0.0], c1: [0.47, 0, -1.42], lc1: [0.0, -0.6, 0.0], fovC: 54,
  lc2: [-0.05, -0.04, 0.0], fovE: 64,
};

const FILM = {
  build(app) {
    FILM._app = app;
    const { scene, camera, renderer } = app;
    camera.near = 0.02; camera.far = 2600; camera.updateProjectionMatrix();
    app.garden = new NstGarden(scene, renderer, app.rng);
    app.garden.camera = camera;
    app.garden.build();
    Look.apply(app.garden.root, camera);
    app.kitchen = new NstKitchen(scene, renderer);
    app.kitchen.build();
    // first-person arms: a muted knit sleeve, skin-tone nails, long slim sleeves (docs/STYLE_BIBLE.md § 11)
    app.hands = new ViewerHands(camera, { scale: 1.0, skin: '#c4957a', nail: '#c99c84', sleeve: '#4b5560', cuff: '#3a424b', watch: false, sleeveLen: 1.1, sleeveFit: 0.8,
      poses: NST_HAND_POSES, blends: NST_HAND_BLEND });
    this._props(app);
    app.stem = new NstStem(scene);
    app.stem.build();
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.audio = new NstAudio(app.tl, app);
    this._v = new THREE.Vector3(); this._w = new THREE.Vector3(); this._f = new THREE.Vector3(); this._n = new THREE.Vector3(); this._q = new THREE.Quaternion();
  },

  // the watering can (held by the aimed right hand) and the waterline lens
  _props(app) {
    const g = new THREE.Group(); app.scene.add(g);
    const green = new THREE.MeshStandardMaterial({ color: '#4f6e5a', roughness: 0.45, metalness: 0.4, name: 'nstCan' });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.2, 24), green); body.castShadow = true; g.add(body);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.085, 0.03, 24), green); top.position.y = 0.115; g.add(top);
    // spout: from the low front of the body, forward and up (local +X is forward)
    const sp = new THREE.CatmullRomCurve3([new THREE.Vector3(0.07, -0.05, 0), new THREE.Vector3(0.17, 0.02, 0), new THREE.Vector3(0.27, 0.11, 0), new THREE.Vector3(0.31, 0.14, 0)]);
    const spout = new THREE.Mesh(new THREE.TubeGeometry(sp, 16, 0.011, 8), green); spout.castShadow = true; g.add(spout);
    const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.014, 0.03, 12), green); rose.position.set(0.315, 0.145, 0); rose.rotation.z = -0.9; g.add(rose);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.011, 8, 18, Math.PI * 1.1), green); handle.position.set(-0.05, 0.1, 0); handle.rotation.z = 0.3; g.add(handle);
    this.can = g;
    this.canStream = new NstStream(app.scene, nstWaterMat({ color: '#c8dade', opacity: 0.38, fres: 0.75 }), { a: new THREE.Vector3(), v0: new THREE.Vector3(), r0: 0.006, yEnd: 0, seed: 71 });
    // the lens at the waterline (the duck shot): below the line you look into the pond's murky green
    const pm = new THREE.ShaderMaterial({
      uniforms: { uH: { value: 0 }, uOn: { value: 0 }, uT: { value: 0 } }, transparent: true, depthTest: false, depthWrite: false,
      vertexShader: /* glsl */`varying vec2 vS; void main(){ vS = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uH, uOn, uT; varying vec2 vS;
        void main(){
          float d = uH - vS.y;
          if (d < 0.0 || uOn < 0.001) discard;
          float k = smoothstep(0.0, 1.15, d);
          vec3 c = mix(vec3(0.17, 0.31, 0.27), vec3(0.03, 0.075, 0.07), k);
          float a = mix(0.4, 0.78, k);
          // daylight coming down through the surface: soft moving bands just under the line
          float sh = 0.5 + 0.5 * sin(vS.x * 9.0 + uT * 1.3 + sin(vS.x * 3.0 - uT) * 2.0);
          c += vec3(0.05, 0.08, 0.06) * sh * (1.0 - smoothstep(0.0, 0.5, d));
          // the waterline on the glass: one thin straight line (water with no surface tension doesn't climb the glass)
          float line = exp(-d * 190.0);
          c = mix(c, vec3(0.62, 0.74, 0.72), line * 0.7); a = max(a, line * 0.55);
          gl_FragColor = vec4(c, a * uOn);
        }`,
    });
    this.port = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), pm); this.port.frustumCulled = false; this.port.renderOrder = 1000; app.scene.add(this.port);
  },

  // the finale: the close-up on the bowed leaf's tip in the rain → down its thread → settling at the waterline
  _finPath(app) {
    const G = app.garden, T = NST, tip = new THREE.Vector3(), base = new THREE.Vector3(), F = NST_FIN, wy = NST_G.pond.y - 0.0006;
    G._updateSunflower(T.fin); G.sunflowerTip(tip, base);
    const at = (o, water = false) => { const v = tip.clone().add(new THREE.Vector3(o[0], o[1], o[2])); if (water) v.y = wy; return v; };
    this._fin = { tip, a0: at(F.a0), la0: at(F.la0), a1: at(F.a1), la1: at(F.la1), bc: at(F.bc), lbc: at(F.lbc),
      c0: at(F.c0, true), lc0: at(F.lc0), c1: at(F.c1, true), lc1: at(F.lc1), lc2: at(F.lc2), lc3: at(F.lc2).add(new THREE.Vector3(0, 0.03, 0)) };
  },
  _finCam(t, pos, look) {
    const T = NST, P = this._fin, F = NST_FIN, E = Ease.inOutSine, k = (a, b) => MathX.clamp((t - a) / (b - a), 0, 1);
    const bez = (out, a, c, b, u) => out.set(0, 0, 0).addScaledVector(a, (1 - u) * (1 - u)).addScaledVector(c, 2 * u * (1 - u)).addScaledVector(b, u * u);
    if (t < T.desc) { const u = E(k(T.fin, T.desc)); pos.copy(P.a0).lerp(P.a1, u); look.copy(P.la0).lerp(P.la1, u); return MathX.lerp(F.fov0, F.fov1, u); }
    if (t < T.wl) { const u = E(k(T.desc, T.wl)); bez(pos, P.a1, P.bc, P.c0, u); const lu = Ease.inOutSine(k(T.desc + 0.15, T.wl)); bez(look, P.la1, P.lbc, P.lc0, lu); return MathX.lerp(F.fov1, F.fovC, u); }
    const tu = T.line2 + 0.35, te = tu + 2.6;
    if (t < tu) { const u = E(k(T.wl, tu)); pos.copy(P.c0).lerp(P.c1, u); look.copy(P.lc0).lerp(P.lc1, u); return F.fovC; }
    const u = E(k(tu, te)); pos.copy(P.c1); look.copy(P.lc1).lerp(P.lc2, u).lerp(P.lc3, MathX.smooth(t, te, T.end)); return MathX.lerp(F.fovC, F.fovE, u);
  },

  update(app, t) {
    const cam = app.camera, K = app.kitchen, G = app.garden, seg = nstSeg(t), T = NST;
    // the finale: a flown camera (no body motion)
    if (t >= T.fin) {
      if (!this._fin) this._finPath(app);
      cam.fov = this._finCam(t, cam.position, this._v);
      cam.up.set(0, 1, 0); cam.lookAt(this._v); cam.updateProjectionMatrix();
    }
    cam.updateMatrixWorld(true);

    // sets: the kitchen's own window light only while you are inside; the sun's shadow box follows the action
    for (const l of K.lights) l.visible = seg === 'kitchen';
    const F = G.focus, sc = G.sun.shadow.camera;
    const box = seg === 'pond' ? [-0.6, -5.5, 2.5] : seg === 'bench' ? [2.4, -0.6, 2.6] : seg === 'kitchen' ? [0.3, -2, 4] : t >= T.fin ? [-1.9, -6.2, 3] : [-2.4, -6.4, 4];
    F.set(box[0], 0, box[1]);
    if (sc.right !== box[2]) { sc.left = -box[2]; sc.right = box[2]; sc.top = box[2]; sc.bottom = -box[2]; sc.updateProjectionMatrix(); }
    G.update(t, cam);
    NST_RIM.value = seg === 'kitchen' ? 1 : (0.15 + 0.85 * nstDaylight(nstDay(t))) * (1 - 0.65 * nstStorm(t));
    // inside, the garden's sun and sky would light the room through its walls: keep only a little of them (the window light is the kitchen's own)
    if (seg === 'kitchen') { app.scene.fog.density *= 0.3; G.sun.castShadow = false; G.sun.intensity *= 0.25; G.hemi.intensity *= 0.4; } else G.sun.castShadow = true;
    if (seg === 'bench') G.hemi.intensity *= 1.5;     // the bench is in the house's shade: more sky fill
    K.update(t);
    app.stem.update(t, cam);

    // hands: aim the active pose at its contact point
    const V = this._v, Fw = this._f, Nw = this._n;
    if (t >= T.tap && t < T.clip) {
      K.lever.updateMatrixWorld(true); V.set(0, 0.088, 0).applyMatrix4(K.lever.matrixWorld);
      Fw.set(-0.85, -0.1, -0.5); Nw.set(0.1, -0.9, -0.3);            // from your right, palm down on the lever
      for (const n of ['tapReach', 'tapTurn', 'tapPush']) nstAimHand(n, cam, V, Fw, Nw);
    }
    if (t >= T.clip - 0.5 && t < T.clipLet + 1.0) {
      K.clipPos(Math.min(t, T.clipLet), V); V.x += 0.017; V.y += 0.04; V.z -= 0.007;     // pinching its right-hand end, fingertips above the water
      if (t > T.clipLet) V.y += 0.09 * MathX.smooth(t, T.clipLet - 0.02, T.clipLet + 0.35) + 0.3 * MathX.smooth(t, T.clipLet + 0.35, T.clipLet + 0.95);   // and away, up out of frame
      Fw.set(-0.8, -0.55, -0.15); Nw.set(0.05, -0.35, -0.95);       // from the right, side-on: the bowl stays in view
      for (const n of ['clipHold', 'clipOpen']) nstAimHand(n, cam, V, Fw, Nw);
    }
    // the bottle: your right hand twists the cap off (and is thrown up with it), your left holds the bottle and lets go
    if (t >= T.soda - 0.5 && t < T.pond) {
      const Y = this._Y || (this._Y = new THREE.Vector3(0, 1, 0)), tw = K.capTwist(t) * 0.8;
      K.capPos(t, V);
      Fw.set(-0.35, -0.5, -0.8).applyAxisAngle(Y, tw); Nw.set(-0.1, -0.97, 0.2).applyAxisAngle(Y, tw);
      for (const n of ['capHold', 'capTwist', 'capOff']) nstAimHand(n, cam, V, Fw, Nw);
      const S = NST_K.soda, u = t - T.sodaOpen, off = u > 0 ? MathX.smooth(u, 0.12, 0.8) : 0;
      V.set(S.x - 0.045 - 0.14 * off, NST_K.top + 0.08 - 0.06 * off, S.z + 0.008 + 0.06 * off);
      Fw.set(0.55, 0.12, -0.83); Nw.set(0.95, 0.0, -0.3);
      nstAimHand('bottleHold', cam, V, Fw, Nw, -1);
    }
    // the watering can: held up to your right, tipped to pour into the tube dish, then levelled
    const showCan = t >= T.bench && t < T.wick;
    this.can.visible = showCan;
    if (showCan) {
      const tilt = MathX.smooth(t, T.pour - 0.25, T.pour + 0.35) * (1 - MathX.smooth(t, T.pourEnd - 0.1, T.pourEnd + 0.4));
      const D = NST_TB.dish, top = NST_G.bench.top;
      // local +X (the spout) points across the dish toward screen-left (+X world, a little away from you); tipping lowers it
      this.can.rotation.set(0, -0.55, -0.62 * tilt + 0.05, 'YXZ');
      this.can.position.set(0, 0, 0); this.can.updateMatrixWorld(true);
      this._w.set(0.32, 0.15, 0).applyMatrix4(this.can.matrixWorld);              // the rose, relative to the can
      const R = this._f.set(D.x - 0.04, top + 0.17 + 0.03 * (1 - tilt), D.z - 0.02);   // where the rose is held (top right of the frame)
      this.can.position.copy(R).sub(this._w); this.can.updateMatrixWorld(true);
      V.set(-0.05, 0.14, 0).applyMatrix4(this.can.matrixWorld);               // the top of the handle
      this._q.setFromRotationMatrix(this.can.matrixWorld);
      Fw.set(0.15, -0.25, 1).applyQuaternion(this._q); Nw.set(-1, 0.1, 0.05).applyQuaternion(this._q);
      nstAimHand('canHold', cam, V, Fw, Nw);
      // the stream from the rose: no drops, it frays on the way down into the dish
      this._w.set(0.32, 0.15, 0).applyMatrix4(this.can.matrixWorld);
      const dir = this._n.set(0.25, -0.95, 0).applyQuaternion(this._q).multiplyScalar(0.7);
      this.canStream.a.copy(this._w); this.canStream.v0.copy(dir);
      this.canStream.yEnd = top + 0.002 + app.garden.tubes.level(t);
      const dy = this._w.y - this.canStream.yEnd, vy = dir.y; this.canStream.T = (vy + Math.sqrt(vy * vy + 2 * 9.81 * Math.max(0.01, dy))) / 9.81;
      const flow = MathX.smooth(t, T.pour + 0.15, T.pour + 0.45) * (1 - MathX.smooth(t, T.pourEnd - 0.2, T.pourEnd + 0.15));
      this.canStream.update(t, flow, 1);
    } else this.canStream.update(t, 0, 1);

    // the lens at the waterline: the line sits on the horizon (the camera is exactly at the water's surface)
    const pu = this.port.material.uniforms, onP = t < T.desc ? 0 : Math.max(MathX.smooth(t, T.wl - 0.05, T.wl + 0.15), 1 - MathX.smooth(cam.position.y, NST_G.pond.y + 0.004, NST_G.pond.y + 0.05));     // (on as the camera reaches the surface: no grazing grey slab)
    pu.uOn.value = onP; pu.uT.value = t;
    if (onP > 0) { cam.getWorldDirection(this._w); pu.uH.value = -Math.tan(Math.asin(this._w.y)) / Math.tan(MathX.deg(cam.fov / 2)) - 0.004; }

    app.hands.update(t);
  },

  grade(t, p) {
    const T = NST, storm = nstStorm(t), rain = nstRain(t), seg = nstSeg(t), wilt = nstWilt(t);
    p.flash = 0; p.fade = 0; p.chroma = 0; p.edgeBlur = 0; p.ao = 0.6; p.smear.set(0, 0);
    p.exposure = 1.1; p.saturation = 1.16; p.contrast = 1.08; p.warmth = 0.05; p.blackLift = 0.008; p.keepWarm = 0;
    p.vignette = 0.5; p.soft = 0.06; p.bloom = 0.26; p.bloomThreshold = 1.25; p.grain = 0.022;
    p.tunnel = 1.25; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.uneven = 0;
    p.flashColor.setRGB(1, 1, 1);
    if (seg === 'kitchen') { p.ao = 0.45; p.edgeBlur = 0.35; p.warmth = 0.06; p.exposure = 1.14; }
    if (seg === 'pond') { p.edgeBlur = 0.45; p.ao = 0.4; }
    if (seg === 'bench') { p.ao = 0.5; p.edgeBlur = 0.2; p.exposure = 1.22; p.warmth = 0.08; }
    if (seg === 'stem') { p.ao = 0; p.edgeBlur = 0.55; p.exposure = 1.05; p.saturation = 1.05; p.warmth = 0.02; p.bloom = 0.3; p.vignette = 0.62; }
    if (t >= T.fin) { p.edgeBlur = 0.32; p.ao = 0.4; }
    // the rule change: a soft cooling pulse under the title
    p.saturation -= 0.06 * MathX.impulse(t, T.drop, 0.6);
    // the time-lapse / the wilting: a touch warmer and drier, then the storm: cold, flatter, darker
    p.warmth += 0.04 * wilt * (1 - storm);
    p.saturation -= 0.26 * storm; p.exposure -= 0.1 * storm; p.contrast += 0.04 * storm; p.warmth -= 0.1 * storm; p.blackLift += 0.006 * storm;
    p.vignette += 0.12 * storm;
    // nights in the time-lapse: lifted so they read as moonlight, not black frames
    if (t > T.lapse && t < T.clouds) p.exposure += 0.5 * (1 - nstDaylight(nstDay(t)));
    // the finale: a little clearer than the storm grade (the rain is grey, the subject mustn't be)
    p.exposure += 0.45 * MathX.smooth(t, T.fin - 0.1, T.fin) + 0.3 * MathX.smooth(t, T.fin - 0.1, T.fin) * (1 - MathX.smooth(t, T.desc, T.wl)); p.saturation += 0.12 * MathX.smooth(t, T.fin - 0.1, T.fin);      // (the finale was too dark to read on a phone)
    // black at the end
    p.fade = MathX.smooth(t, T.end - 0.7, T.end);
  },

  debug(app, t) { return `seg ${nstSeg(t)} · σ ${nstSigma(t).toFixed(1)} mN/m · day ${nstDay(t).toFixed(2)} · wilt ${nstWilt(t).toFixed(2)} · rain ${nstRain(t).toFixed(2)}`; },
};
