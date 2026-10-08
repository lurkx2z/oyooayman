/* =====================================================================
   PROPS — the things in the leisure centre that move or measure, each a pure function of story time:
     GvScale      the body-scan scale you stand on: its screen reads your weight (70.0 → 140.0 kg)
     GvTreadmills three treadmills by the windows; their belts run at 10 km/h
     GvBench      the bench-press rack: the 80 kg bar on the safety arms, the heave, the drop
     GvHoop       the practice basket in the sports hall, the ball (2 G) and its 1 G ghost, both arcs dotted
     GvWater      the pool's surface: ripples, the ring waves from every splash (they run 41 % faster at 2 G),
                  seen from above (reflections, the tiles through it) and from below (Snell's window)
   Also the small shared helpers (gvMesh, gvBox, …) and the caustics on the pool's tiles.
   ===================================================================== */

function gvMesh(geo, mat, parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  m.castShadow = cast; m.receiveShadow = true;
  parent.add(m); return m;
}
function gvBox(w, h, d, mat, parent, x, y, z, rx, ry, rz, cast) { return gvMesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z, rx, ry, rz, cast); }
const _gvUp = new THREE.Vector3(0, 1, 0), _gvD = new THREE.Vector3();
// a cylinder between two points (re-aimed with gvAim)
function gvTube(r, mat, parent, sides = 6) { return gvMesh(new THREE.CylinderGeometry(r, r, 1, sides), mat, parent); }
function gvAim(m, a, b) {
  _gvD.subVectors(b, a); const L = Math.max(_gvD.length(), 1e-4);
  m.position.addVectors(a, b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(_gvUp, _gvD.multiplyScalar(1 / L));
  m.scale.set(1, L, 1);
}
// a quick decaying wobble after t0
function gvJolt(t, t0, f = 3, decay = 0.35) { return t < t0 ? 0 : Math.sin((t - t0) * f * Math.PI * 2) * Math.exp(-(t - t0) / decay); }

/* ---------------------------------------------------------------------
   caustics: the light focused by the moving surface, dancing on the pool's tiles (and on you, under water)
   --------------------------------------------------------------------- */
const GV_CAU = { uCauTime: { value: 0 }, uCauSun: { value: 1 } };
const GV_CAU_GLSL = /* glsl */`
  float gvCau(vec2 p, float t){
    // two drifting layers of warped ridges; where they meet the light bunches into a bright web
    vec2 a = p * 1.25 + vec2(sin(p.y * 0.9 + t * 0.8), cos(p.x * 0.8 - t * 0.7)) * 0.95;
    vec2 b = p * 1.65 + vec2(cos(p.y * 1.1 - t * 0.6), sin(p.x * 1.2 + t * 0.9)) * 0.85;
    float ra = abs(sin(a.x + t * 1.0) + sin(a.y - t * 0.8));
    float rb = abs(sin(b.x - t * 0.7) + sin(b.y + t * 0.9));
    return (1.0 - smoothstep(0.0, 0.42, ra)) * 0.6 + (1.0 - smoothstep(0.0, 0.42, rb)) * 0.6;
  }`;
function gvCaustics(mat, strength = 0.85) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uCauTime = GV_CAU.uCauTime; sh.uniforms.uCauSun = GV_CAU.uCauSun;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vCauW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCauW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vCauW; uniform float uCauTime, uCauSun;\n' + GV_CAU_GLSL)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        { float under = smoothstep(${(GV_WATER + 0.05).toFixed(3)}, ${(GV_WATER - 0.25).toFixed(3)}, vCauW.y);
          float c = gvCau(vCauW.xz * 0.9, uCauTime);
          totalEmissiveRadiance += vec3(0.62, 0.86, 0.95) * c * under * ${strength.toFixed(3)} * uCauSun * diffuseColor.rgb; }`);
  };
  mat.customProgramCacheKey = () => 'gvCaustics' + strength;
  mat.needsUpdate = true;
}

/* ---------------------------------------------------------------------
   the body-scan scale (a platform you stand on, a column, a console with a screen and two grips)
   --------------------------------------------------------------------- */
class GvScale {
  constructor(scene) {
    const K = GV_C.kiosk, g = new THREE.Group(); g.name = 'scale'; g.position.set(K.x, 0, K.z); scene.add(g); this.g = g;
    const body = Mat.std('#e9e8e4', { roughness: 0.4 }), dark = Mat.std('#24272b', { roughness: 0.5 }), chrome = Mat.std('#c4c9ce', { roughness: 0.22, metalness: 0.9 });
    gvBox(0.58, 0.06, 0.64, body, g, 0, 0.03, 0.86);                         // the platform (you stand on it)
    gvBox(0.5, 0.008, 0.56, dark, g, 0, 0.062, 0.88, 0, 0, 0, false);         // its grippy top
    for (const sx of [-0.13, 0.13]) gvBox(0.1, 0.004, 0.22, chrome, g, sx, 0.067, 0.94, 0, 0, 0, false);   // foot electrodes
    gvBox(0.12, 1.16, 0.1, body, g, 0, 0.61, 0.42);                           // the column
    // the console, tilted toward you; the screen in it; the two grips at its sides
    const con = new THREE.Group(); con.position.set(0, 1.26, 0.48); con.rotation.x = -0.62; g.add(con);
    gvBox(0.36, 0.26, 0.08, body, con, 0, 0, 0);
    gvBox(0.31, 0.2, 0.01, dark, con, 0, 0.0, 0.041, 0, 0, 0, false);
    this.cv = Tex.canvas(512, 320); this.ctx = this.cv.getContext('2d');
    this.tex = Tex.tex(this.cv, { repeat: false });
    const scr = new THREE.MeshStandardMaterial({ map: this.tex, emissiveMap: this.tex, emissive: '#ffffff', emissiveIntensity: 1.15, roughness: 0.25, name: 'scaleScreen' });
    scr.userData.grime = 0; scr.userData.surface = true;
    gvMesh(new THREE.PlaneGeometry(0.28, 0.175), scr, con, 0, 0.0, 0.047, 0, 0, 0, false);
    // the grips: upright handles on short arms either side of the console
    for (const sx of [-1, 1]) { gvMesh(new THREE.CylinderGeometry(0.017, 0.017, 0.22, 10), chrome, g, sx * 0.215, 1.1, 0.55); gvBox(0.05, 0.025, 0.04, body, g, sx * 0.19, 1.2, 0.55); gvBox(0.05, 0.025, 0.04, body, g, sx * 0.19, 1.0, 0.55); gvBox(0.035, 0.22, 0.04, body, g, sx * 0.165, 1.1, 0.5); }
    this.grips = [-1, 1].map((sx) => new THREE.Vector3(K.x + sx * 0.215, 1.1, K.z + 0.55));
    this._last = '';
    this.update(0);
  }
  update(t) {
    const kg = gvScaleKg(t), s = kg.toFixed(1), hot = kg > 100;
    const key = s + (hot ? 'h' : '') + (t > GV.g0 + 0.1 ? 'w' : '');
    if (key === this._last) return;
    this._last = key;
    const x = this.ctx, W = 512, H = 320;
    x.fillStyle = '#0d1a26'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#1c3550'; x.fillRect(0, 0, W, 58);
    x.fillStyle = '#cfe3f2'; x.font = '600 30px "Inter", sans-serif'; x.textAlign = 'left'; x.textBaseline = 'middle';
    x.fillText('BODY SCAN', 22, 30);
    x.textAlign = 'right'; x.fillStyle = '#8fb3cc'; x.fillText('WEIGHT', W - 22, 30);
    x.fillStyle = hot ? '#ffb340' : '#ffffff'; x.font = '700 124px "JetBrains Mono", monospace'; x.textAlign = 'right'; x.textBaseline = 'alphabetic';
    x.fillText(s, W - 104, 218);
    x.font = '600 52px "Inter", sans-serif'; x.fillStyle = hot ? '#ffb340' : '#cfe3f2'; x.fillText('kg', W - 30, 216);
    x.fillStyle = '#1c3550'; x.fillRect(22, 240, W - 44, 26);
    x.fillStyle = hot ? '#ff7a3a' : '#4fc3f7'; x.fillRect(22, 240, (W - 44) * MathX.clamp(kg / 160, 0, 1), 26);
    if (t > GV.g0 + 0.1) { x.fillStyle = '#ffb340'; x.font = '600 26px "Inter", sans-serif'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('HOLD STILL…', 22, 292); }
    this.tex.needsUpdate = true;
  }
}

/* ---------------------------------------------------------------------
   treadmills by the windows (the runners face the glass, −X; the belts run toward +X at 10 km/h)
   --------------------------------------------------------------------- */
const GV_BELT = 10 / 3.6;
class GvTreadmills {
  constructor(scene) {
    const dark = Mat.std('#26292d', { roughness: 0.55 }), grey = Mat.std('#7c8288', { roughness: 0.4, metalness: 0.5 }), chrome = Mat.std('#c4c9ce', { roughness: 0.22, metalness: 0.9 });
    const c = Tex.canvas(64, 256), x = c.getContext('2d');
    x.fillStyle = '#1b1c1e'; x.fillRect(0, 0, 64, 256);
    for (let i = 0; i < 256; i += 16) { x.fillStyle = 'rgba(70,72,76,0.8)'; x.fillRect(0, i, 64, 3); }
    this.beltTex = Tex.tex(c); this.beltTex.repeat.set(1, 3);
    const beltM = new THREE.MeshStandardMaterial({ map: this.beltTex, roughness: 0.8, name: 'belt' }); beltM.userData.grime = 0;
    const [xa, xb] = GV_C.treadX, L = xb - xa, cx = (xa + xb) / 2;
    this.belts = [];
    for (const z of GV_C.treadZ) {
      const g = new THREE.Group(); g.position.set(cx, 0, z); scene.add(g);
      gvBox(L + 0.1, 0.16, 0.86, dark, g, 0, 0.08, 0);
      const belt = gvMesh(new THREE.PlaneGeometry(0.56, L - 0.15), beltM, g, 0, 0.165, 0, -Math.PI / 2, 0, Math.PI / 2, false);
      for (const s of [-1, 1]) gvBox(L - 0.1, 0.05, 0.12, grey, g, 0.05, 0.17, s * 0.36, 0, 0, 0, false);   // side rails (the footplates)
      // the front uprights and console (toward the window, −X), the handrails along the sides
      for (const s of [-1, 1]) { gvBox(0.07, 1.2, 0.07, grey, g, -L / 2 + 0.1, 0.72, s * 0.38); gvBox(0.5, 0.045, 0.045, chrome, g, -L / 2 + 0.33, 1.08, s * 0.38); }
      gvBox(0.18, 0.32, 0.82, dark, g, -L / 2 + 0.12, 1.36, 0, 0, 0, 0.35);
      const scr = new THREE.MeshStandardMaterial({ color: '#0c1a24', emissive: '#2aa0e0', emissiveIntensity: 0.6, roughness: 0.3 });
      gvBox(0.01, 0.16, 0.34, scr, g, -L / 2 + 0.215, 1.38, 0, 0, 0, 0.35, false);
      this.belts.push(belt);
    }
    // (a texture shared by all three: one offset per frame)
  }
  update(t) { this.beltTex.offset.y = -((t * GV_BELT) / ((GV_C.treadX[1] - GV_C.treadX[0] - 0.15) / 3)) % 1; }
}

/* ---------------------------------------------------------------------
   the bench-press rack: a bench along −Z, two uprights at its head, safety arms, the 80 kg bar
   --------------------------------------------------------------------- */
// the bar's height: on its hooks at 1 G (pressed), down onto the safety arms at the change, the heave and the drop
const GV_BAR = { rack: 1.18, lock: 1.22, arms: 0.84 };
function gvBarY(t) {
  const B = GV.bench, A = GV_BAR;
  if (t < GV.g0) return A.lock - 0.32 * (0.5 - 0.5 * Math.cos(t * 2.6));                   // reps at 1 G
  const a = t - GV.g0 - 0.04, y0 = A.lock - 0.32 * (0.5 - 0.5 * Math.cos((GV.g0 + 0.04) * 2.6));
  if (t < GV.g0 + 0.04) return y0;
  const fall = 0.5 * GV_G * 0.55 * a * a;                                                   // (he resists a little: 0.55 of free fall)
  if (y0 - fall > A.arms) return y0 - fall;
  if (t < B.heave) return A.arms + 0.012 * Math.max(0, gvJolt(t, GV.g0 + 0.04 + Math.sqrt(2 * (y0 - A.arms) / (GV_G * 0.55)), 6, 0.08));
  if (t < B.drop) return A.arms + 0.065 * MathX.smooth(t, B.heave + 0.25, B.heave + 1.2) + 0.004 * Math.sin(t * 37) * MathX.smooth(t, B.heave + 0.3, B.heave + 0.6);
  const h = 0.065 + 0.004, d = t - B.drop, T = Math.sqrt(2 * h / GV_G);
  if (d < T) return A.arms + h - 0.5 * GV_G * d * d;
  return A.arms + 0.01 * Math.max(0, gvJolt(t, B.drop + T, 7, 0.06));
}
class GvBench {
  constructor(scene) {
    const B = GV_C.bench, Z = (d) => B.barZ + B.feet * d, g = new THREE.Group(); g.name = 'bench'; g.position.set(B.x, 0, 0); scene.add(g); this.g = g;
    const frame = Mat.std('#2b2f34', { roughness: 0.45, metalness: 0.55 }), pad = Mat.std('#22344d', { roughness: 0.65 }), chrome = Mat.std('#c4c9ce', { roughness: 0.22, metalness: 0.9 });
    // (offsets d run from the bar toward the lifter's feet)
    gvBox(0.3, 0.09, 1.45, pad, g, 0, 0.42, Z(0.475));
    for (const d of [-0.1, 1.05]) { gvBox(0.08, 0.38, 0.08, frame, g, 0, 0.19, Z(d)); gvBox(0.5, 0.05, 0.08, frame, g, 0, 0.03, Z(d)); }
    for (const s of [-1, 1]) {
      gvBox(0.075, 1.75, 0.075, frame, g, s * 0.62, 0.875, Z(-0.12));                    // uprights
      gvBox(0.075, 1.75, 0.075, frame, g, s * 0.62, 0.875, Z(0.95));
      gvBox(0.07, 0.07, 1.25, frame, g, s * 0.62, GV_BAR.arms - 0.055, Z(0.42));         // safety arms
      gvBox(0.1, 0.06, 0.1, frame, g, s * 0.62, GV_BAR.rack - 0.05, Z(-0.07));           // J-hooks
      gvBox(0.075, 0.075, 1.15, frame, g, s * 0.62, 1.75, Z(0.42));
    }
    for (const d of [-0.12, 0.95]) gvBox(1.32, 0.06, 0.06, frame, g, 0, 0.03, Z(d));
    // the bar: 20 kg bar + 2 × 30 kg
    this.bar = new THREE.Group(); this.bar.position.set(0, GV_BAR.lock, B.barZ); g.add(this.bar);
    gvMesh(new THREE.CylinderGeometry(0.0145, 0.0145, 1.32, 10), chrome, this.bar, 0, 0, 0, 0, 0, Math.PI / 2);
    const red = Mat.std('#b8231d', { roughness: 0.55 }), blk = Mat.std('#222326', { roughness: 0.6 });
    for (const s of [-1, 1]) {
      gvMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 10), chrome, this.bar, s * 0.87, 0, 0, 0, 0, Math.PI / 2);
      gvMesh(new THREE.CylinderGeometry(0.225, 0.225, 0.05, 24), red, this.bar, s * 0.72, 0, 0, 0, 0, Math.PI / 2);
      gvMesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 18), blk, this.bar, s * 0.765, 0, 0, 0, 0, Math.PI / 2);
      gvMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 10), chrome, this.bar, s * 0.81, 0, 0, 0, 0, Math.PI / 2);
    }
  }
  update(t) { this.bar.position.y = gvBarY(t); this.bar.rotation.z = 0.01 * Math.sin(t * 23) * MathX.smooth(t, GV.bench.heave + 0.3, GV.bench.heave + 0.6) * (t < GV.bench.drop ? 1 : 0); }
}

/* ---------------------------------------------------------------------
   the basket in the sports hall, the ball (2 G) and its 1 G ghost; both arcs leave dotted trails
   --------------------------------------------------------------------- */
// the ball's flight from the release (in the plane x = hoop.x; z decreases toward the basket)
function gvBall(t, g, out) {
  const T = GV_THROW, H = GV_C.court.hoop, r = 0.12, z0 = H.z + T.d, a = t - T.t0;
  out.x = H.x; out.y = T.y0; out.z = z0; out.vis = 1;
  if (a < 0) return out;
  if (g === GV_G0) {                                         // the ghost: swish, through the net, drops, fades
    const ar = T.d / T.vx;
    if (a < ar) { out.z = z0 - T.vx * a; out.y = T.y0 + T.vy * a - 0.5 * g * a * a; return out; }
    const vy = T.vy - g * ar, b = a - ar, y = T.rim + vy * b - 0.5 * g * b * b;
    out.z = H.z - 0.6 * b; out.y = Math.max(r, y); out.vis = 1 - MathX.smooth(b, 0.7, 1.3); return out;
  }
  // the real ball: lands short, then bounces (e = 0.72) lower and lower, rolling on toward the wall
  let vy = T.vy, vz = T.vx, y = T.y0, z = z0, tt = a;
  for (let k = 0; k < 9; k++) {
    const tl = (vy + Math.sqrt(vy * vy + 2 * g * (y - r))) / g;
    if (tt < tl) { out.y = y + vy * tt - 0.5 * g * tt * tt; out.z = z - vz * tt; return out; }
    z -= vz * tl; tt -= tl; y = r; vy = 0.72 * Math.sqrt(Math.max(0, (vy - g * tl) ** 2)); vz *= 0.8;
    if (vy < 0.25) break;
  }
  out.y = r; out.z = Math.max(GV_C.court.z0 + 0.5, z - vz * tt * Math.exp(-tt * 0.6)); return out;
}
class GvHoop {
  constructor(scene) {
    const C = GV_C.court, H = C.hoop, g = new THREE.Group(); g.name = 'hoop'; scene.add(g);
    const white = Mat.std('#f4f4f2', { roughness: 0.3 }), orange = Mat.std('#e2561e', { roughness: 0.45, metalness: 0.2 }), frame = Mat.std('#3b4046', { roughness: 0.45, metalness: 0.55 });
    gvBox(1.8, 1.05, 0.04, white, g, H.x, 2.9 + 0.525, C.board);
    gvBox(0.59, 0.45, 0.045, Mat.std('#c8321e', { roughness: 0.4 }), g, H.x, 3.15, C.board + 0.004, 0, 0, 0, false);
    gvBox(0.53, 0.39, 0.05, white, g, H.x, 3.15, C.board + 0.006, 0, 0, 0, false);
    for (const sx of [-0.5, 0.5]) gvBox(0.06, 0.06, C.board - C.z0, frame, g, H.x + sx, 3.6, (C.board + C.z0) / 2);
    gvMesh(new THREE.TorusGeometry(0.229, 0.01, 6, 28), orange, g, H.x, GV_THROW.rim, H.z, Math.PI / 2, 0, 0);
    gvBox(0.04, 0.03, 0.3, orange, g, H.x, GV_THROW.rim, H.z - 0.38);
    // the net: twelve strings from the rim to a smaller ring below
    const net = new THREE.Group(); g.add(net);
    const nm = new THREE.MeshStandardMaterial({ color: '#f2f2f0', roughness: 0.8, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 12; i++) { const a0 = i / 12 * Math.PI * 2, a1 = a0 + Math.PI / 6, t = gvTube(0.004, nm, net, 3); gvAim(t, new THREE.Vector3(H.x + Math.cos(a0) * 0.225, GV_THROW.rim, H.z + Math.sin(a0) * 0.225), new THREE.Vector3(H.x + Math.cos(a1) * 0.15, GV_THROW.rim - 0.4, H.z + Math.sin(a1) * 0.15)); t.castShadow = false; }
    // the ball (seams painted on) and its ghost
    const c = Tex.canvas(256, 128), x = c.getContext('2d');
    x.fillStyle = '#d8661f'; x.fillRect(0, 0, 256, 128); x.strokeStyle = '#1a1210'; x.lineWidth = 4;
    for (const u of [64, 128, 192]) { x.beginPath(); x.moveTo(u, 0); x.lineTo(u, 128); x.stroke(); }
    x.beginPath(); x.moveTo(0, 64); x.lineTo(256, 64); x.stroke();
    this.ball = gvMesh(new THREE.SphereGeometry(0.12, 18, 12), new THREE.MeshStandardMaterial({ map: Tex.tex(c), roughness: 0.6 }), scene);
    this.ghost = gvMesh(new THREE.SphereGeometry(0.12, 16, 10), new THREE.MeshBasicMaterial({ color: '#dff3ff', transparent: true, opacity: 0.55, depthWrite: false }), scene, 0, 0, 0, 0, 0, 0, false);
    // dotted trails (one instanced mesh each)
    const dot = new THREE.SphereGeometry(0.03, 8, 6);
    this.dotsG = new THREE.InstancedMesh(dot, new THREE.MeshBasicMaterial({ color: '#e6f6ff', transparent: true, opacity: 0.9, depthWrite: false }), 40);
    this.dotsR = new THREE.InstancedMesh(dot, new THREE.MeshBasicMaterial({ color: '#ffab6a', transparent: true, opacity: 0.85, depthWrite: false }), 40);
    for (const d of [this.dotsG, this.dotsR]) { d.frustumCulled = false; d.count = 0; scene.add(d); }
    this._o = { x: 0, y: 0, z: 0, vis: 1 }; this._m = new THREE.Matrix4(); this.holder = null;
  }
  // (the shooter holds the ball until the release: cast.js tells us where his hands are)
  update(t, hands) {
    const T = GV_THROW, o = this._o, M = this._m;
    gvBall(t, GV_G, o);
    if (t < T.t0 && hands) { const k = MathX.smooth(t, T.t0 - 0.12, T.t0); this.ball.position.set(MathX.lerp(hands.x, o.x, k), MathX.lerp(hands.y, o.y, k), MathX.lerp(hands.z, o.z, k)); }
    else this.ball.position.set(o.x, o.y, o.z);
    this.ball.rotation.x = -Math.max(0, t - T.t0) * 9;
    gvBall(t, GV_G0, o);
    this.ghost.visible = t > T.t0 && o.vis > 0.02; this.ghost.position.set(o.x, o.y, o.z); this.ghost.material.opacity = 0.55 * o.vis;
    // the trails: a dot every 0.045 s of flight, fading out a few seconds after the throw
    const fade = 1 - MathX.smooth(t, T.t0 + 3.0, T.t0 + 3.8);
    for (const [mesh, g, tEnd] of [[this.dotsG, GV_G0, T.d / T.vx], [this.dotsR, GV_G, 0.83]]) {
      let n = 0;
      if (t > T.t0 && fade > 0) for (let s = 0.045; s < Math.min(t - T.t0, tEnd) && n < 40; s += 0.045) { gvBall(T.t0 + s, g, o); M.makeTranslation(o.x, o.y, o.z); mesh.setMatrixAt(n++, M); }
      mesh.count = n; mesh.instanceMatrix.needsUpdate = true; mesh.material.opacity = (g === GV_G0 ? 0.9 : 0.8) * fade;
    }
  }
}

/* ---------------------------------------------------------------------
   the pool's surface
   --------------------------------------------------------------------- */
// ring waves from splashes: [x, z, t0, amplitude, speed, wavenumber, width, decay]. Speeds are 2 G speeds (×1.41).
const GV_RINGS = [
  [GV_C.ladder.x - 0.5, GV_C.ladder.z, GV.ladder.splash, 0.07, 2.4, 4.2, 0.6, 1.6],
  [GV_ME.float[0] + 0.4, GV_ME.float[1] + 0.1, GV.slide + 0.32, 0.09, 2.4, 4.0, 0.6, 1.8],
  [-4.5, GV_C.tower.edge + 0.6, 0, 0.32, 3.1, 2.4, 1.1, 2.6],
  [-4.5, GV_C.tower.edge + 0.6, 0, 0.14, 2.2, 3.6, 0.7, 2.2],
];
const GV_BOBS = 8;
// the same height function as the shader (to put your head on the waves)
function gvWaveH(x, z, t, bobs) {
  let h = 0.01 * Math.sin((x * 1.9 + z * 1.1) * 2.2 - t * 4.2) + 0.008 * Math.sin((-x * 1.3 + z * 1.7) * 2.7 - t * 4.9) + 0.006 * Math.sin((x * 0.4 - z * 2.1) * 3.6 - t * 5.8);
  for (const R of GV_RINGS) {
    const a = t - R[2]; if (a <= 0) continue;
    const r = Math.hypot(x - R[0], z - R[1]), f = R[4] * a, e = Math.exp(-(((r - f) / R[6]) ** 2)) * Math.exp(-a / R[7]) / Math.sqrt(1 + 0.6 * r);
    h += R[3] * e * Math.cos(R[5] * (r - f));
  }
  if (bobs) for (const B of bobs) { const r = Math.hypot(x - B[0], z - B[1]); h += B[2] * Math.sin(r * 9 - t * 6 + B[3]) * Math.exp(-r * 1.2); }
  return h;
}
const GV_NO_BOBS = [];
class GvWater {
  constructor(scene) {
    const P = GV_C.pool;
    GV_RINGS[2][2] = GV_FALL.hit; GV_RINGS[3][2] = GV_FALL.hit + 0.25;
    const geo = new THREE.PlaneGeometry(P.x1 - P.x0, P.z1 - P.z0, 84, 132); geo.rotateX(-Math.PI / 2);
    geo.translate((P.x0 + P.x1) / 2, GV_WATER, (P.z0 + P.z1) / 2);
    this.u = {
      uTime: { value: 0 }, uSun: { value: new THREE.Vector3(-0.66, 0.6, 0.28).normalize() },
      uRing: { value: GV_RINGS.map((R) => new THREE.Vector4(R[0], R[1], R[2], R[3])) },
      uRingK: { value: GV_RINGS.map((R) => new THREE.Vector4(R[4], R[5], R[6], R[7])) },
      uBob: { value: Array.from({ length: GV_BOBS }, () => new THREE.Vector4(0, 0, 0, 0)) },
      uFogColor: { value: new THREE.Color() }, uFogDensity: { value: 0 }, uFoam: { value: new THREE.Vector4(0, 0, 0, 0) },
    };
    const H = /* glsl */`
      uniform float uTime; uniform vec4 uRing[${GV_RINGS.length}]; uniform vec4 uRingK[${GV_RINGS.length}]; uniform vec4 uBob[${GV_BOBS}];
      float gvH(vec2 p){
        float t = uTime;
        float h = 0.010 * sin(dot(p, vec2(1.9, 1.1)) * 2.2 - t * 4.2) + 0.008 * sin(dot(p, vec2(-1.3, 1.7)) * 2.7 - t * 4.9) + 0.006 * sin(dot(p, vec2(0.4, -2.1)) * 3.6 - t * 5.8);
        h += 0.003 * sin(dot(p, vec2(2.3, -0.6)) * 6.1 - t * 7.4) + 0.002 * sin(dot(p, vec2(-1.1, -2.4)) * 7.3 - t * 8.3);
        for (int i = 0; i < ${GV_RINGS.length}; i++){
          vec4 R = uRing[i]; vec4 K = uRingK[i]; float a = t - R.z;
          if (a <= 0.0) continue;
          float r = distance(p, R.xy), f = K.x * a;
          h += R.w * exp(-pow((r - f) / K.z, 2.0)) * exp(-a / K.w) / sqrt(1.0 + 0.6 * r) * cos(K.y * (r - f));
        }
        for (int i = 0; i < ${GV_BOBS}; i++){ vec4 B = uBob[i]; if (B.z == 0.0) continue; float r = distance(p, B.xy); h += B.z * sin(r * 9.0 - t * 6.0 + B.w) * exp(-r * 1.2); }
        return h;
      }`;
    const mat = new THREE.ShaderMaterial({
      uniforms: this.u, transparent: true, side: THREE.DoubleSide, depthWrite: false,
      vertexShader: H + /* glsl */`
        varying vec3 vW;
        void main(){ vec3 p = position; p.y += gvH(p.xz); vW = (modelMatrix * vec4(p, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
      fragmentShader: H + /* glsl */`
        uniform vec3 uSun, uFogColor; uniform float uFogDensity; uniform vec4 uFoam; varying vec3 vW;
        void main(){
          vec2 p = vW.xz; float e = 0.03;
          float h0 = gvH(p), hx = gvH(p + vec2(e, 0.0)), hz = gvH(p + vec2(0.0, e));
          vec3 N = normalize(vec3(-(hx - h0) / e, 1.0, -(hz - h0) / e));
          vec3 V = normalize(cameraPosition - vW); float d = length(cameraPosition - vW);
          float deep = smoothstep(-19.0, -21.5, vW.z);
          vec4 col;
          if (gl_FrontFacing) {
            float F = 0.02 + 0.8 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
            vec3 R = reflect(-V, N);
            // what the surface mirrors: the bright glazed wall on the left, the hall's walls, the ceiling
            float win = smoothstep(-0.15, -0.55, R.x) * smoothstep(0.85, 0.2, R.y) * (0.75 + 0.25 * step(0.5, fract(vW.z * 0.5 + R.z * 3.0)));
            vec3 env = mix(vec3(0.36, 0.5, 0.54), vec3(0.6, 0.68, 0.7), smoothstep(0.2, 0.9, R.y));
            env = mix(env, vec3(0.92, 0.98, 1.0), win * 0.8);
            float spec = pow(max(dot(R, uSun), 0.0), 220.0) * 6.0 + pow(max(dot(R, normalize(vec3(0.0, 1.0, 0.15))), 0.0), 60.0) * 0.5;
            vec3 body = mix(vec3(0.16, 0.5, 0.56), vec3(0.06, 0.3, 0.42), deep);
            float a = mix(mix(0.3, 0.55, deep), 1.0, F);
            vec3 c = mix(body, env, F) + spec;
            // foam where the dive hit
            float fo = uFoam.w > 0.0 ? uFoam.w * smoothstep(uFoam.z, uFoam.z * 0.3, distance(p, uFoam.xy)) * (0.55 + 0.45 * sin(p.x * 23.0 + p.y * 17.0 + uTime * 3.0) * sin(p.x * 11.0 - p.y * 19.0)) : 0.0;
            c = mix(c, vec3(0.95, 0.98, 1.0), fo); a = max(a, fo);
            col = vec4(c, a);
          } else {
            // from below: inside Snell's window the bright hall above; outside it the surface mirrors the pool
            vec3 Nd = -N; float ci = dot(V, Nd);
            float win = smoothstep(0.62, 0.72, ci);
            vec3 above = vec3(0.78, 0.92, 0.95) * (0.9 + 0.5 * pow(max(dot(-V, uSun * vec3(1.0, -1.0, 1.0)), 0.0), 30.0));
            vec3 mirror = mix(vec3(0.1, 0.42, 0.48), vec3(0.05, 0.27, 0.36), deep);
            vec3 c = mix(mirror, above, win) + 0.25 * vec3(0.8, 0.95, 1.0) * smoothstep(0.004, 0.02, abs(hx - h0) + abs(hz - h0)) * win;
            float fo = uFoam.w > 0.0 ? uFoam.w * smoothstep(uFoam.z, uFoam.z * 0.3, distance(p, uFoam.xy)) : 0.0;
            col = vec4(mix(c, vec3(0.9, 0.97, 1.0), fo * 0.7), mix(0.82, 0.95, 1.0 - win));
          }
          float fog = min(1.0 - exp(-uFogDensity * d), 0.97);
          gl_FragColor = vec4(mix(col.rgb, uFogColor, fog), col.a);
        }`,
    });
    this.mesh = new THREE.Mesh(geo, mat); this.mesh.name = 'water'; this.mesh.renderOrder = 2; this.mesh.frustumCulled = false;
    scene.add(this.mesh);
    this.bobs = [];
  }
  // bobs: people in the water making little ripples ([x, z, amplitude, phase]); foam: [x, z, radius, amount]
  update(t, scene, bobs, foam) {
    const u = this.u; u.uTime.value = t;
    this.bobs = bobs || [];
    for (let i = 0; i < GV_BOBS; i++) { const B = this.bobs[i]; if (B) u.uBob.value[i].set(B[0], B[1], B[2], B[3]); else u.uBob.value[i].set(0, 0, 0, 0); }
    if (foam) u.uFoam.value.set(foam[0], foam[1], foam[2], foam[3]); else u.uFoam.value.set(0, 0, 0, 0);
    u.uFogColor.value.copy(scene.fog.color); u.uFogDensity.value = scene.fog.density;
  }
  // (without the bobs: they follow the people, who follow the water: keeping them out keeps every frame a pure function of t)
  height(x, z, t) { return GV_WATER + gvWaveH(x, z, t, GV_NO_BOBS); }
}
