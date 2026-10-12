/* =====================================================================
   CAST — the people and their props (pure functions of t). Built on rig.js (GbCharacter, poses, faces, arm IK),
   castbase.js (gbPlant, gbCycle) and motion.js (footholds + leg IK).
   The PROTAGONIST ("Noor" in the plan; never named on screen): one consistent design for the whole film: a low bun,
   warm brown skin, a muted teal top (scenes 1–2: what she slept in), from scene 3 the ochre cardigan she finds on the
   chair, dark trousers, light trainers, later the white mobility cane. Her eyes are open and calm but never FIXATE:
   she turns her head to bring an ear toward a sound, she does not look at things.
   ===================================================================== */

Object.assign(GB_LOOKS, {
  noor: { skin: '#8a5a42', lip: '#4a2622', top: '#3f6f7a', topDark: '#33595f', pants: '#2b2b38', shoes: '#d9d2c6', sole: '#7a6a5c', hair: '#1f1513',
    hairStyle: 'bun', build: 0.93, head: 0.97 },
  noorC: { skin: '#8a5a42', lip: '#4a2622', top: '#c58a3c', topDark: '#a6722f', pants: '#2b2b38', shoes: '#d9d2c6', sole: '#7a6a5c', hair: '#1f1513',
    hairStyle: 'bun', build: 0.93, head: 0.97 },
});

(function () {
  const S = GB_POSES.sit, T = GB_POSES.stand, P = (o) => Object.assign({}, S, o), Q = (o) => Object.assign({}, T, o);
  Object.assign(GB_POSES, {
    // in bed, sitting up against the pillows (legs out under the duvet; hidden in first person)
    bedSit: P({ rootY: -0.36, pelX: -14, spX: -6, chX: -2, nkX: 6, hdX: 4, LHipX: -74, RHipX: -74, LKnX: 8, RKnX: 8, LAnX: -10, RAnX: -10,
      LShX: -18, LShAbd: 10, LElX: -40, RShX: -18, RShAbd: 10, RElX: -40, LFing: 0.4, RFing: 0.35 }),
    bedLean: P({ rootY: -0.36, pelX: -4, spX: 6, chX: 4, nkX: 4, hdX: 6, LHipX: -80, RHipX: -80, LKnX: 10, RKnX: 10, LAnX: -10, RAnX: -10,
      LShX: -14, LShAbd: 12, LElX: -30, RShX: -30, RShAbd: 12, RElX: -30, LFing: 0.4, RFing: 0.3 }),
    // sitting on the bed's edge, feet on the floor, one hand out into the air
    edgeSit: P({ spX: 6, chX: 2, nkX: -2, hdX: 2, LShX: -24, LShAbd: 10, LElX: -40, RShX: -24, RShAbd: 8, RElX: -36 }),
    // kneeling, reaching under furniture
    kneelReach: Q({ rootY: -0.47, pelX: 30, spX: 26, chX: 20, nkX: -14, hdX: -6, LHipX: -66, RHipX: -60, LKnX: 112, RKnX: 116, LAnX: 46, RAnX: 46,
      LShX: -40, LShAbd: 14, LElX: -20, RShX: -80, RShAbd: 10, RElX: -6, LFing: 0.2, RFing: 0.15 }),
    // standing, listening: weight on one leg, head turned a little, hands soft
    standListen: Q({ pelX: 2, spX: 2, chX: 0, nkX: 2, hdX: 4, hdZ: 6, LShAbd: 8, RShAbd: 8, LElX: -16, RElX: -14, LFing: 0.4, RFing: 0.4 }),
    // walking slowly with the right hand trailing along a wall
    trail: Q({ pelX: 4, spX: 6, chX: 2, nkX: -2, hdX: 2, hdY: -8, LShAbd: 10, LElX: -24, RShX: -30, RShAbd: 34, RElX: -20, RFing: 0.15, LFing: 0.45 }),
  });
  Object.assign(GB_FACES, {
    // eyes open, unfocused, a little lowered; the attention is in the brows and the stillness
    listen: { lid: 0.3, lidAng: 0.1, low: 0.08, eyeS: 1, browY: 0.2, browAng: 0.3, smile: 0, open: 0.02, width: 0.9, teeth: 0 },
    alarmed: { lid: 0.05, lidAng: 0.15, low: 0, eyeS: 1.15, browY: 0.75, browAng: 0.6, smile: -0.35, open: 0.25, width: 0.75, teeth: 0 },
    focus: { lid: 0.38, lidAng: -0.1, low: 0.18, eyeS: 0.98, browY: -0.1, browAng: 0.15, smile: -0.1, open: 0.0, width: 0.95, teeth: 0 },
    calm: { lid: 0.3, lidAng: 0.05, low: 0.22, eyeS: 1, browY: 0.05, browAng: 0.1, smile: 0.18, open: 0, width: 1, teeth: 0 },
  });
})();

class BeCast {
  constructor(app) {
    this.app = app;
    this.tmp = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  }

  // one hero per set (each set is its own THREE.Scene); the look changes with the cardigan from scene 3
  heroIn(scene, look = 'noor') {
    const H = new GbCharacter(scene, look, { name: 'noor-' + scene.name });
    // the face takes no cast shadows (the skull's overhang would draw a hard line across the jaw in close-ups)
    H.J.hc.traverse((o) => { if (o.isMesh) o.receiveShadow = false; });
    beAcousticScene(H.root, 'hero');
    return H;
  }

  // ------------------------------------------------------------------------------------------ the phone (scene 1)
  buildPhone(scene) {
    const g = new THREE.Group(); g.name = 'phone'; scene.add(g);
    gbAdd(g, gbRoundBox(0.074, 0.009, 0.152, 0.008, 2), gbMat('#22252c', { rough: 0.3, metal: 0.5, name: 'bePhoneMetal', env: 1.0 }), 0, 0, 0);
    this.phoneScreenM = new THREE.MeshStandardMaterial({ color: '#0d1118', emissive: '#ffffff', emissiveIntensity: 0, roughness: 0.15, name: 'bePhoneScreenGlass' });
    this.phoneTex = beCanvasTex(128, 256, (x, w, h) => {
      const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a3a5c'); gr.addColorStop(1, '#c46a4a'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(255,255,255,0.95)'; x.font = '600 40px Inter, sans-serif'; x.textAlign = 'center'; x.fillText('7:12', w / 2, 92);
      x.font = '500 13px Inter, sans-serif'; x.fillText('ALARM', w / 2, 118);
      x.beginPath(); x.arc(w / 2, 200, 22, 0, 7); x.fillStyle = 'rgba(255,255,255,0.25)'; x.fill();
    });
    this.phoneScreenM.emissiveMap = this.phoneTex;
    gbAdd(g, new THREE.PlaneGeometry(0.066, 0.142), this.phoneScreenM, 0, 0.0047, 0, { rx: -Math.PI / 2, cast: false });
    this.phone = g;
    return g;
  }

  // the phone's path: buzzing on the table → knocked over the edge → floor → bounce → skids under the dresser
  phoneAt(t) {
    const A = BE_APT, p0 = A.phone0, P = new THREE.Vector3(), R = new THREE.Euler(0, 0.35, 0);
    const edge = new THREE.Vector3(-1.32, A.nightH, -1.56);           // where it leaves the table (front-left corner)
    const land = new THREE.Vector3(-1.42, 0.0045, -1.36), rest = new THREE.Vector3(-2.04, 0.0045, -0.58);
    if (t < BE.knock) {
      P.copy(p0);
      // the buzz: tiny jitter while it rings (it rings from frame 1 until it is under the dresser)
      const bz = this.buzz(t);
      P.x += 0.0012 * bz * Math.sin(t * 190); P.z += 0.0009 * bz * Math.cos(t * 170);
      R.y = 0.35 + 0.01 * bz * Math.sin(t * 23);
      return { P, R };
    }
    if (t < BE.drop) {         // pushed along the table toward the corner, tipping
      const k = Ease.inQuad(MathX.ramp(t, BE.knock, BE.drop));
      P.lerpVectors(p0, edge, k); R.set(0, 0.35 + 0.3 * k, -0.2 * k);
      return { P, R };
    }
    if (t < BE.impact) {       // free fall (it keeps a little horizontal speed) and turns over
      const u = (t - BE.drop) / (BE.impact - BE.drop);
      P.lerpVectors(edge, land, u); P.y = A.nightH - 9.81 * 0.5 * (t - BE.drop) * (t - BE.drop); P.y = Math.max(P.y, 0.0045);
      R.set(-1.6 * u, 0.65 + 0.8 * u, -0.2 - 2.4 * u);
      return { P, R };
    }
    if (t < BE.slide[0]) {     // the bounce (small) and the first skid
      const u = (t - BE.impact) / (BE.slide[0] - BE.impact);
      P.lerpVectors(land, rest, 0.14 * u); P.y = 0.0045 + 0.035 * Math.sin(Math.PI * MathX.clamp((t - BE.impact) / 0.16, 0, 1));
      R.set(-Math.PI * (1 - 0.05 * Math.sin(Math.PI * u)), 1.45 + 0.4 * u, 0.02 * Math.sin(u * 20));
      return { P, R };
    }
    // skids with constant friction to rest, spinning a little
    const d = MathX.clamp((t - BE.slide[0]) / (BE.slide[1] - BE.slide[0]), 0, 1), k = 0.14 + 0.86 * (1 - (1 - d) * (1 - d));
    P.lerpVectors(land, rest, k);
    R.set(-Math.PI, 1.85 + 1.2 * (1 - (1 - d) * (1 - d)), 0);
    return { P, R };
  }
  // the alarm's vibration envelope (pattern: buzz-buzz… pause), 0…1, from frame 1 until the phone is under the dresser
  buzz(t) {
    if (t > BE.slide[1] + 6) return 0;
    const ph = t % 1.4;
    return (ph < 0.45 ? 1 : ph > 0.6 && ph < 1.05 ? 1 : 0);
  }
  buzzTimes(a, b) { const out = []; for (let k = Math.floor(a / 1.4); k * 1.4 < b; k++) { out.push(k * 1.4, k * 1.4 + 0.6); } return out.filter((x) => x >= a && x < b); }

  // ------------------------------------------------------------------------------------------ scene 1: first person in bed
  // returns the eye position and the view direction (yaw: 0 = +Z, + toward +X/left; pitch: + up)
  bedView(t) {
    // yaw keys (radians): forward = 0; her right (the phone) ≈ −1.0; the window (her left) ≈ +1.0; the door ≈ −0.5
    const yaw = gbTrack('bedYaw', [[0, -0.55], [BE.wake[1], -0.82], [BE.reach[1], -0.95], [BE.dark1, -0.9], [BE.handUp, -0.55], [BE.hands, -0.45],
      [BE.room + 0.4, -0.88], [BE.alarm + 0.9, -1.05], [BE.cars + 0.2, -0.95], [BE.cars + 1.4, 0.55], [BE.steps + 0.5, 0.2], [BE.steps + 1.6, -0.35],
      [BE.brain + 0.6, -0.8], [BE.touch, -1.0], [BE.knock, -1.08], [BE.impact + 0.25, -1.28], [BE.slide[1] + 0.4, -1.55], [BE.s2, -1.62]]).value(t);
    const pitch = gbTrack('bedPitch', [[0, 0.22], [BE.wake[1], -0.05], [BE.reach[1], -0.32], [BE.dark1, -0.26], [BE.handUp, -0.05], [BE.hands, 0.02],
      [BE.room + 0.4, -0.22], [BE.alarm + 0.9, -0.3], [BE.cars + 1.4, -0.02], [BE.steps + 1.6, -0.06], [BE.brain + 0.6, -0.3], [BE.touch, -0.42],
      [BE.knock, -0.45], [BE.impact + 0.25, -0.55], [BE.slide[1] + 0.4, -0.62], [BE.s2, -0.6]]).value(t);
    // she sits up from the pillows (the eye rises and comes forward); later she leans toward the edge
    const up = Ease.inOutSine(MathX.ramp(t, BE.wake[0], BE.wake[1])), lean = MathX.smooth(t, BE.brain, BE.touch) + 0.6 * MathX.smooth(t, BE.impact, BE.back1 + 1);
    const eye = new THREE.Vector3(-0.36 - 0.12 * lean, 0.92 + 0.22 * up + 0.04 * lean, -1.72 + 0.32 * up + 0.08 * lean);
    // breathing + a startle at the impact + small involuntary head moves in the dark
    eye.y += 0.006 * Math.sin(t * 1.6) + gbSpring(t, BE.impact, 0.025, 3, 5);
    const sway = 0.012 * noise1(t * 0.6, 3) * MathX.smooth(t, BE.dark0, BE.dark1);
    return { eye, yaw: yaw + sway + gbSpring(t, BE.impact, 0.06, 2.4, 4), pitch: pitch + 0.008 * noise1(t * 0.5, 9) };
  }

  // pose the bed hero for the first-person shots (head hidden): the right arm reaches, searches, knocks
  heroBed(H, t, V, fp = true) {
    H.root.visible = true;
    H.place(-0.36, 0.0, -1.95, 0);
    const P = gbEvalTrack([[0, 'bedSit', 0.01], [BE.brain, 'bedLean', 1.6]], GB_POSES, t);
    P.rootY = -0.36 + 0.03 * MathX.smooth(t, BE.wake[0], BE.wake[1]);
    P.rootZ = 0.2 + 0.26 * MathX.smooth(t, BE.wake[0], BE.wake[1]);
    // the head follows the view (it is hidden, but its shadow and neck must agree)
    P.hdY = (V.yaw * 180 / Math.PI) * 0.6; P.nkY = (V.yaw * 180 / Math.PI) * 0.35; P.hdX = -V.pitch * 40;
    H.applyPose(P);
    H.J.hd.visible = !fp;
    for (const s of ['L', 'R']) H.J[s + 'Hip'].visible = false;          // legs are under the duvet
    // the right hand: toward the phone (it stops short as the light goes), up in front of the face, out into the dark,
    // then along the table top to the phone; the knock
    const ph = BE_APT.phone0, fwd = new THREE.Vector3(Math.sin(V.yaw), 0, Math.cos(V.yaw));
    const right = new THREE.Vector3(-Math.cos(V.yaw), 0, Math.sin(V.yaw));
    const face = V.eye.clone().addScaledVector(fwd, 0.3).add(new THREE.Vector3(0, -0.04, 0)).addScaledVector(right, 0.04);
    const nearPhone = ph.clone().add(new THREE.Vector3(0.16, 0.07, 0.05));
    const air = V.eye.clone().addScaledVector(fwd, 0.42).add(new THREE.Vector3(0, -0.22, 0)).addScaledVector(right, 0.12);
    const edgeL = new THREE.Vector3(-0.98, BE_APT.nightH + 0.05, -1.62), onTop = ph.clone().add(new THREE.Vector3(0.06, 0.05, 0.08));
    const keys = [
      [0, V.eye.clone().add(new THREE.Vector3(-0.15, -0.45, 0.25))],
      [BE.reach[0], V.eye.clone().add(new THREE.Vector3(-0.2, -0.38, 0.3))],
      [BE.reach[1], nearPhone],
      [BE.dark1, nearPhone.clone().add(new THREE.Vector3(0.05, 0.03, 0.03))],
      [BE.handUp + 0.9, face],
      [BE.hands + 0.6, face.clone().add(new THREE.Vector3(0, -0.04, 0))],
      [BE.room + 0.3, air],
      [BE.brain + 0.4, air.clone().add(new THREE.Vector3(-0.12, -0.05, -0.04))],
      [BE.touch - 0.1, edgeL],
      [BE.knock - 0.25, onTop.clone().add(new THREE.Vector3(0.05, 0.02, 0))],
      [BE.knock + 0.08, onTop.clone().add(new THREE.Vector3(-0.07, 0.0, 0.04))],
      [BE.impact + 0.4, onTop.clone().add(new THREE.Vector3(-0.02, 0.07, 0.05))],
      [BE.back1 + 1.2, edgeL.clone().add(new THREE.Vector3(-0.1, -0.02, 0.2))],
    ];
    let wt = keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t < keys[i][0]) { const k = Ease.inOutSine(MathX.ramp(t, keys[i - 1][0], keys[i][0])); wt = keys[i - 1][1].clone().lerp(keys[i][1], k); break; }
      wt = keys[i][1];
    }
    // tiny searching motions of the fingers' path in the dark
    wt.x += 0.012 * noise1(t * 1.3, 5) * MathX.smooth(t, BE.room, BE.knock); wt.y += 0.008 * noise1(t * 1.1, 6);
    H.solveArm('R', wt, new THREE.Vector3(-0.6, -1, 0.2).normalize(), 1);
    // the hand: palm down over the table; palm toward the face when she lifts it
    const toFace = MathX.window(t, BE.handUp + 0.3, BE.room + 0.1, 0.6, 0.6);
    const Fd = new THREE.Vector3(-0.55, -0.1, 0.4).normalize().lerp(new THREE.Vector3(0, 1, 0), toFace).normalize();
    const Nd = new THREE.Vector3(0, -1, 0).lerp(fwd.clone().negate(), toFace).normalize();
    H.orientHand('R', Fd, Nd, 1);
    const spread = toFace * 0.9;
    H.handR.fingers.forEach(([f1, f2], i) => { const k = 0.25 * (1 - spread) + 0.04 * Math.sin(t * 2 + i); f1.rotation.z = -H.handR.pn * k * 1.3; f2.rotation.z = -H.handR.pn * k * 1.2; f1.rotation.x = (i - 1.5) * 0.08 * spread; });
    // the left hand rests on the duvet
    H.solveArm('L', new THREE.Vector3(-0.1, 0.66, -1.4), new THREE.Vector3(0.5, -1, 0).normalize(), 0.8);
  }
}
