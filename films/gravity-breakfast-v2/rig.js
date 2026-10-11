/* =====================================================================
   RIG — GbCharacter: an original, reusable stylised humanoid for the hybrid look.
   V2 look: adult proportions (head ≈ 1/6.5 of the height), an oval head with a defined jaw and nose, small
   almond eyes with lids, thin dark brows and a fine lip line (restrained, graphic features; no cartoon whites),
   optional slim glasses, a turtleneck so the neck never shows a seam, tapered limbs, hands with curling fingers.
   Matte materials; the rim light is only a thin edge so silhouettes read without glowing.

   Animation is a pure function of time:
   - BODY: a pose track of named poses (GB_POSES), each key [t, pose, dur, ease] blends from the current state;
     additive layers on top (breathing, tremble, damped springs for impacts) — anticipation / impact / reaction /
     recovery are authored as poses + springs, not as linear interpolation.
   - ARMS: optional 2-bone IK per hand (a world target + elbow pole), blended with the FK pose by a weight.
   - FACE: an expression track (GB_FACES) + blinks + a pupil look target.
   Joint conventions (character faces local +Z, up +Y; right side = −X):
     spine/chest/neck/head  +x = bend forward
     shoulder               x < 0 raises the arm forward; abd > 0 lifts it sideways; tw twists
     elbow                  x < 0 bends (forearm forward);  hip x < 0 lifts the thigh forward; knee x > 0 bends
   Pose keys (degrees): pelX pelZ spX spY spZ chX chY chZ nkX nkY hdX hdY hdZ  rootY rootZ rootX (m)
     per side (L/R prefix): ShX ShY ShAbd ElX WrX WrZ Fing Thumb HipX HipY HipAbd KnX AnX  + Shrug (m)
   ===================================================================== */

const GB_LOOKS = {
  hero: { skin: '#5e3c2f', lip: '#2c1719', top: '#357780', topDark: '#285d64', pants: '#2c2a3c', shoes: '#3a2f2a', sole: '#1b1615', hair: '#2b201d',
    hairStyle: 'crop', glasses: true, build: 1.0, head: 1.0 },
  waiter: { skin: '#8a5a43', lip: '#4a2622', top: '#c9b49a', topDark: '#a8957c', pants: '#26222e', shoes: '#2b2224', sole: '#151214', hair: '#3a2621',
    hairStyle: 'bun', apron: '#7d3a30', build: 0.92, head: 0.97 },
  vendor: { skin: '#4b3027', lip: '#2a1615', top: '#b9663d', topDark: '#94502f', pants: '#3a3a48', shoes: '#3b2e2a', sole: '#1a1414', hair: '#1a1214',
    hairStyle: 'cap', cap: '#c99b45', build: 1.08, head: 1.0 },
  jogger: { skin: '#a46d4f', lip: '#5a2f2a', top: '#c9566f', topDark: '#a9405d', pants: '#24243a', shoes: '#e6e0d6', sole: '#7a6a5a', hair: '#1a1012',
    hairStyle: 'pony', build: 0.9, head: 0.96 },
  sitter: { skin: '#c08b6c', lip: '#6a3c34', top: '#66764a', topDark: '#55633a', pants: '#3b3346', shoes: '#463830', sole: '#1c1716', hair: '#cfc8bd',
    hairStyle: 'short', build: 1.05, head: 1.0 },
};

// --------------------------------------------------------------------------------------------------------------
// POSES (degrees). Missing keys = 0. 'stand' arms rest slightly out.
// --------------------------------------------------------------------------------------------------------------
const GB_POSES = {
  stand: { LShAbd: 7, RShAbd: 7, LElX: -8, RElX: -8, LFing: 0.35, RFing: 0.35, LThumb: 0.3, RThumb: 0.3 },
  sit: { rootY: -0.36, rootZ: -0.03, HipX: 0, LHipX: -86, RHipX: -86, LHipAbd: 6, RHipAbd: 4, LKnX: 92, RKnX: 88, LAnX: -4, RAnX: -2,
    spX: 4, chX: 3, nkX: -4, hdX: 2, LShAbd: 8, RShAbd: 8, LShX: -30, RShX: -30, LElX: -60, RElX: -60, LFing: 0.4, RFing: 0.4, LThumb: 0.3, RThumb: 0.3 },
};
// the seated hero, built on 'sit'
(function () {
  const S = GB_POSES.sit, P = (o) => Object.assign({}, S, o);
  Object.assign(GB_POSES, {
    sitRelax: P({ spX: -4, chX: -2, nkX: 2, hdX: -4, hdZ: 3, LShX: -38, LElX: -78, LWrX: 10, LShAbd: 14, RShX: -24, RElX: -70 }),
    sitSip: P({ spX: 2, chX: -6, nkX: -6, hdX: -14, hdZ: 2, LShX: -38, LElX: -78, LShAbd: 14 }),
    // the collapse: chest folds, shoulders drop, head hangs
    sitCollapse: P({ rootY: -0.385, rootZ: -0.05, pelX: 5, spX: 13, chX: 9, nkX: 6, hdX: 9, hdZ: -4, LShX: -18, RShX: -16, LShAbd: 4, RShAbd: 2,
      LElX: -40, RElX: -40, LShrug: -0.025, RShrug: -0.025, LFing: 0.25, RFing: 0.2 }),
    // trying to sit up: chest lifts, head still heavy
    sitStrain: P({ rootY: -0.375, pelX: 2, spX: 8, chX: 2, nkX: 2, hdX: 6, LShX: -26, RShX: -24, LElX: -60, RElX: -58, LShrug: 0.01, RShrug: 0.01 }),
    sitHeavy: P({ rootY: -0.385, pelX: 4, spX: 11, chX: 7, nkX: 4, hdX: 6, hdZ: 3, LShX: -22, RShX: -20, LElX: -55, RElX: -50, LShrug: -0.02, RShrug: -0.02 }),
    sitLookUp: P({ rootY: -0.385, pelX: 4, spX: 12, chX: 4, nkX: -6, hdX: -14, hdY: 8, LShX: -22, RShX: -20, LElX: -55, RElX: -50, LShrug: -0.015, RShrug: -0.015 }),
    sitStare: P({ rootY: -0.385, spX: 10, chX: 6, nkX: 0, hdX: 4, hdY: -6, LShX: -28, RShX: -24, LElX: -64, RElX: -62 }),
    // V2 struggle: brace (lean in, left palm on the table), the anticipation dip, the pull, the failure, the two-handed lean
    sitBrace: P({ rootY: -0.385, pelX: 3, spX: 12, chX: 6, nkX: 4, hdX: 10, LShX: -40, LElX: -50, RShX: -30, LShrug: 0.02, RShrug: 0.005 }),
    sitBraceDip: P({ rootY: -0.392, pelX: 4, spX: 15, chX: 9, nkX: 5, hdX: 12, LShX: -40, LElX: -50, RShX: -30, LShrug: 0.012, RShrug: -0.005 }),
    sitLift1: P({ rootY: -0.378, pelX: 1, spX: 4, chX: -5, nkX: 3, hdX: 6, hdZ: -3, LShX: -36, LElX: -46, RShX: -26, LShrug: 0.03, RShrug: 0.028 }),
    sitFail: P({ rootY: -0.392, pelX: 5, spX: 15, chX: 11, nkX: 7, hdX: 11, hdZ: 3, LShX: -30, LElX: -50, RShX: -24, LShrug: -0.02, RShrug: -0.025 }),
    sitLean: P({ rootY: -0.385, rootZ: 0.02, pelX: 4, spX: 12, chX: 7, nkX: 5, hdX: 8, LShX: -40, RShX: -40, LShrug: 0.012, RShrug: 0.012 }),
    sitLeanSip: P({ rootY: -0.385, rootZ: 0.02, pelX: 4, spX: 14, chX: 9, nkX: 4, hdX: -10, LShX: -40, RShX: -40, LShrug: 0.01, RShrug: 0.01 }),
  });
  // the waiter (standing, then buckling to one knee)
  const T = GB_POSES.stand;
  Object.assign(GB_POSES, {
    tray: Object.assign({}, T, { LShX: -40, LShAbd: 20, LElX: -80, LWrX: -10, LFing: 0.1, RShX: -10, RShAbd: 10, RElX: -20, chY: -6, hdY: 10, hdX: 4 }),
    trayBuckle: Object.assign({}, T, { rootY: -0.12, pelX: 10, spX: 18, chX: 12, nkX: 6, hdX: 8, LHipX: -38, RHipX: -12, LKnX: 70, RKnX: 30, LAnX: -30, RAnX: -16,
      LShX: -30, LShAbd: 16, LElX: -60, RShX: -38, RShAbd: 22, RElX: -70, LShrug: -0.02, RShrug: -0.01 }),
    trayKneel: Object.assign({}, T, { rootY: -0.4, pelX: 4, spX: 14, chX: 10, nkX: 4, hdX: 6, LHipX: -84, RHipX: 6, LKnX: 92, RKnX: 104, LAnX: -6, RAnX: 30,
      LShX: -46, LShAbd: 22, LElX: -72, RShX: -50, RShAbd: 26, RElX: -74, LShrug: -0.01, RShrug: -0.01 }),
    // outdoor extras
    vendorHold: Object.assign({}, T, { RShX: -150, RShAbd: 12, RElX: -18, RFing: 0.95, RThumb: 0.8, hdX: -10, hdY: -8, LShAbd: 10 }),
    vendorSag: Object.assign({}, T, { rootY: -0.05, pelX: 6, spX: 14, chX: 10, hdX: 10, LKnX: 18, RKnX: 18, LHipX: -14, RHipX: -14, LAnX: -4, RAnX: -4,
      RShX: -55, RShAbd: 18, RElX: -40, RFing: 0.2, RThumb: 0.2, LShAbd: 6, LShrug: -0.02, RShrug: -0.02 }),
    vendorLookUp: Object.assign({}, T, { rootY: -0.05, pelX: 2, spX: 4, chX: -8, nkX: -16, hdX: -28, hdY: -4, LKnX: 18, RKnX: 18, LHipX: -14, RHipX: -14, LAnX: -4, RAnX: -4,
      RShX: -95, RShAbd: 22, RElX: -24, RFing: 0.15, LShX: -20, LShAbd: 14 }),
    jogKneel: Object.assign({}, T, { rootY: -0.5, pelX: 34, spX: 26, chX: 14, nkX: -8, hdX: -6, LHipX: -60, RHipX: -54, LKnX: 120, RKnX: 118, LAnX: 40, RAnX: 40,
      LShX: -62, LShAbd: 10, LElX: -12, RShX: -60, RShAbd: 10, RElX: -10, LWrX: -60, RWrX: -60, LFing: 0.05, RFing: 0.05 }),
    benchSlump: Object.assign({}, GB_POSES.sit, { rootY: -0.44, pelX: -8, spX: 4, chX: 14, nkX: 14, hdX: 16, LShAbd: 22, RShAbd: 22, LShX: -6, RShX: -6, LElX: -10, RElX: -10,
      LKnX: 70, RKnX: 74, LHipX: -70, RHipX: -72, LAnX: 10, RAnX: 8, LShrug: -0.02, RShrug: -0.02 }),
  });
})();

// --------------------------------------------------------------------------------------------------------------
// FACES. lid (upper lid 0 open…1 shut), lidAng (+ = sad slant, − = angry slant), low (lower lid up: smiling eyes),
// eyeS (eye scale), browY (−1…1), browAng (+ inner up = worried, − inner down = strain/angry),
// smile (−1…1), open (0…1), width (mouth width ×), teeth (0…1 fill becomes teeth), puff (cheeks)
// --------------------------------------------------------------------------------------------------------------
const GB_FACES = {
  neutral: { lid: 0.26, lidAng: 0, low: 0.05, eyeS: 1, browY: 0, browAng: 0, smile: 0.15, open: 0, width: 1, teeth: 0 },
  content: { lid: 0.32, lidAng: 0.1, low: 0.42, eyeS: 1, browY: 0.15, browAng: 0.15, smile: 0.8, open: 0.0, width: 1.05, teeth: 0 },
  sip: { lid: 0.85, lidAng: 0.2, low: 0.3, eyeS: 1, browY: 0.25, browAng: 0.2, smile: 0.05, open: 0.18, width: 0.45, teeth: 0 },
  surprise: { lid: 0.0, lidAng: 0, low: 0, eyeS: 1.28, browY: 0.95, browAng: 0.25, smile: -0.15, open: 0.75, width: 0.62, teeth: 0 },
  shock: { lid: 0.05, lidAng: 0.1, low: 0, eyeS: 1.18, browY: 0.75, browAng: 0.55, smile: -0.5, open: 0.4, width: 0.75, teeth: 0 },
  strain: { lid: 0.55, lidAng: -0.45, low: 0.35, eyeS: 0.95, browY: -0.35, browAng: -0.8, smile: -0.55, open: 0.05, width: 1.0, teeth: 0 },
  strainHard: { lid: 0.8, lidAng: -0.5, low: 0.5, eyeS: 0.9, browY: -0.45, browAng: -0.95, smile: -0.7, open: 0.07, width: 1.05, teeth: 0 },
  worried: { lid: 0.22, lidAng: 0.45, low: 0.05, eyeS: 1.05, browY: 0.45, browAng: 0.75, smile: -0.45, open: 0.06, width: 0.75, teeth: 0 },
  exhausted: { lid: 0.55, lidAng: 0.35, low: 0.1, eyeS: 1, browY: 0.15, browAng: 0.5, smile: -0.25, open: 0.32, width: 0.8, teeth: 0 },
  brace: { lid: 0.32, lidAng: -0.25, low: 0.15, eyeS: 1, browY: -0.2, browAng: -0.5, smile: -0.3, open: 0.0, width: 0.95, teeth: 0 },
  relief: { lid: 0.42, lidAng: 0.25, low: 0.3, eyeS: 1, browY: 0.15, browAng: 0.35, smile: 0.25, open: 0.06, width: 1.0, teeth: 0 },
  awe: { lid: 0.05, lidAng: 0.1, low: 0, eyeS: 1.15, browY: 0.7, browAng: 0.35, smile: 0.05, open: 0.45, width: 0.55, teeth: 0 },
};
const GB_FACE_KEYS = Object.keys(GB_FACES.neutral);

// evaluate a chained blend track [[t, name, dur, ease], …] over a library (pure function of t)
function gbEvalTrack(keys, lib, t, base) {
  const out = Object.assign({}, base || lib[keys[0][1]]);
  for (let i = 0; i < keys.length; i++) {
    const [tk, name, dur = 0.4, ease = 'inOutSine'] = keys[i];
    if (t < tk) break;
    const P = lib[name];
    if (!P) continue;
    const a = (Ease[ease] || Ease.inOutSine)(MathX.clamp((t - tk) / Math.max(1e-4, dur), 0, 1));
    const ks = new Set([...Object.keys(out), ...Object.keys(P)]);
    for (const k of ks) { const A = out[k] || 0, B = P[k] || 0; out[k] = A + (B - A) * a; }
  }
  return out;
}

class GbCharacter {
  constructor(scene, lookName, opts = {}) {
    this.L = Object.assign({}, GB_LOOKS[lookName] || GB_LOOKS.hero, opts.look || {});
    this.name = opts.name || lookName;
    this.root = new THREE.Group(); this.root.name = 'gbChar:' + this.name;
    scene.add(this.root);
    this.s = opts.scale || 1;
    this.root.scale.setScalar(this.s);
    this.J = {};
    this.mats = this._materials();
    this._build();
    // hand IK targets (world): { L: {w, p: Vector3, pole: Vector3}, R: … } set by the film each frame
    this.ik = { L: null, R: null };
    this._v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    this._q = [new THREE.Quaternion(), new THREE.Quaternion(), new THREE.Quaternion()];
    this._m = new THREE.Matrix4();
  }

  _materials() {
    const L = this.L;
    return {
      skin: gbMat(L.skin, { rough: 0.78, rim: 0.42, rimWidth: -1, name: 'gbSkin' }),
      top: gbMat(L.top, { rough: 0.97, rim: 0.28, rimWidth: -1, name: 'gbTop' }),
      topDark: gbMat(L.topDark, { rough: 0.97, rim: 0.2, rimWidth: -1, name: 'gbTopDark' }),
      pants: gbMat(L.pants, { rough: 0.95, rim: 0.25, rimWidth: -1, name: 'gbPants' }),
      shoes: gbMat(L.shoes, { rough: 0.75, rim: 0.15, rimWidth: -1, name: 'gbShoes' }),
      sole: gbMat(L.sole, { rough: 0.9, name: 'gbSole' }),
      hair: gbMat(L.hair, { rough: 0.85, rim: 0.4, rimWidth: -1, name: 'gbHair' }),
      eye: gbMat('#e4dccd', { rough: 0.55, emissive: '#e4dccd', emi: 0.05, name: 'gbEye', fog: true }),
      pupil: gbMat('#120c10', { rough: 0.35, name: 'gbPupil' }),
      glint: gbMat('#ffffff', { rough: 0.3, emissive: '#ffffff', emi: 0.35, name: 'gbGlint' }),
      line: gbMat(L.hair, { rough: 0.85, name: 'gbBrow' }),
      lip: gbMat(L.lip || '#2c1719', { rough: 0.8, name: 'gbLip' }),
      mouth: gbMat('#2a0c12', { rough: 0.8, name: 'gbMouth', side: THREE.DoubleSide }),
      teeth: gbMat('#cfc5b5', { rough: 0.6, name: 'gbTeeth', side: THREE.DoubleSide }),
      glass: gbMat('#17110f', { rough: 0.45, metal: 0.25, rim: 0.2, rimWidth: -1, name: 'gbGlassesFrame', env: 0.5 }),
      lens: gbMat('#cfe0ff', { rough: 0.05, transparent: true, opacity: 0.06, name: 'gbLensGlass', depthWrite: false, env: 0.6 }),
      apron: gbMat(L.apron || '#8a3a2e', { rough: 0.95, rim: 0.2, rimWidth: -1, name: 'gbApron' }),
      cap: gbMat(L.cap || '#e0b04a', { rough: 0.88, rim: 0.25, rimWidth: -1, name: 'gbCap' }),
    };
  }

  // ------------------------------------------------------------------------------------------ build
  _joint(name, parent, x, y, z) { const g = new THREE.Group(); g.name = name; g.position.set(x, y, z); parent.add(g); this.J[name] = g; return g; }

  _build() {
    const M = this.mats, L = this.L, b = L.build || 1;
    const J = (n, p, x, y, z) => this._joint(n, p, x, y, z);
    // hips
    const pel = J('pel', this.root, 0, 0.86, 0);
    gbAdd(pel, smoothLoft([[-0.1, 0.13 * b, 0.1], [-0.02, 0.15 * b, 0.11], [0.06, 0.14 * b, 0.1], [0.11, 0.125 * b, 0.092]], 16, 0.3, 0.5), M.pants);
    // spine (belly) and chest
    const sp = J('sp', pel, 0, 0.09, 0);
    gbAdd(sp, smoothLoft([[-0.06, 0.13 * b, 0.095], [0.04, 0.138 * b, 0.1, 0.006], [0.14, 0.145 * b, 0.1, 0.004]], 16, 0.2, 0.2), L.apron ? M.top : M.top);
    const ch = J('ch', sp, 0, 0.17, 0);
    gbAdd(ch, smoothLoft([[-0.06, 0.148 * b, 0.1], [0.04, 0.162 * b, 0.105, 0.008], [0.13, 0.168 * b, 0.1, 0.0], [0.19, 0.15 * b, 0.088, -0.006], [0.215, 0.1, 0.07, -0.008]], 18, 0.35, 0.2), M.top);
    // turtleneck collar (hides the neck joint) — sits on the chest, the neck turns inside it
    gbAdd(ch, smoothLoft([[0.18, 0.068, 0.064], [0.23, 0.064, 0.06], [0.27, 0.06, 0.057]], 16, 0.05, 0.05), M.topDark, 0, 0, -0.008);
    if (L.apron) {   // a bib apron over the front
      gbAdd(sp, gbRoundBox(0.25 * b, 0.36, 0.02, 0.008, 2), M.apron, 0, 0.0, 0.1);
      gbAdd(ch, gbRoundBox(0.2 * b, 0.2, 0.02, 0.008, 2), M.apron, 0, 0.05, 0.106);
      gbAdd(pel, gbRoundBox(0.3 * b, 0.32, 0.02, 0.008, 2), M.apron, 0, -0.16, 0.112);
    }
    const nk = J('nk', ch, 0, 0.215, -0.006);
    gbAdd(nk, new THREE.CylinderGeometry(0.045, 0.05, 0.11, 12), M.skin, 0, 0.03, 0);
    const hd = J('hd', nk, 0, 0.09, 0.01);
    this._buildHead(hd);
    // arms
    for (const [side, sx] of [['L', 1], ['R', -1]]) {
      const shBase = J(side + 'ShB', ch, sx * 0.165 * b, 0.165, -0.006);
      const sh = J(side + 'Sh', shBase, 0, 0, 0);
      gbAdd(sh, new THREE.SphereGeometry(0.054, 14, 10), M.top, 0, -0.005, 0, { s: [1, 0.9, 0.95] });
      gbAdd(sh, smoothLoft([[-0.27, 0.038, 0.039], [-0.14, 0.046, 0.046], [-0.02, 0.052, 0.052]], 14, 0.3, 0.3), M.top);
      const el = J(side + 'El', sh, 0, -0.27, 0);
      gbAdd(el, smoothLoft([[-0.235, 0.031, 0.028], [-0.12, 0.037, 0.034], [0.02, 0.04, 0.038]], 14, 0.3, 0.3), M.top);
      gbAdd(el, smoothLoft([[-0.25, 0.037, 0.033], [-0.225, 0.04, 0.036]], 14, 0.1, 0.1), M.topDark);   // cuff
      const wr = J(side + 'Wr', el, 0, -0.245, 0);
      this._buildHand(wr, side, sx);
      // legs
      const hip = J(side + 'Hip', pel, sx * 0.088 * b, -0.02, 0);
      gbAdd(hip, smoothLoft([[-0.41, 0.05, 0.052], [-0.2, 0.068, 0.07], [0.02, 0.078, 0.08]], 14, 0.3, 0.35), M.pants);
      const kn = J(side + 'Kn', hip, 0, -0.41, 0);
      gbAdd(kn, smoothLoft([[-0.38, 0.044, 0.046], [-0.2, 0.052, 0.054], [0.02, 0.056, 0.058]], 14, 0.3, 0.3), M.pants);
      const an = J(side + 'An', kn, 0, -0.395, 0);
      // a chunky rounded shoe with a contrasting sole
      gbAdd(an, gbRoundBox(0.088, 0.062, 0.25, 0.026, 3), M.shoes, 0, -0.035, 0.055);
      gbAdd(an, gbRoundBox(0.092, 0.018, 0.255, 0.008, 2), M.sole, 0, -0.063, 0.055);
    }
  }

  _buildHead(hd) {
    const M = this.mats, L = this.L, hs = (L.head || 1) * 0.8;   // V2: smaller head → adult proportions
    this.hs = hs;
    const a = 0.142 * hs, bb = 0.182 * hs, c = 0.15 * hs;          // an oval, taller than wide
    this.headR = [a, bb, c];
    const hc = this._joint('hc', hd, 0, 0.15 * hs, 0);       // head centre
    gbAdd(hc, new THREE.SphereGeometry(1, 40, 30), M.skin, 0, 0.004, -0.004, { s: [a, bb, c] });
    // jaw and chin: a narrower lower face that ends in a defined chin
    gbAdd(hc, new THREE.SphereGeometry(1, 32, 20), M.skin, 0, -0.07 * hs, 0.012 * hs, { s: [a * 0.8, bb * 0.62, c * 0.86] });
    gbAdd(hc, new THREE.SphereGeometry(1, 18, 12), M.skin, 0, -0.15 * hs, 0.07 * hs, { s: [0.034 * hs, 0.026 * hs, 0.03 * hs] });
    // cheekbones (break the ball silhouette in three-quarter views)
    for (const sx of [1, -1]) gbAdd(hc, new THREE.SphereGeometry(1, 16, 12), M.skin, sx * 0.06 * hs, -0.026 * hs, 0.08 * hs, { s: [0.036 * hs, 0.026 * hs, 0.048 * hs] });
    // nose: a narrow bridge + tip (reads in profile)
    gbAdd(hc, new THREE.SphereGeometry(1, 16, 12), M.skin, 0, -0.008 * hs, c * 0.95, { s: [0.016 * hs, 0.05 * hs, 0.026 * hs], rx: -0.25 });
    gbAdd(hc, new THREE.SphereGeometry(1, 14, 10), M.skin, 0, -0.038 * hs, c * 1.0, { s: [0.018 * hs, 0.016 * hs, 0.02 * hs] });
    // ears
    for (const sx of [1, -1]) gbAdd(hc, new THREE.SphereGeometry(1, 14, 10), M.skin, sx * a * 0.97, -0.01 * hs, -0.012, { s: [0.013, 0.03 * hs / 0.8, 0.022] });
    // hair
    const H = M.hair;
    if (L.hairStyle === 'crop' || L.hairStyle === 'quiff') {
      // close crop with a soft side part: a fitted shell + a low top volume (no cartoon quiff)
      gbAdd(hc, new THREE.SphereGeometry(1, 32, 18, 0, Math.PI * 2, 0, Math.PI * 0.5), H, 0, 0.014 * hs, -0.014, { s: [a * 1.07, bb * 1.02, bb * 1.0], rx: -0.42 });
    } else if (L.hairStyle === 'bun' || L.hairStyle === 'pony') {
      gbAdd(hc, new THREE.SphereGeometry(1, 30, 18, 0, Math.PI * 2, 0, Math.PI * 0.55), H, 0, 0.014 * hs, -0.014, { s: [a * 1.08, bb * 1.03, bb * 1.01], rx: -0.45 });
      if (L.hairStyle === 'bun') gbAdd(hc, new THREE.SphereGeometry(1, 18, 14), H, 0, bb * 0.8, -c * 0.62, { s: [0.052, 0.048, 0.05] });
      else gbAdd(hc, gbCapsule(0.024, 0.12, 4, 8), H, 0, bb * 0.25, -c * 1.08, { rx: 0.5 });
    } else if (L.hairStyle === 'cap') {
      gbAdd(hc, new THREE.SphereGeometry(1, 30, 16, 0, Math.PI * 2, 0, Math.PI * 0.5), M.cap, 0, 0.02 * hs, -0.008, { s: [a * 1.09, bb * 1.02, bb * 1.02], rx: -0.3 });
      gbAdd(hc, new THREE.CylinderGeometry(0.09 * hs / 0.8, 0.09 * hs / 0.8, 0.01, 24, 1, false, -Math.PI * 0.5, Math.PI), M.cap, 0, 0.06 * hs, c * 0.78, { s: [1, 1, 0.9], rx: -0.12 });
    } else {
      gbAdd(hc, new THREE.SphereGeometry(1, 30, 18, 0, Math.PI * 2, 0, Math.PI * 0.42), H, 0, 0.02 * hs, -0.014, { s: [a * 1.07, bb * 1.03, bb * 1.01], rx: -0.3 });
    }
    // ---- face features (positioned on the ellipsoid surface; the face looks +Z)
    const F = this.face = { eyes: [], brows: [], hc };
    const surf = (u, v, lift = 0) => {
      const zz = c * Math.sqrt(Math.max(0.02, 1 - (u / a) ** 2 - (v / bb) ** 2));
      return new THREE.Vector3(u, v + 0.004, zz - 0.004 + lift);
    };
    this._surf = surf;
    const nrm = (p) => p.clone().multiply(new THREE.Vector3(1 / (a * a), 1 / (bb * bb), 1 / (c * c))).normalize().add(p);
    // small almond eyes: a narrow white, a large dark iris, lids that rest a little closed (calm, adult)
    for (const sx of [1, -1]) {
      const u = sx * 0.05 * hs, v = 0.014 * hs, p = surf(u, v, -0.002);
      const eg = new THREE.Group(); eg.position.copy(p); eg.lookAt(nrm(p)); hc.add(eg);
      const open = new THREE.Group(); eg.add(open);
      const white = gbAdd(open, new THREE.SphereGeometry(1, 20, 14), M.eye, 0, 0, 0, { s: [0.019, 0.0115, 0.007], rz: sx * 0.08, cast: false });
      const pup = new THREE.Group(); open.add(pup);
      gbAdd(pup, new THREE.SphereGeometry(1, 14, 10), M.pupil, 0, 0, 0.0046, { s: [0.0092, 0.0098, 0.0036], cast: false });
      gbAdd(pup, new THREE.SphereGeometry(1, 8, 6), M.glint, 0.0035, 0.0035, 0.0078, { s: 0.0016, cast: false });
      const lidU = new THREE.Group(); open.add(lidU);
      gbAdd(lidU, new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.skin, 0, 0, 0.0008, { s: [0.0215, 0.0145, 0.0092], cast: false });
      const lidL = new THREE.Group(); open.add(lidL);
      gbAdd(lidL, new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), M.skin, 0, 0, 0.0008, { s: [0.0215, 0.0145, 0.0092], cast: false });
      // brow: a thin dark stroke in the hair colour
      const bu = sx * 0.052 * hs, bv = 0.056 * hs;
      const bg = new THREE.Group(); bg.position.copy(surf(bu, bv, 0.002)); hc.add(bg); bg.lookAt(nrm(bg.position));
      gbAdd(bg, gbCapsule(0.0042, 0.03, 3, 8), M.line, 0, 0, 0, { rz: Math.PI / 2, cast: false });
      F.eyes.push({ sx, eg, open, white, pup, lidU, lidL, u, v });
      F.brows.push({ sx, bg, u: bu, v: bv });
    }
    // glasses: slim dark oval frames sized to the eyes
    if (L.glasses) {
      const gl = new THREE.Group(); gl.position.set(0, 0.014 * hs, c + 0.01); hc.add(gl);
      for (const sx of [1, -1]) {
        gbAdd(gl, new THREE.TorusGeometry(0.028, 0.0021, 6, 32), M.glass, sx * 0.05 * hs, 0, -0.012, { s: [1, 0.7, 1], cast: false });
        gbAdd(gl, new THREE.CircleGeometry(0.027, 28), M.lens, sx * 0.05 * hs, 0, -0.012, { s: [1, 0.7, 1], cast: false });
        gbAdd(gl, gbTube([[sx * 0.068, 0.004, -0.014], [sx * 0.108, 0.006, -0.05], [sx * 0.118, 0.004, -0.11]], 0.0018, 10, 5), M.glass, 0, 0, 0, { cast: false });
      }
      gbAdd(gl, gbTube([[-0.012, 0.002, -0.012], [0, 0.007, -0.006], [0.012, 0.002, -0.012]], 0.0019, 8, 5), M.glass, 0, 0, 0, { cast: false });
      F.glasses = gl; F.glassesY = gl.position.y;
    }
    // mouth: a dynamic fill (dark interior / teeth) and a fine lip line, re-shaped every frame
    const N = 11;
    F.N = N;
    const fillG = new THREE.BufferGeometry();
    fillG.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 2 * 3), 3));
    fillG.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(N * 2 * 3).map((_, i) => (i % 3 === 2 ? 1 : 0)), 3));
    const fi = []; for (let i = 0; i < N - 1; i++) { const a0 = i, b0 = i + 1, c0 = N + i + 1, d0 = N + i; fi.push(a0, d0, b0, b0, d0, c0); }
    fillG.setIndex(fi);
    const lineN = 2 * N;
    const lineG = new THREE.BufferGeometry();
    lineG.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(lineN * 2 * 3), 3));
    lineG.setAttribute('normal', new THREE.Float32BufferAttribute(new Float32Array(lineN * 2 * 3).map((_, i) => (i % 3 === 2 ? 1 : 0)), 3));
    const li = []; for (let i = 0; i < lineN; i++) { const j = (i + 1) % lineN; li.push(2 * i, 2 * i + 1, 2 * j, 2 * j, 2 * i + 1, 2 * j + 1); }
    lineG.setIndex(li);
    F.fill = gbAdd(hc, fillG, M.mouth, 0, 0, 0, { cast: false, receive: false });
    F.fill.frustumCulled = false;
    F.line = gbAdd(hc, lineG, M.lip, 0, 0, 0, { cast: false, receive: false });
    F.line.frustumCulled = false;
    F.fillTeeth = M.teeth; F.fillDark = M.mouth;
  }

  _buildHand(wr, side, sx) {
    const M = this.mats;
    // hand frame: fingers along −Y, palm faces +X for the right hand side convention → palm toward the body centre
    const pn = -sx;   // palm normal x sign (right hand at −X: palm faces +X)
    const h = this._joint(side + 'Hand', wr, 0, 0, 0);
    gbAdd(h, gbRoundBox(0.028, 0.085, 0.072, 0.012, 2), M.skin, 0, -0.045, 0);
    const fingers = [];
    const fz = [0.026, 0.009, -0.008, -0.024], fl = [0.046, 0.05, 0.047, 0.038];
    for (let i = 0; i < 4; i++) {
      const f1 = new THREE.Group(); f1.position.set(0, -0.086, fz[i]); h.add(f1);
      gbAdd(f1, gbCapsule(0.0095, fl[i] * 0.55, 3, 8), M.skin, 0, -fl[i] * 0.3, 0, { cast: false });
      const f2 = new THREE.Group(); f2.position.set(0, -fl[i] * 0.58, 0); f1.add(f2);
      gbAdd(f2, gbCapsule(0.0088, fl[i] * 0.45, 3, 8), M.skin, 0, -fl[i] * 0.24, 0, { cast: false });
      fingers.push([f1, f2]);
    }
    const t1 = new THREE.Group(); t1.position.set(pn * 0.008, -0.02, 0.034); h.add(t1);
    gbAdd(t1, gbCapsule(0.011, 0.03, 3, 8), M.skin, 0, -0.02, 0, { cast: false });
    const t2 = new THREE.Group(); t2.position.set(0, -0.042, 0); t1.add(t2);
    gbAdd(t2, gbCapsule(0.0098, 0.022, 3, 8), M.skin, 0, -0.015, 0, { cast: false });
    this['hand' + side] = { h, fingers, t1, t2, pn };
  }

  // ------------------------------------------------------------------------------------------ pose
  // P: flat pose object (degrees / metres). Applies FK to every joint.
  applyPose(P) {
    const J = this.J, d = Math.PI / 180, g = (k) => P[k] || 0;
    J.pel.position.set(g('rootX'), 0.86 + g('rootY'), g('rootZ'));
    J.pel.rotation.set(g('pelX') * d, g('pelY') * d, g('pelZ') * d);
    J.sp.rotation.set(g('spX') * d, g('spY') * d, g('spZ') * d);
    J.ch.rotation.set(g('chX') * d, g('chY') * d, g('chZ') * d);
    J.nk.rotation.set(g('nkX') * d, g('nkY') * d, g('nkZ') * d);
    J.hd.rotation.set(g('hdX') * d, g('hdY') * d, g('hdZ') * d);
    for (const [s, sx] of [['L', 1], ['R', -1]]) {
      J[s + 'ShB'].position.y = 0.165 + g(s + 'Shrug');
      // shoulder: YXZ so 'raise forward' (x) then 'out to the side' (z) behave
      J[s + 'Sh'].rotation.set(g(s + 'ShX') * d, sx * g(s + 'ShY') * d, sx * g(s + 'ShAbd') * d, 'ZXY');
      J[s + 'El'].rotation.set(g(s + 'ElX') * d, sx * g(s + 'ElY') * d, 0);
      J[s + 'Wr'].rotation.set(g(s + 'WrX') * d, sx * g(s + 'WrY') * d, sx * g(s + 'WrZ') * d);
      J[s + 'Hip'].rotation.set(g(s + 'HipX') * d, sx * g(s + 'HipY') * d, sx * g(s + 'HipAbd') * d, 'ZXY');
      J[s + 'Kn'].rotation.set(g(s + 'KnX') * d, 0, 0);
      J[s + 'An'].rotation.set(g(s + 'AnX') * d, 0, 0);
      const H = this['hand' + s], cu = g(s + 'Fing'), th = g(s + 'Thumb');
      H.fingers.forEach(([f1, f2], i) => { const k = cu * (1 + i * 0.06); f1.rotation.z = -H.pn * k * 1.45; f2.rotation.z = -H.pn * k * 1.5; });
      H.t1.rotation.set(0.2, 0, -H.pn * (0.35 + th * 0.6)); H.t2.rotation.z = -H.pn * th * 0.9;
    }
  }

  // 2-bone IK for one arm toward a world wrist target, elbow toward a world pole direction; blended by w
  solveArm(side, target, pole, w) {
    if (w <= 1e-3) return;
    const J = this.J, sh = J[side + 'Sh'], el = J[side + 'El'];
    const [S, E, D, T, X] = this._v, [q1, q2, q3] = this._q;
    this.root.updateMatrixWorld(true);
    sh.getWorldPosition(S);
    const sc = this.s, L1 = 0.27 * sc, L2 = 0.245 * sc;
    D.copy(target).sub(S);
    let d = D.length();
    d = MathX.clamp(d, Math.abs(L1 - L2) + 1e-3, (L1 + L2) * 0.999);
    D.normalize();
    const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    T.copy(pole).addScaledVector(D, -pole.dot(D)).normalize();
    E.copy(S).addScaledVector(D, a).addScaledVector(T, h);
    // upper arm world basis: Y = from elbow toward shoulder, Z = toward the forearm side
    const e1 = X.copy(E).sub(S).normalize();
    const W = new THREE.Vector3().copy(S).addScaledVector(D, d);           // the reachable wrist point
    const f = new THREE.Vector3().copy(W).sub(E).normalize();
    const Y = e1.clone().negate();
    let Z = f.clone().addScaledVector(e1, -f.dot(e1));
    if (Z.lengthSq() < 1e-6) Z = T.clone(); Z.normalize();
    const Xb = new THREE.Vector3().crossVectors(Y, Z).normalize();
    this._m.makeBasis(Xb, Y, Z);
    q1.setFromRotationMatrix(this._m);
    sh.parent.getWorldQuaternion(q2);
    q3.copy(q2).invert().multiply(q1);                                      // local
    sh.quaternion.slerp(q3, w);
    const bend = -Math.acos(MathX.clamp(e1.dot(f), -1, 1));
    el.rotation.set(el.rotation.x + (bend - el.rotation.x) * w, el.rotation.y * (1 - w), 0);
  }

  // set a hand's WORLD orientation after IK: fingers along F, palm facing N (world vectors), blended by w.
  // Hand frame: fingers along local −Y, palm normal along local X × pn (see _buildHand).
  orientHand(side, F, N, w) {
    if (w <= 1e-3) return;
    const wr = this.J[side + 'Wr'], H = this['hand' + side];
    this.root.updateMatrixWorld(true);
    const y = F.clone().normalize().negate();
    const x = N.clone().addScaledVector(F.clone().normalize(), -N.dot(F.clone().normalize())).normalize().multiplyScalar(H.pn);
    const z = new THREE.Vector3().crossVectors(x, y).normalize();
    x.crossVectors(y, z).normalize();
    const qw = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    const qp = new THREE.Quaternion(); wr.parent.getWorldQuaternion(qp);
    const ql = qp.invert().multiply(qw);
    wr.quaternion.slerp(ql, w);
  }

  // face params → features. V2 keeps expressions restrained: the eye-scale, mouth-open and smile ranges are
  // compressed here, so the expression library stays readable while the faces act like adults.
  applyFace(F, look) {
    const Fc = this.face, g = (k) => (F[k] !== undefined ? F[k] : GB_FACES.neutral[k]), hs = this.hs;
    const eyeS = 1 + (g('eyeS') - 1) * 0.45, lid = MathX.clamp(g('lid'), 0, 1), low = MathX.clamp(g('low'), 0, 1), lidAng = g('lidAng');
    const blink = MathX.clamp(F.blink || 0, 0, 1);
    for (const E of Fc.eyes) {
      E.open.scale.setScalar(eyeS);
      const lu = Math.max(lid, blink);
      E.lidU.position.y = 0.0118 * (1 - lu) + 0.0004;
      E.lidU.rotation.set(0, 0, E.sx * lidAng * 0.45 * (0.4 + lu));
      E.lidU.visible = lu > 0.02;
      E.lidL.position.y = -0.0118 * (1 - low * 0.5);
      E.lidL.rotation.z = -E.sx * lidAng * 0.2;
      E.lidL.visible = low > 0.02;
      const lx = look ? look.x : 0, ly = look ? look.y : 0;
      E.pup.position.set(MathX.clamp(lx, -1, 1) * 0.0075, MathX.clamp(ly, -1, 1) * 0.004, 0);
    }
    for (const B of Fc.brows) {
      const by = g('browY'), ba = g('browAng');
      B.bg.position.copy(this._surf(B.u, B.v + by * 0.008 * hs / 0.8 - 0.002, 0.0025));
      B.bg.children[0].rotation.z = Math.PI / 2 - B.sx * ba * 0.32;
    }
    if (Fc.glasses) Fc.glasses.position.y = Fc.glassesY + (F.glassesDrop || 0);
    // mouth
    const N = Fc.N, smile = g('smile') * 0.7, open = g('open') * 0.65, wid = 0.046 * g('width') * hs, my = -0.083 * hs;
    const up = [], lo = [];
    for (let i = 0; i < N; i++) {
      const s = (i / (N - 1)) * 2 - 1, x = s * wid / 2, ss = s * s;
      const curve = smile * 0.009 * (ss - 0.35);
      const yu = my + curve + open * 0.004 * (1 - ss);
      const yl = my + curve - open * 0.034 * Math.pow(Math.max(0, 1 - ss), 0.75);
      up.push([x, yu]); lo.push([x, Math.min(yl, yu - 0.0005)]);
    }
    const P = this._surf;
    const fp = Fc.fill.geometry.attributes.position;
    for (let i = 0; i < N; i++) {
      const a = P(up[i][0], up[i][1], 0.0025), b = P(lo[i][0], lo[i][1], 0.0025);
      fp.setXYZ(i, a.x, a.y, a.z); fp.setXYZ(N + i, b.x, b.y, b.z);
    }
    fp.needsUpdate = true;
    Fc.fill.visible = open > 0.02;
    Fc.fill.material = g('teeth') > 0.5 ? Fc.fillTeeth : Fc.fillDark;
    const ring = up.concat(lo.slice().reverse()), M = ring.length, lp = Fc.line.geometry.attributes.position, wl = 0.0019;
    for (let i = 0; i < M; i++) {
      const p0 = ring[(i - 1 + M) % M], p1 = ring[i], p2 = ring[(i + 1) % M];
      let tx = p2[0] - p0[0], ty = p2[1] - p0[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const nx = -ty, ny = tx;
      const A = P(p1[0] + nx * wl, p1[1] + ny * wl, 0.0032), B = P(p1[0] - nx * wl, p1[1] - ny * wl, 0.0032);
      lp.setXYZ(2 * i, A.x, A.y, A.z); lp.setXYZ(2 * i + 1, B.x, B.y, B.z);
    }
    lp.needsUpdate = true;
  }

  // place the character: world position of the root (floor point under the pelvis) and facing angle (rad, 0 = +Z)
  place(x, y, z, yaw) { this.root.position.set(x, y, z); this.root.rotation.set(0, yaw, 0); }

  // eye look: aim pupils at a world point (returns {x,y} in −1…1)
  lookAt(world) {
    if (!world) return { x: 0, y: 0 };
    const hc = this.face.hc; hc.updateMatrixWorld(true);
    const p = hc.worldToLocal(world.clone());
    const az = Math.atan2(p.x, p.z), el = Math.atan2(p.y, Math.hypot(p.x, p.z));
    return { x: MathX.clamp(az / 0.6, -1, 1), y: MathX.clamp(el / 0.5, -1, 1) };
  }

  worldOf(joint, out = new THREE.Vector3()) { this.root.updateMatrixWorld(true); return this.J[joint].getWorldPosition(out); }
}
