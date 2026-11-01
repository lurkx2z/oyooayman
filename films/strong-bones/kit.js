/* =====================================================================
   KIT — small helpers for this film: materials, text textures, easing, and hand poses written in WORLD terms
   (ViewerHands wants camera space; sbHandPose converts for a camera held still during the shot).
   ===================================================================== */

const SB_SETS = {};
const sbClamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const sbSmooth = (t, a, b) => { const u = sbClamp((t - a) / (b - a)); return u * u * (3 - 2 * u); };
const sbLerp = (a, b, u) => a + (b - a) * u;
const sbEaseOut = (u) => 1 - Math.pow(1 - sbClamp(u), 3);
const sbEaseIn = (u) => Math.pow(sbClamp(u), 2.2);
function sbRng(seed) { let s = seed >>> 0 || 1; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function sbMat(color, o = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.8, metalness: 0 }, o)); }
function sbGlow(color, intensity = 1) { return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), toneMapped: true }); }
function sbBox(w, h, d, mat, x, y, z, parent, o = {}) {
  const m = new THREE.Mesh(o.round ? new THREE.RoundedBoxGeometry(w, h, d, 2, Math.min(o.round, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = o.cast !== false; m.receiveShadow = true; if (parent) parent.add(m); return m;
}
function sbCyl(r0, r1, h, mat, seg = 16) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat); m.castShadow = true; m.receiveShadow = true; return m; }

// a canvas texture with text drawn by fn(ctx, w, h)
function sbCanvasTex(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); fn(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t._c = c; t._g = g; return t;
}
const SB_SERIF = '"Libre Caslon Text", "Libre Baskerville", Georgia, serif';
const SB_SANS = '"Inter", "Helvetica Neue", Arial, sans-serif';

// hand pose from world-space intent. cam: a camera already placed for the shot (matrixWorld up to date).
// p: wrist (world), F: finger direction (world), N: palm normal (world), side: +1 right / -1 left (ViewerHands mirrors
// the left hand's x, so a left pose is written mirrored here)
function sbHandPose(cam, side, p, F, N, curl = [0.3, 0.35, 0.4, 0.45], thumb = [0.5, 0.3], extra = {}) {
  cam.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(cam.matrixWorld).invert();
  const q = new THREE.Quaternion().setFromRotationMatrix(inv);
  const P = new THREE.Vector3(...p).applyMatrix4(inv);
  const f = new THREE.Vector3(...F).normalize().applyQuaternion(q);
  const n = new THREE.Vector3(...N).normalize().applyQuaternion(q);
  return Object.assign({ p: [P.x * side, P.y, P.z], F: [f.x * side, f.y, f.z], N: [n.x * side, n.y, n.z], curl, thumb }, extra);
}
// a hand pose straight in camera space (right-hand terms, mirrored for the left by ViewerHands)
function sbCamPose(p, F, N, curl, thumb, extra = {}) { return Object.assign({ p, F, N, curl, thumb }, extra); }

// place a camera: position + look-at
function sbAim(cam, pos, at, roll = 0) {
  cam.position.set(...pos); cam.up.set(0, 1, 0); cam.lookAt(new THREE.Vector3(...at));
  if (roll) cam.rotateZ(roll);
  cam.updateMatrixWorld(true);
}
// world point → screen fraction (0..1) for labels; null if behind
function sbProject(cam, v) {
  const p = v.clone().project(cam);
  if (p.z > 1 || p.z < -1) return null;
  return { x: (p.x + 1) / 2, y: (1 - p.y) / 2 };
}
