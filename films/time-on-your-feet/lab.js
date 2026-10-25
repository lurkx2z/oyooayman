/* =====================================================================
   LAB — the experiments that measured it (illustrated; the numbers are the real ones, hud.js prints them):
     intro  an optical-clock lab at night: black optical tables, laser beams, a vacuum chamber, racks of electronics
     pound  Harvard, 1959: the 22.5 m shaft of the Jefferson lab. Gamma rays leave a source at the bottom (on a speaker
            cone, as Pound and Rebka's was) and climb to a detector at the top; on the way their waves stretch
            (exaggerated: the real stretch is 2.5 parts in 10^15)
     nist   Boulder, 2010: an aluminium-ion clock on a lab jack, raised 33 cm (at TF.lift)
     jila   Boulder, 2022: inside the vacuum chamber, a cloud of strontium atoms 1 mm tall held in layers of laser light.
            Each layer ticks a little faster than the one below (exaggerated), so stripes of phase build up through it
   Layout (metres): the lab round the origin (table A along z at x = 0, table B at x = 2.6), the shaft at x = 60, the
   inside of the chamber (1 mm drawn as 1 m) at x = −60.
   ===================================================================== */

// the optical table's top: dark steel with a 25 mm grid of tapped holes (a 0.4 m tile)
function tfTableCanvas() {
  return tfCanvas(512, 512, (g, w, h) => {
    g.fillStyle = '#2a2c30'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(255,255,255,${hash1(i * 3.3) * 0.035})`; g.fillRect(hash1(i * 1.7) * w, hash1(i * 2.9) * h, 2, 1); }
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const cx = (x + 0.5) * w / 16, cy = (y + 0.5) * h / 16;
      g.fillStyle = '#0c0d0f'; g.beginPath(); g.arc(cx, cy, 5.5, 0, 7); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.stroke();
    }
  });
}
function tfBrickCanvas() {
  return tfCanvas(512, 512, (g, w, h) => {
    g.fillStyle = '#4a4440'; g.fillRect(0, 0, w, h);
    const r = new RNG(CONFIG.seed + 501), bw = 64, bh = 24;
    for (let row = 0; row < h / bh; row++) for (let col = -1; col < w / bw + 1; col++) {
      const x = col * bw + (row % 2 ? bw / 2 : 0), y = row * bh, v = r.range(0.8, 1.15);
      g.fillStyle = `rgb(${132 * v},${86 * v},${66 * v})`; g.fillRect(x + 2, y + 2, bw - 4, bh - 4);
      for (let k = 0; k < 20; k++) { g.fillStyle = `rgba(0,0,0,${r.range(0, 0.12)})`; g.fillRect(x + r.range(2, bw - 6), y + r.range(2, bh - 6), 3, 2); }
    }
  });
}

TF_SETS.lab = (app) => {
  const S = tfSet(app, { sky: '#05060a', hemi: ['#8fa0c0', '#2a2622', 0.6], fov: 50, near: 0.005, far: 400, env: ['#3a4250', '#20232a', '#101012'] });
  const { scene, camera: cam, hemi } = S;
  const W = tfWin, K = tfK;
  const amb = new THREE.AmbientLight('#9aa8c8', 0.14); scene.add(amb);
  const steel = tfStd('#9aa0a8', 0.28, 0.9), dark = tfStd('#15171a', 0.55, 0.4), black = tfStd('#0b0c0e', 0.7, 0.1), alu = tfStd('#c4c8ce', 0.35, 0.8);
  const copper = tfStd('#b8743e', 0.35, 0.9), brass = tfStd('#b79358', 0.3, 0.9);
  const glowM = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: true });
  // a laser beam from a to b: a bright core and a faint wider glow
  const beams = [];
  const beam = (a, b, col, w = 0.0016, parent = scene) => {
    const core = tfMesh(new THREE.CylinderGeometry(1, 1, 1, 8, 1, true).translate(0, 0.5, 0), glowM(...col), 0, 0, 0, parent); tfStrut(core, a, b, w); core.castShadow = core.receiveShadow = false;
    const halo = tfMesh(new THREE.CylinderGeometry(1, 1, 1, 10, 1, true).translate(0, 0.5, 0), glowM(col[0] * 0.08, col[1] * 0.08, col[2] * 0.08), 0, 0, 0, parent); tfStrut(halo, a, b, w * 5); halo.castShadow = halo.receiveShadow = false;
    beams.push(core, halo); return core;
  };
  const post = (x, z, h, parent = scene) => { tfCyl(0.0065, 0.0065, h, steel, x, 0.9 + h / 2, z, parent, 12); tfCyl(0.012, 0.014, 0.012, dark, x, 0.906, z, parent, 14); };
  const mirror = (x, y, z, ry) => { post(x, z, y - 0.9 - 0.012); const m = tfCyl(0.0125, 0.0125, 0.008, tfStd('#d8dde4', 0.05, 1), x, y, z, scene, 20); m.rotation.set(Math.PI / 2, 0, ry); const mount = tfBox(0.03, 0.03, 0.012, black, x, y, z); mount.rotation.y = ry; mount.translateZ(-0.009); };

  // ---- the room
  const floorM = tfStd('#3a3d42', 0.75, 0, { map: tfTex(tfCanvas(256, 256, (g, w, h) => { g.fillStyle = '#5a5e64'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${hash1(i) * 0.1})`; g.fillRect(hash1(i * 3) * w, hash1(i * 7) * h, 3, 3); } g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h); })) });
  floorM.map.repeat.set(16, 16);
  tfMesh(new THREE.PlaneGeometry(14, 12).rotateX(-Math.PI / 2), floorM, 0.8, 0, -1.5).castShadow = false;
  const wallM = tfStd('#2c3038', 0.85, 0);
  tfBox(14, 3.2, 0.1, wallM, 0.8, 1.6, -5.2); tfBox(0.1, 3.2, 12, wallM, -3.6, 1.6, -1.5); tfBox(0.1, 3.2, 12, wallM, 5.2, 1.6, -1.5); tfBox(14, 0.1, 12, tfStd('#1c1e22', 0.9, 0), 0.8, 3.2, -1.5);
  // racks of electronics along the back wall, their small lights
  const ledM = [glowM(0.2, 2.4, 0.5), glowM(2.4, 0.9, 0.2), glowM(0.4, 0.8, 2.6)], leds = [];
  for (let i = 0; i < 6; i++) {
    const x = -2.6 + i * 0.7; tfBox(0.6, 2.0, 0.6, tfStd('#1d2026', 0.5, 0.5), x, 1.0, -4.8);
    for (let j = 0; j < 9; j++) { tfBox(0.54, 0.16, 0.02, tfStd(j % 3 ? '#2a2e35' : '#383c44', 0.4, 0.6), x, 0.35 + j * 0.19, -4.49); for (let k = 0; k < 4; k++) { const l = tfMesh(new THREE.CircleGeometry(0.006, 8), ledM[(i + j + k) % 3], x - 0.22 + k * 0.03, 0.38 + j * 0.19, -4.475); l.castShadow = false; leds.push([l, i * 31 + j * 7 + k]); } }
  }
  // a screen on the rack: the clock's beat note
  const scr = tfCanvasTex(512, 288, (g, w, h, s) => {
    g.fillStyle = '#05080c'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,200,255,0.18)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y < h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = '#7fe0ff'; g.lineWidth = 3; g.beginPath(); for (let x = 0; x < w; x++) { const y = h / 2 + 70 * Math.sin(x * 0.05 + s.p) * Math.exp(-Math.pow((x - w / 2) / 210, 2)); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.fillStyle = '#7fe0ff'; g.font = '500 22px "JetBrains Mono", monospace'; g.fillText('CLOCK LASER · 429 228 004 229 873.0 Hz', 18, 34);
  });
  const scrMesh = tfMesh(new THREE.PlaneGeometry(0.64, 0.36), new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: true }), -0.5, 1.55, -4.47);
  // ceiling lights (dim, it's night) and a work lamp over table A
  for (const [x, z] of [[-1.5, -1], [1.2, -1], [3.8, -1], [-1.5, -3.5], [1.2, -3.5], [3.8, -3.5]]) tfMesh(new THREE.PlaneGeometry(1.1, 0.25).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.95, 1.0) }), x, 3.14, z).castShadow = false;
  const key = new THREE.SpotLight('#cfdcff', 34, 9, 0.8, 0.7, 1.6); key.position.set(0.6, 3.0, 0.2); key.target.position.set(0.3, 0.9, -2.0); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; scene.add(key, key.target);
  const keyB = new THREE.SpotLight('#ffe2c0', 24, 8, 0.6, 0.7, 1.6); keyB.position.set(3.4, 2.9, 0.4); keyB.target.position.set(2.6, 0.9, -2.0); keyB.castShadow = true; keyB.shadow.mapSize.set(1024, 1024); scene.add(keyB, keyB.target);
  const fillL = new THREE.PointLight('#6d84b8', 7, 9, 2); fillL.position.set(-1.6, 2.4, 1.0); scene.add(fillL);

  // ---- table A: an optical lattice clock (strontium): the chamber, its coils, the beams
  const tableTex = tfTex(tfTableCanvas()); tableTex.repeat.set(1.5 / 0.4, 3.2 / 0.4);
  const topM = tfStd('#ffffff', 0.4, 0.6, { map: tableTex });
  const table = (x, z, w, d) => {
    tfBox(w, 0.04, d, topM, x, 0.88, z); tfBox(w, 0.24, d, tfStd('#26292e', 0.5, 0.5), x, 0.74, z);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tfCyl(0.09, 0.11, 0.62, tfStd('#30343a', 0.5, 0.6), x + sx * (w / 2 - 0.2), 0.31, z + sz * (d / 2 - 0.25), scene, 20);
  };
  table(0, -2.0, 1.5, 3.2); table(2.6, -2.0, 1.5, 3.2);
  const CH = [0.05, 1.14, -2.0];
  const chamber = new THREE.Group(); chamber.position.set(...CH); scene.add(chamber);
  tfMesh(new THREE.CylinderGeometry(0.16, 0.16, 0.13, 12), steel, 0, 0, 0, chamber);
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; const v = tfMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.09, 20).rotateZ(Math.PI / 2), steel, Math.cos(a) * 0.19, 0, Math.sin(a) * 0.19, chamber); v.rotation.y = -a;
    const fl = tfMesh(new THREE.CylinderGeometry(0.048, 0.048, 0.016, 20).rotateZ(Math.PI / 2), steel, Math.cos(a) * 0.235, 0, Math.sin(a) * 0.235, chamber); fl.rotation.y = -a;
    const gl = tfMesh(new THREE.CircleGeometry(0.03, 20), glowM(0.25, 0.45, 1.6), Math.cos(a) * 0.2441, 0, Math.sin(a) * 0.2441, chamber); gl.lookAt(Math.cos(a) * 2 + CH[0], CH[1], Math.sin(a) * 2 + CH[2]); }
  for (const y of [-1, 1]) { tfMesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 32), steel, 0, y * 0.075, 0, chamber); tfMesh(new THREE.TorusGeometry(0.115, 0.018, 12, 40).rotateX(Math.PI / 2), copper, 0, y * 0.11, 0, chamber); tfMesh(new THREE.CircleGeometry(0.07, 32).rotateX(-y * Math.PI / 2), glowM(0.2, 0.36, 1.2), 0, y * 0.0861, 0, chamber); }
  tfCyl(0.03, 0.03, 0.2, steel, 0, -0.18, 0, chamber, 16); tfCyl(0.06, 0.06, 0.06, dark, 0, -0.22, 0, chamber, 20);
  // the oven and the slower tube coming in from one side; an ion pump
  tfMesh(new THREE.CylinderGeometry(0.022, 0.022, 0.7, 16).rotateZ(Math.PI / 2), steel, -0.56, 0, 0, chamber); tfBox(0.12, 0.18, 0.14, steel, -0.95, -0.02, 0, chamber);
  tfBox(0.16, 0.2, 0.12, tfStd('#3d4552', 0.5, 0.6), 0.0, -0.06, 0.34, chamber);
  // the beams: six blue cooling beams through the chamber, the red clock laser along the lattice (vertical), and the
  // routes from the lasers at the table's far end via mirrors
  const BL = [0.6, 1.0, 3.2], RD = [3.2, 0.25, 0.3], IR = [1.4, 0.08, 0.2];
  for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3 + Math.PI / 6, dx = Math.cos(a) * 0.5, dz = Math.sin(a) * 0.5; beam([CH[0] - dx, CH[1], CH[2] - dz], [CH[0] + dx, CH[1], CH[2] + dz], BL, 0.002); }
  beam([CH[0], CH[1] - 0.24, CH[2]], [CH[0], CH[1] + 0.5, CH[2]], RD, 0.0014);
  const route = (pts, col, w) => { for (let i = 1; i < pts.length; i++) beam(pts[i - 1], pts[i], col, w); };
  route([[0.55, 1.0, -3.4], [0.55, 1.0, -2.6], [0.3, 1.0, -2.6], [0.3, 1.0, -1.25], [0.05, 1.0, -1.25], [0.05, 1.0, -1.6]], RD, 0.0012);
  route([[-0.55, 0.98, -3.4], [-0.55, 0.98, -2.9], [CH[0] - 0.25, 0.98, -2.9], [CH[0] - 0.25, CH[1], CH[2] - 0.43]], BL, 0.0016);
  route([[0.45, 1.06, -3.45], [0.45, 1.06, -3.0], [0.62, 1.06, -3.0], [0.62, 1.06, -0.75], [-0.4, 1.06, -0.75], [-0.4, 1.06, -1.3]], IR, 0.0012);
  for (const [x, y, z] of [[0.55, 1.0, -2.6], [0.3, 1.0, -2.6], [0.3, 1.0, -1.25], [0.05, 1.0, -1.25], [-0.55, 0.98, -2.9], [CH[0] - 0.25, 0.98, -2.9], [0.45, 1.06, -3.0], [0.62, 1.06, -3.0], [0.62, 1.06, -0.75], [-0.4, 1.06, -0.75]]) mirror(x, y, z, Math.PI / 4);
  // lasers (boxes) at the far end, lenses, a few optics boxes and cables
  for (const [x, z, w, d] of [[0.55, -3.5, 0.16, 0.3], [-0.55, -3.5, 0.18, 0.3], [0.2, -3.45, 0.14, 0.22], [-0.2, -3.48, 0.2, 0.26]]) { tfBox(w, 0.1, d, tfStd('#22324a', 0.4, 0.6), x, 0.95, z); tfBox(w * 0.9, 0.004, d * 0.6, tfStd('#ffffff', 0.4, 0.2), x, 1.002, z); }
  for (const [x, z] of [[0.3, -1.9], [0.62, -1.8], [-0.4, -1.0], [0.3, -2.25]]) { post(x, z, 0.09); const l = tfCyl(0.012, 0.012, 0.006, tfStd('#e8f0ff', 0.02, 0.1, { transparent: true, opacity: 0.4 }), x, 1.0, z, scene, 20); l.rotation.x = Math.PI / 2; }
  for (const [x, z, w, d, h] of [[-0.45, -2.4, 0.22, 0.16, 0.12], [0.5, -1.2, 0.18, 0.14, 0.1], [-0.5, -0.8, 0.3, 0.2, 0.08]]) tfBox(w, h, d, tfStd('#30343c', 0.45, 0.6), x, 0.9 + h / 2, z);
  const cableM = tfStd('#111214', 0.6, 0);
  for (let i = 0; i < 6; i++) { const z0 = -3.3 + i * 0.4, c = tfMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-0.7, 0.95, z0), new THREE.Vector3(-0.85, 0.7, z0 + 0.1), new THREE.Vector3(-0.9, 0.2, z0 + 0.05), new THREE.Vector3(-1.2, 0.01, z0 - 0.2)]), 20, 0.006, 6), cableM); c.castShadow = false; }

  // ---- table B: an aluminium-ion clock on a lab jack (rises 33 cm), a ruler beside it
  const JX = 2.6, JZ = -2.0;
  const jack = new THREE.Group(); jack.position.set(JX, 0.9, JZ); scene.add(jack);
  tfBox(0.36, 0.02, 0.36, alu, 0, 0.01, 0, jack);
  const jtop = new THREE.Group(); jack.add(jtop);
  tfBox(0.4, 0.025, 0.4, alu, 0, 0, 0, jtop);
  const ionCh = new THREE.Group(); ionCh.position.y = 0.11; jtop.add(ionCh);
  tfMesh(new THREE.SphereGeometry(0.085, 24, 16), steel, 0, 0, 0, ionCh);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const p = tfMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.07, 20).rotateZ(Math.PI / 2), steel, Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1, ionCh); p.rotation.y = -a; const gl = tfMesh(new THREE.CircleGeometry(0.022, 20), glowM(0.9, 0.5, 1.8), Math.cos(a) * 0.1351, 0, Math.sin(a) * 0.1351, ionCh); gl.lookAt(JX + Math.cos(a) * 2, 2, JZ + Math.sin(a) * 2); }
  tfCyl(0.03, 0.03, 0.1, steel, 0, 0.1, 0, ionCh, 16); tfCyl(0.055, 0.055, 0.03, steel, 0, 0.16, 0, ionCh, 20);
  tfCyl(0.05, 0.05, 0.08, dark, 0, -0.07, 0, ionCh, 20);
  // the scissor arms
  const arms = [];
  for (const side of [-1, 1]) for (const d of [-1, 1]) { const a = tfBox(0.46, 0.012, 0.012, alu, 0, 0, side * 0.15, jack); arms.push([a, d]); }
  // the screw and its knob
  const screw = tfCyl(0.006, 0.006, 0.34, brass, 0, 0, 0, jack, 10); screw.rotation.z = Math.PI / 2;
  const knob = tfCyl(0.025, 0.025, 0.02, black, 0.2, 0, 0, jack, 20); knob.rotation.z = Math.PI / 2;
  // a fibre from the clock to the other lab (how the two clocks were compared)
  const fibre = tfMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(JX + 0.12, 1.1, JZ), new THREE.Vector3(JX + 0.4, 0.95, JZ + 0.3), new THREE.Vector3(JX + 0.8, 0.3, JZ + 0.6), new THREE.Vector3(JX + 1.6, 0.01, JZ + 0.8)]), 30, 0.003, 6), tfStd('#f2c23a', 0.5, 0));
  fibre.castShadow = false;
  // the ruler: 0…40 cm, a stand beside the jack
  const rulerC = tfCanvas(128, 1024, (g, w, h) => {
    g.fillStyle = '#f2ede2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#111'; g.font = '600 34px Inter, Arial, sans-serif';
    for (let mm = 0; mm <= 400; mm += 5) { const y = h - (mm / 400) * (h - 20) - 10, L = mm % 100 === 0 ? 70 : mm % 50 === 0 ? 50 : mm % 10 === 0 ? 34 : 18; g.fillRect(0, y - 1.5, L, 3); if (mm % 100 === 0) g.fillText(String(mm / 10), 74, y + 12); }
  });
  const ruler = tfMesh(new THREE.PlaneGeometry(0.05, 0.42), tfStd('#ffffff', 0.6, 0, { map: tfTex(rulerC, { repeat: false }) }), JX - 0.27, 0.92 + 0.21, JZ + 0.05);
  ruler.castShadow = false;
  tfBox(0.012, 0.44, 0.012, alu, JX - 0.27, 0.9 + 0.22, JZ + 0.04);
  // a marker on the ruler that follows the platform
  const markM = glowM(2.6, 1.4, 0.4), mark = tfMesh(new THREE.PlaneGeometry(0.07, 0.003), markM, JX - 0.27, 0.93, JZ + 0.052); mark.castShadow = false;

  // ---- the inside of the chamber (x = −60): the atom cloud, 1 mm tall, drawn 1 m tall; the lattice beam through it
  const IN = [-60, 0, 0];
  const inG = new THREE.Group(); inG.position.set(...IN); scene.add(inG);
  beam([IN[0], IN[1] - 3, IN[2]], [IN[0], IN[1] + 3, IN[2]], [0.35, 0.03, 0.04], 0.07);
  const atoms = tfPuffs(scene, 9000, { additive: true, soft: 1.2 });
  const LAYERS = 36, ATOMS = [];
  { const r = new RNG(CONFIG.seed + 777); for (let l = 0; l < LAYERS; l++) { const y = (l / (LAYERS - 1)) - 0.5, rr = 0.33 * Math.sqrt(Math.max(0.05, 1 - 3.2 * y * y)), n = Math.round(150 * (rr / 0.33) ** 2) + 20; for (let i = 0; i < n; i++) { const a = r.range(0, 6.2832), q = rr * Math.sqrt(-Math.log(1 - r.next() * 0.92)) * 0.6; ATOMS.push([Math.cos(a) * q, y + r.range(-0.004, 0.004), Math.sin(a) * q, l, r.next()]); } } }
  // the scale bar beside the cloud
  const bar = new THREE.Group(); bar.position.set(IN[0] + 0.62, IN[1], IN[2]); scene.add(bar);
  const barM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.4, 1.35, 1.25) });
  tfMesh(new THREE.BoxGeometry(0.008, 1.0, 0.008), barM, 0, 0, 0, bar); for (const y of [-0.5, 0.5]) tfMesh(new THREE.BoxGeometry(0.08, 0.008, 0.008), barM, 0, y, 0, bar);

  // ---- the Pound–Rebka shaft (x = 60): 3 m square, 24 m tall
  const PR = [60, 0, 0];
  const brickT = tfTex(tfBrickCanvas()); brickT.repeat.set(3, 24);
  const brickM = tfStd('#ffffff', 0.9, 0, { map: brickT });
  for (const [dx, dz, ry] of [[0, -1.5, 0], [0, 1.5, Math.PI], [-1.5, 0, Math.PI / 2], [1.5, 0, -Math.PI / 2]]) { const w = tfMesh(new THREE.PlaneGeometry(3, 24), brickM, PR[0] + dx, 12, PR[2] + dz); w.rotation.y = ry; }
  tfMesh(new THREE.PlaneGeometry(3, 3).rotateX(-Math.PI / 2), tfStd('#3a3632', 0.9, 0), PR[0], 0, PR[2]);
  tfMesh(new THREE.PlaneGeometry(3, 3).rotateX(Math.PI / 2), tfStd('#1e1c1a', 0.9, 0), PR[0], 24, PR[2]);
  // floor landings every 4.5 m (a gallery round the shaft), small lamps
  const lampM = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.8, 1.2) });
  const shaftLights = [];
  for (let k = 1; k <= 5; k++) {
    const y = k * 4.5;
    for (const [dx, dz, w, d] of [[0, -1.35, 3, 0.3], [0, 1.35, 3, 0.3], [-1.35, 0, 0.3, 2.4], [1.35, 0, 0.3, 2.4]]) tfBox(w, 0.12, d, tfStd('#55504a', 0.8, 0.2), PR[0] + dx, y, PR[2] + dz);
    tfBox(3, 0.04, 0.04, steel, PR[0], y + 1.0, PR[2] - 1.2); tfBox(3, 0.04, 0.04, steel, PR[0], y + 1.0, PR[2] + 1.2);
    const lm = tfMesh(new THREE.SphereGeometry(0.06, 12, 8), lampM, PR[0] + 1.42, y + 1.6, PR[2] + 0.9); lm.castShadow = false;
    const pl = new THREE.PointLight('#ffd8a8', 2.2, 7, 2); pl.position.set(PR[0] + 1.3, y + 1.6, PR[2] + 0.9); scene.add(pl); shaftLights.push(pl);
  }
  const pl0 = new THREE.PointLight('#ffd8a8', 4, 6, 2); pl0.position.set(PR[0] + 1.0, 2.2, PR[2] + 1.0); scene.add(pl0);
  // the long thin bag of helium up the middle (it let the gamma rays through), the source at the bottom on its
  // loudspeaker, the detector at the top
  const bagM = tfStd('#d8d2c4', 0.35, 0.1, { transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false });
  const bag = tfMesh(new THREE.CylinderGeometry(0.22, 0.22, 21.6, 28, 1, true), bagM, PR[0], 1.2 + 10.8, PR[2]); bag.castShadow = false;
  for (let k = 0; k < 9; k++) tfMesh(new THREE.TorusGeometry(0.225, 0.006, 6, 32).rotateX(Math.PI / 2), steel, PR[0], 1.2 + k * 2.7, PR[2]);
  tfCyl(0.3, 0.36, 0.8, tfStd('#2e3238', 0.6, 0.5), PR[0], 0.4, PR[2], scene, 28);          // the speaker cabinet
  tfMesh(new THREE.ConeGeometry(0.22, 0.12, 28, 1, true).rotateX(Math.PI), tfStd('#1a1a1a', 0.8, 0, { side: THREE.DoubleSide }), PR[0], 0.86, PR[2]);
  const src = tfCyl(0.05, 0.05, 0.1, brass, PR[0], 0.92, PR[2], scene, 20);
  const srcGlow = tfMesh(new THREE.CircleGeometry(0.035, 20).rotateX(-Math.PI / 2), glowM(1.2, 1.4, 2.6), PR[0], 0.9701, PR[2]); srcGlow.castShadow = false;
  const det = new THREE.Group(); det.position.set(PR[0], 22.9, PR[2]); scene.add(det);
  tfMesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 28), alu, 0, 0, 0, det); tfMesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 20), dark, 0, 0.45, 0, det);
  tfMesh(new THREE.CircleGeometry(0.15, 28).rotateX(Math.PI / 2), tfStd('#8a8070', 0.6, 0.1), 0, -0.251, 0, det);
  const detGlow = tfMesh(new THREE.CircleGeometry(0.12, 28).rotateX(Math.PI / 2), glowM(0, 0, 0), 0, -0.252, 0, det); detGlow.castShadow = false;
  const gam = tfPuffs(scene, 6000, { additive: true, soft: 1.4 });
  // gamma rays (drawn as glowing wave packets, slowed down hugely): launched every 0.8 s, 6 m/s; the wavelength
  // stretches with height (exaggerated about 10^14 times) and the colour cools a little
  const G0 = TF.pound + 0.4, GV = 6, GTOP = 22.6, GY0 = 0.98;
  function drawGammas(t) {
    gam.begin();
    for (let i = 0; i < 40; i++) {
      const tl = G0 + i * 0.8; if (tl > t) break;
      const head = GY0 + (t - tl) * GV; if (head - 2.0 > GTOP) continue;
      for (let s = 0; s < 120; s++) {
        const y = head - s * 0.018; if (y < GY0 || y > GTOP) continue;
        const h = (y - GY0) / (GTOP - GY0), lam = 0.11 * (1 + 0.55 * h), env = Math.exp(-Math.pow((s - 60) / 34, 2));
        const ph = (y / lam) * Math.PI * 2, a = 0.07 * env;
        const ang = i * 1.7;
        gam.add(PR[0] + Math.cos(ang) * Math.sin(ph) * a, y, PR[2] + Math.sin(ang) * Math.sin(ph) * a, 0.03, 0.5 * env, tfLerp(1.3, 1.6, h), tfLerp(1.5, 1.25, h), tfLerp(3.0, 1.6, h));
      }
    }
    gam.end();
  }

  // ---- the cameras
  const CAM = {
    intro(t) {
      // along table A at the beams' height, past the chamber
      const k = K(t, TF.measured - 0.3, TF.pound + 0.2, (x) => x), dr = tfDrift(t, 0.004, 0.3, 41);
      const p = tfV([-0.95, 1.18, -0.4], [-0.75, 1.22, -3.0], k), at = tfV([0.1, 1.05, -1.6], [0.15, 1.08, -2.9], k);
      tfCam(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], at, 46, -2);
    },
    pound(t) {
      // the source, then up the shaft with the gamma rays, then the detector at the top
      const k1 = K(t, TF.pound + 2.6, TF.pound + 6.4), k0 = K(t, TF.pound, TF.pound + 2.6), dr = tfDrift(t, 0.01, 0.3, 43);
      const p = tfV([PR[0] + 0.95, 1.6, PR[2] + 1.05], [PR[0] + 0.9, 22.1, PR[2] + 0.95], k1);
      let at = tfV([PR[0], 0.95, PR[2]], [PR[0], 8, PR[2]], k0); at = tfV(at, [PR[0], 22.7, PR[2]], k1);
      tfCam(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], at, tfLerp(54, 62, k0 * (1 - k1)) + 4 * (1 - k0), 0);
    },
    nist(t) {
      // side-on at the jack, the ruler beside it
      const dr = tfDrift(t, 0.004, 0.3, 45), k = K(t, TF.nist, TF.nist + 7);
      const p = [JX - 0.55 + 0.1 * k, 1.28 + 0.06 * k, JZ + 1.25 - 0.1 * k];
      tfCam(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], [JX - 0.08, 1.28 + 0.12 * K(t, TF.lift, TF.lift + 2.5), JZ], 44);
    },
    jila(t) {
      // into the chamber's window, then the cloud itself
      const k1 = K(t, TF.jila - 0.3, TF.jila + 1.6), dr = tfDrift(t, 0.003, 0.3, 47);
      if (t < TF.jila + 1.6) {
        const p = tfV([CH[0] + 0.62, CH[1] + 0.12, CH[2] + 0.62], [CH[0] + 0.26, CH[1] + 0.01, CH[2] + 0.17], k1);
        tfCam(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], CH, tfLerp(44, 30, k1));
      } else {
        const k2 = K(t, TF.jila + 1.6, TF.gps, (x) => x), a = 0.6 + 0.35 * k2;
        tfCam(cam, [IN[0] + Math.sin(a) * tfLerp(2.7, 2.2, k2), IN[1] - 0.05, IN[2] + Math.cos(a) * tfLerp(2.7, 2.2, k2)], [IN[0] + 0.2, IN[1] + 0.06, IN[2]], 42);
      }
    },
  };

  const set = {
    scene, camera: cam,
    cuts() { return [TF.jila + 1.6]; },
    frame(t, shot) {
      const m = shot.mode;
      (CAM[m] || CAM.intro)(t);
      // the racks' lights blink (seeded, slow)
      for (const [l, i] of leds) l.visible = Math.sin(t * (0.6 + tfR(i, 3) * 2.5) + i) > -0.6;
      scr.update({ p: Math.floor(t * 20) / 20 * 3 });
      // the jack: 0 → 33 cm at TF.lift (the scissor arms open, the screw turns)
      const lift = 0.07 + 0.33 * K(t, TF.lift, TF.lift + 2.5);
      jtop.position.y = lift; const half = lift / 2, ang = Math.asin(MathX.clamp(lift / 0.46, -1, 1));
      for (const [a, d] of arms) { a.position.y = half; a.rotation.z = d * ang; }
      screw.position.y = half; knob.position.y = half; knob.rotation.x = lift * 60;
      mark.position.y = 0.9 + lift + 0.11;
      // the atoms: each layer ticks at its own rate (faster higher up, hugely exaggerated): stripes of phase build up
      atoms.begin();
      if (m === 'jila') {
        const T = Math.max(0, t - (TF.jila + 1.6));
        for (const [x, y, z, l, r] of ATOMS) {
          const f = 0.9 * (1 + 0.75 * (y + 0.5)), ph = Math.cos(2 * Math.PI * f * T + r * 0.3), b = 0.08 + 0.92 * Math.pow(0.5 + 0.5 * ph, 2);
          atoms.add(IN[0] + x, IN[1] + y, IN[2] + z, 0.02, 0.32 * b, 2.4 * b + 0.15, 0.6 * b + 0.12, 0.8 * b + 0.3);
        }
      }
      atoms.end();
      // the gamma rays
      if (m === 'pound') drawGammas(t); else { gam.begin(); gam.end(); }
      const hit = m === 'pound' ? Math.max(0, ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => { const tl = G0 + i * 0.8, ta = tl + (GTOP - GY0) / GV; return t > ta ? Math.exp(-(t - ta) * 4) : 0; })) : 0;
      detGlow.material.color.setRGB(1.2 * hit, 1.3 * hit, 2.4 * hit);
      srcGlow.material.color.setRGB(1.2, 1.4, 2.6).multiplyScalar(0.6 + 0.4 * Math.sin(t * 9));
    },
    grade(t, p, shot) {
      const m = shot.mode;
      p.exposure = 1.1; p.vignette = 0.6; p.bloom = 0.5; p.bloomThreshold = 0.8; p.grain = 0.028; p.contrast = 1.08; p.saturation = 1.05;
      if (m === 'jila' && t > TF.jila + 1.6) { p.bloom = 0.8; p.bloomThreshold = 0.5; p.vignette = 0.75; }
      if (m === 'pound') { p.exposure = 1.15; p.warmth = 0.03; }
      if (m === 'intro' || m === 'nist') { p.exposure = 1.75; p.vignette = 0.45; p.blackLift = 0.012; }
    },
    labels(t) {
      const m = tfShotAt(t).mode;
      if (m === 'pound') return [
        { p: [PR[0] + 0.05, 1.02, PR[2]], text: 'GAMMA RAYS', sub: 'LEAVE HERE', a: W(t, TF.pound + 0.8, TF.pound + 2.6, 0.3, 0.3) },
        { p: [PR[0] + 0.1, 22.5, PR[2]], text: '22.5 m UP', sub: 'A LITTLE LESS ENERGY · STRETCHED (EXAGGERATED)', a: W(t, TF.pound + 6.4, TF.planes - 0.2, 0.4, 0.3) }];
      if (m === 'nist') return [{ p: [JX + 0.12, 0.9 + 0.07 + 0.33 * K(t, TF.lift, TF.lift + 2.5) + 0.12, JZ], text: 'ONE CLOCK', sub: t > TF.lift + 2.5 ? '33 cm HIGHER · TICKS FASTER' : 'GOING UP', a: W(t, TF.nist + 0.6, TF.skytree - 0.2, 0.4, 0.3) }];
      if (m === 'jila' && t > TF.jila + 1.6) return [{ p: [IN[0] + 0.62, IN[1] + 0.0, IN[2]], text: '1 mm', sub: 'THE TOP TICKS FASTER (EXAGGERATED)', a: W(t, TF.jila + 2.6, TF.gps - 0.2, 0.4, 0.3) }];
      return [];
    },
  };
  return set;
};
