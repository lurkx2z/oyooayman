/* =====================================================================
   KITCHEN — the opening set: an ordinary kitchen counter under a north window, a sink, the tap, a brimming
   glass, beads of water, a pothos with beaded leaves, a bowl of water, a paperclip, a sealed bottle of sparkling water.
   The back wall's inner face is at z = 0.2 (the garden is outside it, z < 0). Counter top at y = 0.92.
   Every moving thing is a pure function of time; the water reads nstSigma / nstGone (script.js).
   ===================================================================== */

const NST_K = {
  top: 0.92,
  domeH: 0.0075,                    // the water heaped above the rim of a brimming glass (exaggerated a little)
  glass: { x: -0.56, z: 0.52, r: 0.036, rb: 0.031, h: 0.112, wall: 0.0028 },
  beads: [[-0.65, 0.555, 1.0], [-0.47, 0.565, 0.8], [-0.625, 0.615, 0.45], [-0.5, 0.62, 0.35], [-0.67, 0.49, 0.25]],   // x, z, ml (around the glass's foot)
  leafBeads: [[0.0, 0.006, 0.08], [-0.012, -0.012, 0.05], [0.014, -0.01, 0.04]],   // offsets on the hero leaf, ml
  bowl: { x: -0.2, z: 0.61, r: 0.072, h: 0.098, water: 0.074 },      // a clear glass dish: you see the clip sink from the side
  sink: { x0: 0.0, x1: 0.62, z0: 0.33, z1: 0.75, depth: 0.2 },
  tap: { x: 0.31, z: 0.27, spout: [0.31, 1.205, 0.5], lever: [0.37, 1.02, 0.27] },
  roll: { x: -1.38, z: 0.4 },
  soda: { x: -0.4, z: 0.63, fill: 0.186, after: 0.056, neck: 0.212 },   // a 0.5 L bottle; water level (m above the counter) before / after
};

// the outer radius of the sparkling-water bottle at height y above the counter (body, rounded shoulder, neck)
function nstBottleR(y) {
  if (y < 0.004) return 0.0295 + 0.003 * Math.sqrt(Math.max(0, y) / 0.004);
  if (y < 0.142) return 0.0325;
  if (y < 0.192) { const k = (y - 0.142) / 0.05; return 0.0325 - 0.0198 * (0.5 - 0.5 * Math.cos(k * Math.PI)); }
  return 0.0127;
}

// a hand-shaped "Gem" paperclip path (metres, in its own XZ plane), scaled up 1.25× so it reads on a phone
function nstClipCurve() {
  const S = 1.25, pts = [];
  const line = (a, b, n = 4) => { for (let i = 0; i <= n; i++) pts.push([MathX.lerp(a[0], b[0], i / n), MathX.lerp(a[1], b[1], i / n)]); };
  const arc = (cx, cz, r, a0, a1, n = 8) => { for (let i = 1; i <= n; i++) { const a = MathX.lerp(a0, a1, i / n); pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } };
  line([0.007, 0.0], [-0.0105, 0.0]);
  arc(-0.0105, 0.00215, 0.00215, -Math.PI / 2, -Math.PI * 1.5);
  line([-0.0105, 0.0043], [0.0125, 0.0043]);
  arc(0.0125, 0.00065, 0.00365, Math.PI / 2, -Math.PI / 2);
  line([0.0125, -0.003], [-0.0145, -0.003]);
  arc(-0.0145, 0.0002, 0.0032, -Math.PI / 2, -Math.PI * 1.5);
  line([-0.0145, 0.0034], [0.0045, 0.0026]);
  const v = pts.map(([x, z]) => new THREE.Vector3(x * S, 0, z * S));
  const dedup = v.filter((p, i) => i === 0 || p.distanceTo(v[i - 1]) > 1e-5);
  return new THREE.CatmullRomCurve3(dedup, false, 'catmullrom', 0.1);
}

class NstKitchen {
  constructor(scene, renderer) {
    this.scene = scene; this.renderer = renderer;
    this.root = new THREE.Group(); this.root.name = 'kitchen'; scene.add(this.root);
    this.r = new RNG(CONFIG.seed + 5);
    this.v = new THREE.Vector3(); this.v2 = new THREE.Vector3();
  }

  build() {
    const g = this.root, r = this.r, K = NST_K, top = K.top;
    const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o));
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, shadow = true, parent = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; };
    const box = (w, h, d, x, y, z, mat, shadow = true, parent = g) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, 0, 0, 0, shadow, parent);
    this.std = std;

    // ---------- materials (own materials; Look.apply is not run on the kitchen: no street grime on a counter)
    const stone = Tex.canvas(512, 512), sc = stone.getContext('2d');
    sc.fillStyle = '#2b2d2f'; sc.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 70; i++) { sc.fillStyle = `rgba(${r.chance(0.5) ? '54,56,60' : '26,26,28'},${r.range(0.04, 0.1)})`; sc.beginPath(); sc.ellipse(r.range(0, 512), r.range(0, 512), r.range(14, 50), r.range(6, 18), r.range(0, 3), 0, 6.28); sc.fill(); }
    for (let i = 0; i < 2500; i++) { const v = r.range(0, 1); sc.fillStyle = v < 0.6 ? `rgba(62,64,68,${r.range(0.1, 0.3)})` : v < 0.9 ? `rgba(18,18,20,${r.range(0.15, 0.35)})` : `rgba(120,120,116,${r.range(0.06, 0.16)})`; const s = r.range(0.6, 1.8); sc.fillRect(r.range(0, 512), r.range(0, 512), s, s); }
    const stoneT = Tex.tex(stone); stoneT.repeat.set(4, 1.2);
    this.mStone = std('#ffffff', { map: stoneT, roughness: 0.5, envMapIntensity: 0.28, name: 'nstCounter' });
    const tile = Tex.canvas(256, 256), tc = tile.getContext('2d');
    tc.fillStyle = '#a9a69c'; tc.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 8; row++) for (let col = -1; col < 4; col++) {
      const x = col * 64 + (row % 2) * 32, y = row * 32, v = r.range(-8, 8);
      tc.fillStyle = `rgb(${226 + v},${222 + v},${212 + v})`; tc.fillRect(x + 2, y + 2, 60, 28);
      tc.fillStyle = 'rgba(255,255,255,0.18)'; tc.fillRect(x + 4, y + 4, 56, 5);
    }
    const tileT = Tex.tex(tile); tileT.repeat.set(9, 3.2);
    const mTile = std('#ffffff', { map: tileT, roughness: 0.3, envMapIntensity: 0.6 });
    const wallCv = Tex.canvas(256, 256), wc = wallCv.getContext('2d'); wc.fillStyle = '#c9c1b2'; wc.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) { wc.fillStyle = `rgba(${r.chance(0.5) ? '110,100,90' : '255,250,240'},${r.range(0.02, 0.05)})`; wc.fillRect(r.range(0, 256), r.range(0, 256), 2, 2); }
    const wallT = Tex.tex(wallCv); wallT.repeat.set(3, 2);
    const mWall = std('#ffffff', { map: wallT, roughness: 0.92 });
    const mCab = std('#5d6b62', { roughness: 0.55 });            // muted sage cabinet doors
    const mCabDark = std('#3f4943', { roughness: 0.6 });
    const mSteel = std('#c4c8cb', { roughness: 0.22, metalness: 0.75, envMapIntensity: 3.2 });
    const mSteelDark = std('#8a8f93', { roughness: 0.3, metalness: 0.7, envMapIntensity: 2.5 });
    const mWood = std('#7b5a3e', { roughness: 0.6 });
    const fl = Tex.canvas(512, 512), f = fl.getContext('2d');
    for (let i = 0; i < 8; i++) for (let k = 0; k < 3; k++) { const v = r.range(-10, 10), off = (i % 2) * 170; f.fillStyle = `rgb(${132 + v},${104 + v * 0.8},${78 + v * 0.6})`; f.fillRect(k * 256 - off, i * 64, 254, 62); }
    const floorT = Tex.tex(fl); floorT.repeat.set(4, 4);
    const mFloor = std('#ffffff', { map: floorT, roughness: 0.6 });
    this.mGlass = nstWaterMat({ color: '#d6e6ea', opacity: 0.04, fres: 0.55, rough: 0.03, env: 0.7, side: THREE.DoubleSide, name: 'nstGlass' });

    // ---------- room shell: floor, ceiling, walls (the back wall has the window and the garden door)
    add(new THREE.PlaneGeometry(5.4, 4.2), mFloor, -0.4, 0, 2.1, -Math.PI / 2, 0, 0, false);
    add(new THREE.PlaneGeometry(5.4, 4.2), std('#e6e1d7', { roughness: 0.95 }), -0.4, 2.6, 2.1, Math.PI / 2, 0, 0, false);
    const W = { x0: -3.1, x1: 2.3, z: 0.2 };
    const wallSeg = (x0, x1, y0, y1, mat = mWall) => { const m = add(new THREE.PlaneGeometry(x1 - x0, y1 - y0), mat, (x0 + x1) / 2, (y0 + y1) / 2, W.z, 0, 0, 0, true); return m; };
    // back wall around the window (x −0.3…0.9, y 1.08…2.05) and the door (x −2.75…−1.9, y 0…2.1)
    wallSeg(W.x0, -2.75, 0, 2.6); wallSeg(-2.75, -1.9, 2.1, 2.6); wallSeg(-1.9, -0.3, 0, 2.6);
    wallSeg(-0.3, 0.9, 0, 1.08); wallSeg(-0.3, 0.9, 2.05, 2.6); wallSeg(0.9, W.x1, 0, 2.6);
    // a thick outer skin so the window and door have depth (and block the light properly)
    const sk = std('#d8d2c6', { roughness: 0.9 });
    box(1.2, 0.22, 0.2, 0.3, 1.08 - 0.11 - 0.0, 0.1, sk); box(1.2, 0.55, 0.2, 0.3, 2.05 + 0.275, 0.1, sk);
    box(0.05, 0.97, 0.2, -0.325, 1.565, 0.1, sk); box(0.05, 0.97, 0.2, 0.925, 1.565, 0.1, sk);
    for (const [x0, x1] of [[W.x0, -2.75], [-1.9, -0.35], [0.95, W.x1]]) box(x1 - x0, 2.6, 0.2, (x0 + x1) / 2, 1.3, 0.1, sk);
    box(0.85, 0.5, 0.2, -2.325, 2.35, 0.1, sk);
    box(1.2, 0.86, 0.2, 0.3, 0.43, 0.1, sk);
    add(new THREE.PlaneGeometry(4.2, 2.6), mWall, W.x0, 1.3, 2.1, 0, Math.PI / 2, 0, false);
    add(new THREE.PlaneGeometry(4.2, 2.6), mWall, W.x1, 1.3, 2.1, 0, -Math.PI / 2, 0, false);
    add(new THREE.PlaneGeometry(5.4, 2.6), mWall, -0.4, 1.3, 4.2, 0, Math.PI, 0, false);
    // window: frame, mullion, inner sill, the pane
    const mFrame = std('#e9e6df', { roughness: 0.5 });
    box(1.24, 0.05, 0.08, 0.3, 1.055, 0.2, mFrame); box(1.24, 0.05, 0.08, 0.3, 2.075, 0.2, mFrame);
    box(0.05, 1.04, 0.08, -0.325, 1.565, 0.2, mFrame); box(0.05, 1.04, 0.08, 0.925, 1.565, 0.2, mFrame);
    box(0.04, 0.97, 0.06, 0.3, 1.565, 0.19, mFrame);
    box(1.34, 0.025, 0.14, 0.3, 1.075, 0.26, std('#efece6', { roughness: 0.45 }));
    const pane = add(new THREE.PlaneGeometry(1.2, 0.97), new THREE.MeshStandardMaterial({ color: '#cfe0e6', roughness: 0.05, transparent: true, opacity: 0.12, depthWrite: false, envMapIntensity: 0.8, name: 'nstWindowGlass' }), 0.3, 1.565, 0.17, 0, 0, 0, false);
    pane.renderOrder = 2;
    // the garden door (closed, with a glazed upper half)
    const door = std('#efebe2', { roughness: 0.55 });
    box(0.85, 1.05, 0.05, -2.325, 0.525, 0.18, door); box(0.85, 0.12, 0.05, -2.325, 2.04, 0.18, door);
    box(0.08, 0.9, 0.05, -2.71, 1.53, 0.18, door); box(0.08, 0.9, 0.05, -1.94, 1.53, 0.18, door);
    add(new THREE.PlaneGeometry(0.69, 0.9), this.mGlass.clone(), -2.325, 1.53, 0.18, 0, 0, 0, false);

    // ---------- lower cabinets + counter (with the sink cut out)
    const C = { x0: -1.75, x1: 2.25, z0: W.z, z1: W.z + 0.62 };
    // the carcass, open under the sink (a solid box here would cap the basin at y 0.88 and hide what's in it)
    {
      const sx0 = K.sink.x0 - 0.005, sx1 = K.sink.x1 + 0.005, sz0 = K.sink.z0 - 0.005, sz1 = K.sink.z1 + 0.005, yb = 0.06, yt = 0.88, yu = top - K.sink.depth - 0.01;
      const cb = (x0, x1, y0, y1, z0, z1) => box(x1 - x0, y1 - y0, z1 - z0, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, mCabDark);
      cb(C.x0, sx0, yb, yt, C.z0, C.z0 + 0.58); cb(sx1, C.x1, yb, yt, C.z0, C.z0 + 0.58);
      cb(sx0, sx1, yb, yu, C.z0, C.z0 + 0.58);
      cb(sx0, sx1, yu, yt, C.z0, sz0); cb(sx0, sx1, yu, yt, sz1, C.z0 + 0.58);
    }
    box(C.x1 - C.x0, 0.08, 0.52, (C.x0 + C.x1) / 2, 0.04, C.z0 + 0.26, std('#1e2220'));   // kick plinth
    for (let x = C.x0 + 0.02; x < C.x1 - 0.1; x += 0.5) {
      box(0.47, 0.74, 0.02, x + 0.24, 0.49, C.z1 - 0.03, mCab);
      box(0.012, 0.16, 0.02, x + (Math.round(x * 10) % 2 ? 0.44 : 0.05), 0.75, C.z1 - 0.005, mSteel);
    }
    const S = K.sink, th = 0.04, ty = top - th / 2;
    const slab = (x0, x1, z0, z1) => box(x1 - x0, th, z1 - z0, (x0 + x1) / 2, ty, (z0 + z1) / 2, this.mStone, true);
    slab(C.x0, S.x0, C.z0, C.z1 + 0.02); slab(S.x1, C.x1, C.z0, C.z1 + 0.02);
    slab(S.x0, S.x1, C.z0, S.z0); slab(S.x0, S.x1, S.z1, C.z1 + 0.02);
    box(C.x1 - C.x0, 0.012, 0.02, (C.x0 + C.x1) / 2, top - 0.006, C.z1 + 0.03, std('#1a1b1c', { roughness: 0.4 }));   // front edge shadow line
    // the sink basin (open box, brushed steel)
    const sd = S.depth, cx = (S.x0 + S.x1) / 2, cz = (S.z0 + S.z1) / 2, sw = S.x1 - S.x0, sl = S.z1 - S.z0;
    box(sw, 0.01, sl, cx, top - sd, cz, mSteelDark);
    box(sw, sd, 0.01, cx, top - sd / 2, S.z0, mSteel); box(sw, sd, 0.01, cx, top - sd / 2, S.z1, mSteel);
    box(0.01, sd, sl, S.x0, top - sd / 2, cz, mSteel); box(0.01, sd, sl, S.x1, top - sd / 2, cz, mSteel);
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.006, 16), std('#2a2d30', { roughness: 0.4, metalness: 0.7 }), cx, top - sd + 0.008, cz, 0, 0, 0, false);
    // the water in the basin (rises while the tap runs)
    this.basinW = add(new THREE.PlaneGeometry(sw - 0.012, sl - 0.012), nstWaterMat({ color: '#3a5057', opacity: 0.38, fres: 0.5, env: 0.45 }), cx, top - sd + 0.02, cz, -Math.PI / 2, 0, 0, false);
    this.basinW.renderOrder = 3;

    // ---------- the tap: a gooseneck mixer with a side lever
    const T = K.tap;
    add(new THREE.CylinderGeometry(0.0158, 0.03, 0.06, 20), mSteel, T.x, top + 0.03, T.z);     // (tapered: a flat steel ring on top caught the window light like a glowing halo)
    add(new THREE.CylinderGeometry(0.014, 0.016, 0.2, 16), mSteel, T.x, top + 0.16, T.z);
    const neck = new THREE.CatmullRomCurve3([new THREE.Vector3(T.x, top + 0.25, T.z), new THREE.Vector3(T.x, top + 0.33, T.z + 0.04), new THREE.Vector3(T.x, top + 0.34, T.z + 0.15), new THREE.Vector3(T.x, top + 0.31, T.z + 0.225), new THREE.Vector3(T.x, top + 0.29, T.z + 0.23)]);
    add(new THREE.TubeGeometry(neck, 32, 0.0125, 14), mSteel, 0, 0, 0);
    add(new THREE.CylinderGeometry(0.0122, 0.0125, 0.03, 16), mSteelDark, T.spout[0], T.spout[1] + 0.012, T.spout[2]);
    this.lever = new THREE.Group(); this.lever.position.set(T.x + 0.028, top + 0.1, T.z); g.add(this.lever);
    const lv = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.006, 0.09, 10), mSteel); lv.position.set(0.0, 0.045, 0); lv.castShadow = true; this.lever.add(lv);
    const lvk = new THREE.Mesh(new THREE.SphereGeometry(0.009, 12, 8), mSteel); lvk.position.set(0, 0.09, 0); this.lever.add(lvk);
    const lvb = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.022, 14), mSteel); lvb.rotation.z = Math.PI / 2; this.lever.add(lvb);

    // the tap's stream (into the basin)
    const wm = nstWaterMat({ color: '#6f8a93', opacity: 0.5, fres: 0.8 });
    this.stream = new NstStream(g, wm, { a: new THREE.Vector3(T.spout[0], T.spout[1] - 0.004, T.spout[2]), v0: new THREE.Vector3(0, -0.28, 0.012), r0: 0.0036, yEnd: top - sd + 0.02, seed: 4, spread: 0.2, frayLen: 0.17, ns: 60, nrad: 12 });
    this.spray = new NstSpray(this.scene, 900);      // a stream with nothing smoothing it sheds shreds and mist, not drops

    // ---------- upper cabinets, a fridge edge, a shelf: the room around the counter
    for (const [x0, x1] of [[-1.75, -0.45], [1.05, 1.5]]) {
      box(x1 - x0, 0.78, 0.34, (x0 + x1) / 2, 1.86, W.z + 0.17, mCabDark);
      for (let x = x0; x < x1 - 0.05; x += (x1 - x0) / Math.max(1, Math.round((x1 - x0) / 0.45))) {
        const w = (x1 - x0) / Math.max(1, Math.round((x1 - x0) / 0.45));
        box(w - 0.02, 0.74, 0.02, x + w / 2, 1.86, W.z + 0.345, mCab);
      }
    }
    // under-cabinet strip lights (warm, small): they put a soft warm sheen on the counter
    for (const x of [-1.1, 1.27]) box(0.5, 0.012, 0.03, x, 1.465, W.z + 0.3, std('#fff2d8', { emissive: '#ffe6bc', emissiveIntensity: 2.0 }), false);
    box(0.7, 1.95, 0.66, 1.92, 0.975, W.z + 0.36, std('#d8d9d6', { roughness: 0.35, metalness: 0.3 }));   // fridge
    box(0.02, 0.5, 0.03, 1.56, 1.25, W.z + 0.7, mSteel);
    // backsplash tiles between counter and cabinets (around the window)
    const bs = (x0, x1, y0, y1) => add(new THREE.PlaneGeometry(x1 - x0, y1 - y0), mTile, (x0 + x1) / 2, (y0 + y1) / 2, W.z + 0.002, 0, 0, 0, false);
    bs(-1.75, -0.35, top, 1.47); bs(0.95, 1.55, top, 1.47); bs(-0.35, 0.95, top, 1.03);

    // ---------- counter dressing: a cutting board, a jar of utensils, a kettle, a dish rack (life, not clutter)
    add(new THREE.RoundedBoxGeometry(0.36, 0.02, 0.24, 2, 0.006), mWood, -1.28, top + 0.01, 0.62, 0, 0.12, 0);
    add(new THREE.CylinderGeometry(0.05, 0.045, 0.14, 16), std('#d9d4ca', { roughness: 0.4 }), -1.58, top + 0.07, 0.3);
    for (let i = 0; i < 5; i++) add(new THREE.CylinderGeometry(0.005, 0.006, 0.26, 6), i % 2 ? mWood : mSteelDark, -1.58 + Math.cos(i * 1.3) * 0.02, top + 0.2, 0.3 + Math.sin(i * 1.3) * 0.02, Math.cos(i * 1.3) * 0.15, 0, Math.sin(i * 1.3) * 0.15);
    add(new THREE.CylinderGeometry(0.075, 0.09, 0.2, 20), std('#3a3f44', { roughness: 0.35, metalness: 0.5 }), 1.1, top + 0.1, 0.36);
    add(new THREE.TorusGeometry(0.06, 0.009, 8, 16, Math.PI), std('#222', { roughness: 0.5 }), 1.1, top + 0.22, 0.36, 0, Math.PI / 2, 0);
    // window-sill herbs (outside light behind them)
    for (const [x, c] of [[-0.12, '#b5643c'], [0.72, '#cfc8ba']]) {
      add(new THREE.CylinderGeometry(0.05, 0.04, 0.09, 14), std(c, { roughness: 0.8 }), x, 1.13, 0.27);
      for (let i = 0; i < 9; i++) { const a = i * 2.4, h = 0.06 + hash1(i + x * 10) * 0.06; add(new THREE.SphereGeometry(0.022, 6, 5), std('#4c6b3a', { roughness: 0.8, flatShading: true }), x + Math.cos(a) * 0.025, 1.18 + h * 0.6, 0.27 + Math.sin(a) * 0.02); }
    }

    // ---------- the paper-towel roll on its stand
    const PR = K.roll;
    add(new THREE.CylinderGeometry(0.065, 0.065, 0.24, 28), std('#f2efe8', { roughness: 0.95 }), PR.x, top + 0.135, PR.z);
    add(new THREE.CylinderGeometry(0.08, 0.08, 0.012, 24), mWood, PR.x, top + 0.006, PR.z);
    add(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 8), mWood, PR.x, top + 0.15, PR.z);

    this._glass();
    this._beads();
    this._plant();
    this._bowl();
    this._soda();

    // ---------- light: soft north window light (cool), a warm room fill, sky ambience
    const key = new THREE.DirectionalLight('#e8eef2', 2.6);
    key.position.set(1.05, 2.92, -0.98); key.target.position.set(-0.55, top, 0.62);
    key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
    const kc = key.shadow.camera; kc.left = -1.6; kc.right = 1.6; kc.top = 1.6; kc.bottom = -1.6; kc.near = 0.5; kc.far = 7;
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.01; key.shadow.radius = 6;
    g.add(key, key.target); this.key = key;
    const fill = new THREE.PointLight('#ffd9a8', 0.9, 6, 1.6); fill.position.set(-0.3, 2.45, 2.2); g.add(fill);
    const fill2 = new THREE.PointLight('#ffe2b8', 0.35, 2.5, 2); fill2.position.set(-1.1, 1.42, 0.5); g.add(fill2);
    const hemi = new THREE.HemisphereLight('#c9d4d8', '#5a4a3c', 0.85); g.add(hemi);
    this.lights = [key, fill, fill2, hemi];
    this._roomReflections();
  }

  // indoor reflections: the garden's sky map makes counters, glass and water glow like they are outdoors.
  // A dim room with one bright window, rendered once into a PMREM and given to every kitchen material.
  _roomReflections() {
    if (!this.renderer) return;
    const es = new THREE.Scene();
    const basic = (c, k = 1) => { const m = new THREE.MeshBasicMaterial({ color: c, side: THREE.BackSide }); m.color.multiplyScalar(k); return m; };
    const room = new THREE.Mesh(new THREE.BoxGeometry(5, 2.8, 5), [basic('#4a4640'), basic('#4a4640'), basic('#6a655d'), basic('#2a2724'), basic('#45413b'), basic('#514c45')]);
    room.position.y = 0.5; es.add(room);
    const plane = (w, h, c, k, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k) })); m.position.set(x, y, z); m.rotation.y = ry; es.add(m); };
    plane(1.4, 0.55, '#e4ecf0', 3.2, 0.3, 1.25, -2.45);        // the window: sky
    plane(1.4, 0.4, '#8fa37c', 1.1, 0.3, 0.78, -2.45);         //             garden
    plane(1.6, 0.22, '#fff2dc', 2.2, 0, 1.88, 0.6);            // ceiling light (faces down via rotation below)
    es.children[es.children.length - 1].rotation.x = Math.PI / 2;
    const pm = new THREE.PMREMGenerator(this.renderer);
    const env = pm.fromScene(es, 0.02).texture;
    pm.dispose();
    this.root.traverse(o => {
      if (!o.isMesh) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m && m.isMeshStandardMaterial && !m.envMap) { m.envMap = env; m.needsUpdate = true; }
    });
    this.envMap = env;
  }

  // ---------------------------------------------------------------- the brimming glass
  _glass() {
    const G = NST_K.glass, top = NST_K.top, g = this.root;
    // built from simple parts (clean normals: a lathe's centre point puts a star-shaped artefact in the thick base)
    const gl = new THREE.Group(); gl.position.set(G.x, top, G.z); g.add(gl);
    const part = (geo, y, rx) => { const m = new THREE.Mesh(geo, this.mGlass); m.position.y = y; m.rotation.x = rx; m.renderOrder = 4; gl.add(m); };
    part(new THREE.CylinderGeometry(G.r, G.rb, G.h - 0.002, 48, 1, true), 0.002 + (G.h - 0.002) / 2, 0);
    part(new THREE.CylinderGeometry(G.r - G.wall, G.rb - G.wall, G.h - 0.012, 48, 1, true), 0.012 + (G.h - 0.012) / 2, 0);
    part(new THREE.RingGeometry(G.r - G.wall, G.r, 48), G.h, -Math.PI / 2);
    this.glass = gl;
    // the water inside: up to the rim
    const wIn = G.r - G.wall - 0.0004;
    const wm = nstWaterMat({ color: '#4f6f78', opacity: 0.16, fres: 0.3, env: 0.6 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(wIn, G.rb - G.wall, G.h - 0.012, 40, 1, true), wm);
    body.position.set(G.x, top + 0.012 + (G.h - 0.012) / 2, G.z); body.renderOrder = 3; g.add(body);
    // the dome above the rim (held only by surface tension) → flat
    this.dome = new NstPuddle(g, nstWaterMat({ color: '#6f8c95', opacity: 0.24, fres: 0.7, rough: 0.02, env: 1.4 }), { na: 48, nr: 8, seed: 2 });
    this.dome.group.position.set(G.x, top + G.h - 0.0006, G.z);
    // the overflow: a film running down the outside of the glass (shader-masked, with a few faster rivulets)
    const fm = nstWaterMat({ color: '#2c3d44', opacity: 0.1, fres: 0.45, env: 0.9 });
    fm.userData.prog = { value: 0 };
    const ob = fm.onBeforeCompile;
    fm.onBeforeCompile = (sh) => {
      ob(sh);
      sh.uniforms.uProg = fm.userData.prog;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vUvN;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvUvN = uv;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vUvN; uniform float uProg;')
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          float ang = vUvN.x * 6.2832;
          float riv = 0.86 + 0.14 * pow(max(0.0, sin(ang * 5.0 + 0.7) * 0.6 + sin(ang * 11.0 + 2.1) * 0.4), 2.0);
          float front = 1.0 - uProg * riv;
          if (vUvN.y < front) discard;`);
    };
    fm.customProgramCacheKey = () => 'nstOverflow';
    this.overflow = new THREE.Mesh(new THREE.CylinderGeometry(G.r + 0.0005, G.rb + 0.0006, G.h - 0.002, 48, 1, true), fm);
    this.overflow.position.set(G.x, top + G.h / 2, G.z); this.overflow.renderOrder = 5; g.add(this.overflow);
    this.overflowMat = fm;
    // the spill spreading out around the foot of the glass
    this.spill = new NstPuddle(g, nstWaterMat({ color: '#56717a', opacity: 0.26, fres: 0.45, rough: 0.02, env: 1.2 }), { na: 64, nr: 7, seed: 5 });
    this.spill.group.position.set(G.x, top + 0.0003, G.z);
  }

  _beads() {
    const top = NST_K.top;
    this.beadObjs = NST_K.beads.map(([x, z, ml], i) => {
      const p = new NstPuddle(this.root, nstWaterMat({ color: '#5f7c86', opacity: 0.2, fres: 0.5, rough: 0.02, env: 1.2 }), { na: 48, nr: 9, seed: 11 + i * 3 });
      p.group.position.set(x, top + 0.0002 + i * 0.00002, z);
      return { p, V: ml * 1e-6, delay: 0.03 * i + hash1(i + 4) * 0.05 };
    });
  }

  // a pothos on the counter, one big heart-shaped leaf arching toward the camera, beaded with water
  _plant() {
    const g = this.root, top = NST_K.top, r = this.r;
    const px = -1.02, pz = 0.36;
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.065, 0.15, 24), this.std('#e8e2d6', { roughness: 0.45 }));
    pot.position.set(px, top + 0.075, pz); pot.castShadow = true; pot.receiveShadow = true; g.add(pot);
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.01, 20), this.std('#3a2e24', { roughness: 1 }));
    soil.position.set(px, top + 0.14, pz); g.add(soil);
    // heart-shaped leaf geometry (bent along its length)
    const leafGeo = (L, Wd, bend) => {
      const sh = new THREE.Shape();
      sh.moveTo(0, 0);
      sh.bezierCurveTo(Wd * 0.55, -L * 0.1, Wd * 0.62, L * 0.45, 0, L);
      sh.bezierCurveTo(-Wd * 0.62, L * 0.45, -Wd * 0.55, -L * 0.1, 0, 0);
      const geo = new THREE.ShapeGeometry(sh, 10);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, -bend * (y / L) * (y / L) * L + Math.abs(x) * 0.25); }
      geo.computeVertexNormals();
      return geo;
    };
    const leafM = this.std('#3f6b34', { roughness: 0.5, side: THREE.DoubleSide, envMapIntensity: 0.8 });
    const leafM2 = this.std('#557f3c', { roughness: 0.55, side: THREE.DoubleSide });
    const stemM = this.std('#5b7a3a', { roughness: 0.7 });
    for (let i = 0; i < 11; i++) {
      const a = i * 2.39 + 0.3, L = r.range(0.07, 0.11), lean = r.range(0.4, 1.1);
      const m = new THREE.Mesh(leafGeo(L, L * 0.85, 0.25), i % 3 ? leafM : leafM2);
      m.position.set(px + Math.cos(a) * 0.05, top + 0.16 + r.range(0, 0.08), pz + Math.sin(a) * 0.04);
      m.rotation.set(-Math.PI / 2 + lean, -a + Math.PI / 2, 0, 'YXZ');
      m.castShadow = true; g.add(m);
    }
    // a trailing vine with the hero leaf, reaching out over the counter toward the beads
    const vine = new THREE.CatmullRomCurve3([new THREE.Vector3(px + 0.04, top + 0.16, pz + 0.03), new THREE.Vector3(px + 0.12, top + 0.2, pz + 0.1), new THREE.Vector3(px + 0.2, top + 0.12, pz + 0.2), new THREE.Vector3(-0.8, top + 0.075, 0.56)]);
    const vm = new THREE.Mesh(new THREE.TubeGeometry(vine, 20, 0.0035, 6), stemM); vm.castShadow = true; g.add(vm);
    const hero = new THREE.Group(); hero.position.set(-0.8, top + 0.075, 0.56); hero.rotation.set(-1.25, -0.55, 0.0, 'YXZ'); g.add(hero);
    const hl = new THREE.Mesh(leafGeo(0.12, 0.11, 0.18), leafM); hl.castShadow = true; hero.add(hl);
    this.heroLeaf = hero;
    // a wet sheen layer over the leaf (fades in when the beads spread into it)
    this.leafWetMat = nstWaterMat({ color: '#2c4a28', opacity: 0.0, fres: 0.5, side: THREE.DoubleSide });
    const wet = new THREE.Mesh(leafGeo(0.118, 0.106, 0.18), this.leafWetMat); wet.position.z = 0.0008; wet.renderOrder = 3; hero.add(wet);
    // beads on the hero leaf (near-spheres on a waxy leaf) — in leaf-local space (the leaf lies in XY, normal +Z)
    this.leafBeads = NST_K.leafBeads.map(([dx, dy, ml], i) => {
      const p = new NstPuddle(hero, nstWaterMat({ color: '#7d9aa2', opacity: 0.22, fres: 0.6, rough: 0.02, env: 1.2 }), { na: 32, nr: 7, seed: 31 + i });
      p.group.position.set(dx, 0.06 + dy, 0.002 + 0.06 * 0.06 * 0.06 / 0.12);
      p.group.rotation.x = Math.PI / 2;
      return { p, V: ml * 1e-6 };
    });
  }

  _bowl() {
    const B = NST_K.bowl, top = NST_K.top, g = this.root, base = 0.007;
    // a straight-sided clear glass dish with a thick base
    const dg = new THREE.Group(); dg.position.set(B.x, top, B.z); g.add(dg);
    const part = (geo, y, rx) => { const m = new THREE.Mesh(geo, this.mGlass); m.position.y = y; m.rotation.x = rx; m.renderOrder = 4; dg.add(m); return m; };
    part(new THREE.CylinderGeometry(B.r, B.r - 0.002, B.h, 56, 1, true), B.h / 2, 0);
    part(new THREE.CylinderGeometry(B.r - 0.003, B.r - 0.005, B.h - base, 56, 1, true), base + (B.h - base) / 2, 0);
    part(new THREE.RingGeometry(B.r - 0.003, B.r, 56), B.h, -Math.PI / 2);
    part(new THREE.CircleGeometry(B.r - 0.002, 56), 0.0004, Math.PI / 2);
    // the floor of the dish: a dark slate coaster under it so the water and the sinking clip read
    const inner = new THREE.Mesh(new THREE.CircleGeometry(B.r - 0.004, 48), this.std('#2c3a42', { roughness: 0.35 }));
    inner.rotation.x = -Math.PI / 2; inner.position.set(B.x, top + base, B.z); g.add(inner);
    this.bowlInner = inner;
    // the water: its side (seen through the glass) and its surface; a ring wave when the clip goes in
    const wr = B.r - 0.0035;
    this.bowlWaterR = wr;
    const side = new THREE.Mesh(new THREE.CylinderGeometry(wr, wr - 0.0015, B.water - base, 56, 1, true), nstWaterMat({ color: '#4c6a74', opacity: 0.18, fres: 0.3, env: 0.6 }));
    side.position.set(B.x, top + base + (B.water - base) / 2, B.z); side.renderOrder = 3; g.add(side);
    this.bowlSurf = new THREE.Mesh(new THREE.CircleGeometry(wr, 56), nstWaterMat({ color: '#5d7c86', opacity: 0.26, fres: 0.55 }));
    this.bowlSurf.rotation.x = -Math.PI / 2; this.bowlSurf.position.set(B.x, top + B.water, B.z); this.bowlSurf.renderOrder = 3; g.add(this.bowlSurf);
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.98, 1.0, 48), new THREE.MeshBasicMaterial({ color: '#e8f2f4', transparent: true, opacity: 0, depthWrite: false }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.set(B.x, top + B.water + 0.0006, B.z); this.ring.renderOrder = 4; g.add(this.ring);
    // the paperclip (steel wire)
    this.clip = new THREE.Mesh(new THREE.TubeGeometry(nstClipCurve(), 160, 0.00062, 6), this.std('#c9cdd0', { roughness: 0.25, metalness: 0.95, envMapIntensity: 1.3 }));
    // a pale "ghost" of the clip floating where normal water would have held it (it fades in once the real one sinks)
    this.clipGhost = new THREE.Mesh(this.clip.geometry, new THREE.MeshBasicMaterial({ color: '#f4fbff', transparent: true, opacity: 0, depthWrite: false }));
    this.clipGhost.renderOrder = 6; g.add(this.clipGhost);
    this.clip.castShadow = true; g.add(this.clip);
  }

  // ---------------------------------------------------------------- a sealed bottle of sparkling water
  // Sealed, it is clear: the gas stays dissolved because the gas above it is at the same high pressure. Opened, the
  // pressure drops and the whole bottle is suddenly over-full of gas. A new bubble normally has to push against surface
  // tension to get started (so fizz only starts at a few scratches); with none, bubbles start everywhere at once: it goes
  // white and the gas throws most of the water out. Nothing is left as foam (foam needs surface tension): a wet counter.
  _soda() {
    const g = this.root, top = NST_K.top, D = NST_K.soda;
    const b = new THREE.Group(); b.position.set(D.x, top, D.z); g.add(b); this.bottle = b;
    const lathe = (inset, y0, y1, n = 48) => { const pts = []; for (let i = 0; i <= n; i++) { const y = MathX.lerp(y0, y1, i / n); pts.push(new THREE.Vector2(Math.max(0.0005, nstBottleR(y) - inset), y)); } return new THREE.LatheGeometry(pts, 44); };
    // the glass (one thin shell, both faces; a disc for the base)
    const gm = nstWaterMat({ color: '#d9ecee', opacity: 0.05, fres: 0.62, rough: 0.03, env: 0.9, side: THREE.DoubleSide, name: 'nstBottleGlass' });
    const shell = new THREE.Mesh(lathe(0, 0, D.neck), gm); shell.renderOrder = 5; b.add(shell);
    const base = new THREE.Mesh(new THREE.CircleGeometry(0.0296, 40), gm); base.rotation.x = -Math.PI / 2; base.position.y = 0.0015; base.renderOrder = 5; b.add(base);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.0134, 0.0013, 6, 32), gm); lip.rotation.x = Math.PI / 2; lip.position.y = D.neck - 0.0015; lip.renderOrder = 5; b.add(lip);
    // the water inside (cut at its level in the shader) and its flat top
    const level = { value: D.fill }; this.sodaLevel = level;
    const cut = (m, key) => {
      const ob = m.onBeforeCompile;
      m.onBeforeCompile = (sh) => {
        if (ob) ob(sh);
        sh.uniforms.uLevel = level;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vLy;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvLy = position.y;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vLy; uniform float uLevel;').replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vLy > uLevel) discard;');
      };
      m.customProgramCacheKey = () => key;
      return m;
    };
    const lm = cut(nstWaterMat({ color: '#9fc0c6', opacity: 0.1, fres: 0.32, env: 0.7 }), 'nstSodaLiquid');
    const liq = new THREE.Mesh(lathe(0.0011, 0.003, 0.205), lm); liq.renderOrder = 3; b.add(liq);
    this.sodaTop = new THREE.Mesh(new THREE.CircleGeometry(1, 40), nstWaterMat({ color: '#b9d2d6', opacity: 0.16, fres: 0.6, env: 1.0 }));
    this.sodaTop.rotation.x = -Math.PI / 2; this.sodaTop.renderOrder = 4; b.add(this.sodaTop);
    // the white-out: the whole body of water fills with gas at once (a milky, churning cloud), then clears from the
    // bottom up as the gas rises out, leaving thin ragged threads of gas (no round bubbles: nothing makes them round)
    this.milkU = { uMilk: { value: 0 }, uFront: { value: 0 }, uTop: { value: D.fill }, uT: { value: 0 }, uStreak: { value: 0 } };
    const mm = new THREE.ShaderMaterial({
      uniforms: this.milkU, transparent: true, depthWrite: false,
      vertexShader: /* glsl */`
        varying vec3 vP; varying vec3 vN; varying vec3 vV;
        void main(){ vP = position; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        uniform float uMilk, uFront, uTop, uT, uStreak;
        varying vec3 vP; varying vec3 vN; varying vec3 vV;
        float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
        void main(){
          if (vP.y > uTop) discard;
          float an = atan(vP.z, vP.x);
          vec2 q = vec2(an * 5.0, vP.y * 80.0 - uT * 6.0);
          float n = 0.55 * n2(q) + 0.3 * n2(q * 2.3 + 4.1) + 0.15 * n2(q * 5.1 + 1.7);
          float body = uMilk * smoothstep(uFront - 0.014, uFront + 0.014, vP.y);
          float st = uStreak * smoothstep(0.66, 0.86, n2(vec2(an * 7.0 + 0.6 * n2(vec2(an * 3.0, vP.y * 30.0)), vP.y * 9.0 - uT * 5.0)));
          float a = clamp(body * (0.7 + 0.45 * n) + st * 0.42, 0.0, 0.96);
          if (a < 0.004) discard;
          float fr = abs(dot(normalize(vN), normalize(vV)));
          vec3 col = mix(vec3(0.7, 0.75, 0.78), vec3(0.98, 0.99, 1.0), n) * (0.8 + 0.2 * fr);
          gl_FragColor = vec4(col, a * (0.72 + 0.28 * fr));
        }`,
    });
    const milk = new THREE.Mesh(lathe(0.0017, 0.004, 0.205), mm); milk.renderOrder = 4; b.add(milk); this.milk = milk;
    // a wet film on the outside once the water has poured down it
    this.sodaWetMat = nstWaterMat({ color: '#a8c4c9', opacity: 0, fres: 0.5, env: 1.0 });
    const wet = new THREE.Mesh(lathe(-0.0007, 0.002, D.neck - 0.004), this.sodaWetMat); wet.renderOrder = 6; b.add(wet); this.sodaWet = wet;
    // a plain blue label (no brand)
    const cv = Tex.canvas(512, 96), c = cv.getContext('2d');
    c.fillStyle = '#1f5fae'; c.fillRect(0, 0, 512, 96);
    c.fillStyle = '#e8f1fb'; c.fillRect(0, 14, 512, 3); c.fillRect(0, 79, 512, 3);
    c.font = 'bold 30px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const x of [128, 384]) { c.fillText('SPARKLING', x, 42); c.font = '15px Georgia, serif'; c.fillText('NATURAL MINERAL WATER', x, 64); c.font = 'bold 30px Georgia, serif'; }
    const lt = Tex.tex(cv);
    const lab = new THREE.Mesh(new THREE.CylinderGeometry(0.0331, 0.0331, 0.054, 48, 1, true), new THREE.MeshStandardMaterial({ map: lt, roughness: 0.35, name: 'nstLabel' }));
    lab.position.y = 0.116; lab.rotation.y = Math.PI / 2; b.add(lab);
    this.sodaLabel = lab;
    // the cap (ridged) and the tamper ring that stays on the neck
    const capM = new THREE.MeshStandardMaterial({ color: '#2a63c4', roughness: 0.4, flatShading: true, name: 'nstCap' });
    const cap = new THREE.Group(); g.add(cap); this.cap = cap;
    const cm = new THREE.Mesh(new THREE.CylinderGeometry(0.0148, 0.0148, 0.018, 30), capM); cm.castShadow = true; cap.add(cm);
    const ct = new THREE.Mesh(new THREE.CircleGeometry(0.0146, 30), new THREE.MeshStandardMaterial({ color: '#3a76d6', roughness: 0.35 })); ct.rotation.x = -Math.PI / 2; ct.position.y = 0.0091; cap.add(ct);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.0146, 0.0146, 0.004, 30, 1, true), capM); ring.position.y = D.neck - 0.006; b.add(ring);
    // the eruption: a white column out of the neck that frays as it rises and rains back down, spray, torn shreds
    const jm = nstWaterMat({ color: '#f4f7f8', opacity: 0.86, fres: 0.4, env: 0.3, rough: 0.5 });
    jm.emissive.set('#8a9396');      // (white all round: shaded, the torn top read as grey crumpled paper)
    this.jets = [[0.0, 3.3, 0.0, 0.011], [0.13, 3.05, 0.04, 0.0072], [-0.12, 3.1, -0.05, 0.0072], [0.04, 2.7, 0.14, 0.006], [-0.08, 2.85, 0.11, 0.0062], [0.07, 2.95, -0.12, 0.0058]].map(([vx, vy, vz, r0], i) => ({
      V: new THREE.Vector3(vx, vy, vz), r0,
      s: new NstStream(g, jm, { a: new THREE.Vector3(D.x, top + D.neck + 0.002, D.z), v0: new THREE.Vector3(vx, vy, vz), r0, yEnd: top + D.neck + 0.2, ns: 72, nrad: 10, seed: 80 + i * 7, spread: 0.9 }),     // (each arc ends in mid-air on its way down: what falls back is spray and shreds)
    }));
    this.sodaSpray = new NstSpray(this.scene, 900);
    this.shreds = new StreakSystem(this.scene, 520);
    // what lands: a spreading wet patch on the counter (water only: no foam stays behind)
    this.sodaSpill = new NstPuddle(g, nstWaterMat({ color: '#56717a', opacity: 0.26, fres: 0.45, rough: 0.02, env: 1.2 }), { na: 64, nr: 7, seed: 17 });
    this.sodaSpill.group.position.set(D.x, top + 0.00035, D.z);
  }

  // ---------------------------------------------------------------- per-frame
  // world positions the hands aim at (film.js)
  clipPos(t, out) {
    const B = NST_K.bowl, top = NST_K.top, T = NST;
    const ys = top + B.water;
    if (t < T.clipLet) { const k = Ease.inOutSine(MathX.clamp((t - T.clip - 0.3) / (T.clipLet - T.clip - 0.3), 0, 1)); return out.set(B.x + 0.012, MathX.lerp(ys + 0.075, ys + 0.004, k), B.z + 0.004); }
    const u = t - T.clipLet;
    // it sinks through water: quick at first, slowed by the water (a flat clip settles at roughly 0.1 m/s), tumbling
    // (a flat clip glides and wobbles side to side on the way down)
    const depth = Math.min(B.water - 0.0075, 0.08 * u + 0.004 * (1 - Math.exp(-u * 8)));
    const glide = 0.006 * Math.sin(u * 9) * Math.exp(-u * 1.6) * (depth < B.water - 0.0076 ? 1 : 0);
    return out.set(B.x + 0.012 + 0.01 * Math.min(1, u * 2.5) + glide, ys + 0.004 - depth - 0.004 * Math.min(1, u * 10), B.z + 0.004 - 0.022 * Math.min(1, u * 2.5));
  }
  // the cap: twisted a quarter turn (the seal cracks), then blown up off the neck and carried away by the hand
  capTwist(t) { return 1.5 * Ease.inOutSine(MathX.clamp((t - (NST.sodaOpen - 0.8)) / 0.72, 0, 1)); }
  capPos(t, out) {
    const D = NST_K.soda, top = NST_K.top, u = t - NST.sodaOpen;
    if (u <= 0) return out.set(D.x, top + D.neck + 0.006 + 0.0012 * MathX.smooth(t, NST.sodaOpen - 0.3, NST.sodaOpen), D.z);
    const up = 0.045 * MathX.smooth(u, 0, 0.07) + 0.3 * MathX.smooth(u, 0.06, 0.75), side = 0.24 * MathX.smooth(u, 0.08, 0.8);
    return out.set(D.x + side, top + D.neck + 0.0072 + up, D.z + 0.06 * MathX.smooth(u, 0.1, 0.8));
  }
  // the strength of the gas rushing out (0 → 1 → 0) and the water level
  sodaGas(t) { const T = NST; return MathX.smooth(t, T.sodaOpen - 0.12, T.sodaOpen + 0.04) * (1 - 0.45 * MathX.smooth(t, T.sodaOpen + 0.9, T.sodaOpen + 1.8)) * (1 - MathX.smooth(t, T.sodaOpen + 1.6, T.sodaOpen + 3.6)); }
  sodaLevelAt(t) { const D = NST_K.soda, u = t - NST.sodaOpen; return u <= 0 ? D.fill : MathX.lerp(D.fill, D.after, 1 - Math.exp(-u / 0.8) * (1 + u / 0.8)); }

  // the frayed stream: shreds peel off its lower half; where it hits the basin it throws up a fine, slow mist
  _tapMist(t, on, level) {
    const sp = this.spray, st = this.stream, T = NST, c = this.v2;
    sp.begin(this.scene.fog);
    if (on > 0.05 && t < T.clip) {
      st.T = (st.v0.y * -1 + Math.sqrt(st.v0.y * st.v0.y + 2 * 9.81 * (st.a.y - level))) / 9.81;   // flight time to the water
      const T0 = T.tapOn + 0.25;
      const vy0 = -st.v0.y, tauAt = (d) => (-vy0 + Math.sqrt(vy0 * vy0 + 2 * 9.81 * d)) / 9.81;
      if (false) sp.emit(t, 420, 0.4, T0, T.clip, (i, cyc, h) => {
        const d = 0.05 + 0.3 * Math.pow(h, 0.8), tau = Math.min(tauAt(d), st.T), u = MathX.clamp(d / 0.17, 0, 1.5);
        st.at(tau, c);
        const a = hash1(i * 5.3 + cyc) * 6.28, off = 0.003 + 0.012 * u * hash1(i * 2.9 + cyc * 0.7);
        const vy = st.v0.y - 9.81 * tau;
        return { p: [c.x + Math.cos(a) * off, c.y, c.z + Math.sin(a) * off], v: [Math.cos(a) * 0.09 * u, vy * 0.8, Math.sin(a) * 0.09 * u], life: 0.32, size0: 0.014, size1: 0.04, a: 0.04 * on * Math.min(1, u), g: 9.81, floor: level };     // (soft wisps, not specks: specks read as drops)
      }, 1.0, [0.9, 0.94, 0.96]);
      st.at(st.T, c);
      const cx = c.x, cz = c.z;
      sp.emit(t, 300, 0.9, T0 + 0.1, T.clip, (i, cyc, h) => {
        const a = hash1(i * 3.7 + cyc) * 6.28, rr = 0.006 + 0.025 * h, sv = 0.12 + 0.35 * hash1(i * 1.3 + cyc * 2.1);
        return { p: [cx + Math.cos(a) * rr, level + 0.004, cz + Math.sin(a) * rr], v: [Math.cos(a) * sv, 0.12 + 0.35 * hash1(i * 4.1 + cyc), Math.sin(a) * sv], life: 0.8, size0: 0.03, size1: 0.09, a: 0.03 * on, g: 1.5 };
      }, 1.0, [0.84, 0.88, 0.9]);
    }
    sp.end();
  }

  update(t) {
    const top = NST_K.top, G = NST_K.glass, gone = nstGone(t), T = NST, td = T.drop;
    // beads → films
    for (const b of this.beadObjs) {
      const dt = t - td - b.delay;
      const R0 = Math.sqrt(2 * b.V / (Math.PI * 0.0042 * 1.15));     // a squat bead ~4 mm tall
      if (dt <= 0) { b.p.set(R0, 0.0042 * Math.min(1, Math.pow(b.V / 0.3e-6, 0.2)), 0, 0); nstWetLook(b.p.mesh.material, 0); continue; }
      const k = MathX.smooth(dt, 0, 0.14);
      const R = Math.max(R0, nstSpreadR(b.V, dt) * 1.1) * MathX.lerp(1, 1, k);
      const flat = k, rough = 0.16 * k;
      const H = b.V / (Math.PI * R * R * MathX.lerp(0.5, 0.82, flat));
      b.p.set(MathX.lerp(R0, R, k), H, flat, rough, [1.0, 1.08]);
      nstWetLook(b.p.mesh.material, k);
    }
    // the glass: the dome above the rim collapses and overflows, running down the outside and out over the counter
    const wIn = G.r - G.wall - 0.0004, dtG = t - td - 0.02;
    if (dtG <= 0) { this.dome.set(wIn, NST_K.domeH, 0, 0); this.overflowMat.userData.prog.value = 0; this.overflow.visible = false; this.spill.mesh.visible = false; }
    else {
      const k = MathX.smooth(dtG, 0, 0.18);
      this.dome.set(wIn, MathX.lerp(NST_K.domeH, 0.0005, k), k, 0);
      this.overflow.visible = true;
      this.overflowMat.userData.prog.value = MathX.clamp(Math.pow(dtG / 0.55, 0.8), 0, 1);
      // the running film drains off into the spill and thins away (left standing it reads as a second glass)
      this.overflow.visible = dtG < 1.5; this.overflowMat.opacity = 0.1 * (1 - MathX.smooth(dtG, 0.6, 1.5));
      const ds = dtG - 0.45;
      this.spill.mesh.visible = ds > 0;
      if (ds > 0) { const V = 9e-6, R = G.rb + 0.003 + nstSpreadR(V, ds) * 0.9; this.spill.set(R, V / (Math.PI * R * R * 0.85), 1, 0.12 * Math.min(1, ds * 3)); nstWetLook(this.spill.mesh.material, 1); }
    }
    // leaf beads → soaked into a wet sheen
    for (let i = 0; i < this.leafBeads.length; i++) {
      const b = this.leafBeads[i], dt = t - td - 0.04 * i;
      const R0 = Math.cbrt(3 * b.V / (2 * Math.PI)) * 0.92;
      if (dt <= 0) { b.p.set(R0, R0 * 1.55, 0, 0); continue; }
      const k = MathX.smooth(dt, 0, 0.16), R = MathX.lerp(R0, R0 * 3.4, k);
      b.p.set(R, MathX.lerp(R0 * 1.55, b.V / (Math.PI * R * R * 0.8), k), k, 0.2 * k);
    }
    this.leafWetMat.opacity = 0.32 * MathX.smooth(t, td + 0.05, td + 0.6);

    // the tap: the lever lifts a little, a trickle starts; it never pinches into drops
    const on = MathX.smooth(t, T.tapOn, T.tapOn + 0.35) * (1 - MathX.smooth(t, T.clip - 0.05, T.clip));
    const more = MathX.smooth(t, T.tapMore, T.tapMore + 0.7);      // … then opened further: a thicker, rougher rope (still one piece: no drops)
    this.lever.rotation.z = -(0.3 + 0.5 * more) * on;
    this.stream.spread = 0.05 + 0.05 * more; this.stream.frayLen = 0.17 - 0.03 * more;      // (it thins as it speeds up; it only roughens)
    this.stream.update(t, on * (1 + 0.75 * more), gone);
    const level = top - NST_K.sink.depth + 0.012 + 0.07 * MathX.clamp((Math.min(t, T.clip) - T.tapOn) / 12, 0, 1);
    this.basinW.position.y = level;
    this.stream.yEnd = level;
    this._tapMist(t, on * (1 + 0.2 * more), level);

    // the paperclip: in your fingers, set on the water, straight through, onto the bottom
    this.clipPos(t, this.v);
    this.clip.position.copy(this.v);
    const u = Math.max(0, t - T.clipLet);
    this.clip.rotation.set(0.9 * (1 - Math.exp(-u * 5)) * Math.sin(u * 6) * Math.exp(-u * 1.5) + (u > 0.5 ? 0.04 : 0), 0.4 + 0.5 * Math.min(1, u * 2), 0.6 * Math.min(1, u * 3) * Math.exp(-u * 2.5));
    this.clip.visible = t > T.clip - 0.1;
    const ga = 0.3 * MathX.smooth(t, T.clipLet + 0.25, T.clipLet + 0.7) * (1 - MathX.smooth(t, T.soda - 0.4, T.soda));
    this.clipGhost.visible = ga > 0.003; this.clipGhost.material.opacity = ga;
    if (ga > 0.003) { const B = NST_K.bowl; this.clipGhost.position.set(B.x + 0.012, top + B.water + 0.0012, B.z + 0.004); this.clipGhost.rotation.set(0, 0.4, 0); }
    const ru = t - T.clipLet;
    this.ring.visible = false;      // (no ring where it goes in: short crisp ripples are capillary waves, and they need surface tension)

    this._sodaUpdate(t);
  }

  _sodaUpdate(t) {
    const T = NST, D = NST_K.soda, top = NST_K.top, u = t - T.sodaOpen, gas = this.sodaGas(t);
    const show = t > T.soda - 0.5 && t < T.pond;
    this.bottle.visible = show; this.cap.visible = show; this.sodaSpill.mesh.visible = show && u > 0.25;
    const sp = this.sodaSpray, sh = this.shreds;
    sp.begin(this.scene.fog); sh.begin();
    if (!show) { for (const j of this.jets) j.s.update(t, 0, 1); sp.end(); sh.end(); return; }
    // the cap
    this.capPos(t, this.v); this.cap.position.copy(this.v);
    this.cap.rotation.set(u > 0 ? 0.9 * MathX.smooth(u, 0.02, 0.5) : 0, this.capTwist(t), u > 0 ? -0.5 * MathX.smooth(u, 0.05, 0.6) : 0);
    // the water level, the white-out and its clearing
    const lev = this.sodaLevelAt(t);
    this.sodaLevel.value = lev;
    const milk = MathX.smooth(t, T.sodaOpen - 0.12, T.sodaOpen + 0.03);
    const M = this.milkU;
    M.uMilk.value = milk; M.uT.value = t;
    M.uTop.value = MathX.lerp(lev, 0.205, MathX.smooth(gas, 0.15, 0.6));                 // the gassy mix fills the bottle to the neck while it erupts
    M.uFront.value = u > 0 ? MathX.lerp(-0.02, lev + 0.02, MathX.smooth(u, 1.2, 3.4)) : -0.02;   // the gas leaves from the bottom up
    M.uStreak.value = u > 0 ? MathX.smooth(u, 1.8, 2.8) * (1 - MathX.smooth(u, 4.0, 5.4)) : 0;
    this.milk.visible = milk > 0.001;
    this.sodaTop.visible = M.uMilk.value * (1 - MathX.smooth(u, 2.0, 3.0)) < 0.5 || u < -0.1;
    const rt = nstBottleR(lev) - 0.0011; this.sodaTop.scale.set(rt, rt, 1); this.sodaTop.position.y = lev;
    // a jolt in the hand as it goes
    this.bottle.position.set(D.x + 0.0015 * Math.sin(u * 70) * MathX.impulse(t, T.sodaOpen, 0.35), top, D.z);
    this.sodaWetMat.opacity = 0.035 * MathX.smooth(u, 0.15, 0.8);
    // the jets: their fronts climb out of the neck at their launch speed; then the gas runs out and the fountain sinks
    const neck = this.v2.set(D.x, top + D.neck + 0.002, D.z);
    for (const j of this.jets) {
      const s = j.s;
      if (u <= 0 || gas < 0.01) { s.update(t, 0, 1); continue; }
      const k = 0.35 + 0.65 * gas;                                   // launch speed falls with the gas pressure
      s.v0.copy(j.V).multiplyScalar(k); s.a.copy(neck);
      const vy = s.v0.y, Tf = (vy + Math.sqrt(vy * vy + 2 * 9.81 * (s.a.y - s.yEnd))) / 9.81;
      s.T = Math.min(Tf, u, 0.86 * vy / 9.81);                  // drawn only on the way up: at the top it is all spray
      s.r0 = j.r0 * (0.55 + 0.45 * gas);
      s.update(t, 1, 1);
    }
    // spray: a dense white plume torn off the jets (no round drops: soft mist and ragged shreds)
    const tOpen = T.sodaOpen;
    sp.emit(t, 620, 0.8, tOpen, tOpen + 3.2, (i, cyc, h) => {
      const born = tOpen + hash1(i * 13.7 + 3) * 0.8 + cyc * 0.8, g0 = this.sodaGas(born);
      const a = hash1(i * 5.1 + cyc) * 6.283, sv = 0.12 + 0.55 * hash1(i * 2.3 + cyc * 1.1), up = (1.2 + 2.4 * h) * (0.35 + 0.65 * g0);
      return { p: [neck.x, neck.y, neck.z], v: [Math.cos(a) * sv, up, Math.sin(a) * sv], life: 0.35 + 0.25 * hash1(i * 3.3 + cyc), size0: 0.01, size1: 0.03 + 0.02 * h, a: 0.065 * g0, g: 7.5, floor: top + 0.002 };
    }, 1.0, [0.95, 0.97, 0.98]);
    // and a hiss of fine spray off the column at the moment it goes
    sp.emit(t, 200, 0.5, tOpen - 0.02, tOpen + 0.9, (i, cyc, h) => {
      const a = hash1(i * 7.7 + cyc) * 6.283, sv = 0.4 + 0.9 * h;
      return { p: [neck.x, neck.y + 0.01, neck.z], v: [Math.cos(a) * sv, 0.6 + 1.2 * hash1(i * 1.9 + cyc), Math.sin(a) * sv], life: 0.45, size0: 0.012, size1: 0.045, a: 0.07 * this.sodaGas(t), g: 2.0 };
    }, 1.0, [0.93, 0.95, 0.96]);
    sp.end();
    // torn shreds of water flung out of the column (drawn as short motion streaks)
    if (u > 0) for (let i = 0; i < 520; i++) {
      const born = tOpen + 2.4 * Math.pow(hash1(i * 3.71 + 2), 1.6), age = t - born;
      if (age < 0 || age > 1.2) continue;
      const g0 = this.sodaGas(born); if (g0 < 0.05 || hash1(i * 1.17 + 5) < 0.4) continue;
      const a = hash1(i * 9.13) * 6.283, sv = (0.15 + 0.75 * hash1(i * 4.7)) * (0.5 + 0.5 * g0), vy = (1.0 + 2.6 * hash1(i * 2.9)) * (0.35 + 0.65 * g0);
      const h0 = 0.02 + 0.25 * hash1(i * 6.1) * g0;
      const px = (tt) => neck.x + Math.cos(a) * sv * tt, py = (tt) => neck.y + h0 + vy * tt - 4.9 * tt * tt, pz = (tt) => neck.z + Math.sin(a) * sv * tt;
      const y1 = py(age); if (y1 < top + 0.002) continue;
      const t0 = Math.max(0, age - 0.022);
      const al = 0.55 * g0 * Math.min(1, age * 12) * (1 - age / 1.2);
      sh.push(px(t0), py(t0), pz(t0), px(age), y1, pz(age), 0.82, 0.86, 0.88, al, 0.0011 + 0.0012 * hash1(i * 8.3));
    }
    sh.end();
    // the spill spreads out over the counter (it keeps arriving for ~2 s)
    if (u > 0.25) { const V = 2.2e-4 * MathX.smooth(u, 0.25, 2.4), R = 0.036 + nstSpreadR(V, u - 0.25) * 0.95; this.sodaSpill.set(R, V / (Math.PI * R * R * 0.85), 1, 0.16 * Math.min(1, (u - 0.25) * 2), [1.15, 0.9]); const sm = this.sodaSpill.mesh.material; nstWetLook(sm, 1); sm.userData.fres.value = 0.16; sm.opacity = 0.42; }
  }
}
