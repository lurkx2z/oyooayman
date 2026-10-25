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
  mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.035, 48), metal, 0, 0.0175, 0);
  mesh(new THREE.TorusGeometry(0.17, 0.006, 8, 64).rotateX(Math.PI / 2), brass, 0, 0.035, 0);
  // the pole
  mesh(new THREE.CylinderGeometry(0.014, 0.016, 1.78, 20), metal, 0, 0.035 + 0.89, 0);
  // the two clock units: a rounded dark case, a glass face (towards +z), a brass collar on the pole
  const units = {};
  for (const [key, y, label] of [['feet', 0.14, 'FEET'], ['head', 1.62, 'HEAD']]) {
    const u = new THREE.Group(); u.position.set(0, y, 0); g.add(u);
    const cs = new THREE.Mesh(tfRoundBox(0.34, 0.15, 0.06, 0.018, 0.008), black); cs.position.set(0, -0.075, 0.02); cs.castShadow = cs.receiveShadow = true; u.add(cs);
    const face = tfClockFace(label);
    face.tex.anisotropy = 8;
    const fm = new THREE.MeshBasicMaterial({ map: face.tex, toneMapped: false });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.116), fm); glass.position.set(0, 0, 0.0515); u.add(glass);
    // a thin glass sheen over it
    const sheen = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.116), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, metalness: 0, transparent: true, opacity: 0.08, envMapIntensity: 1.4 }));
    sheen.position.set(0, 0, 0.0525); u.add(sheen);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.05, 20), brass); col.position.set(0, 0, 0); u.add(col);
    units[key] = { u, face, glass };
  }
  // the lamp on top: a small brass head with a warm emissive disc, pointing down at your feet
  const lampHead = mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.07, 24), brass, 0, 1.84, 0.03);
  lampHead.rotation.x = 0.5;
  const bulbM = new THREE.MeshBasicMaterial({ color: '#fff1d6', toneMapped: false });
  const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.04, 24), bulbM); bulb.position.set(0, 1.81, 0.05); bulb.rotation.x = Math.PI / 2 + 0.5; g.add(bulb);
  const lamp = new THREE.SpotLight('#ffe7c4', 0, 6, 0.9, 0.6, 1.6);
  lamp.position.set(0, 1.8, 0.05); lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0005;
  g.add(lamp); g.add(lamp.target);
  return {
    g, units, lamp, bulb,
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
  const cloth = tfStd('#ffffff', 0.92, 0, { map: tfTex(tfClothCanvas('#47546a', 3)) });
  const sock = tfStd('#ffffff', 0.95, 0, { map: tfTex(tfSockCanvas(), { repeat: false }) });
  const hoodie = tfStd('#5b4b42', 0.95, 0);
  const add = (geo, m, par = g) => { const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = true; par.add(o); return o; };
  const legs = {};
  for (const s of [-1, 1]) {
    const L = new THREE.Group(); L.position.set(s * 0.115, 0, 0); g.add(L);
    // the trouser leg: hip → knee → hem, loose and a little rumpled at the ankle
    add(tfLoft([[0, 0.92, 0.0, 0.085, 0.075], [s * 0.005, 0.7, -0.01, 0.075, 0.07], [s * 0.01, 0.5, -0.02, 0.066, 0.062], [s * 0.01, 0.3, -0.005, 0.06, 0.058],
      [s * 0.008, 0.17, 0.01, 0.064, 0.062], [s * 0.008, 0.115, 0.015, 0.07, 0.066]], 16, 0), cloth, L);
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
  // the hem of your hoodie, just in view when you look straight down
  const hem = add(tfLoft([[0, 0.98, 0.04, 0.2, 0.13], [0, 1.08, 0.05, 0.21, 0.135], [0, 1.3, 0.06, 0.21, 0.14]], 22, 0), hoodie);
  hem.position.z = 0.02;
  return {
    g, legs, hem,
    // o: { toe (0…1 curl), toeL, toeR, show }
    pose(o = {}) {
      g.visible = o.show !== false;
      for (const s of [-1, 1]) { const k = s < 0 ? (o.toeL ?? o.toe ?? 0) : (o.toeR ?? o.toe ?? 0); legs[s].toes.rotation.x = -0.65 * k; }
    },
  };
}
