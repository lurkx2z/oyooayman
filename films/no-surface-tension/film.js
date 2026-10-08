/* =====================================================================
   FILM — "What if water lost all surface tension?" (see js/main.js for the hook order)
     build: the kitchen + the garden in one scene (you walk out the back door), hands, props, HUD, soundtrack
     update: the active set, your hands (aimed at the lever, the clip, the towel, the sponge, the can, the umbrella),
             world tags, the payoff's rising camera
     grade: a bright ordinary morning → the time-lapse → the storm
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// hands: right-hand poses (aimed ones carry `aim`: the palm point, in the hand's frame X = thumb side, Y = fingers, Z = palm)
// ---------------------------------------------------------------------------------------------------------------------
const NST_HAND_POSES = {
  tapReach: { p: [0.12, -0.2, -0.42], F: [0, -0.3, -1], N: [-1, 0, 0], curl: [0.35, 0.45, 0.55, 0.6], thumb: [0.55, 0.2], aim: [0.0, 0.07, 0.025] },
  tapTurn: { p: [0.12, -0.2, -0.42], F: [0, -0.3, -1], N: [-1, 0, 0], curl: [0.75, 0.95, 1.05, 1.1], thumb: [0.35, 0.45], aim: [0.0, 0.07, 0.025] },
  clipHold: { p: [0.08, -0.2, -0.4], F: [0, -0.6, -0.8], N: [0, -0.8, 0.6], curl: [0.55, 0.95, 1.15, 1.25], thumb: [0.25, 0.55], aim: [0.012, 0.085, 0.012] },
  clipOpen: { p: [0.08, -0.2, -0.4], F: [0, -0.6, -0.8], N: [0, -0.8, 0.6], curl: [0.2, 0.45, 0.6, 0.7], thumb: [0.55, 0.2], aim: [0.012, 0.085, 0.012] },
  towelHold: { p: [0.08, -0.2, -0.4], F: [0, -0.2, -1], N: [-1, 0, 0], curl: [0.65, 1.0, 1.15, 1.25], thumb: [0.2, 0.5], aim: [0.0, 0.08, 0.012] },
  spongeGrab: { p: [0.08, -0.2, -0.4], F: [0, -0.3, -1], N: [0, -1, 0], curl: [0.75, 0.8, 0.85, 0.9], thumb: [0.3, 0.4], aim: [0.0, 0.065, 0.028] },
  canHold: { p: [0.18, -0.3, -0.42], F: [0, 0, -1], N: [-1, 0, 0], curl: [1.25, 1.3, 1.35, 1.35], thumb: [0.15, 0.75], aim: [0.0, 0.05, 0.03] },
  umbHold: { p: [0.1, -0.32, -0.32], F: [-1, 0, 0], N: [0, 0, 1], curl: [1.3, 1.35, 1.4, 1.4], thumb: [0.12, 0.8], aim: [0.0, 0.05, 0.028] },
};
const NST_HAND_BLEND = { tapReach: 0.4, tapTurn: 0.25, clipHold: 0.4, clipOpen: 0.12, towelHold: 0.35, spongeGrab: 0.25, canHold: 0.35, umbHold: 0.4, hidden: 0.4 };
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
  { t0: 6.3, t1: 9.3, at: (t, o) => { const S = NST_K.tap.spout; return o.set(S[0] + 0.454 * 0.03, S[1] - 0.085, S[2] + 0.01 - 0.891 * 0.03); }, text: 'NORMAL WATER<br>WOULD BREAK<br>INTO DROPS HERE', line: true },
  { t0: 16.1, t1: 18.3, at: (t, o) => o.set(NST_K.bowl.x - 0.01 + 0.033, NST_K.top + NST_K.bowl.water + 0.075, NST_K.bowl.z - 0.005), text: 'NORMAL WATER<br>WOULD CLIMB<br>TO HERE', line: true },
  { t0: 34.5, t1: 37.2, at: (t, o) => o.set(NST_G.potB.x + 0.012, NST_G.bench.top + 0.1, NST_G.potB.z), text: 'DRY ABOVE<br>THE WATER LINE', line: false },
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

  // the watering can and the umbrella (world props, held by the aimed right hand)
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
    // the umbrella: 8 gores, dark navy, ribs; its underside soaks through in the rain (shader: wet spreading from the apex)
    const u = new THREE.Group(); app.scene.add(u);
    const cm = new THREE.MeshStandardMaterial({ color: '#d9b84e', roughness: 0.6, side: THREE.DoubleSide, name: 'nstUmbrella' });
    cm.userData.wet = { value: 0 };
    cm.onBeforeCompile = (sh) => {
      sh.uniforms.uWet = cm.userData.wet;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vLocU;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocU = position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vLocU; uniform float uWet;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float rr = length(vLocU.xz) / 0.52;
          float an = atan(vLocU.z, vLocU.x);
          float seam = pow(abs(cos(an * 4.0)), 18.0);
          float n = fract(sin(dot(floor(vec2(an * 9.0, rr * 14.0)), vec2(12.9, 78.2))) * 43758.5);
          // soaked patches: blotches that grow and join (value noise over the canopy), a little ahead near the top
          vec2 bq = vec2(an * 2.6, rr * 5.0); vec2 bi = floor(bq), bf = fract(bq); bf = bf * bf * (3.0 - 2.0 * bf);
          float h00 = fract(sin(dot(bi, vec2(12.9, 78.2))) * 43758.5), h10 = fract(sin(dot(bi + vec2(1, 0), vec2(12.9, 78.2))) * 43758.5);
          float h01 = fract(sin(dot(bi + vec2(0, 1), vec2(12.9, 78.2))) * 43758.5), h11 = fract(sin(dot(bi + vec2(1, 1), vec2(12.9, 78.2))) * 43758.5);
          float blot = mix(mix(h00, h10, bf.x), mix(h01, h11, bf.x), bf.y);
          float wet = smoothstep(0.0, 0.08, uWet * 1.35 - (0.3 * rr + 0.7 * blot));
          float streak = wet * smoothstep(0.6, 1.0, abs(sin(an * 28.0 + rr * 3.0))) * 0.5;
          diffuseColor.rgb *= 1.0 - 0.6 * wet - 0.2 * streak;
          diffuseColor.rgb += seam * 0.03;`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          { // thin fabric glows with the daylight behind it (seen from underneath); soaked patches go dark
            float rr3 = length(vLocU.xz) / 0.52;
            float wet3 = wet;          // (declared in the colour chunk above, same scope)
            totalEmissiveRadiance += diffuseColor.rgb * (0.55 - 0.35 * wet3) * (gl_FrontFacing ? 0.0 : 1.0); }`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, 0.15, wet);`);
    };
    cm.customProgramCacheKey = () => 'nstUmb';
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.22, 8, 4, true), cm); canopy.position.y = 0.11; u.add(canopy);
    const rib = new THREE.MeshStandardMaterial({ color: '#2a2a2c', roughness: 0.4, metalness: 0.6 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8, rm = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.6, 4), rib);
      rm.position.set(Math.cos(a) * 0.27, 0.105, Math.sin(a) * 0.27); rm.rotation.set(0, -a, Math.PI / 2 - 0.38); u.add(rm);
    }
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.95, 8), rib); shaft.position.y = -0.255; u.add(shaft);
    const hdl = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.12, 10), new THREE.MeshStandardMaterial({ color: '#3a2a20', roughness: 0.5 })); hdl.position.y = -0.68; u.add(hdl);
    this.umb = u; this.umbMat = cm;
    this.umbDrip = new StreakSystem(app.scene, 500);       // what soaks through falls off the fabric as fine torn strands
  },

  update(app, t) {
    const cam = app.camera, K = app.kitchen, G = app.garden, seg = nstSeg(t), T = NST;
    // the payoff: a rising camera over the garden, the park and the city in the storm (no body motion)
    if (t >= T.drone) {
      const k = Ease.inOutSine(MathX.clamp((t - T.drone) / (T.end - T.drone), 0, 1)), k2 = MathX.smooth(t, T.drone, T.drone + 6);
      cam.position.set(MathX.lerp(-2.0, -0.6, k), MathX.lerp(2.0, 16.5, k), MathX.lerp(-1.0, 5.5, k));
      this._v.set(MathX.lerp(-1.1, -0.8, k2), MathX.lerp(1.2, 0.0, k2), MathX.lerp(-9.0, -34, k));
      cam.up.set(0, 1, 0); cam.lookAt(this._v);
      cam.fov = MathX.lerp(62, 54, k); cam.updateProjectionMatrix();
    }
    cam.updateMatrixWorld(true);

    // sets: the kitchen's own window light only while you are inside; the sun's shadow box follows the action
    for (const l of K.lights) l.visible = seg === 'kitchen';
    const F = G.focus, sc = G.sun.shadow.camera;
    const box = seg === 'pond' ? [-0.6, -5.5, 2.5] : seg === 'bench' ? [2.4, -0.6, 2.6] : seg === 'kitchen' ? [0.3, -2, 4] : [-0.8, -7.5, 15];
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
    if (t >= T.tap && t < T.tapOn + 1.3) {
      K.lever.updateMatrixWorld(true); V.set(0, 0.088, 0).applyMatrix4(K.lever.matrixWorld);
      Fw.set(-0.85, -0.1, -0.5); Nw.set(0.1, -0.9, -0.3);            // from your right, palm down on the lever
      for (const n of ['tapReach', 'tapTurn']) nstAimHand(n, cam, V, Fw, Nw);
    }
    if (t >= T.clip - 0.5 && t < T.clipLet + 1.0) {
      K.clipPos(Math.min(t, T.clipLet), V); V.x += 0.017; V.y += 0.016; V.z -= 0.007;     // pinching its right-hand end, fingertips above the water
      if (t > T.clipLet) V.y += 0.09 * MathX.smooth(t, T.clipLet - 0.02, T.clipLet + 0.35) + 0.3 * MathX.smooth(t, T.clipLet + 0.35, T.clipLet + 0.95);   // and away, up out of frame
      Fw.set(-0.8, -0.55, -0.15); Nw.set(0.05, -0.35, -0.95);       // from the right, side-on: the bowl stays in view
      for (const n of ['clipHold', 'clipOpen']) nstAimHand(n, cam, V, Fw, Nw);
    }
    if (t >= T.towel - 0.5 && t < T.sponge + 0.2) {
      K.towelTop(t, V); V.x += 0.02; V.y += 0.004;
      Fw.set(-0.25, -0.15, -1); Nw.set(-1, 0.05, 0.2);
      nstAimHand('towelHold', cam, V, Fw, Nw);
    }
    if (t >= T.sponge - 0.4 && t < 22.2) {
      K.spongePos(t, V); V.y += 0.03;
      Fw.set(-0.2, -0.25, -1); Nw.set(0, -1, 0.1);
      nstAimHand('spongeGrab', cam, V, Fw, Nw);
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

    // the umbrella: held over your head from when the clouds come; its underside soaks; spray falls through onto you
    const showU = t >= T.clouds + 0.6 && t < T.drone;
    this.umb.visible = showU;
    this.umbDrip.begin();
    if (showU) {
      const c = cam.position, yaw = MathX.deg(SCRIPT_TRACKS.pov ? 0 : 0);
      const hx = Math.sin(0) * 0, fwx = -Math.sin(cam.rotation.y), fwz = -Math.cos(cam.rotation.y);
      const rx = -fwz, rz = fwx;                                   // your right, on the ground plane
      this.umb.position.set(c.x + rx * 0.08 + fwx * 0.05, c.y + 0.33, c.z + rz * 0.08 + fwz * 0.05);
      this.umb.rotation.set(0.05 * Math.sin(t * 0.9), 0, -0.1 + 0.03 * Math.sin(t * 0.7));
      this.umb.updateMatrixWorld(true);
      V.set(0, -0.6, 0).applyMatrix4(this.umb.matrixWorld);
      Fw.set(-1, 0, 0.2); Nw.set(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), cam.rotation.y); Fw.set(-1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), cam.rotation.y);
      nstAimHand('umbHold', cam, V, Fw, Nw);
      const wet = MathX.smooth(t, T.umb + 0.4, T.umb + 4.0);
      this.umbMat.userData.wet.value = wet;
      // water that soaks through can't hang as drops under the fabric: it falls straight off as fine torn strands,
      // slowly (spray, not drops), from the soaked patches; nothing is drawn near the lens
      const ux = this.umb.position.x, uy = this.umb.position.y, uz = this.umb.position.z, cp = cam.position;
      for (let i = 0; i < 380; i++) {
        const per = 0.9 + 0.5 * hash1(i * 1.7), ph = hash1(i * 2.3) * per, cyc = Math.floor((t + ph) / per), age = (t + ph) / per - cyc, tt = age * per;
        const a = hash1(i * 3.1 + cyc) * 6.28, rr = (0.12 + 0.4 * Math.sqrt(hash1(i * 7.3 + cyc * 1.7))) * Math.min(1, wet * 1.3);
        const k = MathX.clamp((wet * 1.25 - rr / 0.52) * 3, 0, 1); if (k <= 0) continue;
        const vf = 1.2 + 0.8 * hash1(i * 5.1 + cyc);
        const x = ux + Math.cos(a) * rr + 0.25 * tt, y = uy + 0.11 - rr * 0.42 - vf * tt, z = uz + Math.sin(a) * rr;
        const d = Math.hypot(x - cp.x, y - cp.y, z - cp.z); if (d < 0.3) continue;
        const L = 0.03 + 0.04 * hash1(i + cyc), al = 0.8 * k * Math.min(1, age * 6) * (1 - age) * MathX.smooth(d, 0.3, 0.45);
        this.umbDrip.push(x, y, z, x + 0.004, y - L, z, 0.85, 0.88, 0.9, al, 0.0022);
      }
    }
    this.umbDrip.end();

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
    // the rule change: a soft cooling pulse under the title
    p.saturation -= 0.06 * MathX.impulse(t, T.drop, 0.6);
    // the time-lapse / the wilting: a touch warmer and drier, then the storm: cold, flatter, darker
    p.warmth += 0.04 * wilt * (1 - storm);
    p.saturation -= 0.26 * storm; p.exposure -= 0.1 * storm; p.contrast += 0.04 * storm; p.warmth -= 0.1 * storm; p.blackLift += 0.006 * storm;
    p.vignette += 0.12 * storm;
    // nights in the time-lapse: lifted so they read as moonlight, not black frames
    if (t > T.lapse && t < T.clouds) p.exposure += 0.3 * (1 - nstDaylight(nstDay(t)));
    // the rise: a little clearer
    p.exposure += 0.08 * MathX.smooth(t, T.drone, T.drone + 2); p.saturation += 0.08 * MathX.smooth(t, T.drone, T.drone + 2);
    // lightning (the sky does most of it; a whisper of flash in the grade)
    p.flash = 0.22 * nstFlash(t);
    p.flashColor.setRGB(0.85, 0.9, 1.0);
    // dips at the bigger jumps (out to the pond, into the time-lapse), black at the end
    p.fade = Math.max(1 - MathX.smooth(t, T.lapse, T.lapse + 0.3), 0) * (t >= T.lapse ? 1 : 0) * 0.8;
    p.fade = Math.max(p.fade, MathX.smooth(t, T.end - 0.7, T.end));
  },

  debug(app, t) { return `seg ${nstSeg(t)} · σ ${nstSigma(t).toFixed(1)} mN/m · day ${nstDay(t).toFixed(2)} · wilt ${nstWilt(t).toFixed(2)} · rain ${nstRain(t).toFixed(2)}`; },
};
