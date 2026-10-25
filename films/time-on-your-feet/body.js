/* =====================================================================
   BODY — what travels with you to every place in the film:
     the clock pole   a slim weighted stand, 1.8 m, with two clocks: one at your feet (12 cm up) and one at your head
                      (1.62 m), each a dark glass face with amber digits, and a small lamp on top (on the black hole's
                      platform it is the only light on your feet). tfBuildPole(parent) → { g, set(state) }
     you              first person: pyjama trousers and striped socks (looking down you see your own feet; on the
                      platform you wiggle your toes). tfBuildBody(parent) → { g, pose(o) }
   The clock faces show the time to many decimal places (formatted by hud.js: tfFmtClock), the same strings as the HUD.
   ===================================================================== */

// ---- the clock face: a canvas redrawn only when its text changes
function tfClockFace(label) {
  return tfCanvasTex(1024, 384, (g, w, h, s) => {
    g.clearRect(0, 0, w, h);
    // the glass: near black, a faint vertical sheen
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0d1013'); bg.addColorStop(0.5, '#07090b'); bg.addColorStop(1, '#0b0d10');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const on = s.on ?? 1, col = s.col || [255, 196, 120];
    const amber = (a) => `rgba(${col[0]},${col[1]},${col[2]},${a * on})`;
    // the label
    g.font = '600 46px Inter, Arial, sans-serif'; g.fillStyle = `rgba(232,226,214,${0.62 * on + 0.1})`; g.textBaseline = 'alphabetic';
    g.fillText(label, 44, 78);
    g.fillStyle = amber(0.9); g.beginPath(); g.arc(w - 60, 62, 11, 0, 7); g.fill();
    // the big digits (HH:MM:SS), then the fraction in groups of three on the next line
    g.shadowColor = amber(0.7); g.shadowBlur = 18;
    g.font = '500 150px "JetBrains Mono", monospace'; g.fillStyle = amber(1);
    g.fillText(s.big || '', 40, 232);
    g.font = '500 62px "JetBrains Mono", monospace'; g.fillStyle = amber(0.92);
    g.fillText(s.small || '', 44, 330);
    g.shadowBlur = 0;
    // a hairline frame
    g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 4; g.strokeRect(6, 6, w - 12, h - 12);
  });
}

function tfBuildPole(parent) {
  const g = new THREE.Group(); parent.add(g);
  const metal = tfStd('#26282b', 0.38, 0.85), brass = tfStd('#a8875a', 0.32, 0.9), black = tfStd('#121315', 0.5, 0.3);
  const mesh = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; g.add(o); return o; };
  // the weighted base: a low disc with a bevel, a brass ring
  const base = [mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.035, 48), metal, 0, 0.0175, 0),
    mesh(new THREE.TorusGeometry(0.17, 0.006, 8, 64).rotateX(Math.PI / 2), brass, 0, 0.035, 0)];   // (home.js lifts the pole out of it)
  // the pole
  mesh(new THREE.CylinderGeometry(0.014, 0.016, 1.78, 20), metal, 0, 0.035 + 0.89, 0);
  // the two clock units: a rounded dark case, a glass face (towards +z), a brass collar on the pole. The feet unit is
  // tipped back so its face looks up at your eyes (a desk clock on the floor)
  const units = {};
  for (const [key, y, label, tilt] of [['feet', 0.15, 'FEET', -1.0], ['head', 1.62, 'HEAD', 0]]) {
    const u = new THREE.Group(); u.position.set(0, y, 0); g.add(u);
    const tg = new THREE.Group(); tg.position.set(0, 0, 0.03); tg.rotation.x = tilt; u.add(tg);
    const cs = new THREE.Mesh(tfRoundBox(0.34, 0.15, 0.06, 0.018, 0.008), black); cs.position.set(0, -0.075, -0.01); cs.castShadow = cs.receiveShadow = true; tg.add(cs);
    const face = tfClockFace(label);
    face.tex.anisotropy = 8;
    const fm = new THREE.MeshBasicMaterial({ map: face.tex });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.116), fm); glass.position.set(0, 0, 0.0305); tg.add(glass);   // (the case's bevel reaches z 0.028)
    // the arm from the collar to the case
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.05), metal); arm.position.set(0, 0, 0.015); u.add(arm);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 20), brass); u.add(col);
    units[key] = { u, tg, face, glass, tilt };
  }
  // the lamp: on a short arm out from the top, towards you, pointing down at your feet (clear of the head's clock)
  const armL = mesh(new THREE.BoxGeometry(0.018, 0.018, 0.26), metal, 0, 1.805, 0.12);
  const lampHead = mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.06, 24), brass, 0, 1.79, 0.25);
  const bulbM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 2.2, 1.9) });
  const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.036, 24).rotateX(Math.PI / 2), bulbM); bulb.position.set(0, 1.759, 0.25); g.add(bulb);
  const lamp = new THREE.SpotLight('#ffe7c4', 0, 7, 0.62, 0.55, 2);
  lamp.position.set(0, 1.75, 0.25); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0005; lamp.shadow.camera.near = 0.05;
  g.add(lamp); g.add(lamp.target);
  return {
    g, units, lamp, bulb, base,
    // state: { head: {big, small, on}, feet: {big, small, on}, lamp: intensity, lampAt: [x,y,z] (pole space) }
    set(s) {
      for (const k of ['head', 'feet']) if (s[k]) units[k].face.update(s[k]);
      lamp.intensity = s.lamp || 0; bulb.visible = (s.lamp || 0) > 0;
      if (s.lampAt) lamp.target.position.set(...s.lampAt);
    },
  };
}

// ---- you: trousers and socks, standing; origin on the floor between your feet, +z behind you (you face −z)
function tfSockCanvas() {
  return tfCanvas(256, 512, (g, w, h) => {
    g.fillStyle = '#2b2e33'; g.fillRect(0, 0, w, h);
    // stripes round the leg (v along the sock): two amber bands near the cuff, a ribbed texture
    for (const [y0, y1, c] of [[30, 58, '#d9a441'], [74, 92, '#c9c2b4'], [108, 124, '#d9a441']]) { g.fillStyle = c; g.fillRect(0, y0, w, y1 - y0); }
    for (let x = 0; x < w; x += 6) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x, 0, 2, 150); }
    // the toe and heel a little darker
    const tg = g.createLinearGradient(0, h - 120, 0, h); tg.addColorStop(0, 'rgba(0,0,0,0)'); tg.addColorStop(1, 'rgba(0,0,0,0.25)'); g.fillStyle = tg; g.fillRect(0, h - 120, w, 120);
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(255,255,255,${hash1(i * 13.7) * 0.05})`; g.fillRect(hash1(i * 3.1) * w, hash1(i * 5.3) * h, 2, 2); }
  });
}
function tfClothCanvas(base, seed) {
  return tfCanvas(512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    // a soft check (pyjama flannel) and weave noise
    for (let x = 0; x < w; x += 64) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x, 0, 10, h); }
    for (let y = 0; y < h; y += 64) { g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(0, y, w, 10); }
    for (let i = 0; i < 9000; i++) { const v = hash1(i * 1.37 + seed); g.fillStyle = `rgba(${v > 0.5 ? 255 : 0},${v > 0.5 ? 255 : 0},${v > 0.5 ? 255 : 0},0.04)`; g.fillRect(hash1(i * 2.11 + seed) * w, hash1(i * 3.7 + seed) * h, 3, 1); }
  });
}
function tfBuildBody(parent) {
  const g = new THREE.Group(); parent.add(g);
  const cloth = tfStd('#ffffff', 0.92, 0, { map: tfTex(tfClothCanvas('#5f6e8c', 3)) });
  const sock = tfStd('#ffffff', 0.95, 0, { map: tfTex(tfSockCanvas(), { repeat: false }) });
  const hoodie = tfStd('#ffffff', 0.95, 0, { map: tfTex(tfClothCanvas('#6b7280', 9)) });   // (grey marl)
  const add = (geo, m, par = g) => { const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = true; par.add(o); return o; };
  const legs = {};
  for (const s of [-1, 1]) {
    const L = new THREE.Group(); L.position.set(s * 0.115, 0, 0); g.add(L);
    // the trouser leg: hip → knee → hem, loose and a little rumpled at the ankle
    add(tfLoft([[0, 0.92, 0.11, 0.085, 0.075], [s * 0.005, 0.72, 0.04, 0.077, 0.071], [s * 0.01, 0.5, -0.025, 0.066, 0.062], [s * 0.01, 0.3, -0.005, 0.06, 0.058],
      [s * 0.008, 0.17, 0.01, 0.064, 0.062], [s * 0.008, 0.115, 0.015, 0.07, 0.066]], 16, 0.6), cloth, L);
    // the sock: ankle, then the foot forward (−z), the toes a separate part that can curl
    const foot = new THREE.Group(); foot.position.set(s * 0.008, 0, 0.0); L.add(foot);
    add(tfLoft([[0, 0.15, 0.015, 0.043, 0.043], [0, 0.085, 0.02, 0.045, 0.047], [0, 0.05, 0.03, 0.044, 0.05], [0, 0.04, 0.0, 0.046, 0.04],
      [0, 0.036, -0.06, 0.048, 0.034], [0, 0.034, -0.11, 0.047, 0.031]], 18, 0.5), sock, foot);
    const toes = new THREE.Group(); toes.position.set(0, 0.03, -0.12); foot.add(toes);
    add(tfLoft([[0, 0.004, 0.012, 0.047, 0.03], [0, 0.0, -0.03, 0.045, 0.026], [0, -0.004, -0.06, 0.037, 0.02]], 18, 0.8), sock, toes);
    // the heel cushion
    add(new THREE.SphereGeometry(0.042, 16, 12).scale(1, 0.75, 1.0).translate(0, 0.045, 0.035), sock, foot);
    foot.rotation.y = -s * 0.12;
    legs[s] = { L, foot, toes };
  }
  // your hoodie, hips to chest: its front sits just behind the line from your eyes to your toes, so looking down you
  // see its edge at the bottom of the frame, your legs from the knees and your feet (casts no shadow on them)
  const hem = add(tfLoft([[0, 0.8, 0.13, 0.19, 0.125], [0, 0.95, 0.13, 0.2, 0.13], [0, 1.12, 0.14, 0.195, 0.135], [0, 1.3, 0.15, 0.18, 0.12]], 28, 0.9), hoodie);
  hem.castShadow = false;
  return {
    g, legs, hem,
    // o: { toe (0…1 curl), toeL, toeR, show }
    pose(o = {}) {
      g.visible = o.show !== false;
      for (const s of [-1, 1]) { const k = s < 0 ? (o.toeL ?? o.toe ?? 0) : (o.toeR ?? o.toe ?? 0); legs[s].toes.rotation.x = -0.65 * k; }
    },
  };
}

// ---- first person: the camera at eye position `eye`, looking along yaw (0 = −z, + = left) and pitch (+ = up)
function tfLook(cam, eye, yaw, pitch, fov, roll = 0) {
  const d = tfDir(yaw, pitch);
  tfCam(cam, eye, [eye[0] + d[0], eye[1] + d[1], eye[2] + d[2]], fov, roll);
}
// yaw and pitch from eye to a point
function tfAim(eye, p) { const dx = p[0] - eye[0], dy = p[1] - eye[1], dz = p[2] - eye[2]; return [Math.atan2(-dx, -dz), Math.atan2(dy, Math.hypot(dx, dz))]; }
// blend yaw/pitch pairs (k 0…1)
const tfAimLerp = (a, b, k) => [MathX.angleLerp(a[0], b[0], k), tfLerp(a[1], b[1], k)];

// ---- you and your pole together, as they stand at every place: you at the origin facing −z, the pole in front and to
// your right, its faces turned to your eyes. rig.update(clock, o) sets the faces from a clock (tfClock) and the toes.
const TF_EYE = [0, 1.6, -0.06];
function tfRig(parent, o = {}) {
  const g = new THREE.Group(); parent.add(g);
  const pole = tfBuildPole(g), body = tfBuildBody(g);
  const P0 = o.pole || [0.4, 0, -0.42];
  pole.g.position.set(P0[0], P0[1], P0[2]);
  pole.g.rotation.y = Math.atan2(TF_EYE[0] - P0[0], TF_EYE[2] - P0[2]);
  { const th = pole.g.rotation.y, wx = -P0[0], wz = -P0[2]; pole.lamp.target.position.set(wx * Math.cos(th) - wz * Math.sin(th), 0.05, wx * Math.sin(th) + wz * Math.cos(th)); }   // (pole space: down at your feet)
  const n = [Math.sin(pole.g.rotation.y), 0, Math.cos(pole.g.rotation.y)];
  // the faces' centres in rig space (for the camera and the labels)
  const head = [P0[0] + n[0] * 0.0605, 1.62, P0[2] + n[2] * 0.0605], fz = 0.03 + 0.0305 * Math.cos(-1.0), fy = 0.15 + 0.0305 * Math.sin(1.0);
  const feet = [P0[0] + n[0] * fz, fy, P0[2] + n[2] * fz];
  return {
    g, pole, body, head, feet, n,
    // F: tfFmtClock strings; o: { on, lamp, toe, toeL, toeR, show }
    update(F, s = {}) {
      const on = s.on ?? 1;
      pole.set({ head: { big: F.head.big, small: F.head.small, on, col: s.headCol }, feet: { big: F.feet.big, small: F.feet.small, on, col: s.feetCol }, lamp: s.lamp || 0 });
      body.pose({ toe: s.toe, toeL: s.toeL, toeR: s.toeR, show: s.show });
    },
  };
}
