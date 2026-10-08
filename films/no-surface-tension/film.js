/* =====================================================================
   FILM — "What if water lost all surface tension?" (see js/main.js for the hook order)
     build: the kitchen + the garden in one scene (you walk out the back door), hands, props, HUD, soundtrack
     update: the active set, your hands (aimed at the lever, the clip, the bottle and its cap, the can), a world tag,
             the lens at the waterline (the duck shot), the payoff's dive down to one leaf
     grade: a bright ordinary morning → the time-lapse → the rain
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
function nstSeg(t) { return t < NST.pond ? 'kitchen' : t < NST.bench ? 'pond' : t < NST.lapse ? 'bench' : 'garden'; }

// labels pinned to points in the world: [t0, t1, point fn(t, out), text]
const NST_TAGS = [
  // the trickle: where ordinary water would have pinched off into drops (a point on the stream, 12 cm below the spout, + 3 cm to screen-right)
  { t0: 6.3, t1: 9.3, at: (t, o) => { const S = NST_K.tap.spout; return o.set(S[0] + 0.454 * 0.012, S[1] - 0.085, S[2] + 0.01 - 0.891 * 0.012); }, text: 'NORMAL WATER<br>WOULD BREAK<br>INTO DROPS HERE', line: true },
];

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
    // world tags (one-off HTML in the HUD layer)
    const hud = document.getElementById('hud');
    this.tags = NST_TAGS.map((d) => { const el = document.createElement('div'); el.className = 'nst-tag' + (d.line ? ' line' : '') + (d.left ? ' left' : ''); el.innerHTML = `<span>${d.text}</span>`; hud.appendChild(el); return { d, el }; });
    app.hud = new StoryHUD(hud, app.tl);
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

  // the payoff: from high over the garden straight down to one wilted sunflower leaf, its tip letting the rain go
  _divePath(app) {
    const G = app.garden, T = NST, tip = new THREE.Vector3(), base = new THREE.Vector3();
    G._updateSunflower(T.dive); G.sunflowerTip(tip, base);
    const V = (x, y, z) => new THREE.Vector3(x, y, z), at = (x, y, z) => tip.clone().add(V(x, y, z));
    const P0 = NST_G.pond, v = new THREE.Vector3(P0.x - tip.x, 0, P0.z - tip.z).normalize();
    // (it comes down on the leaf from the same side as the close-up, clear of the stem and the hanging head)
    // the close-up: above and to one side of the bowed leaf, its tip high in frame, the thread falling down the frame
    // against the dark pond; then, on the last line, back out to the whole sunflower bowed over the pond in the rain
    const mc = at(-0.165, 0.3, 0.274), ml = at(0.141, -0.25, -0.052);
    const wc = at(-1.073, -0.077, -0.853), wl = at(0.027, 0.073, 0.047);
    const app0 = mc.clone().add(mc.clone().sub(tip).multiplyScalar(0.9));
    const pull = T.line2 + 1.0, held = pull + 2.6;
    const P = [[T.dive, tip.clone().add(V(-3.5, 21, 8))], [T.dive + 1.8, tip.clone().add(V(-2.0, 8.5, 3.4))], [T.dive + 3.5, at(-1.0, 2.2, 1.7)],
      [T.land - 0.6, app0], [T.land, mc], [pull, mc.clone().lerp(tip, 0.12)]];
    const L = [[T.dive, V(-1.2, 0, -7.5)], [T.dive + 1.8, V(P0.x, 0, P0.z)], [T.dive + 3.5, at(0.1, -0.35, -0.05)],
      [T.land - 0.6, ml.clone().add(V(0, -0.1, 0))], [T.land, ml], [pull, ml.clone().add(V(0, -0.02, 0))]];
    const tr = (keys) => ['x', 'y', 'z'].map((c) => new SmoothTrack(keys.map(([t, v]) => [t, v[c]])));
    // (the pull-back is its own eased move, so the close-up's slow push-in doesn't swing back through it)
    const out = { pull, held, c0: P[P.length - 1][1], l0: L[L.length - 1][1], c1: wc, l1: wl, c2: wc.clone().lerp(wl, -0.06) };
    this._dive = { p: tr(P), l: tr(L), out, fov: new Track([[T.dive, 62], [T.dive + 2.5, 54], [T.land - 0.8, 46], [T.land, 42], [pull, 40], [held, 55, 'inOutSine'], [T.end, 53]]) };
  },

  update(app, t) {
    const cam = app.camera, K = app.kitchen, G = app.garden, seg = nstSeg(t), T = NST;
    // the payoff: the dive (no body motion)
    if (t >= T.dive) {
      if (!this._dive) this._divePath(app);
      const D = this._dive;
      const O = D.out;
      if (t < O.pull) {
        cam.position.set(D.p[0].value(t), D.p[1].value(t), D.p[2].value(t));
        this._v.set(D.l[0].value(t), D.l[1].value(t), D.l[2].value(t));
      } else {
        const k = Ease.inOutSine(MathX.clamp((t - O.pull) / (O.held - O.pull), 0, 1)), k2 = MathX.smooth(t, O.held, T.end + 0.5);
        cam.position.copy(O.c0).lerp(O.c1, k).lerp(O.c2, k2);
        this._v.copy(O.l0).lerp(O.l1, k);
      }
      cam.up.set(0, 1, 0); cam.lookAt(this._v);
      cam.fov = D.fov.value(t); cam.updateProjectionMatrix();
    }
    cam.updateMatrixWorld(true);

    // sets: the kitchen's own window light only while you are inside; the sun's shadow box follows the action
    for (const l of K.lights) l.visible = seg === 'kitchen';
    const F = G.focus, sc = G.sun.shadow.camera;
    const box = seg === 'pond' ? [-0.6, -5.5, 2.5] : seg === 'bench' ? [2.4, -0.6, 2.6] : seg === 'kitchen' ? [0.3, -2, 4] : t >= T.duck ? [-1.2, -5.6, 4] : [-0.8, -7.5, 15];
    F.set(box[0], 0, box[1]);
    if (sc.right !== box[2]) { sc.left = -box[2]; sc.right = box[2]; sc.top = box[2]; sc.bottom = -box[2]; sc.updateProjectionMatrix(); }
    G.update(t, cam);
    NST_RIM.value = seg === 'kitchen' ? 1 : (0.15 + 0.85 * nstDaylight(nstDay(t))) * (1 - 0.65 * nstStorm(t));
    // inside, the garden's sun and sky would light the room through its walls: keep only a little of them (the window light is the kitchen's own)
    if (seg === 'kitchen') { app.scene.fog.density *= 0.3; G.sun.castShadow = false; G.sun.intensity *= 0.25; G.hemi.intensity *= 0.4; } else G.sun.castShadow = true;
    if (seg === 'bench') G.hemi.intensity *= 1.5;     // the bench is in the house's shade: more sky fill
    K.update(t);

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
      V.set(S.x - 0.034 - 0.14 * off, NST_K.top + 0.08 - 0.06 * off, S.z + 0.008 + 0.06 * off);
      Fw.set(0.55, 0.12, -0.83); Nw.set(0.95, 0.0, -0.3);
      nstAimHand('bottleHold', cam, V, Fw, Nw, -1);
    }
    // the watering can: held in front of you, tilted to pour into pot A, then levelled
    const showCan = t >= T.bench && t < T.wick;
    this.can.visible = showCan;
    if (showCan) {
      const tilt = MathX.smooth(t, T.pour - 0.2, T.pour + 0.45) * (1 - MathX.smooth(t, T.pourEnd - 0.1, T.pourEnd + 0.4));
      const away = 0;
      const A = NST_G.potA;
      this.can.position.set(A.x + 0.36 + 0.12 * away, NST_G.bench.top + 0.42 - 0.06 * tilt - 0.55 * away, A.z - 0.22 - 0.25 * away);
      // local +X (the spout) points at the pot (toward −X world, slightly +Z); tilt pitches the spout down
      this.can.rotation.set(0, Math.PI + 0.55, 0.55 * tilt - 0.08, 'YXZ');
      this.can.updateMatrixWorld(true);
      V.set(-0.05, 0.14, 0).applyMatrix4(this.can.matrixWorld);               // the top of the handle
      this._q.setFromRotationMatrix(this.can.matrixWorld);
      Fw.set(0, 0, 1).applyQuaternion(this._q); Nw.set(0, -0.2, 1).applyQuaternion(this._q); Fw.set(0.05, -0.2, 1).applyQuaternion(this._q); Nw.set(1, 0, 0).applyQuaternion(this._q);
      Fw.set(0.15, -0.25, 1).applyQuaternion(this._q); Nw.set(-1, 0.1, 0.05).applyQuaternion(this._q);
      nstAimHand('canHold', cam, V, Fw, Nw);
      // the stream from the rose: no drops, it frays on the way down into the soil
      this._w.set(0.32, 0.15, 0).applyMatrix4(this.can.matrixWorld);
      const dir = new THREE.Vector3(0.6, -0.8, 0).applyQuaternion(this._q).multiplyScalar(0.9);
      this.canStream.a.copy(this._w); this.canStream.v0.copy(dir);
      this.canStream.yEnd = NST_G.bench.top + 0.19;
      const dy = this._w.y - this.canStream.yEnd, vy = dir.y; this.canStream.T = (vy + Math.sqrt(vy * vy + 2 * 9.81 * Math.max(0.01, dy))) / 9.81;
      const flow = MathX.smooth(t, T.pour + 0.2, T.pour + 0.5) * (1 - MathX.smooth(t, T.pourEnd - 0.2, T.pourEnd + 0.15));
      this.canStream.update(t, flow, 1);
    } else this.canStream.update(t, 0, 1);

    // the lens at the waterline: the line sits on the horizon (the camera is exactly at the water's surface)
    const pu = this.port.material.uniforms, onP = t >= T.duck && t < T.dive ? 1 : 0;
    pu.uOn.value = onP; pu.uT.value = t;
    if (onP) { cam.getWorldDirection(this._w); pu.uH.value = -Math.tan(Math.asin(this._w.y)) / Math.tan(MathX.deg(cam.fov / 2)) - 0.004; }

    app.hands.update(t);

    // world tags
    for (const { d, el } of this.tags) {
      const a = StoryHUD.win(t, d.t0, d.t1, 0.3, 0.3);
      el.style.opacity = a.toFixed(3);
      if (a <= 0) continue;
      d.at(t, V); V.project(cam);
      el.style.left = ((V.x * 0.5 + 0.5) * 100).toFixed(2) + '%';
      el.style.top = ((1 - (V.y * 0.5 + 0.5)) * 100).toFixed(2) + '%';
    }
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
    if (t >= T.duck && t < T.dive) { p.edgeBlur = 0.3; p.ao = 0.4; p.exposure += 0.08; }
    // the rule change: a soft cooling pulse under the title
    p.saturation -= 0.06 * MathX.impulse(t, T.drop, 0.6);
    // the time-lapse / the wilting: a touch warmer and drier, then the storm: cold, flatter, darker
    p.warmth += 0.04 * wilt * (1 - storm);
    p.saturation -= 0.26 * storm; p.exposure -= 0.1 * storm; p.contrast += 0.04 * storm; p.warmth -= 0.1 * storm; p.blackLift += 0.006 * storm;
    p.vignette += 0.12 * storm;
    // nights in the time-lapse: lifted so they read as moonlight, not black frames
    if (t > T.lapse && t < T.clouds) p.exposure += 0.5 * (1 - nstDaylight(nstDay(t)));
    // the dive: a little clearer
    p.exposure += 0.22 * MathX.smooth(t, T.dive, T.dive + 0.5); p.saturation += 0.1 * MathX.smooth(t, T.dive, T.dive + 0.5);
    // black at the end
    p.fade = MathX.smooth(t, T.end - 0.7, T.end);
  },

  debug(app, t) { return `seg ${nstSeg(t)} · σ ${nstSigma(t).toFixed(1)} mN/m · day ${nstDay(t).toFixed(2)} · wilt ${nstWilt(t).toFixed(2)} · rain ${nstRain(t).toFixed(2)}`; },
};
