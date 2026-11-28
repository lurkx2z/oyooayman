/* =====================================================================
   HELI — your tour helicopter (made up: a light five-seat turbine helicopter, white with a teal stripe), outside and
   in: the cabin and its glass nose, the tail and its rotor, the skids, the main rotor (it turns up over two and a half
   minutes from when the pilot starts it, and blurs into a disc), the seats, the panel (the fuel page), the headsets.
   Local frame: the nose is +z, up +y, the ground under the mast at the origin; the pilot flies from the right seat
   (x −0.45), you sit on the left (x +0.45).
   eqHeliAt(s) → { p, yaw, pitch, roll }: on the pad, then its path over the bay (story seconds).
   ===================================================================== */

const EQ_HT = {
  start: eqW('pilot') - EQ.tick0 + 3.5,                      // the pilot starts the engine
  lift: eqW('lift') - EQ.tick0 - 0.1,                         // "And you're off the ground."
};
// the rotor: revolutions per second at s (idle to flight over 2.5 minutes), and its angle (integrated, a table)
const eqRotorRev = (s) => 6.4 * Math.pow(MathX.smooth(s, EQ_HT.start, EQ_HT.lift - 10), 1.35);
const EQ_ROTOR = (() => { const s0 = EQ_HT.start, d = 0.05, n = Math.ceil((620 - s0) / d), T = new Float64Array(n + 1); for (let i = 1; i <= n; i++) T[i] = T[i - 1] + eqRotorRev(s0 + (i - 0.5) * d) * d; return { s0, d, T }; })();
function eqRotorAngle(s) { const R = EQ_ROTOR, x = (s - R.s0) / R.d; if (x <= 0) return 0; const i = Math.min(R.T.length - 2, Math.floor(x)), f = x - i; return 2 * Math.PI * (R.T[i] + (R.T[i + 1] - R.T[i]) * f); }

// the path after lift-off (world x, y, z) and where it looks (the city, once it has climbed out over the bay)
const EQ_HPATH = [
  [EQ_HT.lift, 357, 2.6, 207], [EQ_HT.lift + 1.6, 357, 7, 207], [EQ_HT.lift + 4.5, 372, 18, 188], [EQ_HT.lift + 9.5, 430, 48, 146],
  [285, 560, 118, 40], [300, 720, 228, -250], [320, 560, 330, -880], [345, 250, 400, -1650], [372, -200, 430, -2250],
  [405, -700, 460, -2550], [445, -1150, 500, -2650], [490, -950, 560, -2500], [540, -650, 600, -2300], [600, -520, 620, -2230],
];
const EQ_LOOKAT = [-900, 60, 700];                           // (downtown, from out over the bay)
function eqHeliAt(s, padTop) {
  if (s < EQ_HT.lift) return { p: padTop, yaw: eqYawWF(-0.25, -1), pitch: 0, roll: 0 };
  const p = eqSpline(EQ_HPATH, s), q = eqSpline(EQ_HPATH, s + 0.5), q2 = eqSpline(EQ_HPATH, s + 1.0);
  const vx = q[0] - p[0], vz = q[2] - p[2], sp = Math.hypot(vx, vz) * 2;
  const along = Math.atan2(vx, vz), look = Math.atan2(EQ_LOOKAT[0] - p[0], EQ_LOOKAT[2] - p[2]);
  // turn from flying along the path to facing the city (from 330 s)
  const k = MathX.smooth(s, 318, 352), d = Math.atan2(Math.sin(look - along), Math.cos(look - along));
  let yaw = along + d * k;
  if (s < EQ_HT.lift + 3) yaw = MathX.lerp(eqYawWF(-0.25, -1), along, MathX.smooth(s, EQ_HT.lift + 0.8, EQ_HT.lift + 3));
  const turn = Math.atan2(q2[0] - q[0], q2[2] - q[2]) - along, tr = Math.atan2(Math.sin(turn), Math.cos(turn));
  const pitch = MathX.clamp(sp / 45, 0, 0.18) * (1 - k * 0.8), roll = MathX.clamp(-tr * 1.6, -0.35, 0.35) * (1 - k * 0.6);
  return { p, yaw, pitch, roll };
}

function eqHeli(scene) {
  const H = { g: new THREE.Group() }; scene.add(H.g);
  const g = H.g;
  // ---- paint: white, a teal stripe, an orange pinstripe (on the loft's uv: u around, v along)
  // (the loft's u runs round the ring: 0.5 is the left side, 0 / 1 the right; the stripe sits just under the middle)
  const paintT = eqTex(eqCanvas(512, 256, (c) => { c.fillStyle = '#f5f4f0'; c.fillRect(0, 0, 512, 256); for (const x0 of [0.525, 0.905]) { c.fillStyle = '#16807c'; c.fillRect(x0 * 512, 0, 0.07 * 512, 256); c.fillStyle = '#ef7a2a'; c.fillRect((x0 + (x0 < 0.7 ? 0.075 : -0.02)) * 512, 0, 0.012 * 512, 256); } }), { repeat: false });
  const paint = new THREE.MeshPhysicalMaterial({ map: paintT, roughness: 0.28, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.1, side: THREE.DoubleSide });
  const dark = eqStd('#1e2124', 0.6, 0.3), metal = eqStd('#8c9196', 0.35, 0.8), seatM = eqStd('#2a2d33', 0.8), inner = eqStd('#3a3d42', 0.85);
  // the cabin (rings along z: [x, y, z, rx, ry]); the nose is glass above its chin
  const ring = (z, y, rx, ry) => [0, y, z, rx, ry];
  const bodyR = [ring(-1.95, 1.78, 0.42, 0.5), ring(-1.4, 1.62, 0.78, 0.82), ring(-0.6, 1.55, 0.93, 0.95), ring(0.2, 1.5, 0.95, 0.96), ring(0.62, 1.49, 0.95, 0.96)];
  const body = eqMesh(eqLoft(bodyR, 24, 0.7), paint, 0, 0, 0, g); body.castShadow = true;
  const noseR = [ring(0.6, 1.49, 0.95, 0.96), ring(1.25, 1.45, 0.9, 0.92), ring(1.8, 1.38, 0.74, 0.8), ring(2.2, 1.3, 0.5, 0.58), ring(2.42, 1.25, 0.18, 0.22)];
  const glassM = new THREE.MeshPhysicalMaterial({ color: '#cfe6ee', roughness: 0.05, metalness: 0, transmission: 0, transparent: true, opacity: 1, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.2 });
  glassM.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vHL;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvHL = position;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vHL;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        // below the chin line: painted (opaque white); above: glass (faint, with a dark frame line round its edge)
        float chin = 1.05 + (vHL.z - 0.6) * 0.1;
        if (vHL.y < chin) { diffuseColor = vec4(0.96, 0.955, 0.94, 1.0); }
        else { float edge = smoothstep(chin + 0.05, chin, vHL.y) + step(abs(vHL.x), 0.025) * step(1.9, vHL.y);
          diffuseColor = mix(vec4(0.75, 0.85, 0.9, 0.13), vec4(0.08, 0.09, 0.1, 1.0), clamp(edge, 0.0, 1.0)); }`);
  };
  glassM.customProgramCacheKey = () => 'eqHeliGlass';
  const nose = eqMesh(eqLoft(noseR, 24, 0.9), glassM, 0, 0, 0, g); nose.castShadow = false; nose.renderOrder = 9;
  H.glass = nose;
  // the door frames (dark posts) and the roof
  for (const s of [-1, 1]) { eqStrut(eqMesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 6), dark, 0, 0, 0, g), [s * 0.9, 1.0, 0.62], [s * 0.82, 2.25, 0.5], 0.035); eqStrut(eqMesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6), dark, 0, 0, 0, g), [s * 0.93, 1.05, -0.5], [s * 0.85, 2.3, -0.5], 0.03); }
  // the side windows of the rear cabin (dark tinted panels on the body)
  for (const s of [-1, 1]) { const w = eqMesh(new THREE.PlaneGeometry(0.95, 0.7), new THREE.MeshStandardMaterial({ color: '#33474f', roughness: 0.08, metalness: 0.7, side: THREE.DoubleSide }), s * 0.965, 1.82, -0.1, g); w.rotation.y = s * Math.PI / 2; w.castShadow = false; }
  // the engine's hump, the mast, the hub
  eqMesh(eqRoundBox(1.0, 0.45, 1.7, 0.2, 0.05, 2), paint, 0, 2.3, -1.0, g);
  const mast = eqMesh(new THREE.CylinderGeometry(0.07, 0.09, 0.55, 10), metal, 0, 2.95, 0, g); void mast;
  // the tail boom, its fins, its rotor
  const boom = eqMesh(eqLoft([[0, 1.8, -1.9, 0.34, 0.36], [0, 1.92, -4.2, 0.2, 0.22], [0, 2.0, -6.7, 0.12, 0.13]], 16, 0.8), paint, 0, 0, 0, g); boom.castShadow = true;
  eqMesh(new THREE.BoxGeometry(2.3, 0.05, 0.45), paint, 0, 1.98, -5.5, g);
  for (const s of [-1, 1]) eqMesh(new THREE.BoxGeometry(0.04, 0.42, 0.4), dark, s * 1.15, 1.98, -5.5, g);
  const fin = eqMesh(new THREE.BoxGeometry(0.06, 1.25, 0.75), paint, 0, 2.55, -6.55, g); fin.rotation.x = -0.35;
  const tail = new THREE.Group(); tail.position.set(-0.22, 2.25, -6.55); g.add(tail);
  for (let k = 0; k < 2; k++) { const b = eqMesh(new THREE.BoxGeometry(0.03, 1.9, 0.14), dark, 0, 0, 0, tail); b.rotation.x = k * Math.PI / 2; }
  // the skids
  for (const s of [-1, 1]) { const sk = eqMesh(new THREE.CylinderGeometry(0.045, 0.045, 3.6, 8), metal, s * 1.15, 0.08, 0.25, g); sk.rotation.x = Math.PI / 2;
    for (const z of [-0.75, 1.05]) eqStrut(eqMesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 8), metal, 0, 0, 0, g), [s * 1.15, 0.08, z], [s * 0.55, 0.85, z], 0.04); }
  // the name on the tail boom (both sides): made up
  const nameT = eqTex(eqCanvas(512, 96, (c) => { c.clearRect(0, 0, 512, 96); c.fillStyle = '#16807c'; c.font = '800 64px Montserrat, Arial, sans-serif'; c.textBaseline = 'middle'; c.fillText('BAY TOURS · N724BT', 8, 50); }), { repeat: false });
  for (const s of [-1, 1]) { const n = eqMesh(new THREE.PlaneGeometry(2.4, 0.45), new THREE.MeshStandardMaterial({ map: nameT, transparent: true, alphaTest: 0.4, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }), s * 0.3, 1.86, -3.3, g); n.rotation.y = s * Math.PI / 2; n.rotation.z = s * 0.02; n.castShadow = false; if (s < 0) n.scale.x = -1; }
  // ---- the main rotor: three blades and the blur disc
  const rotor = new THREE.Group(); rotor.position.set(0, 3.22, 0); g.add(rotor);
  const bladeG = new THREE.BoxGeometry(5.2, 0.035, 0.32); bladeG.translate(2.75, 0, 0);
  for (let k = 0; k < 3; k++) { const b = eqMesh(bladeG, dark, 0, 0, 0, rotor); b.rotation.y = k * Math.PI * 2 / 3; b.rotation.x = 0.02; }
  eqMesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 12), metal, 0, 0, 0, rotor);
  const discM = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { k: { value: 0 } },
    vertexShader: 'varying vec2 vU; void main(){ vU = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float k; varying vec2 vU; void main(){ float r = length(vU) / 5.35; if (r > 1.0 || r < 0.06) discard; float a = k * (0.16 + 0.1 * smoothstep(0.85, 1.0, r)) * smoothstep(1.0, 0.97, r); gl_FragColor = vec4(0.12, 0.13, 0.14, a); }' });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(5.35, 48), discM); disc.rotation.x = -Math.PI / 2; disc.position.y = 3.22; disc.renderOrder = 8; g.add(disc);
  H.rotor = rotor; H.disc = disc; H.tail = tail;
  // ---- inside: the floor, four seats, the panel (two screens: the map and the fuel page), the sticks
  eqMesh(new THREE.BoxGeometry(1.7, 0.06, 3.0), inner, 0, 0.95, 0.4, g);
  const seat = (x, z, w = 0.5) => { eqMesh(new THREE.BoxGeometry(w, 0.12, 0.5), seatM, x, 1.32, z, g); const b = eqMesh(new THREE.BoxGeometry(w, 0.72, 0.1), seatM, x, 1.72, z - 0.27, g); b.rotation.x = -0.12; };
  seat(-0.45, 0.85); seat(0.45, 0.85); seat(0, -0.45, 1.5);
  const panel = new THREE.Group(); panel.position.set(0, 1.45, 1.72); panel.rotation.x = -0.55; g.add(panel);
  eqMesh(new THREE.BoxGeometry(1.35, 0.36, 0.08), dark, 0, 0, 0, panel);
  const fuelTex = eqCanvasTex(256, 160, (c, w, h, st) => {
    c.fillStyle = '#05080a'; c.fillRect(0, 0, w, h); c.fillStyle = '#7ff0b0'; c.font = '700 26px Montserrat, Arial, sans-serif'; c.fillText('FUEL', 16, 36);
    c.font = '800 54px Montserrat, Arial, sans-serif'; c.fillText(st.t, 16, 100); c.font = '700 20px Montserrat, Arial, sans-serif'; c.fillStyle = '#c8e8d8'; c.fillText('ENDURANCE', 16, 136);
    c.strokeStyle = '#7ff0b0'; c.lineWidth = 6; c.strokeRect(170, 30, 60, 110); c.fillStyle = '#7ff0b0'; c.fillRect(176, 140 - 104 * st.k, 48, 104 * st.k - 6);
  });
  const mapTex = eqTex(eqCanvas(256, 160, (c) => { c.fillStyle = '#0a1a2a'; c.fillRect(0, 0, 256, 160); c.fillStyle = '#2a4a3a'; c.beginPath(); c.moveTo(0, 160); c.lineTo(0, 70); c.lineTo(90, 60); c.lineTo(120, 100); c.lineTo(150, 160); c.fill(); c.strokeStyle = '#ffd36a'; c.lineWidth = 3; c.beginPath(); c.moveTo(128, 80); c.lineTo(200, 20); c.stroke(); c.fillStyle = '#ff6a1f'; c.beginPath(); c.arc(128, 80, 6, 0, 6.29); c.fill(); }), { repeat: false });
  fuelTex.update({ t: '2:00 H', k: 0.62 });
  const scrF = eqMesh(new THREE.PlaneGeometry(0.42, 0.26), new THREE.MeshBasicMaterial({ map: fuelTex.tex, toneMapped: false }), -0.3, 0, 0.045, panel); scrF.castShadow = false;
  const scrM = eqMesh(new THREE.PlaneGeometry(0.42, 0.26), new THREE.MeshBasicMaterial({ map: mapTex, toneMapped: false }), 0.3, 0, 0.045, panel); scrM.castShadow = false;
  H.fuel = fuelTex; H.fuelScreen = scrF;
  for (const x of [-0.45, 0.45]) { const st = eqMesh(new THREE.CylinderGeometry(0.018, 0.022, 0.6, 6), dark, x, 1.25, 1.22, g); st.rotation.x = -0.25; }
  // the headsets (one for you, one for the pilot): a band, two cups, a mic
  H.headset = (head) => {
    const hs = new THREE.Group(); head.add(hs);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.012, 6, 20, Math.PI), dark); band.position.y = 0.06; band.rotation.z = 0; hs.add(band);
    band.rotation.y = Math.PI / 2;
    for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 14), eqStd('#2b2d30', 0.5)); c.rotation.z = Math.PI / 2; c.position.set(s * 0.1, 0.0, 0); hs.add(c); }
    const mic = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.13, 5), dark); mic.position.set(0.085, -0.055, 0.06); mic.rotation.set(0.9, 0, 0.3); hs.add(mic);
    hs.traverse((m) => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; } });
    return hs;
  };
  // the world point of a spot in the helicopter (its own frame)
  const _v = new THREE.Vector3();
  H.toWorld = (x, y, z, out = new THREE.Vector3()) => { g.updateMatrixWorld(true); return out.set(x, y, z).applyMatrix4(g.matrixWorld); };
  H.frame = (s, padTop, lvl) => {
    const at = eqHeliAt(s, padTop);
    let [x, y, z] = at.p, pitch = at.pitch, roll = at.roll;
    if (s < EQ_HT.lift) { const a = eqGround(s, 0.25, 61), amp = Math.min(1, lvl * 5); x += a[0] * amp * 0.25; y += Math.max(0, a[1]) * amp * 0.3; z += a[2] * amp * 0.25; roll += a[0] * amp * 0.08; pitch += a[2] * amp * 0.06; }
    else {
      // the hover's slow bob, and from minute nine the air itself shaking (sound waves from the ground: jolts)
      y += 0.35 * Math.sin(s * 0.9) + 0.2 * Math.sin(s * 1.7 + 1);
      const air = MathX.smooth(s, eqW('air') - EQ.tick0 - 0.4, eqW('air') - EQ.tick0 + 0.6) + MathX.smooth(s, 540, 545) * 0.6;
      if (air > 0) { const a = eqGround(s, 0, 91); y += a[1] * air * 0.9; roll += a[0] * air * 0.12; pitch += a[2] * air * 0.08; x += a[0] * air * 0.6; }
    }
    g.position.set(x, y, z); g.rotation.order = 'YXZ'; g.rotation.set(pitch, at.yaw, roll);
    rotor.rotation.y = eqRotorAngle(s); tail.rotation.x = eqRotorAngle(s) * 4.6;
    const rev = eqRotorRev(s); discM.uniforms.k.value = MathX.smooth(rev, 1.2, 3.8);
    rotor.children.forEach((b, i) => { if (i < 3) b.visible = rev < 3.6; });
    // the fuel page (from minute nine the pilot is watching it)
    const left = 2 - Math.max(0, s - 523) / 3600;
    fuelTex.update({ t: `${Math.floor(left)}:${String(Math.floor((left % 1) * 60)).padStart(2, '0')} H`, k: left / 3.2 });
    g.updateMatrixWorld(true);
    return at;
  };
  void _v;
  return H;
}
