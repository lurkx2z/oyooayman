/* =====================================================================
   CAT — the slow-light film's brown tabby (itself the Shrinking film's), copied and renamed ux*; metres; cat-local +z
   forward, +y up, origin on the ground under its middle). New here: a loaf pose (asleep on the sofa) and a gallop
   (uxCatGallop: the laser sprint).
   A small rig: pelvis → chest → neck → head, two-bone legs solved to foot targets (the hind legs walk on their toes:
   a third bone at a set angle), a ten-link tail. Poses are plain numbers, blended; the head can look at a point.
     uxBuildCat(root) → { g, pose(P, t), lookAt(worldPoint, k) }
   ===================================================================== */

const UX_CAT = {
  L: { fu: 0.105, fl: 0.105, bu: 0.105, bl: 0.11, bm: 0.068 },        // front upper/lower, back thigh/shin/metatarsal
  hipF: [0.046, -0.04, 0.0], hipB: [0.05, -0.012, 0.03],               // leg roots (x, y, z) in chest / pelvis space
  chestAt: [0, 0.012, 0.28],
};

function uxCatFurCanvas(seed) {
  const r = new RNG(seed);
  const base = [164, 142, 118], dark = [58, 48, 40], belly = [234, 228, 216];
  return uxCanvas(512, 512, (g, w, h) => {
    const img = g.createImageData(w, h), d = img.data;
    const ph = r.range(0, 6);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      const back = Math.cos((u - 0.25) * 6.2832);                       // 1 on the spine, −1 on the belly
      const stripe = Math.pow(0.5 + 0.5 * Math.sin(v * 38 + 3.0 * Math.sin(u * 6.2832 * 2 + ph) + 1.6 * Math.sin(v * 5)), 4);
      const spine = Math.exp(-Math.pow((u - 0.25) * 22, 2));            // the dark line along the back
      const hair = (hash2(x, y >> 2) - 0.5) * 0.16 + (hash2(x >> 1, y >> 3) - 0.5) * 0.1;
      const k = Math.min(1, stripe * Math.max(0, back + 0.35) * 0.8 + spine * 0.55);
      const bel = MathX.smooth(-back, 0.25, 0.85);
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) d[i + c] = MathX.clamp(((base[c] * (1 - k) + dark[c] * k) * (1 - bel) + belly[c] * bel) * (1 + hair), 0, 255);
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}
// the head: forehead "M" stripes on top, pale muzzle and chin below (sphere UVs: front = u 0.25)
function uxCatHeadCanvas() {
  return uxCanvas(512, 256, (g, w, h) => {
    const img = g.createImageData(w, h), d = img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;                     // v 0 = top
      const du = ((u - 0.25 + 1.5) % 1) - 0.5;        // −0.5..0.5 around the face's front
      const top = 1 - MathX.smooth(v, 0.15, 0.5);
      const m = top * Math.pow(0.5 + 0.5 * Math.sin(du * 70 + 1.0), 6) * MathX.smooth(Math.abs(du), 0.0, 0.03);
      const cheek = Math.pow(0.5 + 0.5 * Math.sin(v * 40 + du * 30), 6) * MathX.smooth(Math.abs(du), 0.07, 0.12) * MathX.smooth(v, 0.35, 0.5) * (1 - MathX.smooth(v, 0.62, 0.7));
      const pale = MathX.smooth(v, 0.5, 0.72) * (1 - MathX.smooth(Math.abs(du), 0.1, 0.2));
      const hair = (hash2(x, y >> 1) - 0.5) * 0.14;
      const k = Math.min(1, m * 0.9 + cheek * 0.6);
      const base = [168, 146, 122], dark = [55, 45, 38], pl = [236, 230, 218], i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) d[i + c] = MathX.clamp(((base[c] * (1 - k) + dark[c] * k) * (1 - pale) + pl[c] * pale) * (1 + hair), 0, 255);
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}
function uxCatEyeCanvas() {
  return uxCanvas(512, 256, (g, w, h) => {
    g.fillStyle = '#3a2a12'; g.fillRect(0, 0, w, h);
    const cx = w * 0.25, cy = h * 0.5, R = 70;
    const ir = g.createRadialGradient(cx, cy, 6, cx, cy, R);
    ir.addColorStop(0, '#5a3a08'); ir.addColorStop(0.35, '#c88a1c'); ir.addColorStop(0.75, '#d9b03a'); ir.addColorStop(0.93, '#8a7a2a'); ir.addColorStop(1, '#2a2008');
    g.fillStyle = ir; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    // fine radial fibres in the iris
    g.strokeStyle = 'rgba(90,50,10,0.35)'; g.lineWidth = 1.2;
    const r = new RNG(5);
    for (let i = 0; i < 90; i++) { const a = r.range(0, 6.283), r0 = r.range(14, 30), r1 = r.range(45, 68); g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); g.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.stroke(); }
    // the pupil: a tall oval (dim evening light)
    g.fillStyle = '#050403'; g.beginPath(); g.ellipse(cx, cy, 15, 48, 0, 0, 7); g.fill();
  });
}

function uxBuildCat(parent) {
  const C = UX_CAT, g = new THREE.Group();
  const furTex = uxTex(uxCatFurCanvas(3));
  const fur = uxStd('#ffffff', 0.88, 0, { map: furTex, envMapIntensity: 0.3 });
  const headM = uxStd('#ffffff', 0.85, 0, { map: uxTex(uxCatHeadCanvas(), { repeat: false }), envMapIntensity: 0.3 });
  const white = uxStd('#e6dccb', 0.9), pink = uxStd('#c98d86', 0.55), darkM = uxStd('#2a1f18', 0.6), earIn = uxStd('#d4a598', 0.8, 0, { side: THREE.DoubleSide });
  const eyeM = new THREE.MeshPhysicalMaterial({ map: uxTex(uxCatEyeCanvas(), { repeat: false }), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.2 });
  const mesh = (geo, m, par, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; par.add(o); return o; };

  // ---- pelvis + torso (a loft from rump to chest, in pelvis space)
  const pelvis = new THREE.Group(); g.add(pelvis);
  mesh(uxLoft([[0, 0.012, -0.05, 0.03, 0.03], [0, 0.015, -0.03, 0.052, 0.058], [0, 0.012, 0.03, 0.06, 0.068], [0, 0.004, 0.12, 0.062, 0.074],
    [0, 0.006, 0.2, 0.06, 0.074], [0, 0.014, 0.27, 0.056, 0.07], [0, 0.026, 0.32, 0.044, 0.052]], 16, 0.4), fur, pelvis);
  const chest = new THREE.Group(); chest.position.set(...C.chestAt); pelvis.add(chest);
  mesh(new THREE.SphereGeometry(0.058, 20, 14).scale(0.95, 1.05, 0.9), fur, chest, 0, -0.012, 0.012);   // the rounded chest
  // neck → head
  const neck = new THREE.Group(); neck.position.set(0, 0.03, 0.02); chest.add(neck);
  mesh(uxLoft([[0, -0.01, -0.02, 0.045, 0.05], [0, 0.005, 0.03, 0.04, 0.044], [0, 0.02, 0.07, 0.036, 0.04]], 14, 0.3), fur, neck);
  const head = new THREE.Group(); head.position.set(0, 0.03, 0.08); neck.add(head);
  {
    const hg = new THREE.SphereGeometry(0.046, 32, 20), p = hg.attributes.position;
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      // a flatter forehead, wide cheeks, a short muzzle
      x *= 1.0 + 0.12 * MathX.smooth(-y, -0.01, 0.03);
      if (z > 0) { z *= 0.92; y -= 0.008 * MathX.smooth(z, 0.0, 0.04); }
      p.setXYZ(i, x, y * 0.9, z);
    }
    hg.computeVertexNormals();
    mesh(hg, headM, head);
  }
  mesh(new THREE.SphereGeometry(0.019, 16, 12).scale(1.25, 0.9, 1.0), white, head, 0, -0.019, 0.034);         // muzzle
  for (const sx of [-1, 1]) mesh(new THREE.SphereGeometry(0.0145, 14, 10).scale(1, 0.85, 1), white, head, sx * 0.0135, -0.016, 0.039);  // whisker pads
  mesh(new THREE.SphereGeometry(0.012, 12, 8).scale(1.1, 0.7, 1), white, head, 0, -0.031, 0.03);                // chin
  const nose = mesh(new THREE.SphereGeometry(0.0072, 12, 8).scale(1.25, 0.75, 0.8), pink, head, 0, -0.006, 0.05);
  mesh(new THREE.BoxGeometry(0.0012, 0.008, 0.0012), darkM, head, 0, -0.013, 0.051);
  const eyes = [], lids = [];
  for (const sx of [-1, 1]) {
    const e = mesh(new THREE.SphereGeometry(0.0122, 24, 16), eyeM, head, sx * 0.0205, 0.008, 0.0285);
    e.rotation.y = sx * 0.28; e.castShadow = false; eyes.push(e);
    // an eyelid: a fur cap that closes over the eye (blinks)
    const lid = mesh(new THREE.SphereGeometry(0.0128, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), headM, head, sx * 0.0205, 0.008, 0.0285);
    lid.rotation.order = 'YXZ'; lid.rotation.y = sx * 0.28; lids.push(lid);
  }
  // ears
  const ears = [];
  for (const sx of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(sx * 0.027, 0.028, -0.004); pivot.rotation.z = -sx * 0.38; head.add(pivot);
    const outer = mesh(new THREE.ConeGeometry(0.025, 0.05, 16).scale(1, 1, 0.42), headM, pivot, 0, 0.02, 0);
    const inner = mesh(new THREE.ConeGeometry(0.018, 0.038, 14).scale(1, 1, 0.28), earIn, pivot, 0, 0.018, 0.0062);
    ears.push(pivot);
  }
  // whiskers
  {
    const pts = [];
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) {
      const y0 = -0.013 - (k % 2) * 0.004, z0 = 0.043, len = 0.05 + (k % 2) * 0.008 + (k > 1 ? 0.006 : 0);
      const a = (k % 2 ? -0.12 : 0.1) + (k > 1 ? -0.08 : 0.04);
      let px = sx * 0.02, py = y0, pz = z0;
      for (let s = 0; s < 6; s++) {
        const u = (s + 1) / 6, nx = sx * (0.02 + len * u), ny = y0 + Math.sin(a) * len * u - 0.012 * u * u, nz = z0 + 0.012 * u - 0.03 * u * u;
        pts.push(px, py, pz, nx, ny, nz); px = nx; py = ny; pz = nz;
      }
    }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    head.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: '#f4efe6', transparent: true, opacity: 0.42 })));
  }
  // ---- legs: upper → lower (→ metatarsal for the hind legs) → paw
  const leg = (front, sx) => {
    const par = front ? chest : pelvis, root = front ? C.hipF : C.hipB, L = C.L;
    const up = new THREE.Group(); up.position.set(sx * root[0], root[1], root[2]); par.add(up);
    const l1 = front ? L.fu : L.bu, l2 = front ? L.fl : L.bl;
    mesh(uxLoft(front ? [[0, 0.02, 0, 0.03, 0.036], [0, -l1 * 0.5, 0, 0.022, 0.025], [0, -l1, 0, 0.016, 0.017]] : [[0, 0.025, 0.005, 0.04, 0.056], [0, -l1 * 0.45, 0.004, 0.034, 0.042], [0, -l1, 0, 0.018, 0.02]], 12, 0.5), fur, up);
    const lo = new THREE.Group(); lo.position.y = -l1; up.add(lo);
    mesh(uxLoft([[0, 0.006, 0, 0.016, 0.017], [0, -l2 * 0.5, 0, 0.0125, 0.013], [0, -l2, 0, 0.011, 0.012]], 10, 0.5), front ? fur : fur, lo);
    let mt = null, end = lo, endY = -l2;
    if (!front) {
      mt = new THREE.Group(); mt.position.y = -l2; lo.add(mt);
      mesh(uxLoft([[0, 0.004, 0, 0.0115, 0.012], [0, -L.bm, 0, 0.0105, 0.011]], 10, 0.5), fur, mt);
      end = mt; endY = -L.bm;
    }
    const paw = new THREE.Group(); paw.position.y = endY; end.add(paw);
    mesh(new THREE.SphereGeometry(0.016, 14, 9).scale(0.95, 0.55, 1.35), white, paw, 0, 0.0, 0.009);
    return { up, lo, mt, paw, front, sx, l1, l2 };
  };
  const legs = { fl: leg(true, 1), fr: leg(true, -1), bl: leg(false, 1), br: leg(false, -1) };
  // tail: ten links, banded
  const tail = []; let tp = pelvis;
  const ringDark = uxStd('#4a4038', 0.9);
  for (let k = 0; k < 10; k++) {
    const j = new THREE.Group(); j.position.set(0, k === 0 ? 0.035 : 0, k === 0 ? -0.045 : -0.029); tp.add(j);
    const r = 0.0155 - k * 0.0006;
    mesh(new THREE.CapsuleGeometry(r, 0.022, 3, 10).rotateX(Math.PI / 2).translate(0, 0, -0.0145), k % 2 ? ringDark : fur, j);
    tail.push(j); tp = j;
  }
  parent.add(g);

  // ---- posing
  const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion();
  // a "down" angle (rotation.x of a bone pointing −y) for a direction (dy, dz)
  const ang = (dy, dz) => Math.atan2(-dz, -dy);
  const solve = (Lg, H, T, absParent, kneeFwd) => {
    const vy = T[0] - H[0], vz = T[1] - H[1];
    let d = Math.hypot(vy, vz);
    const L1 = Lg.l1, L2 = Lg.l2;
    d = MathX.clamp(d, Math.abs(L1 - L2) + 1e-4, L1 + L2 - 1e-4);
    const rb = ang(vy, vz), a = Math.acos(MathX.clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const r1 = kneeFwd ? rb - a : rb + a;
    const ky = H[0] - Math.cos(r1) * L1, kz = H[1] - Math.sin(r1) * L1;
    const r2 = ang(T[0] - ky, T[1] - kz);
    Lg.up.rotation.x = r1 - absParent; Lg.lo.rotation.x = r2 - r1;
    return r2;
  };
  const api = {
    g, head, neck, chest, pelvis, ears, eyes, lids, legs, tail, nose,
    // P: { py, pz, pp, cp, np, ny, hp, hy, hr, fl:[y,z], fr, bl, br, bm, tb, tc, ts, tw, ear, blink }
    pose(P, t) {
      pelvis.position.set(0, P.py, P.pz); pelvis.rotation.x = P.pp;
      chest.rotation.x = P.cp;
      neck.rotation.set(P.np, P.ny, 0, 'YXZ');
      head.rotation.set(P.hp, P.hy, P.hr, 'YXZ');
      // joint positions in the cat's (y, z) plane
      const cp = Math.cos(P.pp), sp = Math.sin(P.pp);
      const inP = (y, z) => [P.py + y * cp - z * sp, P.pz + y * sp + z * cp];            // pelvis space → root (rotation about x)
      const ca = P.pp + P.cp, cc = Math.cos(ca), sc = Math.sin(ca);
      const chestR = inP(C.chestAt[1], C.chestAt[2]);
      const inC = (y, z) => [chestR[0] + y * cc - z * sc, chestR[1] + y * sc + z * cc];
      for (const k of ['fl', 'fr']) {
        const Lg = legs[k], H = inC(C.hipF[1], C.hipF[2]);
        const r2 = solve(Lg, H, P[k], ca, false);
        Lg.paw.rotation.x = -r2;
      }
      for (const k of ['bl', 'br']) {
        const Lg = legs[k], H = inP(C.hipB[1], C.hipB[2]), T = P[k];
        // the hock sits one metatarsal length above/behind the toes, at angle bm
        const hk = [T[0] + Math.cos(P.bm) * C.L.bm, T[1] + Math.sin(P.bm) * C.L.bm];
        const r2 = solve(Lg, H, hk, P.pp, true);
        Lg.mt.rotation.x = P.bm - r2;
        Lg.paw.rotation.x = -P.bm;
      }
      // the tail: base angle, curl along its length, a slow sway, a twitch at the tip
      tail.forEach((j, k) => {
        const u = k / 9;
        j.rotation.x = (k === 0 ? P.tb : 0) + P.tc * (0.4 + u);
        j.rotation.y = P.ts * Math.sin(t * 1.3 - k * 0.45) * (0.3 + u) + (k > 6 ? P.tw * Math.sin(t * 9 - k) : 0);
      });
      for (const [i, e] of ears.entries()) { const s = i ? 1 : -1; e.rotation.set(-0.9 * P.ear, s * 0.5 * P.ear, -s * 0.38 + s * 0.5 * P.ear); }
      for (const l of lids) l.rotation.x = -1.1 + P.blink * 2.4;
    },
    // turn the head (weight k) to look at a point given in the cat's parent space
    lookAt(p, k) {
      if (k <= 0) return;
      _q.copy(head.quaternion);
      parent.updateMatrixWorld(true);
      head.lookAt(_v.set(p[0], p[1], p[2]).applyMatrix4(parent.matrixWorld));
      _q2.copy(head.quaternion);
      head.quaternion.copy(_q).slerp(_q2, MathX.clamp(k, 0, 1));
    },
  };
  return api;
}

// ---- the poses (cat-local, metres)
const UX_CAT_POSES = {
  stand: { py: 0.238, pz: -0.13, pp: 0.0, cp: 0.0, np: -0.35, ny: 0, hp: 0.3, hy: 0, hr: 0,
    fl: [0.011, 0.165], fr: [0.011, 0.165], bl: [0.011, -0.085], br: [0.011, -0.085], bm: -0.18, tb: -0.5, tc: 0.12, ts: 0.25, tw: 0.15, ear: 0, blink: 0 },
  sit: { py: 0.06, pz: -0.1, pp: -1.0, cp: 0.6, np: -0.3, ny: 0, hp: 0.4, hy: 0, hr: 0,
    fl: [0.011, 0.105], fr: [0.011, 0.105], bl: [0.011, 0.045], br: [0.011, 0.045], bm: -1.5, tb: 1.25, tc: 0.42, ts: 0.12, tw: 0.25, ear: 0, blink: 0 },
  crouch: { py: 0.15, pz: -0.12, pp: 0.12, cp: 0.12, np: -0.1, ny: 0, hp: 0.1, hy: 0, hr: 0,
    fl: [0.011, 0.19], fr: [0.011, 0.19], bl: [0.011, -0.05], br: [0.011, -0.05], bm: -0.65, tb: -0.25, tc: 0.08, ts: 0.15, tw: 0.4, ear: 0.1, blink: 0 },
  sniff: { py: 0.2, pz: -0.14, pp: 0.22, cp: 0.25, np: 0.45, ny: 0, hp: -0.55, hy: 0, hr: 0,
    fl: [0.011, 0.2], fr: [0.011, 0.2], bl: [0.011, -0.08], br: [0.011, -0.08], bm: -0.3, tb: -0.15, tc: 0.25, ts: 0.35, tw: 0.2, ear: 0, blink: 0 },
  leap: { py: 0.23, pz: -0.13, pp: 0.3, cp: -0.05, np: -0.4, ny: 0, hp: 0.15, hy: 0, hr: 0,
    fl: [0.06, 0.3], fr: [0.05, 0.28], bl: [0.12, -0.28], br: [0.11, -0.26], bm: 0.6, tb: -0.1, tc: -0.05, ts: 0.05, tw: 0.1, ear: 0.2, blink: 0 },
  startle: { py: 0.16, pz: -0.16, pp: -0.1, cp: 0.0, np: -0.55, ny: 0, hp: 0.25, hy: 0, hr: 0,
    fl: [0.011, 0.17], fr: [0.011, 0.17], bl: [0.011, -0.05], br: [0.011, -0.05], bm: -0.7, tb: -0.9, tc: -0.1, ts: 0.05, tw: 0.8, ear: 1, blink: 0 },
};
UX_CAT_POSES.loaf = { py: 0.075, pz: -0.11, pp: -0.05, cp: 0.05, np: -0.15, ny: 0.0, hp: 0.25, hy: 0, hr: 0.05,
  fl: [0.03, 0.12], fr: [0.03, 0.12], bl: [0.04, -0.01], br: [0.04, -0.01], bm: -1.45, tb: 0.25, tc: 0.55, ts: 0.05, tw: 0.05, ear: 0, blink: 1 };
UX_CAT_POSES.alert = Object.assign({}, UX_CAT_POSES.sit, { np: -0.45, hp: 0.15, ear: -0.1, tw: 0.6, blink: 0 });
// a gallop at phase u (cycles): feet in stance sweep back under the body, swing forward in the air; the spine flexes and
// extends once a stride, the body bobs. k = how much of the gallop (0 = the stand pose)
function uxCatGallop(u, k = 1) {
  const P = Object.assign({}, UX_CAT_POSES.stand), ph = { bl: 0, br: 0.09, fl: 0.52, fr: 0.6 }, ext = Math.sin(u * 6.2832);
  for (const leg of ['fl', 'fr', 'bl', 'br']) {
    const w = ((u + ph[leg]) % 1 + 1) % 1, z0 = UX_CAT_POSES.stand[leg][1], A = leg[0] === 'f' ? 0.13 : 0.12;
    let y, z;
    if (w < 0.38) { const q = w / 0.38; z = z0 + A * (1 - 2 * q); y = 0.011; }
    else { const q = (w - 0.38) / 0.62; z = z0 - A + 2 * A * (0.5 - 0.5 * Math.cos(Math.PI * q)); y = 0.011 + 0.075 * Math.sin(Math.PI * q); }
    P[leg] = [uxLerp(UX_CAT_POSES.stand[leg][0], y, k), uxLerp(z0, z, k)];
  }
  P.py = UX_CAT_POSES.stand.py - k * (0.03 - 0.022 * Math.abs(ext));
  P.cp = k * 0.16 * ext; P.pp = k * (0.08 - 0.06 * ext); P.np = UX_CAT_POSES.stand.np + k * (0.25 - 0.12 * ext); P.hp = UX_CAT_POSES.stand.hp - k * 0.2;
  P.tb = uxLerp(P.tb, 0.1, k); P.tc = uxLerp(P.tc, -0.05, k); P.ts = uxLerp(P.ts, 0.05, k); P.ear = k * 0.35;
  return P;
}
function uxCatBlend(a, b, k) {
  const o = {};
  for (const key of Object.keys(a)) {
    const x = a[key], y = b[key];
    o[key] = Array.isArray(x) ? [x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k] : x + (y - x) * k;
  }
  return o;
}
// pose keyframes [[t, name], …] with blend times → a pose
function uxCatPoseAt(K, t) {
  let i = 0; while (i + 1 < K.length && K[i + 1][0] <= t) i++;
  const [t1, n1, bl = 0.35] = K[i];
  const prev = i > 0 ? UX_CAT_POSES[K[i - 1][1]] : UX_CAT_POSES[n1];
  return uxCatBlend(prev, UX_CAT_POSES[n1], Ease.inOutSine(MathX.clamp((t - t1) / bl, 0, 1)));
}
