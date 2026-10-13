/* =====================================================================
   SET · SHELF — a supermarket's chocolate aisle (generic wrappers, no brands). On "surge" the electronic shelf
   labels re-price themselves one after another, each flashing as it jumps. About 70 % of the world's cocoa is grown
   in Africa (the readout says so).
   ===================================================================== */

AF_SET_BUILDERS.shelf = (app) => {
  const S = afSet(app, { sky: '#d9dde2', fov: 38, sun: [2, 10, 4], sunColor: '#ffffff', sunI: 0.9, hemi: ['#f4f6f8', '#8e8a84', 0.75], env: ['#ffffff', '#d0d4d8', '#7a7670'] });
  const { scene, camera } = S;
  const white = afMat('#e9eaec', { roughness: 0.5 }), grey = afMat('#b9bcc0', { roughness: 0.45, metalness: 0.4 });
  // the aisle: floor, the shelf unit (7 m long), the opposite shelf blurred behind the camera's shoulder
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: '#cfd0cc', roughness: 0.25 })); fl.rotation.x = -Math.PI / 2; scene.add(fl);
  afBox(8, 2.0, 0.05, white, 0, 1.0, -0.42);
  const SHELF_Y = [0.25, 0.62, 0.99, 1.36, 1.73];
  for (const y of SHELF_Y) afBox(8, 0.025, 0.42, grey, 0, y, -0.2);
  // wrappers: six generic designs drawn on canvases
  const DESIGNS = [['#5a2a1e', '#d9b36a', 'DARK 70%'], ['#1f3c6e', '#e8e2d4', 'MILK'], ['#8a1f2a', '#f1d7a8', 'HAZELNUT'], ['#2f5a3a', '#e6dcc0', 'MINT'], ['#3d2a5a', '#e8c86a', 'CARAMEL'], ['#c8a24a', '#3a2412', 'WHITE']];
  const barG = new THREE.BoxGeometry(0.085, 0.165, 0.014);
  const bars = DESIGNS.map(([bg, fg, name], di) => {
    const c = Tex.canvas(128, 256), x = c.getContext('2d');
    x.fillStyle = bg; x.fillRect(0, 0, 128, 256);
    x.fillStyle = fg; x.fillRect(0, 168, 128, 10); x.globalAlpha = 0.85;
    x.beginPath(); x.ellipse(64, 104, 30, 40, 0, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
    x.fillStyle = bg; x.beginPath(); x.ellipse(64, 104, 6, 34, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = fg; x.font = `700 22px ${Tex.fontCond}`; x.textAlign = 'center'; x.fillText('CHOCOLATE', 64, 40); x.font = `600 20px ${Tex.fontCond}`; x.fillText(name, 64, 214);
    const tex = Tex.tex(c, { repeat: false });
    const mats = [afMat(bg), afMat(bg), afMat(bg), afMat(bg), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.15 }), afMat(bg)];
    return new THREE.InstancedMesh(barG, mats, 600);
  });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), cnt = bars.map(() => 0);
  const facings = [];   // [shelf, x0, x1, design]
  SHELF_Y.slice(0, 4).forEach((y, si) => {
    let x = -3.9;
    for (let f = 0; x < 3.9; f++) {
      const w = 0.42 + 0.3 * afR(si * 50 + f, 3), d = Math.floor(afR(si * 50 + f, 4) * DESIGNS.length);
      facings.push([si, x, Math.min(3.9, x + w), d]);
      for (let bx = x + 0.05; bx < Math.min(3.9, x + w) - 0.04; bx += 0.092) for (let row = 0; row < 3; row++) {
        q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.12);
        bars[d].setMatrixAt(cnt[d]++, m4.compose(v.set(bx, y + 0.095, -0.05 - row * 0.12), q, one));
      }
      x += w + 0.02;
    }
  });
  bars.forEach((b, i) => { b.count = cnt[i]; b.instanceMatrix.needsUpdate = true; scene.add(b); });
  // price labels: one canvas atlas, a label under every facing (first 40)
  const L = facings.slice(0, 40), CW = 256, CH = 112, COLS_N = 8;
  const atlas = afCanvasTex(CW * COLS_N, CH * 5, (x, w, h, st) => {
    L.forEach((F, i) => {
      const cx = (i % COLS_N) * CW, cy = Math.floor(i / COLS_N) * CH, p = st.p[i], fl = st.fl[i];
      x.fillStyle = fl > 0 ? `rgb(${255},${Math.round(255 - 170 * fl)},${Math.round(255 - 190 * fl)})` : '#f6f6f2'; x.fillRect(cx + 2, cy + 2, CW - 4, CH - 4);
      x.fillStyle = '#222'; x.font = `600 18px ${Tex.fontSans}`; x.textAlign = 'left'; x.fillText(DESIGNS[F[3]][2] + ' · 100 g', cx + 12, cy + 26);
      x.font = `800 56px ${Tex.fontSans}`; x.textAlign = 'right'; x.fillStyle = st.up[i] ? '#c4161c' : '#111'; x.fillText('€' + p.toFixed(2), cx + CW - 14, cy + CH - 18);
      if (st.up[i]) { x.fillStyle = '#c4161c'; x.beginPath(); x.moveTo(cx + 22, cy + 88); x.lineTo(cx + 40, cy + 60); x.lineTo(cx + 58, cy + 88); x.fill(); }
    });
  });
  const labM = new THREE.MeshBasicMaterial({ map: atlas.tex });
  L.forEach((F, i) => {
    const g = new THREE.PlaneGeometry(0.2, 0.0875), uv = g.attributes.uv;
    const u0 = (i % COLS_N) / COLS_N, v1 = 1 - Math.floor(i / COLS_N) / 5, u1 = u0 + 1 / COLS_N, v0 = v1 - 1 / 5;
    uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
    const m = new THREE.Mesh(g, labM); m.position.set((F[1] + F[2]) / 2, SHELF_Y[F[0]] - 0.025, 0.012); scene.add(m);
    afBox(0.21, 0.096, 0.008, afMat('#2a2a2a'), m.position.x, m.position.y, 0.006);
  });
  const base = L.map((F, i) => 1.49 + 0.1 * Math.floor(afR(i, 11) * 12));
  return {
    scene, camera,
    frame(t) {
      const st = { p: [], fl: [], up: [] };
      L.forEach((F, i) => {
        // nearest labels (to the camera) re-price first, then down the aisle; each jumps twice
        const t1 = AF.surgeW - 0.25 + (F[1] + 3.9) * 0.09, t2 = t1 + 0.55;
        const step = t >= t2 ? 2 : t >= t1 ? 1 : 0;
        st.p.push(Math.round(base[i] * [1, 1.45, 2.1][step] * 10) / 10 - 0.01);
        const df = Math.min(t >= t1 ? t - t1 : 9, t >= t2 ? t - t2 : 9);
        st.fl.push(df < 0.35 ? Math.round((1 - df / 0.35) * 8) / 8 : 0); st.up.push(step > 0 ? 1 : 0);
      });
      atlas.update(st);
      const k = afK(t, AF.prices, AF.oceans);
      afCam(camera, [afLerp(-4.6, -4.3, k), 1.12, afLerp(0.75, 0.7, k)], [afLerp(-2.6, -2.2, k), 0.86, -0.18], 38, -1);
    },
    grade(t, p) { p.warmth = 0.02; p.bloom = 0.2; p.vignette = 0.6; p.saturation = 0.92; p.exposure = 0.92; },
  };
};
