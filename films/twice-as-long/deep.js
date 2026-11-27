/* =====================================================================
   DEEP SET — from step 57 (turning round near Proxima Centauri) to step 90 (outside the observable universe), and
   the cold open (the film's last moment, a flash-forward).
   One frame for everything, the space set's (x east, y up, z south at Central Park), in light years from home. Your
   path is the same straight line. The Milky Way lies where the star sky's band says it is (its pole twStarSky's G0,
   its centre 26,000 ly towards C0), so your path climbs out of it at about 32°.
   Everything far is background, drawn at its true direction and angular size about the camera: point clouds whose
   positions are worked out relative to the camera in the vertex shader (each in its own unit: thousands of light
   years for a galaxy, millions for the web, billions for the observable universe), drawn before you, never in front.
   The Orion Nebula and Andromeda are placed beside your path at their real distances (their labels say so).
   ===================================================================== */

const TW_RD = 8000;                 // (m) where far things are drawn about the camera
const TW_GAL = (() => {
  const G = new THREE.Vector3(0.3, 0.86, -0.41).normalize(), C = new THREE.Vector3().crossVectors(G, new THREE.Vector3(1, 0, 0)).normalize();
  const e1 = C.clone().negate(), e3 = new THREE.Vector3().crossVectors(e1, G).normalize();
  // galaxy-local (x: from the centre towards the Sun, y: the pole) → the film's frame
  return { G, C, M: new THREE.Matrix3().set(e1.x, G.x, e3.x, e1.y, G.y, e3.y, e1.z, G.z, e3.z) };
})();
// where things are (light years from home, the film's frame)
const TW_MW_C = [TW_GAL.C.x * 26000, TW_GAL.C.y * 26000, TW_GAL.C.z * 26000];
const twYouLy = (t) => { const d = twDist(t) / TW_LY; return [TW_HEAD3.x * d, TW_HEAD3.y * d, TW_HEAD3.z * d]; };
const twBeside = (d, side, up) => [TW_HEAD3.x * d + TW_SIDE3.x * side + TW_UP3.x * up, TW_HEAD3.y * d + TW_SIDE3.y * side + TW_UP3.y * up, TW_HEAD3.z * d + TW_SIDE3.z * side + TW_UP3.z * up];
const TW_ORION = twBeside(1344, 30, 8);
const TW_ANDRO = twBeside(2.5e6, -1.1e5, 0.5e5);

// ---------------------------------------------------------------------------------------------------------------------
// A FAR CLOUD of points: data { pos (xyz in the cloud's unit), size (diameter, same unit), col (rgb), shape? (4) }
//   kind 0: a soft glow (additive) · 1: a little galaxy (additive; shape = [axis ratio, angle, spiral 0/1, phase])
//   kind 2: dust (darkens what is behind it)
//   set(cam, off (the cloud's origin relative to the camera, in its unit), rot (Matrix3, local → film frame), o)
// ---------------------------------------------------------------------------------------------------------------------
let TW_MAXPT = 0;
function twFarCloud(scene, data, kind = 0, order = -2500) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(data.pos, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(data.size, 1));
  g.setAttribute('aCol', new THREE.BufferAttribute(data.col, 3));
  if (kind === 1) g.setAttribute('aShape', new THREE.BufferAttribute(data.shape, 4));
  const U = { uRot: { value: new THREE.Matrix3() }, uOff: { value: new THREE.Vector3() }, uPx: { value: 1 }, uMin: { value: 1.5 }, uMax: { value: 160 },
    uA: { value: 1 }, uKeep: { value: 0 }, uNear: { value: 0 }, uSz: { value: 1 }, uFar: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: false, depthTest: false, depthWrite: false,
    blending: kind === 2 ? THREE.CustomBlending : THREE.AdditiveBlending,
    blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation,
    vertexShader: `
      uniform mat3 uRot; uniform vec3 uOff; uniform float uPx, uMin, uMax, uA, uKeep, uNear, uSz, uFar;
      attribute float aSize; attribute vec3 aCol; ${kind === 1 ? 'attribute vec4 aShape; varying vec4 vS; varying float vPx;' : ''}
      varying vec3 vC; varying float vA;
      void main(){
        vec3 r = uRot * position + uOff; float d = max(length(r), 1e-9); vec3 dir = r / d;
        float px = aSize * uSz / d * uPx, s = clamp(px, uMin, uMax);
        float a = px < uMin ? mix((px / uMin) * (px / uMin), 1.0, uKeep) : (px > uMax ? pow(uMax / px, 2.0) : 1.0);
        a *= uNear > 0.0 ? smoothstep(uNear * 0.5, uNear, d) : 1.0; a *= uFar > 0.0 ? 1.0 - smoothstep(uFar * 0.4, uFar, d) : 1.0;
        vA = uA * a; vC = aCol; ${kind === 1 ? 'vS = aShape; vPx = s;' : ''}
        gl_Position = projectionMatrix * modelViewMatrix * vec4(dir * ${TW_RD.toFixed(1)}, 1.0);
        gl_PointSize = s; }`,
    fragmentShader: kind === 1 ? `
      varying vec3 vC; varying float vA; varying vec4 vS; varying float vPx;
      void main(){
        vec2 q0 = gl_PointCoord * 2.0 - 1.0; float r0 = dot(q0, q0); if (r0 > 1.0) discard;
        // (a few pixels across: a soft dot; bigger: its shape, an ellipse with a core, and arms if it's a spiral)
        float w = smoothstep(7.0, 22.0, vPx), dot0 = pow(1.0 - r0, 2.2);
        float ca = cos(vS.y), sa = sin(vS.y); vec2 q = vec2(ca * q0.x + sa * q0.y, -sa * q0.x + ca * q0.y); q.y /= max(vS.x, 0.12);
        float r = length(q), core = exp(-r * r * 90.0), disc = exp(-r * 5.0) * max(0.0, 1.0 - r);
        if (vS.z > 0.5) { float th = atan(q.y, q.x), arm = 0.5 + 0.5 * cos(2.0 * th - 7.0 * log(r + 0.03) + vS.w);
          disc *= mix(1.0, 0.25 + 1.3 * pow(arm, 2.0), smoothstep(0.08, 0.3, r)); }
        vec3 c = mix(vC * dot0, (vC * disc * 1.6 + vec3(1.0, 0.88, 0.68) * core * 1.2) * 1.4, w);
        gl_FragColor = vec4(c * vA, 1.0); }` : kind === 2 ? `
      varying vec3 vC; varying float vA;
      void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard; gl_FragColor = vec4(vC, vA * pow(1.0 - r, 1.6)); }` : `
      varying vec3 vC; varying float vA;
      void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard; gl_FragColor = vec4(vC * vA * pow(1.0 - r, 2.2), 1.0); }`,
  });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = order; scene.add(pts);
  return {
    pts, U,
    set(cam, off, rot, o = {}) {
      pts.visible = o.on !== false && (o.a ?? 1) > 0.003; if (!pts.visible) return;
      pts.position.copy(cam.position);
      U.uOff.value.set(off[0], off[1], off[2]); U.uRot.value.copy(rot);
      U.uPx.value = (TW_PX / 2) / Math.tan(cam.fov * Math.PI / 360);
      const sc = Math.max(0.5, TW_PX / 1080);
      U.uMin.value = (o.min ?? 1.5) * sc; U.uMax.value = Math.min(TW_MAXPT || 256, (o.max ?? 160) * sc);
      U.uA.value = o.a ?? 1; U.uKeep.value = o.keep ? 1 : 0; U.uNear.value = o.near || 0; U.uSz.value = o.sz ?? 1; U.uFar.value = o.far || 0;
    },
    hide() { pts.visible = false; },
  };
}

// a seeded number in [0,1) and a normal deviate
const twH = (i, k, s) => hash1(Math.imul(i + 1, 0x9E3779B1) ^ Math.imul(k + 7, 0x85EBCA77) ^ Math.imul(s + 3, 0xC2B2AE3D));
const twGauss = (i, k, s) => Math.sqrt(-2 * Math.log(1 - twH(i, k, s) * 0.999999)) * Math.cos(6.2831853 * twH(i, k + 1, s));
function twCloudData(n, shape = false) { return { pos: new Float32Array(n * 3), size: new Float32Array(n), col: new Float32Array(n * 3), shape: shape ? new Float32Array(n * 4) : null, n: 0 }; }
function twCloudPut(D, x, y, z, s, r, g, b, sh) {
  const i = D.n++; D.pos[i * 3] = x; D.pos[i * 3 + 1] = y; D.pos[i * 3 + 2] = z; D.size[i] = s; D.col[i * 3] = r; D.col[i * 3 + 1] = g; D.col[i * 3 + 2] = b;
  if (sh && D.shape) { D.shape[i * 4] = sh[0]; D.shape[i * 4 + 1] = sh[1]; D.shape[i * 4 + 2] = sh[2]; D.shape[i * 4 + 3] = sh[3]; }
}
function twCloudTrim(D) { const n = D.n; return { pos: D.pos.subarray(0, n * 3), size: D.size.subarray(0, n), col: D.col.subarray(0, n * 3), shape: D.shape ? D.shape.subarray(0, n * 4) : null }; }

// ---------------------------------------------------------------------------------------------------------------------
// A SPIRAL GALAXY in kly (thousands of light years), its disc in the local x–z plane, y its pole.
//   o: { seed, Rs (scale length), Rmax, arms: [[phase, weight]], pitch (rad), bar (half length), barAng, n (disc), hot (0…1: how blue) }
//   → { glow (kind 0), stars (kind 0, tiny, kept), dust (kind 2) }
// ---------------------------------------------------------------------------------------------------------------------
function twGalaxyData(o) {
  const S = o.seed, N = o.n, glow = twCloudData(N + N / 4 + 600), stars = twCloudData(N / 2), dust = twCloudData(N / 4);
  const kArm = 1 / Math.tan(o.pitch), wSum = o.arms.reduce((a, b) => a + b[1], 0);
  const armAt = (i) => { let h = twH(i, 9, S) * wSum; for (const a of o.arms) { if (h < a[1]) return a[0]; h -= a[1]; } return o.arms[0][0]; };
  const radius = (i, k) => { const u = twH(i, k, S), e = 1 - Math.exp(-o.Rmax / o.Rs); return -o.Rs * Math.log(1 - u * e); };
  for (let i = 0; i < N; i++) {
    let r = radius(i, 1); if (r < 2.2) r = 2.2 + twH(i, 2, S) * 3;
    const inArm = twH(i, 3, S) < 0.72;
    let th = inArm ? armAt(i) + Math.log(r) * kArm + twGauss(i, 4, S) * (0.5 + 0.05 * r) / r : twH(i, 4, S) * 6.2832;
    const y = twGauss(i, 6, S) * (0.16 + 0.006 * r), x = r * Math.cos(th), z = r * Math.sin(th);
    const fall = Math.exp(-r / (o.Rs * 2.2)) * (0.5 + twH(i, 7, S)), hot = inArm ? o.hot : o.hot * 0.3;
    const c = [1.0 - 0.25 * hot, 0.92 - 0.04 * hot, 0.8 + 0.2 * hot];
    twCloudPut(glow, x, y, z, 1.3 + twH(i, 8, S) * 0.9, c[0] * fall, c[1] * fall, c[2] * fall);
    // pink star-forming knots along the arms
    if (inArm && twH(i, 10, S) < 0.035 && r > 4) twCloudPut(glow, x, y, z, 0.5 + twH(i, 11, S) * 0.5, 1.0 * fall * 2.2, 0.36 * fall * 2.2, 0.52 * fall * 2.2);
    // resolved stars (tiny, kept visible)
    if (i % 2 === 0) { const b = 0.25 + 0.75 * Math.pow(twH(i, 12, S), 3); twCloudPut(stars, x + twGauss(i, 13, S) * 0.4, y, z + twGauss(i, 14, S) * 0.4, 0.02, (0.8 + 0.2 * twH(i, 15, S)) * b, 0.85 * b, (0.85 + 0.15 * hot) * b); }
    // dust on the inner edge of the arms
    if (inArm && i % 4 === 1 && r > 3 && r < o.Rmax * 0.75) {
      const td = th - 0.09 - 0.25 / r;
      twCloudPut(dust, r * Math.cos(td), twGauss(i, 16, S) * 0.08, r * Math.sin(td), 1.0 + twH(i, 17, S) * 0.8, 0.045, 0.032, 0.026);
    }
  }
  // the bulge and the bar
  const nb = Math.floor(N / 4), ca = Math.cos(o.barAng), sa = Math.sin(o.barAng);
  for (let i = 0; i < nb; i++) {
    const bar = twH(i, 20, S) < 0.55;
    let x = twGauss(i, 21, S) * (bar ? o.bar * 0.5 : 1.6), z = twGauss(i, 22, S) * (bar ? o.bar * 0.16 : 1.6), y = twGauss(i, 23, S) * (bar ? 0.45 : 1.1);
    const X = x * ca - z * sa, Z = x * sa + z * ca, b = (0.9 + twH(i, 24, S) * 0.6) * (o.bulge ?? 1);
    twCloudPut(glow, X, y, Z, 1.4 + twH(i, 25, S), 1.0 * b, 0.82 * b, 0.58 * b);
  }
  return { glow: twCloudTrim(glow), stars: twCloudTrim(stars), dust: twCloudTrim(dust) };
}
// a little elliptical galaxy (a soft ball of old stars), added to a data block
function twBlobInto(D, cx, cy, cz, R, n, seed, k = 1) {
  for (let i = 0; i < n; i++) { const b = (0.6 + twH(i, 2, seed) * 0.6) * k; twCloudPut(D, cx + twGauss(i, 3, seed) * R, cy + twGauss(i, 4, seed) * R * 0.8, cz + twGauss(i, 5, seed) * R, R * 1.4, b, 0.84 * b, 0.62 * b); }
}

// ---------------------------------------------------------------------------------------------------------------------
// THE COSMIC WEB: galaxies on the walls, threads and knots between giant empty bubbles (a jittered grid of bubble
// centres; each galaxy is pushed onto the plane between its nearest bubbles). o: { seed, n, cell, R, size, sprite }
// ---------------------------------------------------------------------------------------------------------------------
function twWebData(o) {
  const S = o.seed, cs = o.cell, D = twCloudData(o.n + (o.local ? o.local[0] : 0), true), cache = new Map();
  const ctr = (i, j, k) => {
    const key = (i + 512) * 1048576 + (j + 512) * 1024 + (k + 512); let c = cache.get(key);
    if (!c) { c = [(i + 0.5 + 0.8 * (twH(key, 1, S) - 0.5)) * cs, (j + 0.5 + 0.8 * (twH(key, 2, S) - 0.5)) * cs, (k + 0.5 + 0.8 * (twH(key, 3, S) - 0.5)) * cs]; cache.set(key, c); }
    return c;
  };
  const near = (p) => {
    const I = Math.floor(p[0] / cs), J = Math.floor(p[1] / cs), K = Math.floor(p[2] / cs), L = [];
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) { const q = ctr(I + a, J + b, K + c); L.push([(p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2, q]); }
    L.sort((x, y) => x[0] - y[0]); return L;
  };
  for (let i = 0; i < o.n; i++) {
    // a point in the ball
    let p; for (let k = 0; ; k++) { p = [(twH(i, 10 + k * 3, S) * 2 - 1) * o.R, (twH(i, 11 + k * 3, S) * 2 - 1) * o.R, (twH(i, 12 + k * 3, S) * 2 - 1) * o.R]; if (Math.hypot(...p) <= o.R || k > 8) break; }
    const ty = twH(i, 40, S), planes = ty < 0.16 ? 3 : ty < 0.62 ? 2 : 1;
    for (let it = 0; it < 5; it++) {
      const L = near(p), c1 = L[0][1];
      for (let j = 1; j <= planes; j++) {
        const cj = L[j][1], nx = cj[0] - c1[0], ny = cj[1] - c1[1], nz = cj[2] - c1[2], l = Math.hypot(nx, ny, nz);
        const dd = ((p[0] - (c1[0] + cj[0]) / 2) * nx + (p[1] - (c1[1] + cj[1]) / 2) * ny + (p[2] - (c1[2] + cj[2]) / 2) * nz) / l;
        p[0] -= nx / l * dd; p[1] -= ny / l * dd; p[2] -= nz / l * dd;
      }
    }
    const th = cs * (planes === 3 ? 0.02 : planes === 2 ? 0.022 : 0.03);
    p[0] += twGauss(i, 50, S) * th; p[1] += twGauss(i, 51, S) * th; p[2] += twGauss(i, 52, S) * th;
    const rr = Math.hypot(...p) / o.R; if (rr > 1 || (o.hole && rr * o.R < o.hole)) continue;
    if (o.slab && Math.abs(p[0] * o.slab[0][0] + p[1] * o.slab[0][1] + p[2] * o.slab[0][2] - o.slab[2]) > o.slab[1]) continue;   // (only a slice)
    const edge = o.soft ? Math.exp(-Math.pow(rr / 0.8, 4)) : 1;
    const b = (planes === 3 ? 1.0 : planes === 2 ? 0.62 : o.wall ?? 0.34) * (0.5 + twH(i, 53, S)) * edge, spiral = twH(i, 54, S) < 0.6;
    const c = spiral ? [0.72, 0.82, 1.0] : [1.0, 0.84, 0.62];
    twCloudPut(D, p[0], p[1], p[2], o.size * (0.5 + twH(i, 55, S) * (planes === 3 ? 1.6 : 1.0)), c[0] * b, c[1] * b, c[2] * b,
      [spiral ? 0.25 + 0.75 * twH(i, 56, S) : 0.55 + 0.4 * twH(i, 56, S), twH(i, 57, S) * 6.2832, spiral ? 1 : 0, twH(i, 58, S) * 6.2832]);
    if (planes === 3) { const d2 = p[0] * p[0] + p[1] * p[1] + p[2] * p[2]; if (!D.knot || d2 < D.knot[3]) D.knot = [p[0], p[1], p[2], d2]; }
  }
  // (optionally: move the whole web so a knot of it sits where you are, and give you a little group of galaxies close by)
  if (o.local && D.knot) {
    const k = D.knot; for (let i = 0; i < D.n; i++) { D.pos[i * 3] -= k[0]; D.pos[i * 3 + 1] -= k[1]; D.pos[i * 3 + 2] -= k[2]; }
    for (let i = 0; i < o.local[0]; i++) {
      const r = o.local[1] * (0.25 + Math.pow(twH(i, 60, S), 0.7)), a = twH(i, 61, S) * 6.2832, z = twH(i, 62, S) * 2 - 1, q = Math.sqrt(1 - z * z), sp = twH(i, 63, S) < 0.7, b = 0.9 + twH(i, 64, S) * 0.6;
      const c = sp ? [0.72, 0.82, 1.0] : [1.0, 0.84, 0.62];
      twCloudPut(D, r * q * Math.cos(a), r * z * 0.5, r * q * Math.sin(a), o.size * (0.6 + twH(i, 65, S) * 0.9), c[0] * b, c[1] * b, c[2] * b, [sp ? 0.3 + 0.7 * twH(i, 66, S) : 0.6 + 0.35 * twH(i, 66, S), twH(i, 67, S) * 6.2832, sp ? 1 : 0, twH(i, 68, S) * 6.2832]);
    }
  }
  return twCloudTrim(D);
}

TW_SETS.deep = (app) => {
  const S = twSet(app, { sky: '#000000', fov: 50, near: 0.05, far: 2e4, hemi: ['#3a4a66', '#0a0c10', 0.3], sun: [1, 0, 0], sunColor: '#fff2e0', sunI: 2.2, env: ['#0a0e18', '#141a26', '#05070a'] });
  const scene = S.scene, cam = S.camera;
  try { TW_MAXPT = app.renderer.getContext().getParameter(app.renderer.getContext().ALIASED_POINT_SIZE_RANGE)[1] || 256; } catch (e) { TW_MAXPT = 256; }
  const sky = twStarSky(scene, 9000, 5);
  // the Milky Way (kly)
  const MW = twGalaxyData({ seed: 3, Rs: 10, Rmax: 52, arms: [[0.35, 1], [0.35 + Math.PI, 1], [0.35 + Math.PI / 2, 0.55], [0.35 + Math.PI * 1.5, 0.55]], pitch: 0.23, bar: 9, barAng: 0.45, n: 64000, hot: 0.7 });
  const mwGlow = twFarCloud(scene, MW.glow, 0, -2600), mwStars = twFarCloud(scene, MW.stars, 0, -2599), mwDust = twFarCloud(scene, MW.dust, 2, -2598);
  // Andromeda (kly): bigger, tighter arms, a ring; M32 and M110 beside it
  const AN = twGalaxyData({ seed: 8, Rs: 17, Rmax: 110, arms: [[1.1, 1], [1.1 + Math.PI, 1]], pitch: 0.13, bar: 5, barAng: 0.2, n: 52000, hot: 0.55, bulge: 0.45 });
  { const D = twCloudData(2200); twBlobInto(D, 9, 2, 14, 1.6, 700, 31, 1.6); twBlobInto(D, -16, -4, -30, 3.2, 1400, 32, 0.7); const T = twCloudTrim(D);
    AN.sats = T; }
  const anGlow = twFarCloud(scene, AN.glow, 0, -2700), anStars = twFarCloud(scene, AN.stars, 0, -2699), anDust = twFarCloud(scene, AN.dust, 2, -2698), anSats = twFarCloud(scene, AN.sats, 0, -2697);
  // the Orion Nebula (ly): glowing gas round four bright young stars, dark dust in front
  const OR = (() => {
    const g = twCloudData(3000), d = twCloudData(500);
    for (let i = 0; i < 2600; i++) {
      const r = Math.pow(twH(i, 1, 77), 1.6) * 21, th = twH(i, 2, 77) * 6.2832, ph = Math.acos(2 * twH(i, 3, 77) - 1);
      const x = r * Math.sin(ph) * Math.cos(th), y = r * Math.cos(ph) * 0.8, z = r * Math.sin(ph) * Math.sin(th), f = Math.exp(-r / 9);
      const teal = r < 3.5 && twH(i, 4, 77) < 0.5;
      twCloudPut(g, x, y, z, 3.4 + twH(i, 5, 77) * 3.5, teal ? 0.25 * f : 1.0 * f, teal ? 0.75 * f : 0.32 * f, teal ? 0.8 * f : 0.42 * f);
    }
    for (let i = 0; i < 5; i++) twCloudPut(g, (twH(i, 6, 78) - 0.5) * 0.6, (twH(i, 7, 78) - 0.5) * 0.6, (twH(i, 8, 78) - 0.5) * 0.6, 0.7, 3.0, 3.0, 3.2);
    for (let i = 0; i < 480; i++) { const a = twH(i, 9, 79) * 6.2832, r = 8 + twH(i, 10, 79) * 14; twCloudPut(d, r * Math.cos(a) - 5, (twH(i, 11, 79) - 0.6) * 14, r * Math.sin(a) * 0.4 + 9, 3.8 + twH(i, 12, 79) * 3, 0.05, 0.03, 0.03); }
    return { g: twCloudTrim(g), d: twCloudTrim(d) };
  })();
  const orGlow = twFarCloud(scene, OR.g, 0, -2400), orDust = twFarCloud(scene, OR.d, 2, -2399);
  // the web, three sizes: around you at step 80 (Mly), at step 84 (Mly), and the observable universe (Gly)
  const webNear = twFarCloud(scene, twWebData({ seed: 5, n: 30000, cell: 45, R: 320, size: 0.45, soft: false, local: [220, 14] }), 1, -2900);
  const webMid = twFarCloud(scene, twWebData({ seed: 6, n: 70000, cell: 200, R: 1000, size: 2.4, soft: true, wall: 0.14 }), 1, -2950);
  const ballPts = twFarCloud(scene, twWebData({ seed: 7, n: 30000, cell: 9.5, R: 46.5, size: 0.9, soft: false, wall: 0.12 }), 1, -3050);
  // (and the universe going on past it, the same web: the ball is only what Earth can see, not an edge)
  const pastPts = twFarCloud(scene, twWebData({ seed: 8, n: 160000, cell: 9.5, R: 160, size: 0.9, soft: false, wall: 0.12, hole: 46.5 }), 1, -3049);
  // the observable universe's glow: a haze through it, and its edge (the oldest light there is)
  const ballMat = new THREE.ShaderMaterial({
    uniforms: { uC: { value: new THREE.Vector3() }, uR: { value: 1 }, uA: { value: 1 } }, transparent: false, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `${TW_GLSL_NOISE}
      uniform vec3 uC; uniform float uR, uA; varying vec3 vW;
      void main(){
        vec3 v = normalize(vW - cameraPosition), oc = uC - cameraPosition; float tc = dot(oc, v), b2 = dot(oc, oc) - tc * tc;
        float x = clamp(1.0 - b2 / (uR * uR), 0.0, 1.0), ch = sqrt(x);
        vec3 hit = normalize(cameraPosition + v * (tc - ch * uR) - uC);
        float mott = cF3(hit * 7.0) * 0.7 + cF3(hit * 19.0) * 0.3;
        float shell = clamp(0.08 / max(ch, 0.08), 0.0, 1.0) * (0.55 + 0.9 * mott);
        vec3 col = vec3(0.1, 0.13, 0.3) * ch * 0.3 + vec3(1.0, 0.42, 0.16) * shell * 0.32 * smoothstep(0.0, 0.02, ch) + vec3(1.0, 0.6, 0.3) * exp(-ch * 40.0) * 0.35;
        gl_FragColor = vec4(col * uA, 1.0); }`,
  });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), ballMat); ball.frustumCulled = false; ball.renderOrder = -3060; scene.add(ball);
  const ballGlow = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.ShaderMaterial({
    uniforms: { uC: ballMat.uniforms.uC, uR: { value: 1 }, uA: { value: 1 } }, transparent: false, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform vec3 uC; uniform float uR, uA; varying vec3 vW;
      void main(){ vec3 v = normalize(vW - cameraPosition), oc = uC - cameraPosition; float tc = dot(oc, v), b = sqrt(max(0.0, dot(oc, oc) - tc * tc)) / uR;
        float g = exp(-max(0.0, b - 1.0) / 0.1) * smoothstep(0.985, 1.0, b); gl_FragColor = vec4(vec3(1.0, 0.5, 0.22) * g * 0.22 * uA, 1.0); }`,
  }));
  ballGlow.frustumCulled = false; ballGlow.renderOrder = -3061; scene.add(ballGlow);
  // you
  const you = new YouCharacter(scene, { seed: 11 }); you.cup(false);
  const adds = twPuffs(scene, 600, { additive: true, soft: 1.6 });
  const fill = new THREE.DirectionalLight('#dfe8ff', 1.0); scene.add(fill); scene.add(fill.target);
  const rimL = new THREE.DirectionalLight('#b8d0ff', 1.5); scene.add(rimL); scene.add(rimL.target);   // (from behind you: your hair and shoulders against black)
  const H = TW_HEAD3, SD = TW_SIDE3, UP = TW_UP3, h3 = [H.x, H.y, H.z];
  const rel = (f, s, u) => [H.x * f + SD.x * s + UP.x * u, H.y * f + SD.y * s + UP.y * u, H.z * f + SD.z * s + UP.z * u];
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const n3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const yawY = Math.atan2(H.x, H.z);
  const I3 = new THREE.Matrix3();
  // (the end of the pull-out: a slice through the web, face-on to you, so its threads and empty bubbles read; the same
  // galaxies as webMid's, and more, while the rest of webMid fades away)
  // (through where you are as the pull-out passes through it: webMid's centre is (t − 452.6) × 60 behind you, see frame())
  const SLAB_N = n3(rel(-0.35, 0.8, 0.45)), SLAB_C = (462.3 - 452.6) * 60 * (H.x * SLAB_N[0] + H.y * SLAB_N[1] + H.z * SLAB_N[2]);
  const webSlab = twFarCloud(scene, twWebData({ seed: 6, n: 170000, cell: 200, R: 1000, size: 2.4, soft: true, wall: 0.2, slab: [SLAB_N, 70, SLAB_C] }), 1, -2949);
  // Andromeda's tilt: 77° from face-on, seen from where you pass it
  const AN_M = (() => {
    const v = new THREE.Vector3(...n3(sub3(twYouLy(TW_T[75] + TW_D[75] + 0.3), TW_ANDRO))), q = new THREE.Vector3(0.2, 1, 0.1).normalize();
    const p = q.clone().sub(v.clone().multiplyScalar(v.dot(q))).normalize(), nrm = v.clone().multiplyScalar(Math.cos(1.05)).addScaledVector(p, Math.sin(1.05)).normalize();
    const e1 = new THREE.Vector3().crossVectors(nrm, v).normalize(), e3 = new THREE.Vector3().crossVectors(e1, nrm).normalize();
    return new THREE.Matrix3().set(e1.x, nrm.x, e3.x, e1.y, nrm.y, e3.y, e1.z, nrm.z, e3.z);
  })();
  const PASS_AN = (() => { let lo = TW_T[74], hi = TW_T[77]; const dA = TW_ANDRO[0] * h3[0] + TW_ANDRO[1] * h3[1] + TW_ANDRO[2] * h3[2]; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (twDist(m) / TW_LY < dA) lo = m; else hi = m; } return lo; })();
  const scaleM = (M, k) => M.clone().multiplyScalar(k);

  // ---- you: a stride for every step, drifting while you wait
  function youPose(t, o = {}) {
    const s = twStepAt(t);
    let p;
    if (o.pose) p = o.pose;
    else if (s.u < 1) p = YOU_POSES.leap(0.12 + 0.76 * s.u, { lead: s.n % 2 ? 1 : -1, reach: 0.9, arms: 'swing' });
    else { const k = MathX.smooth(t - (TW_T[s.n] + TW_D[s.n]), 0, 0.8); p = YouCharacter.mix(YOU_POSES.leap(0.88, { lead: s.n % 2 ? 1 : -1, reach: 0.9 }), twFloat(t), k); }
    if (o.neck !== undefined) p.neck = o.neck;
    return p;
  }
  // a camera that sees you against a far direction D: `dist` metres back from you along D, moved `side`/`up` (m) across it
  const basis = (D) => { const u0 = n3(sub3([UP.x, UP.y, UP.z], mul3(D, D[0] * UP.x + D[1] * UP.y + D[2] * UP.z))), s0 = n3([D[1] * u0[2] - D[2] * u0[1], D[2] * u0[0] - D[0] * u0[2], D[0] * u0[1] - D[1] * u0[0]]); return [s0, u0]; };
  const against = (D, dist, side, up, fov, aim = [0, 0], lookAt = 1) => {
    const [s0, u0] = basis(D), p = add3(mul3(D, -dist), add3(mul3(s0, side), mul3(u0, up)));
    return { p, at: add3(p, mul3(D, 100)), fov, aim, lk: lookAt };
  };
  const dirTo = (q, t) => n3(sub3(q, twYouLy(t)));
  const shot0 = (t) => (set._shot ? set._shot.t0 : t);
  // where the cold open sits in story time: just after the film's last frame (step ninety reached, nothing replayed)
  const OPEN_T = TW.end + 1.2;

  const STAGE = {
    // ---- the cold open (story time: after the end): you, outside everything there is
    // (it starts on your face and pulls back fast until you are small against all of it)
    open: (t, u) => { const B = dirTo([0, 0, 0], t), v = u - 1, e = Ease.inOutCubic(MathX.clamp((v - 0.1) / 2.1, 0, 1));
      return { cam: against(B, 0.85 + 4.4 * e, -0.08 - 1.1 * e, 0.66 - 0.45 * e, 42, [-0.28 * e, 0.02]), you: { turn: 0.12, expr: 'awe', pose: twFloat(t) }, ball: 1, light: 'ball' }; },
    // ---- near Proxima: turn round, home is that star
    turn: (t, u) => { const B = dirTo([0, 0, 0], t); return { cam: against(B, 6.0, -1.7, -0.7, 50, [0.04, -0.1]), you: { turn: MathX.smooth(u, 0.6, 2.2), expr: 'awe', look: mul3(B, 1000), pose: YOU_POSES.lookBack(t, 1 - MathX.smooth(u, 0.6, 2.2), 1) }, stars: 1, sun: 1,
      labels: [{ dir: B, text: 'HOME', sub: 'THE SUN', a: twWin(t, shot0(t) + 2.4, 1e9, 0.4), side: 'l' }] }; },
    keep: (t, u) => ({ cam: { p: rel(-3.4 + 0.3 * u, 1.1, 0.9), at: rel(4, -0.3, 0.2), fov: 54 }, you: { expr: 'determined' }, stars: 1, streak: 0.6 }),
    sixty: (t, u) => ({ cam: { p: rel(1.35, 0.42, 0.82), at: rel(0, 0, 0.74), fov: 30 }, you: { expr: u < 1.2 ? 'determined' : 'sad', pose: YouCharacter.mix(youPose(t), twFloat(t), MathX.smooth(u, 2.4, 3.4)) }, stars: 1, streak: 0.4 }),
    sixtyfour: (t, u) => { const B = n3(add3(mul3(h3, -1), rel(0, 0.32, 0.08))); return { cam: against(B, 4.6 - 0.2 * u, -1.5, 0.4, 54, [-0.12, 0]), you: { expr: 'awe', look: mul3(B, 1000) }, stars: 0.8, rest: 1, band: 0.7, mw: 1, orion: 1,
      labels: [{ obj: 'orion', text: 'THE ORION NEBULA', sub: '1,344 LIGHT YEARS FROM EARTH<br>PLACED ON YOUR PATH', a: twWin(t, TW_T[64] + 0.8, 1e9, 0.3) }] }; },
    climb: (t, u) => { const C = dirTo(TW_MW_C, t); return { cam: against(n3(add3(C, mul3(h3, -0.4))), 4.2, 1.0, 1.8, 58, [0, -0.05]), you: { expr: 'determined' }, stars: 0.6 * (1 - MathX.smooth(t, TW_T[67], TW_T[67] + 2.5)), band: 0.3, mw: 1, mwSz: 0.45, mwA: 0.55 }; },
    milkyway: (t, u) => { const C = dirTo(TW_MW_C, t); return { cam: against(C, 5.5, -2.2, 0.6, 62, [0.28, -0.04]), you: { turn: 0.0, expr: 'awe', look: mul3(C, 1000) }, mw: 1, web: 0.25,
      labels: [{ obj: 'mw', text: 'THE MILKY WAY', sub: 'A FEW HUNDRED BILLION STARS', a: twWin(t, TW_T[70] + 1.6, 1e9, 0.4) }] }; },
    mwHere: (t, u) => { const C = dirTo(TW_MW_C, t); return { cam: { p: [0, 0, 0], at: mul3(dirTo([0, 0, 0], t), 100), fov: 34 - 1.2 * u }, you: { on: false }, mw: 1, web: 0.25,
      labels: [{ obj: 'home', text: 'EVERY PERSON WHO EVER LIVED', a: twWin(t, shot0(t) + 1.2, 1e9, 0.4), you: true }] }; },
    humans: (t, u) => { const C = dirTo(TW_MW_C, t); return { cam: against(C, 3.6, 0.55, 0.35, 36, [-0.16, 0]), you: { turn: 0.0, expr: 'sad', pose: twFloat(t) }, mw: 1, web: 0.35 }; },
    andromeda: (t, u) => { const B = dirTo(TW_ANDRO, Math.max(t, PASS_AN + 0.35)); return { cam: against(B, 4.6 - 0.2 * u, 1.3, 0.35, 56, [-0.12, 0]), you: { expr: 'awe', look: mul3(dirTo(TW_ANDRO, t), 1000) }, rest: 1, mw: 1, andro: 1, web: 0.4,
      labels: [{ obj: 'andro', text: 'ANDROMEDA', sub: '2.5 MILLION LIGHT YEARS FROM EARTH<br>PLACED ON YOUR PATH', a: twWin(t, PASS_AN + 0.25, 1e9, 0.3) }, { obj: 'mw', text: 'THE MILKY WAY', sub: 'HOME', a: twWin(t, PASS_AN + 1.6, 1e9, 0.4) }] }; },
    dust: (t, u) => ({ cam: { p: rel(-3.2 + 0.2 * u, 1.4, 0.7), at: rel(3, -0.5, 0.2), fov: 60 }, you: { expr: 'awe' }, near: 1 }),
    web: (t, u) => ({ cam: { p: rel(2.4 - 0.1 * u, -2.3, 0.5), at: rel(-1, 0.4, 0.4), fov: 64, aim: [0, 0.04] }, you: { expr: 'awe', look: rel(-10, 30, 6) }, mid: 1 }),
    webOut: (t, u) => { const k = Ease.inOutSine(MathX.clamp(u / ((set._shot.t1 - set._shot.t0) * 0.72), 0, 1));   /* (out by 72% of the shot, then the web holds) */ return { cam: { p: [0, 0, 0], at: [0, 0, 0], fov: 50, out: k }, you: { on: k < 0.04 }, mid: 1, slab: MathX.smooth(k, 0.35, 0.75),
      midFar: k > 0.3 ? 600 + 3e5 * Math.pow((k - 0.3) / 0.7, 3) : 600, labels: [{ youDot: true, text: 'YOU', a: twWin(t, shot0(t) + 1.0, 1e9, 0.3), you: true },
        { dir: n3(add3(mul3(SLAB_N, -1), rel(0.18, 0.05, -0.32))), text: 'THE COSMIC WEB', sub: 'GALAXIES IN THREADS, AROUND EMPTY BUBBLES', a: twWin(t, set._shot.t0 + 3.4, 1e9, 0.4), side: 'l' }] }; },
    // ---- step ninety, and the end (story time runs on from the leap; the cold open is later still)
    ninety: (t, u) => { const B = dirTo([0, 0, 0], t); return { cam: against(n3(add3(B, rel(0, 0.25, 0.1))), 3.8 - 0.25 * MathX.smooth(t, TW_T[90], TW_T[90] + 3), -1.3, 0.35, 50, [0.12, 0.02]), you: { expr: t < TW_T[90] + 2.6 ? 'determined' : 'awe' }, ball: 1, light: 'ball',
      labels: [{ dir: B, text: 'ALL WE CAN SEE FROM EARTH', sub: 'THE UNIVERSE CARRIES ON PAST IT', a: twWin(t, TW_T[90] + 1.2, 1e9, 0.4), side: 'r' }] }; },
    last: (t, u) => { const B = dirTo([0, 0, 0], t); return { cam: against(B, 6.0, 1.5, -0.7, 50, [-0.04, -0.1]), you: { turn: 1, expr: 'sad', look: mul3(B, 1000), pose: twFloat(t) }, ball: 1, light: 'ball',
      labels: [{ dir: B, text: 'HOME', a: twWin(t, shot0(t) + 0.8, 1e9, 0.4), side: 'l' }] }; },
    or: (t, u) => { const B = dirTo([0, 0, 0], t); return { cam: against(B, 2.6 + 0.15 * u, -0.75, 0.3, 44, [-0.1, 0]), you: { turn: 1 - MathX.smooth(u, 0.3, 1.8), expr: 'determined', pose: twFloat(t) }, ball: 1, light: 'ball' }; },
    question: (t, u) => { const B = dirTo([0, 0, 0], t), [s0] = basis(B), Q = n3(add3(B, mul3(s0, 1.2))); return { cam: against(Q, 9 + 0.5 * u, 0, 2.1, 56, [0.0, 0]), you: { turn: 1, expr: 'determined', pose: twFloat(t) }, ball: 1, light: 'ball' }; },
  };

  // a far point (light years from home) as a direction about the camera, for labels: [position, scale]
  const farAt = (q, tv, cp) => { const d = n3(sub3(q, twYouLy(tv))); return add3(cp, mul3(d, TW_RD * 0.98)); };
  const set = {
    scene, camera: cam,
    frame(t, shot) {
      set._shot = shot;
      const u = t - shot.t0, tv = shot.mode === 'open' ? OPEN_T + u : t;     // (the cold open's story time)
      TW_PX = app.renderer.domElement.height || 1080;
      const st = (STAGE[shot.mode] || STAGE.keep)(tv, u, shot);
      const Y = twYouLy(tv);
      // ---- you
      const yon = st.you.on !== false;
      you.visible(yon);
      if (yon) {
        you.place(-UP.x * 0.95, -UP.y * 0.95, -UP.z * 0.95, yawY + Math.PI * (st.you.turn || 0), 0, 0);
        you.pose(youPose(tv, { pose: st.you.pose }), ['relax', 'relax']);
        you.expr(st.you.expr || 'determined', tv, 1); you.look(st.you.look ? new THREE.Vector3(...st.you.look) : null);
      }
      // ---- the camera
      let cp;
      if (st.cam.out !== undefined) {
        // pulling right out: from beside you to outside the web (the distance grows a millionfold; drawn about the camera)
        // (you are drawn at the origin; past the first few metres the camera's distance is only in light years)
        const k = st.cam.out, D = n3(rel(-0.35, 0.8, 0.45));
        set._outLy = k > 0.04 ? Math.pow(10, MathX.lerp(-1, 9.6, k)) : 0;
        twCam(cam, mul3(D, Math.min(6, 2.5 + 90 * k)), [0, 0, 0], 50); set._outDir = D;
      } else {
        const dr = twDrift(tv, 0.02, 0.5, 9);
        twCam(cam, add3(st.cam.p, dr), st.cam.at, st.cam.fov);
        if (st.cam.aim) { cam.rotateOnWorldAxis(new THREE.Vector3(...cam.up.toArray()), st.cam.aim[0]); cam.rotateX(st.cam.aim[1]); cam.updateMatrixWorld(true); }
        set._outLy = 0;
      }
      cam.near = 0.05; cam.far = 2e4; cam.updateProjectionMatrix();
      cp = cam.position.toArray();
      // the camera's place in light years (from home): you, plus (when pulling out) its distance from you
      const CL = set._outLy ? add3(Y, mul3(set._outDir, set._outLy)) : Y;
      const off = (q, unit) => mul3(sub3(q, CL), 1 / unit);
      // ---- the stars (inside the galaxy), bent by your speed
      const beta = st.rest ? 0 : Math.min(twBetaAt(tv), 0.94);
      sky.set(cam, h3, st.stars ? beta : 0, { on: !!st.stars, bright: (st.stars || 0) * 0.9 * (1 - 0.55 * MathX.smooth(beta, 0.3, 0.9)), band: st.band ?? 1, streak: (st.streak || 0) * MathX.smooth(beta, 0.05, 0.5) });
      // ---- the Milky Way, Andromeda, the Orion Nebula
      const mwM = TW_GAL.M, mwOff = off(TW_MW_C, 1000), dMW = Math.hypot(...mwOff);
      // (inside it, the near glow would cover the sky: it fades in as you climb; the star sky's band does the inside)
      const mwA = (st.mw || 0) * MathX.smooth(dMW, 27.0, 31.0) * 0.9 + (st.mw || 0) * 0.1;
      mwGlow.set(cam, mwOff, mwM, { a: mwA * 0.55 * (st.mwA ?? 1), max: 140, sz: st.mwSz ?? 1 });
      mwStars.set(cam, mwOff, mwM, { a: mwA * 0.9, min: 1.1, keep: true, max: 3 });
      mwDust.set(cam, mwOff, mwM, { a: mwA * 0.55, max: 140, sz: st.mwSz ?? 1 });
      const anOff = off(TW_ANDRO, 1000), aA = st.andro || 0;
      anGlow.set(cam, anOff, AN_M, { a: aA * 0.42, max: 160 }); anStars.set(cam, anOff, AN_M, { a: aA * 0.8, min: 1.1, keep: true, max: 3 }); anDust.set(cam, anOff, AN_M, { a: aA * 0.5, max: 160 }); anSats.set(cam, anOff, AN_M, { a: aA * 0.5, max: 160 });
      const orOff = off(TW_ORION, 1), oA = st.orion || 0;
      orGlow.set(cam, orOff, I3, { a: oA * 0.35, max: 220 }); orDust.set(cam, orOff, I3, { a: oA * 0.6, max: 220 });
      // ---- the web: near you at step 80, around you at step 84 (both centred on where you are then), and the observable universe
      // (both move with you, drifting back past you: the steps are far too long to show the same galaxies twice)
      const nearC = add3(sub3(Y, mul3(h3, (tv - 449.4) * 6e6)), rel(0, 3.5e6, 0.8e6)), midC = sub3(Y, mul3(h3, (tv - 452.6) * 60e6));
      webNear.set(cam, add3(off(nearC, 1e6), [0, 0, 0]), I3, { a: (st.near || 0) + (st.web || 0) * 0.6, min: 1.2, max: 200 });
      const slabK = st.slab || 0;
      webMid.set(cam, off(midC, 1e6), I3, { a: (st.mid || 0) * 1.5 * (1 - 0.9 * slabK), min: 1.2, max: 120, far: st.midFar ?? 600 });
      webSlab.set(cam, off(midC, 1e6), I3, { a: slabK * 1.9, min: 1.3, max: 120, keep: true, far: st.midFar ?? 600 });
      const bOff = off([0, 0, 0], 1e9), bD = Math.hypot(...bOff), bA = st.ball || 0;
      ballPts.set(cam, bOff, I3, { a: bA * 0.42, min: 1.0, max: 60 });
      pastPts.set(cam, bOff, I3, { a: bA * 0.5, min: 1.0, max: 5 });
      ball.visible = ballGlow.visible = bA > 0.01 && bD > 46.5 * 1.002;
      if (ball.visible) {
        const dir = n3(bOff), r = TW_RD * 46.5 / bD, c = add3(cp, mul3(dir, TW_RD));
        ball.position.set(...c); ball.scale.setScalar(r); ball.updateMatrixWorld();
        ballGlow.position.set(...c); ballGlow.scale.setScalar(r * 1.5); ballGlow.updateMatrixWorld();
        ballMat.uniforms.uC.value.set(...c); ballMat.uniforms.uR.value = r; ballMat.uniforms.uA.value = bA; ballGlow.material.uniforms.uR.value = r; ballGlow.material.uniforms.uA.value = bA;
      }
      // ---- the Sun from Proxima: a bright star
      adds.begin();
      if (st.sun) {
        const d = n3(sub3([0, 0, 0], Y)), q = add3(cp, mul3(d, TW_RD * 0.9)), px = Math.tan(cam.fov * Math.PI / 360) * 2 / 1080 * TW_RD * 0.9;
        adds.add(...q, px * 9, 1, 1, 0.95, 0.85); adds.add(...q, px * 30, 0.35, 1, 0.85, 0.6);
      }
      adds.end();
      // ---- the light on you: from what fills the sky
      const Ld = st.light === 'ball' ? n3(bOff) : st.andro ? n3(anOff) : st.mw ? n3(mwOff) : n3(sub3([0, 0, 0], Y));
      const Lc = st.light === 'ball' ? '#ffb27a' : st.mw ? '#fff0dc' : '#fff6ea';
      S.sun.color.set(Lc); S.sun.intensity = st.light === 'ball' ? 2.4 : st.mw || st.andro ? 1.6 : 1.2;
      S.sun.position.set(Ld[0] * 100, Ld[1] * 100, Ld[2] * 100); S.sun.target.position.set(0, 0, 0); S.sun.target.updateMatrixWorld();
      S.hemi.intensity = 0.4; S.hemi.color.set(st.mid || st.near ? '#8a9ad8' : '#7a86a8'); S.hemi.groundColor.set('#141820');
      fill.position.set(cp[0], cp[1] + 0.6, cp[2]); fill.target.position.set(0, 0, 0); fill.target.updateMatrixWorld(); fill.intensity = 0.9;
      { const l = Math.hypot(...cp) || 1; rimL.position.set(-cp[0] / l * 10 + UP.x * 6, -cp[1] / l * 10 + UP.y * 6, -cp[2] / l * 10 + UP.z * 6); rimL.target.position.set(0, 0, 0); rimL.target.updateMatrixWorld(); }
      set._st = st; set._tv = tv; set._cp = cp; set._CL = CL;
    },
    labels(t, shot) {
      const st = set._st; if (!st || !st.labels) return [];
      const tv = set._tv, cp = set._cp, CL = set._CL;
      const dirOf = (q) => add3(cp, mul3(n3(sub3(q, CL)), TW_RD * 0.98));
      // (a big thing's label sits up and to the right of its middle, by about its size on screen, never off it)
      const e = cam.matrixWorld.elements, edgeOf = (q, R) => { const d = Math.hypot(...sub3(q, CL)), a = Math.min(0.25, R / d) * 0.55; return add3(dirOf(q), mul3([e[0] + e[4], e[1] + e[5], e[2] + e[6]], a * TW_RD * 0.98)); };
      return st.labels.map((l) => {
        let p = null;
        if (l.dir) p = add3(cp, mul3(l.dir, TW_RD * 0.98));
        else if (l.obj === 'orion') p = dirOf(add3(TW_ORION, rel(0, 0, 9)));
        else if (l.obj === 'mw') p = edgeOf(TW_MW_C, 50000);
        else if (l.obj === 'home') p = dirOf([0, 0, 0]);
        else if (l.obj === 'andro') p = edgeOf(TW_ANDRO, 70000);
        else if (l.youDot) p = [0, 0, 0];
        void tv;
        return p ? { p, text: l.text, sub: l.sub, a: l.a, you: l.you, side: l.side } : null;
      }).filter(Boolean);
    },
    grade(t, p, shot) {
      p.exposure = 1.0; p.saturation = 1.15; p.contrast = 1.1; p.bloom = 0.55; p.bloomThreshold = 0.95; p.vignette = 0.5; p.grain = 0.02; p.blackLift = 0.0;
      if (shot.mode === 'open' || shot.mode === 'ninety' || shot.mode === 'last' || shot.mode === 'or' || shot.mode === 'question') { p.bloom = 0.75; p.bloomThreshold = 0.85; p.warmth = 0.04; }
    },
  };
  return set;
};
