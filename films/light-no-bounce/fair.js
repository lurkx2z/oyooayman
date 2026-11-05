/* =====================================================================
   FAIR SET — the funfair on the hilltop, the sky over it, the valley below (fair-world.js, fair-rides.js, valley.js,
   fair-people.js, sky.js), and every camera in it.
   THE LOOK (physics.js): b = NBP.bounce(s). Every light that stands for bounced light (the Sun's direct light reaching a
   surface, the sky's light, the environment) is scaled by b; the sky dome and the haze by b; mirrors show b × their
   reflection. Sources (bulbs, signs, screens, flames, sparks, car and plane lights, lit windows) don't change. So while
   nothing bounces every surface renders pure black and shows only as a shape cut out of the lights behind it.
   Your eyes: in the dark your pupils open (NBP.pupil): the exposure rises with them (never all the way), more stars
   come out (NBP.limMag); at 3:30:10 the light floods into wide-open pupils (the dazzle) until they close.
   Your hands are ViewerHands (layer 2: never in a mirror); you exist in the mirror only (layer 1).
   ===================================================================== */

const NB_HAND_POSES = {
  phone: { p: [0.045, -0.125, -0.255], F: [-0.9, 0.22, -0.18], N: [0.02, 0.28, 1], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.95, 0.42] },
  phoneLow: { p: [0.075, -0.115, -0.31], F: [-0.86, 0.3, -0.25], N: [0.02, 0.5, 0.86], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.95, 0.42] },
  phoneUp: { p: [0.03, -0.072, -0.27], F: [-0.9, 0.22, -0.18], N: [0.02, 0.28, 1], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.95, 0.42] },
  raise: { p: [0.07, -0.02, -0.36], F: [-0.1, 1, -0.12], N: [0.12, 0.1, -1], curl: [0.1, 0.08, 0.12, 0.2], thumb: [0.4, 0.12] },
};
const NB_HAND_BL = Object.fromEntries(Object.keys(NB_HAND_POSES).concat(['hidden']).map((k) => [k, 0.01]));
const NB_HANDS_OF = { hands: ['phoneLow', 'raise'], phoneNet: ['phoneUp', 'hidden'], after: ['phoneUp', 'hidden'] };
const NB_PHONE_OF = { hands: 'cam', phoneNet: 'net', after: 'video' };

// the phone's screen: the camera app (black: it sees what you see), an upload stuck, a video of the dark
function nbDrawPhone(g, w, h, st) {
  const s = st.s, c = nbClockParts(Math.max(-9, s));
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  if (st.app === 'cam') {
    // the viewfinder: black, a scatter of bulbs; the record dot and the timer
    const r = new RNG(5); for (let i = 0; i < 150; i++) { const x = r.range(0, w), y = r.range(h * 0.12, h * 0.8), a = r.range(0.6, 1), hue = r.int(0, 5); g.fillStyle = [`rgba(255,220,150,${a})`, `rgba(255,90,80,${a})`, `rgba(120,200,255,${a})`, `rgba(255,240,120,${a})`, `rgba(255,120,220,${a})`, `rgba(140,255,140,${a})`][hue]; g.beginPath(); g.arc(x, y, r.range(1.6, 3.8), 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,90,180,0.9)'; g.fillRect(w * 0.18, h * 0.3, w * 0.64, 6); g.fillStyle = 'rgba(255,255,255,0.8)'; g.font = '600 18px Arial'; g.fillText('VIDEO   PHOTO   SLO-MO', w * 0.16, h - 118);
    g.fillStyle = '#ff2a2a'; g.beginPath(); g.arc(w / 2 - 44, 30, 7, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.font = '600 20px Arial'; g.fillText(`00:${String(Math.floor(12 + s)).padStart(2, '0')}`, w / 2 - 30, 37);
    g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.beginPath(); g.arc(w / 2, h - 70, 30, 0, 7); g.stroke(); g.fillStyle = '#ff2a2a'; g.fillRect(w / 2 - 13, h - 83, 26, 26);
  } else if (st.app === 'net') {
    g.fillStyle = '#121418'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.font = '600 18px Arial'; g.fillText(`${c.h}:${String(c.m).padStart(2, '0')}`, 18, 28);
    g.fillStyle = '#05070a'; g.fillRect(16, 70, w - 32, (w - 32) * 1.2);
    const r = new RNG(9); for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(255,220,160,0.9)'; g.beginPath(); g.arc(r.range(24, w - 24), r.range(80, 70 + (w - 32) * 1.15), r.range(1, 2.2), 0, 7); g.fill(); }
    const y0 = 90 + (w - 32) * 1.2; g.fillStyle = '#ffffff'; g.font = '700 21px Arial'; g.fillText('Posting your video…', 18, y0);
    g.fillStyle = 'rgba(255,255,255,0.18)'; nbRR(g, 18, y0 + 18, w - 36, 10, 5); g.fill(); g.fillStyle = '#3d8bff'; nbRR(g, 18, y0 + 18, (w - 36) * 0.37, 10, 5); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.font = '500 17px Arial'; g.fillText('37% · Waiting for network', 18, y0 + 56);
    const sp = (s * 8) % 6.28; g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.beginPath(); g.arc(w - 40, y0 + 52, 12, sp, sp + 4.4); g.stroke();
  } else {
    // a video someone posted of the ten seconds: black, with dots of light, and the count of views
    g.fillStyle = '#0d0f12'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#000'; g.fillRect(0, 60, w, w * 1.25);
    const r = new RNG(21), tt = s * 0.6; for (let i = 0; i < 70; i++) { const x = r.range(6, w - 6), y = 64 + r.range(0, w * 1.24), a = 0.5 + 0.5 * Math.sin(tt * 3 + i); g.fillStyle = `rgba(255,${190 + r.int(0, 60)},${120 + r.int(0, 110)},${a.toFixed(2)})`; g.beginPath(); g.arc(x, y, r.range(1, 2.4), 0, 7); g.fill(); }
    g.fillStyle = '#ffffff'; g.font = '700 19px Arial'; g.fillText('everything went black???', 16, 90 + w * 1.25);
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = '500 16px Arial'; g.fillText(`${(1.2 + 0.4 * Math.max(0, s - 130)).toFixed(1)}M views · 2 min ago`, 16, 116 + w * 1.25);
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.moveTo(w / 2 - 14, 60 + w * 0.6 - 18); g.lineTo(w / 2 + 18, 60 + w * 0.6); g.lineTo(w / 2 - 14, 60 + w * 0.6 + 18); g.fill();
  }
}

NB_SETS.fair = (app) => {
  const S = nbSet(app, { sky: '#000000', fov: 50, near: 0.05, far: 30000, sun: [-400, 30, 330], sunColor: '#ffb874', sunI: 3.4, shadow: 4096, shadowR: 70, shadowFar: 1400,
    hemi: ['#8fb2e6', '#6a6a48', 1.0], env: ['#7fa2d8', '#d8c4a8', '#4a4a3a'] });
  const scene = S.scene, cam = S.camera;
  scene.fog = new THREE.FogExp2('#b4bfcc', 0.00012);
  const FOG0 = 0.00012, FOGC = new THREE.Color('#b4bfcc'), FOGD = new THREE.Color('#1a2234');
  S.sun.shadow.bias = -0.0006; S.sun.shadow.normalBias = 0.06;
  const sky = nbBuildSky(scene, {});
  const W = nbBuildFairWorld(S), wheel = nbBuildWheel(S, W), co = nbBuildCoaster(S, W), carou = nbBuildCarousel(S, W), dg = nbBuildDodgems(S, W);
  const V = nbBuildValley(S, W), PP = nbBuildPeople(S, W);
  const L = nbLamps(scene, 26000), fx = nbPuffs(scene, 2500, { additive: true, soft: 1.4 });
  const BL = nbBounceLights(S); BL.reg(S.sun); BL.reg(S.hemi);
  // your hands and your phone (layer 2: the mirror never sees them)
  const hands = new ViewerHands(cam, { script: { right: [[-9, 'hidden']], left: [[-9, 'hidden']] }, poses: NB_HAND_POSES, blends: NB_HAND_BL, skin: '#c9967a', nail: '#e2bba8', sleeve: '#4a5a4a', cuff: '#3a483a', watch: false, sleeveLen: 0.36 });
  const phone = new THREE.Group(), PT = nbCanvasTex(270, 576, nbDrawPhone);
  phone.add(new THREE.Mesh(new THREE.RoundedBoxGeometry(0.072, 0.152, 0.0085, 3, 0.008), nbStd('#2a2d33', 0.35, 0.4)));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.1446), new THREE.MeshBasicMaterial({ map: PT.tex, color: new THREE.Color(1.15, 1.15, 1.15) })); screen.position.z = 0.0058; phone.add(screen);
  phone.position.set(0.034, 0.074, 0.024); phone.rotation.set(0, 0, -Math.PI / 2); hands.right.g.add(phone);
  hands.root.traverse((o) => o.layers.set(2)); cam.layers.enable(2);
  // the hot dog grill's coals (sources: hot enough to glow)
  const coals = []; { const r = new RNG(33); for (let i = 0; i < 40; i++) coals.push([W.grill[0] + r.range(-0.55, 0.55), W.grill[1] - 0.08, W.grill[2] + r.range(-0.2, 0.2), r.next()]); }

  const set = {
    scene, camera: cam, sky, W, wheel, co, carou, dg, V, PP, L, hands, phone,
    cuts() { return []; },
    frame(t, shot) {
      const m = shot.mode, s = nbStoryAt(t), b = NBP.bounce(s), kk = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      const px = (app.renderH || 1080) / 1080, dusk = s > 3000 ? 1 : 0, lstAdd = s / 3600 * 1.0027;
      this._s = s; this._b = b; this._shot = shot; this._t = t; this._dusk = dusk;
      // ------------------------------------------------------------------ the world, moving
      W.update(s); wheel.update(s); co.update(s); carou.update(s); dg.update(s); V.update(s); PP.update(s);
      PP.you.root.visible = m === 'title' || m === 'mirror' || m === 'mirror2';
      // ------------------------------------------------------------------ the camera
      const v = { p: [0, 5, 10], at: [0, 4, 0], fov: 50, drift: 0.008, near: 0.05, far: 30000, expo: 1, roll: 0 };
      nbFairCam(this, m, s, t, kk, shot, v, lstAdd);
      const dr = v.drift ? nbDrift(t, v.drift, 0.3, 11) : [0, 0, 0];
      if (v.shake) { const j = v.shake; dr[0] += j * Math.sin(t * 61) * Math.sin(t * 11.3); dr[1] += j * 0.7 * Math.sin(t * 53 + 1); dr[2] += j * Math.sin(t * 47 + 2) * Math.sin(t * 7.1); }
      if (cam.near !== v.near || cam.far !== v.far) { cam.near = v.near; cam.far = v.far; }
      nbCam(cam, [v.p[0] + dr[0], v.p[1] + dr[1], v.p[2] + dr[2]], [v.at[0] + dr[0], v.at[1] + dr[1], v.at[2] + dr[2]], v.fov, v.roll);
      this._expo = v.expo;
      // ------------------------------------------------------------------ the light that bounces (none, for ten seconds)
      const day = 1 - 0.985 * dusk;
      BL.apply(b, day);
      S.sun.target.position.set(MathX.clamp(v.at[0], cam.position.x - 120, cam.position.x + 120), 0, MathX.clamp(v.at[2], cam.position.z - 120, cam.position.z + 120));
      if (Math.abs(cam.position.x) > 200) S.sun.target.position.set(cam.position.x + (v.at[0] - cam.position.x) * 0.2, cam.position.y - 2, cam.position.z + (v.at[2] - cam.position.z) * 0.2);
      S.sun.position.copy(S.sun.target.position).addScaledVector(sky.sunDir, 600); S.sun.target.updateMatrixWorld();
      S.sun.castShadow = b > 0 && dusk < 0.5;
      scene.fog.density = FOG0 * (b > 0 ? 1 : 0); scene.fog.color.copy(FOGC).lerp(FOGD, dusk).multiplyScalar(b);
      W.mirror.material.uniforms.uDim.value = b;
      // ------------------------------------------------------------------ the sky
      const gain = NBP.pupilGain(s), dark = b === 0;
      sky.update(s, { bounce: b, dusk, lstAdd: dusk ? lstAdd : 0, lim: dark ? NBP.limMag(s) : dusk ? 2.6 : -9, px, gain: dark ? 1 : 1, domeK: 1, moonK: 1, glareK: v.glare ?? 1, satK: v.satK ?? 1 });
      // ------------------------------------------------------------------ the lights (sources: every frame from scratch)
      L.begin(cam, px);
      for (const q of W.static) { const c = NB_BULB[q[4]]; L.add(q[0], q[1], q[2], q[3], c[0], c[1], c[2]); }
      W.lamps(L, s); wheel.lamps(L, s); co.lamps(L, s); carou.lamps(L, s); dg.lamps(L, s); PP.lamps(L, s);
      const valley = NB_VALLEY_MODES.has(m) || v.valley;
      V.carLamps(L, s, valley ? null : { x: 430, z: cam.position.z, r: 9000 }); V.airportLamps(L, s); V.planeLamps(L, s, cam.position); V.townLampsAdd(L, s, dusk);
      L.end();
      // ------------------------------------------------------------------ flames, coals
      fx.begin(); PP.flames(fx, s);
      for (const c of coals) { const f = 0.55 + 0.45 * Math.sin(s * (2 + 3 * c[3]) + c[3] * 20); fx.add(c[0], c[1], c[2], 0.07, 0.6 * f, 1.0, 0.32, 0.08); }
      fx.end();
      // ------------------------------------------------------------------ your hands, your phone
      const hp = NB_HANDS_OF[m] || ['hidden', 'hidden'], eye = !!NB_HANDS_OF[m];
      hands.root.visible = eye; hands.o.script = { right: [[-9, hp[0]]], left: [[-9, hp[1]]] }; if (eye) hands.update(t);
      phone.visible = eye && hp[0].startsWith('phone');
      if (phone.visible) PT.update({ app: NB_PHONE_OF[m] || 'cam', s: Math.round(s * 30) / 30 });
    },
    prerender(app2) { if (this._b > 0 && NB_MIRROR_MODES.has(this._shot.mode)) W.mirror.render(app2.renderer, scene, cam); },
    labels(t) { return nbFairLabels(this, t); },
    grade(t, p, shot) {
      const s = this._s, b = this._b, dark = b === 0, gain = NBP.pupilGain(s);
      // your pupils: open in the dark (the picture brightens with them, partly); flooded at the return until they close
      // (at the return the light floods eyes that had adapted to the dark: dazzled for a few seconds, longer than the
      // pupils take to close: the photoreceptors are saturated; rough)
      const dz = s >= NBP.T ? 1 + 6 * Math.exp(-(s - NBP.T) / 0.8) : 1;
      const open = s >= 0 ? (dark ? Math.pow(gain, 0.45) : s >= NBP.T ? Math.pow(dz, 0.8) : gain) : 1;
      p.exposure = 1.0 * (this._expo || 1) * open * (this._dusk ? 1.15 : 1);
      p.blackLift = dark ? 0 : 0.004; p.saturation = dark ? 1.08 : 1.02; p.contrast = 1.07; p.warmth = dark ? 0 : 0.03;
      p.vignette = dark ? 0.4 : 0.5; p.bloom = dark ? 0.6 : 0.36; p.bloomThreshold = dark ? 0.55 : 0.92; p.grain = 0.028;
      if (!dark && s >= NBP.T && s < NBP.T + 5) { const d = Math.max(0, dz - 1); p.bloom = 0.36 + 0.6 * Math.min(1, d / 3); p.bloomThreshold = 0.92 - 0.35 * Math.min(1, d / 2); p.saturation = 1.02 - 0.35 * Math.min(1, d / 4); }
      void t; void shot;
    },
  };
  return set;
};
const NB_MIRROR_MODES = new Set(['title', 'mirror', 'mirror2']);
const NB_VALLEY_MODES = new Set(['moon', 'moongone', 'valley', 'driver', 'verge', 'planeHill', 'approach', 'tower', 'planeSide', 'netWide', 'saturn', 'moonback', 'crash', 'echo', 'echoSat']);

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERAS: one per mode. v = { p, at, fov, drift, near, far, expo, shake, roll, glare }.
// The world: x east, y up, z south. You stand at (0, 0, 0.6) on the main path facing the Fun House's mirrors (north,
// z −2.18); the stalls are south of you (counters at z ≈ 9.3), the Ferris wheel south-west (−31, 30), the carousel
// (−24, 8.5), the dodgems (−30, −20), the coaster south-east; the fence at the hill's eastern edge x 86; the motorway
// x 430 (70 m below), the town beyond, the runway z 1650 (x 900–2900, landing westward).
// ---------------------------------------------------------------------------------------------------------------------
function nbFairCam(set, m, s, t, k, shot, v, lstAdd) {
  const E = Ease.inOutSine, into = (a, b, u) => nbV(a, b, E(u)), Y = [NB_F.you[0], NB_F.eye, NB_F.you[2]];
  const look = (p, d, Ln = 100) => { const n = nbN3(d); return [p[0] + n[0] * Ln, p[1] + n[1] * Ln, p[2] + n[2] * Ln]; };
  const sky = set.sky, sun = sky.sunDir, moon = [sky.moonDir.x, sky.moonDir.y, sky.moonDir.z], sat = [sky.satDir.x, sky.satDir.y, sky.satDir.z];
  const V = set.V, ry = NB_F.runway.y, FX = (z, back = 1.6) => nbEdgeX(z) - back;   // (at the fence, on the hilltop's edge)
  // aim so that direction d sits at screen fraction (fx from the left, fy from the top) of the frame (0.5, 0.5 = the middle)
  const aimAt = (p, d, fx, fy, fov) => { const n = new THREE.Vector3(...nbN3(d)), r = new THREE.Vector3().crossVectors(n, new THREE.Vector3(0, 1, 0)).normalize(), u = new THREE.Vector3().crossVectors(r, n);
    const ty = Math.tan(MathX.deg(fov) / 2), tx = ty * 16 / 9; n.addScaledVector(r, -(fx - 0.5) * 2 * tx).addScaledVector(u, (fy - 0.5) * 2 * ty); return look(p, [n.x, n.y, n.z]); };
  switch (m) {
    // ---- 1: the mirror, 3:29:57 PM; then the fair, black
    case 'title': v.p = into([0.05, 1.62, 1.05], [0.02, 1.62, 0.75], k); v.at = [0, 1.55, -2.18]; v.fov = 50; v.drift = 0.004; break;
    case 'mirror': v.p = into([0.35, 1.66, 6.4], [0.15, 1.64, 5.2], k); v.at = [0, 2.3, -2.18]; v.fov = 56; v.drift = 0.004; break;
    case 'mirror2': v.p = into([2.6, 1.72, 2.2], [2.2, 1.7, 1.75], k); v.at = [-0.7, 1.5, -2.18]; v.fov = 44; v.drift = 0.004; break;
    case 'wide': v.p = into([7.6, 3.5, 1.2], [7.2, 3.6, 1.4], k); v.at = [-31, 8.5, 30]; v.fov = 56; v.drift = 0.01; break;
    case 'stalls': v.p = into([31, 1.55, 4.4], [26, 1.55, 4.6], k); v.at = [-6, 2.0, 9.0]; v.fov = 46; break;
    // ---- the Moon over the valley; the sky; the Sun
    case 'moon': { const p = [FX(-1.8), 1.66, -1.8]; v.p = p; v.fov = into([44], [38], k)[0]; v.at = aimAt(p, moon, 0.36, 0.3, v.fov); v.near = 0.3; v.drift = 0.004; break; }
    case 'moongone': case 'moonback': { const p = [FX(-1.8), 1.66, -1.8]; v.p = p; v.fov = m === 'moongone' ? into([6.2], [4.2], k)[0] : 5; v.at = m === 'moongone' ? aimAt(p, moon, 0.3, 0.45, v.fov) : look(p, moon); v.near = 1; v.drift = 0.0012; break; }
    case 'sky': v.p = into([-21.5, 1.5, 21.0], [-21.8, 1.5, 21.4], k); v.at = [-33, 31, 32]; v.fov = 64; v.near = 0.2; break;
    case 'sun': case 'sunWarn': v.p = m === 'sun' ? into([0.6, 1.62, 0.7], [0.2, 1.62, 0.6], k) : [-0.2, 1.62, 0.9]; v.at = look(v.p, [sun.x, sun.y + 0.005, sun.z]); v.fov = m === 'sun' ? 30 : 40; v.near = 0.2; v.drift = 0.003; break;
    case 'sources': v.p = into([3, 15.5, -8.0], [0.5, 16.2, -8.6], k); v.at = [-14, 0, 22]; v.fov = 62; v.near = 0.3; break;
    // ---- your hands; the impossible part; the crowd; something passes
    case 'hands': v.p = Y; v.at = [1.2, 2.6, 10.4]; v.fov = 54; v.near = 0.02; v.drift = 0.003; break;
    case 'real': v.p = into([-2.0, 1.75, 2.2], [-2.8, 1.75, 2.5], k); v.fov = 46; v.at = aimAt(v.p, [-24 - v.p[0], 2.6 - v.p[1], 8.5 - v.p[2]], 0.27, 0.5, v.fov); break;
    case 'crowd': v.p = into([7.4, 3.1, 0.6], [7.4, 3.15, 0.9], k); v.at = [-26, 1.3, 2.6]; v.fov = 44; break;
    case 'near': v.p = Y; v.at = [0.9, 1.72, 10]; v.fov = 54; v.near = 0.02; v.drift = 0.002; break;
    // ---- the motorway
    case 'valley': v.p = into([FX(-8), 1.72, -8], [FX(-5), 1.72, -5], k); v.at = [430, -69, -80]; v.fov = 34; v.near = 0.5; v.drift = 0.003; break;
    case 'driver': v.p = V.drvEye(s); v.at = V.drvAt(s, 80); v.at[1] -= 0.6; v.fov = 60; v.near = 0.02; v.drift = 0.002; v.shake = 0.002; break;
    case 'verge': v.p = [447.2, -68.6, -160]; v.at = [431, -69.4, 140]; v.fov = 36; v.near = 0.2; v.drift = 0.002; break;
    // ---- the airport and the plane
    case 'planeHill': v.p = [76, 1.7, 52]; v.at = [3300, -20, 1650]; v.fov = 16; v.near = 1; v.drift = 0.0015; break;
    case 'approach': { const P = V.plane; P.updateMatrixWorld(true); const E = V.deckEye, e = P.localToWorld(new THREE.Vector3(E[0], E[1], E[2])), a = P.localToWorld(new THREE.Vector3(E[0] - 100, E[1] - 100 * Math.tan(MathX.deg(7.5)), E[2] - 3));
      v.p = [e.x, e.y, e.z]; v.at = [a.x, a.y, a.z]; v.fov = 56; v.near = 0.02; v.shake = 0.0006; break; }
    case 'tower': { const C = V.cab; v.p = into(C.eye, [C.eye[0] - 0.3, C.eye[1], C.eye[2] - 0.15], k); v.at = C.at; v.fov = 58; v.near = 0.05; break; }
    case 'planeSide': { const pl = V.planePos(s); v.p = [pl[0] - 22, pl[1] - 5, pl[2] - 30]; v.at = [pl[0] + 3, pl[1] + 0.5, pl[2]]; v.fov = 44; v.near = 0.5; v.drift = 0.004; break; }
    // ---- the rides
    case 'coaster': { const f = set.co.cars[0].position; v.p = [44, 1.65, 12.5]; v.at = [f.x, f.y + 1, f.z]; v.fov = 50; v.near = 0.1; break; }
    case 'coasterPOV': { const C = set.co, d = C.frontD(s), f = C.at(d), a = C.at(d + 14); v.p = [f.p.x + f.up.x * 1.28 + f.t.x * 0.5, f.p.y + f.up.y * 1.28 + f.t.y * 0.5, f.p.z + f.up.z * 1.28 + f.t.z * 0.5]; v.at = [a.p.x, a.p.y + 0.4, a.p.z]; v.fov = 70; v.near = 0.05; v.shake = 0.004; break; }
    case 'dodgems': v.p = into([-23.4, 1.35, -12.5], [-24.6, 1.35, -12.6], k); v.at = [-33, 2.2, -21]; v.fov = 64; v.near = 0.05; break;
    case 'fire': v.p = into([3.6, 1.55, 2.6], [3.9, 1.55, 2.75], k); v.at = [8.1, 1.65, 5.0]; v.fov = 40; v.near = 0.05; break;
    case 'fireClose': v.p = into([6.4, 1.9, 3.7], [6.55, 1.9, 3.8], k); v.at = [8.2, 1.95, 5.15]; v.fov = 34; v.near = 0.05; break;
    // ---- the internet; the heat; Saturn; your pupils
    case 'phoneNet': case 'after': v.p = Y; v.at = look(Y, [0.3, -0.62, 1]); v.fov = 50; v.near = 0.02; v.drift = 0.002; break;
    case 'netWide': v.p = into([FX(26), 1.72, 26], [FX(22), 1.72, 22], k); v.at = [1000, -30, -180]; v.fov = 30; v.near = 0.5; v.drift = 0.002; break;
    case 'heat': v.p = into([-38, 1.4, 2.2], [-38.6, 1.4, 2.6], k); v.at = look(v.p, [sun.x, sun.y + 0.02, sun.z]); v.fov = 42; v.near = 0.2; break;
    case 'saturn': { const p = [FX(4), 1.66, 4]; v.p = p; v.at = look(p, [sat[0], sat[1] - 0.08, sat[2]]); v.fov = 24; v.near = 0.5; v.drift = 0.002; v.satK = 1.8; break; }
    case 'pupils': v.p = [16, 1.6, -2.5]; v.at = look(v.p, into([0.25, 1, 0.2], [0.05, 1, -0.2], k)); v.fov = 78; v.near = 0.3; v.drift = 0.002; break;
    // ---- the last seconds, the return, the reveal
    case 'count': v.p = Y; v.at = [-0.1, 1.85, 10]; v.fov = 54; v.near = 0.02; v.drift = 0.0015; break;
    case 'reveal': { const b = set.PP.bear.p; b.j.head.getWorldPosition(set._hv || (set._hv = new THREE.Vector3())); const h = set._hv;
      v.p = into(Y, [Y[0] + 0.02, Y[1] - 0.03, Y[2] - 0.32], Math.min(1, k * 3)); v.at = [h.x, h.y - 0.05, h.z]; v.fov = 54; v.near = 0.02; v.shake = 0.003 * (1 - k); break; }
    case 'crash': v.p = [FX(-46), 1.72, -46]; v.at = [430, -69.5, -170]; v.fov = 15; v.near = 1; v.drift = 0.0012; break;
    case 'afterWide': v.p = into([5, 9.5, -1], [3, 9.9, -2], k); v.at = [-25, 3, 25]; v.fov = 55; v.near = 0.2; break;
    // ---- 4:42 PM: the hilltop watches Saturn (the sky has turned 72 minutes' worth)
    case 'echo': { const d = set.sky.turned(set.sky.satDir, lstAdd); v.p = into([62, 1.65, -3], [64, 1.65, -2.4], k); v.fov = 50; v.at = aimAt(v.p, [d.x, d.y, d.z], 0.62, 0.3, v.fov); v.near = 0.3; v.satK = 1.6; break; }
    case 'echoSat': { const d = set.sky.turned(set.sky.satDir, lstAdd), p = [FX(4), 1.66, 4]; v.p = p; v.fov = into([9], [6.5], k)[0]; v.at = aimAt(p, [d.x, d.y, d.z], 0.5, 0.42, v.fov); v.near = 0.5; v.drift = 0.0012; v.satK = 2.4; break; }
  }
}

// labels pinned in the scene: [{ p, text, sub, a, side }]
function nbFairLabels(set, t) {
  const shot = nbShotAt(t), m = shot.mode, out = [], Wn = StoryHUD.win, s = set._s, sky = set.sky;
  const lab = (p, text, sub, a0 = 0.8, side) => out.push({ p, text, sub, a: Wn(t, shot.t0 + a0, shot.t1 - 0.25, 0.35, 0.3), side });
  const far = (d, D = 2000) => { const c = set.camera.position; return [c.x + d.x * D, c.y + d.y * D, c.z + d.z * D]; };
  if (m === 'mirror2') lab([-1.6, 2.2, -2.15], 'THE MIRROR', 'reflects nothing now', 1.0);
  if (m === 'moon') lab(far(sky.moonDir), 'THE MOON', 'its light: 1.28 s on the way', 1.2, 'r');
  if (m === 'sky') { const d = sky.dirOf(18.615, 38.78); lab(far(d), 'VEGA', 'a star: its own light', 2.0, 'r'); }
  if (m === 'sun') lab(far(sky.sunDir), 'THE SUN', 'white: nothing scatters its blue', 1.2, 'r');
  if (m === 'hands') { set.hands.left.g.getWorldPosition(set._lh || (set._lh = new THREE.Vector3())); const h = set._lh; lab([h.x, h.y + 0.08, h.z], 'YOUR HAND', 'only its outline, against the bulbs', 2.6); }
  if (m === 'driver') { const a = set.V.drvAt(s, 25); lab(a, 'HEADLIGHTS ON (AUTOMATIC)', 'the road sends nothing back', 1.2); }
  if (m === 'valley') lab([430, -66, -260], 'THE MOTORWAY', '70 m below you', 0.8);
  if (m === 'planeHill') { const p = set.V.plane.position; lab([p.x, p.y + 6, p.z], 'A PLANE, LANDING', 'its own lights', 1.0, 'r'); lab([2000, NB_F.runway.y + 30, NB_F.runway.z], 'THE RUNWAY', 'lit edges, nothing between', 1.6); }
  if (m === 'tower') lab([2350, NB_F.runway.y + 30, NB_F.runway.z - 330], 'RADAR', 'its pulses don’t come back', 1.0, 'r');
  if (m === 'coaster') { const f = set.co.cars[0].position; lab([f.x, f.y + 1.6, f.z], 'YOUR FRIEND', 'front row', 0.8); }
  if (m === 'dodgems') lab([-30, 4.6, -24], 'SPARKS', 'a spark makes its own light', 1.0);
  if (m === 'fireClose') { set.PP.juggler.p.j.ra.hand.getWorldPosition(set._jh || (set._jh = new THREE.Vector3())); const h = set._jh; lab([h.x, h.y, h.z], 'HIS HAND', 'holding the torch', 1.0); }
  if (m === 'heat') lab(far(sky.sunDir, 3000), 'THE SUN', 'heat that would have bounced away: absorbed', 1.0, 'r');
  if (m === 'saturn') lab(far(sky.satDir), 'SATURN', 'its light: 72 minutes old', 1.0, 'r');
  if (m === 'crash') lab([430, -66, -150], 'THE MOTORWAY', '3:30:12 PM', 0.6);
  if (m === 'echo') { const d = sky.turned(sky.satDir, set._s / 3600 * 1.0027); lab(far(d), 'SATURN', 'dark from 4:42:10 to 4:42:20', 1.0, 'r'); }
  return out;
}
