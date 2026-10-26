/* =====================================================================
   SEA — the marina on a bright afternoon, year two. Your 60-metre yacht at the pier; the camera swings right and up to the one in
   the next berth: 120 metres, twice yours.
   ===================================================================== */

// a motor yacht of length L along +x (bow at +x), sitting on the water (y = 0); decks of white with dark glass bands
function sbSeaYacht(L, o = {}) {
  const g = new THREE.Group(), B = L * (o.beam || 0.17), Hh = L * 0.075, white = sbStd('#ecebe7', 0.35, 0.05, { envMapIntensity: 0.9 });
  const glass = sbStd('#090c11', 0.06, 0.3, { envMapIntensity: 0.55, emissive: new THREE.Color('#ffc890'), emissiveIntensity: 0 });
  const boot = sbStd('#1a2a44', 0.35, 0.1), hullM = o.hull ? sbStd(o.hull, 0.22, 0.2, { envMapIntensity: 1.0 }) : white;
  // (the plan of a deck: a square-ish stern, a long pointed bow; s shrinks it, x0 trims the bow)
  const plan = (s, bowTrim = 0, sternTrim = 0) => {
    const sh = new THREE.Shape(), hl = L / 2, hb = B / 2 * s, xs = -hl + sternTrim, xb = hl - bowTrim;
    sh.moveTo(xs, -hb * 0.92); sh.lineTo(xb - L * 0.3, -hb); sh.quadraticCurveTo(xb - L * 0.06, -hb * 0.85, xb, 0);
    sh.quadraticCurveTo(xb - L * 0.06, hb * 0.85, xb - L * 0.3, hb); sh.lineTo(xs, hb * 0.92); sh.quadraticCurveTo(xs - 0.6, 0, xs, -hb * 0.92);
    return sh;
  };
  const slab = (sh, h, m, y) => { const geo = new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 18 }); geo.rotateX(-Math.PI / 2); const mm = new THREE.Mesh(geo, m); mm.position.y = y; mm.castShadow = mm.receiveShadow = true; g.add(mm); return mm; };
  // the hull: a dark boot stripe at the waterline, white above, a rising bow
  slab(plan(0.985), 1.2, boot, -1.0);
  const hull = slab(plan(1.0), Hh, hullM, 0.2);
  { const pos = hull.geometry.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i); if (y > Hh * 0.5) pos.setY(i, y + Math.max(0, (x / (L / 2)) - 0.3) * Hh * 0.35); } pos.needsUpdate = true; hull.geometry.computeVertexNormals(); }
  // a line of hull windows and a bright rubbing strake at the sheer
  slab(plan(1.004, L * 0.32, L * 0.1), Hh * 0.13, glass, 0.2 + Hh * 0.42);
  slab(plan(1.006, L * 0.02, 0.2), Hh * 0.05, o.hull ? white : sbStd('#9aa4ae', 0.3, 0.6), 0.2 + Hh * 0.9);
  // the decks: each set back, a band of dark glass in the middle of each
  const decks = o.decks || 3, dh = L * 0.04;
  for (let d = 0; d < decks; d++) {
    const s = 0.9 - d * 0.08, bow = L * (0.27 + d * 0.065), stern = L * (0.06 + d * 0.03), y = Hh + 0.2 + d * dh;
    slab(plan(s, bow, stern), dh * 0.28, white, y);
    const gl = slab(plan(s - 0.01, bow + 0.4, stern + 0.4), dh * 0.52, glass, y + dh * 0.28); gl.userData.glass = true;
    slab(plan(s + 0.02, bow - 0.3, stern - 0.5), dh * 0.2, white, y + dh * 0.8);
  }
  // a mast, two radar domes
  const top = Hh + 0.2 + decks * dh, mx = L * ((0.06 + (decks - 1) * 0.03) - (0.27 + (decks - 1) * 0.065)) / 2 + L * 0.03;
  sbBox(L * 0.02, L * 0.05, B * 0.25, white, mx, top + L * 0.025 - dh * 0.1, 0, g);
  for (const z of [-B * 0.08, B * 0.08]) sbMesh(new THREE.SphereGeometry(L * 0.009, 16, 10), white, mx, top + L * 0.055 - dh * 0.1, z, g);
  g.userData = { glass, L, top };
  return g;
}

SB_SETS.sea = (app) => {
  const S = sbSet(app, { sky: '#a8c8e8', fov: 52, near: 0.1, far: 9000, fog: 0.00026, fogColor: '#bcd2e4', hemi: ['#b8d0ea', '#3a4a50', 0.5],
    sun: [-460, 470, 380], sunColor: '#fff4e2', sunI: 3.0, shadow: 2048, shadowR: 90, shadowFar: 2000 });
  const { scene, camera: cam, sun } = S;
  sun.target.position.set(50, 0, -10);
  sbSky(scene, '#2a62b4', '#c4daee', '#6a8aa0', { sunDir: [-0.6, 0.6, 0.5], sunGlow: '#ffffff', hw: 0.2 });
  scene.environment = sbEnv(app.renderer, '#5a90d0', '#e8eef2', '#4a5a60');
  const W = SB_W, K = sbK;
  // the sea: dark, glossy, a slow swell (a bump map drifting)
  const waveTex = sbTex(sbCanvas(256, 256, (g, w, h) => { const img = g.createImageData(w, h), wv = [];   // (a sum of whole-period waves, so the tile repeats without seams)
    for (let k = 0; k < 14; k++) wv.push([Math.round(1 + 9 * hash1(k * 3.1)) * (hash1(k * 7.3) < 0.5 ? -1 : 1), Math.round(1 + 5 * hash1(k * 5.7)), 6.283 * hash1(k * 9.9), 14 / (1 + k * 0.35)]);
    for (let i = 0; i < w * h; i++) { const x = i % w, y = (i / w) | 0; let v = 128; for (const [fx, fy, ph, a] of wv) v += a * Math.sin(6.2832 * (fx * x + fy * y) / w + ph); img.data.set([v, v, v, 255], i * 4); } g.putImageData(img, 0, 0); }), { srgb: false });
  waveTex.repeat.set(300, 300);
  const sea = sbMesh(new THREE.PlaneGeometry(9000, 9000), sbStd('#0a3a5a', 0.06, 0.0, { bumpMap: waveTex, bumpScale: 0.8, envMapIntensity: 1.0 }), 0, 0, 0, scene);
  sea.rotation.x = -Math.PI / 2; sea.castShadow = sea.receiveShadow = false; sea.material.envMap = sbEnv(app.renderer, '#3a78c8', '#7aa8cc', '#0a2a3a');
  // the pier (wood on piles), bollards, lamps; the marina beyond (sailing masts), the coast and its lights
  const wood = sbStd('#ffffff', 0.7, 0, { map: sbTex(sbWoodCanvas(CONFIG.seed + 800, 256, 1024, [120, 92, 70])) }); wood.map.repeat.set(60, 1);
  const PZ = -27;   // (the pier runs behind the two yachts)
  sbBox(260, 0.3, 5, wood, 60, 1.35, PZ, scene);
  for (let x = -60; x < 190; x += 6) for (const z of [-2.2, 2.2]) sbCyl(0.18, 0.18, 2.4, sbStd('#3a2e26', 0.8), x, 0.2, PZ + z, scene, 8);
  const lampM = sbStd('#f0eee8', 0.4, 0);
  for (let x = -50; x < 190; x += 16) { sbCyl(0.06, 0.08, 3.2, sbStd('#2a2a2e', 0.4, 0.6), x, 3.1, PZ - 2, scene, 8); sbMesh(new THREE.SphereGeometry(0.2, 12, 8), lampM, x, 4.8, PZ - 2, scene); }
  const mine = sbSeaYacht(60, { decks: 3 }); mine.position.set(-12, 0, -9); scene.add(mine);
  const big = sbSeaYacht(120, { decks: 5, beam: 0.16, hull: '#1b2940' }); big.position.set(88, 0, -13); scene.add(big);
  for (let i = 0; i < 40; i++) {
    const x = -260 + i * 13 + 6 * hash1(i), z = -120 - 40 * hash1(i * 3), L = 10 + 6 * hash1(i * 5);
    const hb = sbBox(L, 1.2, L * 0.3, sbStd('#e8e4dc', 0.4), x, 0.4, z, scene); hb.castShadow = false;
    const m = sbCyl(0.08, 0.1, L * 1.4, sbStd('#d8d4cc', 0.4, 0.4), x, L * 0.7, z, scene, 6); m.castShadow = false;
  }
  for (let i = 0; i < 9; i++) { const h = sbMesh(new THREE.ConeGeometry(260 + 200 * hash1(i), 90 + 80 * hash1(i * 3), 7), sbStd('#6a7a5a', 0.95), -900 + i * 260, 0, -1600 - 300 * hash1(i * 5), scene); h.castShadow = false; }
  { const town = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), sbStd('#d6c8b0', 0.85), 700), o = new THREE.Object3D();
    for (let i = 0; i < 700; i++) { const x = -1000 + 2200 * hash1(i * 3.3), z = -1250 - 260 * hash1(i * 7.7), w = 8 + 14 * hash1(i * 5.1); o.position.set(x, 2 + 60 * hash1(i * 9.1) * hash1(i * 2.2), z); o.scale.set(w, 6 + 18 * hash1(i * 4.4), w * 0.8); o.updateMatrix(); town.setMatrixAt(i, o.matrix); }
    town.castShadow = false; scene.add(town); }
  const puffs = sbPuffs(scene, 1200, { additive: true, soft: 1.5 });
  const lights = []; for (let i = 0; i < 400; i++) lights.push([-1100 + 2400 * hash1(i * 3.3), 2 + 30 * hash1(i * 5.1), -1350 - 200 * hash1(i * 7.7), hash1(i * 9.1)]);
  // a tender crossing the harbour (for life and for scale)
  const tender = sbSeaYacht(11, { decks: 1 }); scene.add(tender);
  // crew on your aft deck
  const crew = [sbPerson({ id: 'sbCrew1', look: 'sbCrew', path: [[0, -34, -6.2]], face: 180, states: [[0, 'idle']], y: 4.7 }, scene), sbPerson({ id: 'sbCrew2', look: 'sbCrew', path: [[0, -30, -12]], face: -90, states: [[0, 'idle']], y: 4.7 }, scene)];

  const set = {
    scene, camera: cam,
    frame(t) {
      // your yacht from the pier; then you turn and look up at the one next to it
      const k = K(t, sbCap('yacht', 1).show - 0.9, sbCap('yacht', 1).show + 1.4, Ease.inOutSine), k0 = K(t, SB.yacht, SB.wall, (x) => x);
      // (a long lens from across the harbour: both yachts at the same distance, so their sizes compare honestly)
      const pos = [22 - 4 * k0, 5.5, 255], at = sbV([-12, 7.5, -10], [48, 13, -12], k);
      const d = sbDrift(t, 0.05, 0.25, 41); sbCam(cam, [pos[0] + d[0], pos[1] + d[1], pos[2] + d[2]], at, sbLerp(15.5 - 0.8 * k0, 26, k));
      waveTex.offset.set(t * 0.01, t * 0.006);
      for (const y of [mine, big]) y.userData.glass.emissiveIntensity = 0.0;
      for (const c of crew) c.update(t);
      const tx = -75 + 17 * (t - SB.yacht), tz = 46; tender.position.set(tx, 0.15 * Math.sin(t * 2.3), tz); tender.rotation.z = 0.04;
      puffs.begin();
      for (let k = 0; k < 46; k++) { const b = k * 1.1, sp = 0.6 + b * 0.16, fa = Math.max(0, 1 - k / 46);
        for (const sd of [-1, 1]) puffs.add(tx - 5.6 - b, 0.25, tz + sd * sp, 1.6 + b * 0.06, 0.16 * fa, 1, 1, 1);
        if (k < 22) puffs.add(tx - 5.8 - b, 0.3, tz + 0.4 * Math.sin(k * 1.7 + t * 3), 2.2, 0.2 * (1 - k / 22), 1, 1, 1); }
      puffs.end();
    },
    grade(t, p) { p.exposure = 0.84; p.warmth = 0.03; p.bloom = 0.12; p.bloomThreshold = 0.92; p.saturation = 1.1; p.contrast = 1.16; p.grain = 0.026; },
    labels(t) {
      return [{ p: [-12, 17, -9], text: 'YOURS', sub: '60 METRES', a: W(t, sbCap('yacht', 0).show + 1.0, SB.wall - 0.1, 0.3, 0.3) },
        { p: [88, 40, -13], text: 'NEXT TO IT', sub: '120 METRES', a: W(t, sbCap('yacht', 1).show + 0.9, SB.wall - 0.1, 0.3, 0.3) }];
    },
  };
  return set;
};
LOOKS.sbCrew = { skin: 2, build: 'avg', shirt: '#f4f2ee', sleeves: 'short', pants: '#1f2a44', shoes: '#f4f2ee', sole: '#ddd', hair: '#2a1a10', collar: true };
