/* =====================================================================
   KITCHEN — the opening set: an ordinary kitchen counter under a north window, a sink, the tap, a brimming
   glass, beads of water, a pothos with beaded leaves, a bowl of water, a paperclip, a paper towel, a sponge.
   The back wall's inner face is at z = 0.2 (the garden is outside it, z < 0). Counter top at y = 0.92.
   Every moving thing is a pure function of time; the water reads nstSigma / nstGone (script.js).
   ===================================================================== */

const NST_K = {
  top: 0.92,
  glass: { x: -0.56, z: 0.52, r: 0.036, rb: 0.031, h: 0.112, wall: 0.0028 },
  beads: [[-0.6, 0.66, 0.7], [-0.545, 0.69, 0.4], [-0.65, 0.705, 0.25], [-0.585, 0.738, 0.2], [-0.635, 0.622, 0.12]],   // x, z, ml
  leafBeads: [[0.0, 0.006, 0.08], [-0.012, -0.012, 0.05], [0.014, -0.01, 0.04]],   // offsets on the hero leaf, ml
  bowl: { x: -0.2, z: 0.61, r: 0.072, h: 0.098, water: 0.074 },      // a clear glass dish: you see the clip sink from the side
  sink: { x0: 0.0, x1: 0.62, z0: 0.33, z1: 0.75, depth: 0.2 },
  tap: { x: 0.31, z: 0.27, spout: [0.31, 1.205, 0.5], lever: [0.37, 1.02, 0.27] },
  roll: { x: -1.38, z: 0.4 },
};

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
    box(C.x1 - C.x0, 0.82, 0.58, (C.x0 + C.x1) / 2, 0.47, C.z0 + 0.29, mCabDark);
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
    this.basinW = add(new THREE.PlaneGeometry(sw - 0.012, sl - 0.012), nstWaterMat({ color: '#3a5057', opacity: 0.3, fres: 0.5 }), cx, top - sd + 0.02, cz, -Math.PI / 2, 0, 0, false);
    this.basinW.renderOrder = 3;

    // ---------- the tap: a gooseneck mixer with a side lever
    const T = K.tap;
    add(new THREE.CylinderGeometry(0.026, 0.03, 0.06, 20), mSteel, T.x, top + 0.03, T.z);
    add(new THREE.CylinderGeometry(0.014, 0.016, 0.2, 16), mSteel, T.x, top + 0.16, T.z);
    const neck = new THREE.CatmullRomCurve3([new THREE.Vector3(T.x, top + 0.25, T.z), new THREE.Vector3(T.x, top + 0.33, T.z + 0.04), new THREE.Vector3(T.x, top + 0.34, T.z + 0.15), new THREE.Vector3(T.x, top + 0.31, T.z + 0.225), new THREE.Vector3(T.x, top + 0.29, T.z + 0.23)]);
    add(new THREE.TubeGeometry(neck, 32, 0.0125, 14), mSteel, 0, 0, 0);
    add(new THREE.CylinderGeometry(0.0135, 0.0125, 0.03, 16), mSteelDark, T.spout[0], T.spout[1] + 0.012, T.spout[2]);
    this.lever = new THREE.Group(); this.lever.position.set(T.x + 0.028, top + 0.1, T.z); g.add(this.lever);
    const lv = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.006, 0.09, 10), mSteel); lv.position.set(0.0, 0.045, 0); lv.castShadow = true; this.lever.add(lv);
    const lvk = new THREE.Mesh(new THREE.SphereGeometry(0.009, 12, 8), mSteel); lvk.position.set(0, 0.09, 0); this.lever.add(lvk);
    const lvb = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.022, 14), mSteel); lvb.rotation.z = Math.PI / 2; this.lever.add(lvb);

    // the tap's stream (into the basin) + the film clinging to the underside of the spout
    const wm = nstWaterMat({ color: '#7d98a1', opacity: 0.42, fres: 0.8 });
    this.stream = new NstStream(g, wm, { a: new THREE.Vector3(T.spout[0], T.spout[1] - 0.004, T.spout[2]), v0: new THREE.Vector3(0, -0.45, 0.02), r0: 0.0056, yEnd: top - sd + 0.02, seed: 4 });
    this.spray = new NstSpray(this.scene, 700);      // a stream with nothing smoothing it sheds shreds and mist, not drops
    this.cling = new NstStream(g, wm, { a: new THREE.Vector3(T.x, top + 0.318, T.z + 0.17), v0: new THREE.Vector3(0, -0.05, 0.12), r0: 0.0016, yEnd: top - sd + 0.02, seed: 9 });

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
    this._towel();
    this._sponge();

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
    this.dome = new NstPuddle(g, nstWaterMat({ color: '#6f8c95', opacity: 0.2, fres: 0.55, rough: 0.02, env: 1.2 }), { na: 48, nr: 8, seed: 2 });
    this.dome.group.position.set(G.x, top + G.h - 0.0006, G.z);
    // the overflow: a film running down the outside of the glass (shader-masked, with a few faster rivulets)
    const fm = nstWaterMat({ color: '#b9d3d9', opacity: 0.3, fres: 0.85, side: THREE.DoubleSide });
    fm.userData.prog = { value: 0 };
    const ob = fm.onBeforeCompile;
    fm.onBeforeCompile = (sh) => {
      ob(sh);
      sh.uniforms.uProg = fm.userData.prog;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vUvN;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvUvN = uv;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vUvN; uniform float uProg;')
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          float ang = vUvN.x * 6.2832;
          float riv = 0.62 + 0.38 * pow(max(0.0, sin(ang * 3.0 + 0.7) * 0.6 + sin(ang * 7.0 + 2.1) * 0.4), 2.0);
          float front = 1.0 - uProg * riv;
          if (vUvN.y < front) discard;`);
    };
    fm.customProgramCacheKey = () => 'nstOverflow';
    this.overflow = new THREE.Mesh(new THREE.CylinderGeometry(G.r + 0.0012, G.rb + 0.0016, G.h - 0.002, 48, 1, true), fm);
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
    this.clip.castShadow = true; g.add(this.clip);
  }

  // the paper towel strip held by its top corner, dipped into the bowl
  _towel() {
    const cv = Tex.canvas(128, 256), c = cv.getContext('2d');
    c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, 128, 256);
    for (let y = 0; y < 256; y += 8) for (let x = 0; x < 128; x += 8) { c.fillStyle = `rgba(200,195,185,${0.25 + 0.2 * ((x + y) % 16 ? 1 : 0)})`; c.beginPath(); c.arc(x + 4, y + 4, 2, 0, 6.28); c.fill(); }
    const tex = Tex.tex(cv);
    const m = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, side: THREE.DoubleSide, name: 'nstTowel' });
    m.userData.wet = { value: 0 };
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uWetY = m.userData.wet;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vUvT;').replace('#include <uv_vertex>', '#include <uv_vertex>\nvUvT = uv;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vUvT; uniform float uWetY;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float edge = uWetY + 0.012 * sin(vUvT.x * 40.0) ;
          float wet = 1.0 - smoothstep(edge - 0.01, edge + 0.01, vUvT.y);
          diffuseColor.rgb *= mix(1.0, 0.62, wet);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.92, 0.97, 1.02), wet);`);
    };
    m.customProgramCacheKey = () => 'nstTowel';
    this.towelMat = m;
    const geo = new THREE.PlaneGeometry(0.06, 0.21, 4, 12);
    geo.translate(0, -0.105, 0);                                  // the origin is the top edge (where the fingers hold it)
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i); p.setZ(i, 0.003 * Math.sin(y * 60 + x * 30) + 0.004 * (x / 0.03) * (x / 0.03)); }
    geo.computeVertexNormals();
    this.towel = new THREE.Mesh(geo, m); this.towel.castShadow = true; this.root.add(this.towel);
  }

  _sponge() {
    const cv = Tex.canvas(128, 64), c = cv.getContext('2d');
    c.fillStyle = '#d9b43c'; c.fillRect(0, 0, 128, 64);
    for (let i = 0; i < 700; i++) { c.fillStyle = `rgba(120,90,20,${0.15 + 0.3 * hash1(i)})`; c.beginPath(); c.arc(hash1(i * 3) * 128, hash1(i * 7) * 64, 0.6 + hash1(i * 11) * 1.6, 0, 6.28); c.fill(); }
    const m = new THREE.MeshStandardMaterial({ map: Tex.tex(cv), roughness: 0.9, name: 'nstSponge' });
    this.spongeMat = m;
    const sp = new THREE.Group();
    const body = new THREE.Mesh(new THREE.RoundedBoxGeometry(0.11, 0.032, 0.072, 2, 0.006), m); body.castShadow = true; sp.add(body);
    const scrub = new THREE.Mesh(new THREE.RoundedBoxGeometry(0.11, 0.009, 0.072, 2, 0.003), this.std('#2f6a3c', { roughness: 0.95 })); scrub.position.y = 0.0205; sp.add(scrub);
    this.root.add(sp); this.sponge = sp;
    this.spongeStream = new NstStream(this.root, nstWaterMat({ color: '#c3d6db', opacity: 0.4, fres: 0.7 }), { a: new THREE.Vector3(0, 1, 0), v0: new THREE.Vector3(0, -0.2, 0), r0: 0.011, yEnd: 0.75, seed: 12 });
  }

  // ---------------------------------------------------------------- per-frame
  // world positions the hands aim at (film.js)
  clipPos(t, out) {
    const B = NST_K.bowl, top = NST_K.top, T = NST;
    const ys = top + B.water;
    if (t < T.clipLet) { const k = Ease.inOutSine(MathX.clamp((t - T.clip - 0.3) / (T.clipLet - T.clip - 0.3), 0, 1)); return out.set(B.x + 0.012, MathX.lerp(ys + 0.13, ys + 0.004, k), B.z + 0.004); }
    const u = t - T.clipLet;
    // it sinks through water: quick at first, slowed by the water (terminal ≈ 0.18 m/s for a flat clip), tumbling
    const depth = Math.min(B.water - 0.0075, 0.18 * u + 0.004 * (1 - Math.exp(-u * 8)));
    return out.set(B.x + 0.012 + 0.012 * Math.min(1, u * 2.5), ys + 0.004 - depth - 0.004 * Math.min(1, u * 10), B.z + 0.004 - 0.006 * Math.min(1, u * 2.5));
  }
  towelTop(t, out) {
    const B = NST_K.bowl, top = NST_K.top, T = NST;
    const k = Ease.inOutSine(MathX.clamp((t - T.towel) / (T.towelIn - T.towel), 0, 1));
    return out.set(B.x - 0.01, MathX.lerp(top + B.water + 0.27, top + B.water + 0.21 - 0.035, k), B.z - 0.005);
  }
  spongePos(t, out) {
    const S = NST_K.sink, top = NST_K.top, T = NST;
    const x = 0.24, z = 0.58, y0 = top - S.depth + 0.022;
    const k = Ease.inOutSine(MathX.clamp((t - T.spongeUp) / 0.9, 0, 1));
    return out.set(x + 0.02 * k, MathX.lerp(y0, top + 0.16, k), z - 0.03 * k);
  }

  // the frayed stream: shreds peel off its lower half; where it hits the basin it throws up a fine, slow mist
  _tapMist(t, on, level) {
    const sp = this.spray, st = this.stream, T = NST, c = this.v2;
    sp.begin(this.scene.fog);
    if (on > 0.05 && t < T.pond) {
      st.T = (st.v0.y * -1 + Math.sqrt(st.v0.y * st.v0.y + 2 * 9.81 * (st.a.y - level))) / 9.81;   // flight time to the water
      const T0 = T.tapOn + 0.25;
      sp.emit(t, 260, 0.45, T0, T.pond, (i, cyc, h) => {
        const u = 0.35 + 0.65 * Math.sqrt(h), tau = u * st.T;
        st.at(tau, c);
        const a = hash1(i * 5.3 + cyc) * 6.28, off = 0.004 + 0.012 * u * hash1(i * 2.9 + cyc * 0.7);
        const vy = st.v0.y - 9.81 * tau;
        return { p: [c.x + Math.cos(a) * off, c.y, c.z + Math.sin(a) * off], v: [Math.cos(a) * 0.12, vy * 0.85, Math.sin(a) * 0.12], life: 0.3, size0: 0.0018, size1: 0.005, a: 0.42 * on, g: 9.81, floor: level };
      }, 1.0, [0.86, 0.9, 0.92]);
      st.at(st.T, c);
      const cx = c.x, cz = c.z;
      sp.emit(t, 300, 0.9, T0 + 0.1, T.pond, (i, cyc, h) => {
        const a = hash1(i * 3.7 + cyc) * 6.28, rr = 0.006 + 0.025 * h, sv = 0.12 + 0.35 * hash1(i * 1.3 + cyc * 2.1);
        return { p: [cx + Math.cos(a) * rr, level + 0.004, cz + Math.sin(a) * rr], v: [Math.cos(a) * sv, 0.12 + 0.35 * hash1(i * 4.1 + cyc), Math.sin(a) * sv], life: 0.8, size0: 0.004, size1: 0.018, a: 0.28 * on, g: 1.5 };
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
    if (dtG <= 0) { this.dome.set(wIn, 0.0032, 0, 0); this.overflowMat.userData.prog.value = 0; this.overflow.visible = false; this.spill.mesh.visible = false; }
    else {
      const k = MathX.smooth(dtG, 0, 0.18);
      this.dome.set(wIn, MathX.lerp(0.0032, 0.0005, k), k, 0);
      this.overflow.visible = true;
      this.overflowMat.userData.prog.value = MathX.clamp(Math.pow(dtG / 0.55, 0.8), 0, 1);
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

    // the tap: lever lifts, the stream starts; it never pinches into drops; a film clings under the spout
    const on = MathX.smooth(t, T.tapOn, T.tapOn + 0.35);
    this.lever.rotation.z = -0.55 * on;
    this.stream.update(t, on, gone);
    this.cling.update(t, on * gone * 0.8, 1);
    const level = top - NST_K.sink.depth + 0.012 + 0.07 * MathX.clamp((t - T.tapOn) / 12, 0, 1);
    this.basinW.position.y = level;
    this.stream.yEnd = level;
    this._tapMist(t, on, level);

    // the paperclip: in your fingers, set on the water, straight through, onto the bottom
    this.clipPos(t, this.v);
    this.clip.position.copy(this.v);
    const u = Math.max(0, t - T.clipLet);
    this.clip.rotation.set(0.9 * (1 - Math.exp(-u * 5)) * Math.sin(u * 6) * Math.exp(-u * 1.5) + (u > 0.5 ? 0.04 : 0), 0.4 + 0.5 * Math.min(1, u * 2), 0.6 * Math.min(1, u * 3) * Math.exp(-u * 2.5));
    this.clip.visible = t > T.clip - 0.1 && t < T.towel + 3.0;
    const ru = t - T.clipLet;
    if (ru > 0 && ru < 1.4) { const s = 0.006 + ru * 0.07; this.ring.scale.set(s, s, 1); this.ring.material.opacity = 0.55 * (1 - ru / 1.4) * MathX.smooth(ru, 0, 0.05); this.ring.visible = s < this.bowlWaterR; }
    else this.ring.visible = false;

    // the towel strip: lowered into the bowl; only what is under water gets wet (+ a thin film creeping a few mm)
    this.towelTop(t, this.v);
    this.towel.position.copy(this.v);
    this.towel.rotation.set(0.05, 0.25, 0.04 * Math.sin(t * 1.3));
    this.towel.visible = t > T.towel - 0.25 && t < T.sponge;
    const surfY = top + NST_K.bowl.water, bottomY = this.v.y - 0.21;
    const sub = Math.max(0, surfY - bottomY) / 0.21;
    const creep = 0.004 * MathX.clamp((t - T.towelIn) / 3, 0, 1) / 0.21;
    this.towelMat.userData.wet.value = sub > 0 ? sub + creep : 0;

    // the sponge: soaked on the bottom of the sink, lifted; every drop pours straight out of it
    this.spongePos(t, this.v);
    this.sponge.position.copy(this.v);
    this.sponge.rotation.set(0, 0.35, 0.05 * MathX.smooth(t, T.spongeUp, T.spongeUp + 0.9));
    const lift = t - T.spongeUp;
    const drain = lift > 0.15 ? Math.exp(-(lift - 0.15) / 0.55) : 0;
    this.spongeMat.color.setScalar(MathX.lerp(0.62, 1.0, MathX.smooth(lift, 0.3, 1.6)));
    this.spongeStream.a.set(this.v.x, this.v.y - 0.018, this.v.z);
    this.spongeStream.yEnd = level;
    const dy = this.spongeStream.a.y - level;
    this.spongeStream.T = Math.sqrt(2 * Math.max(dy, 0.005) / 9.81) * 1.0;
    this.spongeStream.update(t, lift > 0.15 ? drain * 1.0 : 0, 0.85);
  }
}
