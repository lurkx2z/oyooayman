/* =====================================================================
   SKY SET — an airliner at 10 km, heading east, 0.8 s into the second. The air never stopped, so nothing has happened
   to it: plane and air still move together. Far below: the coast (the sea's wall is a white line with a shadow 2.6 km
   long behind it), the town's dust, the hill's fire.
   Set coordinates: the airliner at the origin, nose to +x (east); the ground at y = −10,000.
   ===================================================================== */

ES_SETS.sky = (app) => {
  const S = esSet(app, { sky: '#6f97cf', fov: 40, near: 1, far: 90000, sun: [ES_SUN[0] * 800, ES_SUN[1] * 800 + 60, ES_SUN[2] * 800], sunColor: '#ffd2a0', sunI: 3.6, shadow: 2048, shadowR: 40, shadowFar: 1700,
    hemi: ['#b4caf0', '#e6c49c', 1.15], env: ['#3f6fb8', '#f0d2a8', '#c8a888'] });
  const scene = S.scene, cam = S.camera, P = ESP;
  scene.fog = new THREE.FogExp2('#e9cfae', 0.000028);
  esGradSky(scene, '#1f4a8c', '#f4cf9e', '#dcb890', { sunDir: ES_SUN, sunGlow: '#ffb468', hw: 0.2, r: 60000 });
  { const sd = new THREE.Vector3(...ES_SUN).normalize(), disc = new THREE.Mesh(new THREE.CircleGeometry(330, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color(10, 7.8, 4.8), fog: false, depthWrite: false })); disc.position.copy(sd).multiplyScalar(56000); disc.lookAt(0, 0, 0); disc.renderOrder = -9; scene.add(disc); }

  // ---- the ground, 10 km down: 64 km of coast (the sea to the west), drawn once
  const COAST = 9000;                                      // the coast is this far ahead of the airliner
  {
    const N = 2048, span = 64000, r = new RNG(4410);
    const tex = esTex(esCanvas(N, N, (g) => {
      const px = (m) => m / span * N, cx = N / 2;
      // the sea (the low sun on it to the west), the land (red earth, dry grass, fields)
      const sg = g.createLinearGradient(0, 0, cx, 0); sg.addColorStop(0, '#c9a878'); sg.addColorStop(0.45, '#4f6f72'); sg.addColorStop(1, '#27525a'); g.fillStyle = sg; g.fillRect(0, 0, cx + 40, N);
      const coast = (y) => cx + px(700) * Math.sin(y * 0.004) + px(380) * Math.sin(y * 0.011 + 1.3) + px(160) * Math.sin(y * 0.031 + 0.4);
      g.fillStyle = '#9a7a52'; g.beginPath(); g.moveTo(N, 0); for (let y = 0; y <= N; y += 4) g.lineTo(coast(y), y); g.lineTo(N, N); g.closePath(); g.fill();
      g.save(); g.clip();
      for (let i = 0; i < 2600; i++) { const x = cx + r.range(-60, N / 2), y = r.range(0, N), w = r.range(8, 70), h = r.range(6, 40), k = r.next(); g.fillStyle = k < 0.4 ? `rgba(92,104,58,${r.range(0.15, 0.5)})` : k < 0.75 ? `rgba(168,122,78,${r.range(0.15, 0.45)})` : `rgba(206,180,130,${r.range(0.12, 0.35)})`; g.save(); g.translate(x, y); g.rotate(r.range(-0.3, 0.3)); g.fillRect(-w / 2, -h / 2, w, h); g.restore(); }
      // hills east of the coast (their sunlit west flanks, their long shadows)
      for (let i = 0; i < 26; i++) { const y = r.range(0, N), x = coast(y) + px(r.range(600, 9000)), w = r.range(20, 70), h = r.range(60, 240); g.fillStyle = 'rgba(40,30,24,0.42)'; g.fillRect(x, y - h / 2, w * 2.4, h); g.fillStyle = 'rgba(222,178,120,0.55)'; g.fillRect(x - w * 0.4, y - h / 2, w * 0.5, h); }
      // the dust everything loose is trailing east (0.8 s: about 370 m; drawn longer so it can be seen at all)
      g.globalAlpha = 0.5; for (let i = 0; i < 900; i++) { const y = r.range(0, N), x = coast(y) + r.range(4, N / 2); g.fillStyle = 'rgba(228,206,170,0.28)'; g.fillRect(x, y, r.range(10, 44), 1.4); } g.globalAlpha = 1;
      g.restore();
      // the sea's wall along the whole coast: a white line; behind it (east) its shadow, 2.6 km long in this light
      for (let y = 0; y <= N; y += 2) {
        const x = coast(y), sh = px(2600) * (0.9 + 0.1 * Math.sin(y * 0.05));
        const sgr = g.createLinearGradient(x, 0, x + sh, 0); sgr.addColorStop(0, 'rgba(14,16,20,0.62)'); sgr.addColorStop(0.75, 'rgba(14,16,20,0.5)'); sgr.addColorStop(1, 'rgba(14,16,20,0)');
        g.fillStyle = sgr; g.fillRect(x, y, sh, 2);
        g.fillStyle = 'rgba(255,252,244,0.98)'; g.fillRect(x - 5, y, 7, 2); g.fillStyle = 'rgba(255,250,240,0.4)'; g.fillRect(x - 12, y, 8, 2);
      }
      // the town by the harbour (pale), the hill beyond it: its fire and the smoke going over it
      const ty = N / 2, tx = coast(ty);
      g.fillStyle = 'rgba(214,200,176,0.5)'; g.fillRect(tx + 2, ty - 8, 16, 16);
      const fx = tx + px(850); const fg = g.createRadialGradient(fx, ty, 0, fx, ty, 16); fg.addColorStop(0, 'rgba(255,190,90,1)'); fg.addColorStop(0.4, 'rgba(255,110,30,0.8)'); fg.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = fg; g.fillRect(fx - 16, ty - 16, 32, 32);
      const sm = g.createLinearGradient(fx, 0, fx + 110, 0); sm.addColorStop(0, 'rgba(20,18,18,0.8)'); sm.addColorStop(1, 'rgba(20,18,18,0)'); g.fillStyle = sm; g.beginPath(); g.moveTo(fx + 4, ty - 5); g.lineTo(fx + 110, ty - 22); g.lineTo(fx + 110, ty + 22); g.lineTo(fx + 4, ty + 5); g.fill();
    }), { repeat: false, aniso: 8 });
    const gm = new THREE.Mesh(new THREE.PlaneGeometry(span, span), new THREE.MeshBasicMaterial({ map: tex }));
    gm.rotation.x = -Math.PI / 2; gm.position.set(COAST, -10000, 0); scene.add(gm);
    // (beyond the drawn square: sea to the west, land to the east, lost in the haze)
    const far = (x, c) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(200000, 400000), new THREE.MeshBasicMaterial({ color: c })); m.rotation.x = -Math.PI / 2; m.position.set(x, -10040, 0); scene.add(m); };
    far(COAST - 132000 + 40, '#9c8a6c'); far(COAST + 132000 - 40, '#9a7a52');
  }
  // ---- scattered cloud, far below (lit from the west)
  {
    const ct = esTex(esCanvas(256, 256, (g, w, h) => { const r = new RNG(77); for (let i = 0; i < 26; i++) { const x = w * r.range(0.22, 0.78), y = h * r.range(0.3, 0.7), rr = r.range(18, 52); const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); } }), { repeat: false });
    const r = new RNG(99);
    for (let i = 0; i < 46; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(r.range(2200, 6500), r.range(1500, 3800)), new THREE.MeshBasicMaterial({ map: ct, transparent: true, depthWrite: false, color: new THREE.Color(1.15, 1.0 + 0.06 * r.next(), 0.88) }));
      m.rotation.x = -Math.PI / 2; m.rotation.z = r.range(0, 3.1); m.position.set(r.range(-12000, 36000), r.range(-7600, -5200), r.range(-22000, 22000)); m.renderOrder = 2; scene.add(m);
    }
  }
  // ---- the airliner (38 m; twin engines)
  const plane = new THREE.Group(); scene.add(plane);
  {
    const skinT = esTex(esCanvas(256, 2048, (g, w, h) => {
      g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, w, h);
      // (u runs round the body: 0 = its right side, 0.25 = the top, 0.5 = its left side; v runs tail → nose, drawn bottom → top)
      for (const u of [0.035, 0.465]) {
        g.fillStyle = '#1f6a6a'; g.fillRect(w * u - 30 * (u < 0.25 ? 1 : 0) - (u < 0.25 ? 0 : -8), h * 0.06, 22, h * 0.86);
        g.fillStyle = '#16242c'; for (let y = h * 0.14; y < h * 0.86; y += 13) { esRR(g, w * u - 3 + (u < 0.25 ? 6 : -6), y, 7, 8, 2.5); g.fill(); }
      }
      g.fillStyle = '#16242c'; g.fillRect(w * 0.09, h * 0.03, w * 0.32, h * 0.014);            // the flight deck's windows (over the top, near the nose)
      g.fillStyle = 'rgba(0,0,0,0.05)'; for (let y = 0; y < h; y += 96) g.fillRect(0, y, w, 1.5);
    }), { repeat: false });
    skinT.flipY = true;
    const skin = new THREE.MeshStandardMaterial({ map: skinT, roughness: 0.35, metalness: 0.25 }), wingM = esStd('#d9dbdc', 0.4, 0.5), dark = esStd('#1c2024', 0.5, 0.5), teal = esStd('#1f6a6a', 0.45, 0.2);
    const body = new THREE.Mesh(esLoft([[-19.2, 1.5, 0, 0.25, 0.4], [-17.5, 1.25, 0, 0.75, 0.95], [-14, 0.8, 0, 1.45, 1.6], [-9, 0.35, 0, 1.92, 2.02], [-4, 0.2, 0, 1.98, 2.07], [11, 0.2, 0, 1.98, 2.07], [14.5, 0.15, 0, 1.86, 1.92], [17, 0.0, 0, 1.36, 1.38], [18.4, -0.12, 0, 0.72, 0.74], [19, -0.18, 0, 0.26, 0.28]], 28, 0.7), skin);
    body.castShadow = body.receiveShadow = true; plane.add(body);
    // a flat tapered surface from a planform [[x, z]…] (thickness th), for the wings and the tailplane
    const slab = (pts, th, mat, y, dih = 0) => {
      const sh = new THREE.Shape(); pts.forEach(([x, z], i) => (i ? sh.lineTo(x, -z) : sh.moveTo(x, -z))); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: th, bevelEnabled: true, bevelThickness: th * 0.3, bevelSize: 0.12, bevelSegments: 2 }); g.rotateX(-Math.PI / 2);
      const out = [];
      for (const sgn of [1, -1]) { const m = new THREE.Mesh(g, mat); m.position.y = y; m.scale.z = sgn; m.rotation.x = -sgn * dih; m.castShadow = m.receiveShadow = true; plane.add(m); out.push(m); }
      return out;
    };
    const wm = new THREE.MeshStandardMaterial({ color: '#d9dbdc', roughness: 0.4, metalness: 0.5, side: THREE.DoubleSide });
    slab([[4.2, 1.7], [-6.6, 17.2], [-8.3, 17.2], [-3.6, 1.7]], 0.32, wm, -0.75, 0.09);
    slab([[-14.6, 0.6], [-18.6, 6.4], [-19.6, 6.4], [-18.2, 0.6]], 0.2, wm, 1.25, 0.1);
    void wingM;
    // the fin
    { const sh = new THREE.Shape(); [[-13.2, 1.9], [-18.8, 8.2], [-20.4, 8.2], [-18.6, 1.6]].forEach(([x, y], i) => (i ? sh.lineTo(x, y) : sh.moveTo(x, y))); sh.closePath();
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.1, bevelSegments: 2 }); g.translate(0, 0, -0.13);
      const m = new THREE.Mesh(g, teal); m.castShadow = true; plane.add(m); }
    // the engines, under the wings; winglets
    for (const sgn of [-1, 1]) {
      const e = new THREE.Group(); e.position.set(1.6, -1.95, sgn * 5.9); plane.add(e);
      const c = esMesh(new THREE.CylinderGeometry(1.12, 0.95, 3.8, 22), esStd('#e8e8e6', 0.35, 0.4), 0, 0, 0, e); c.rotation.z = -Math.PI / 2;
      const i = esMesh(new THREE.CylinderGeometry(0.98, 0.98, 0.1, 22), dark, 1.9, 0, 0, e); i.rotation.z = -Math.PI / 2;
      const o = esMesh(new THREE.CylinderGeometry(0.6, 0.35, 1.0, 16), dark, -2.2, 0, 0, e); o.rotation.z = -Math.PI / 2;
      esBox(2.6, 0.9, 0.24, wm, -0.4, 0.8, 0, e);
      const wl = esBox(1.5, 1.5, 0.1, teal, -7.5, 1.35, sgn * 17.25, plane); wl.rotation.z = -0.5;
    }
  }
  const fx = esPuffs(scene, 600, { soft: 1.3, billow: 0.7 });

  const set = {
    scene, camera: cam,
    cuts() { return []; },
    frame(t, shot) {
      const s = esStoryAt(t), u = t - shot.t0, d = shot.t1 - shot.t0, k = esK(u, 0, d);
      this._s = s; this._shot = shot;
      // (in 0.06 s the airliner covers 40 m more than the air around it: it hangs there; only the camera drifts)
      plane.rotation.z = 0.018 * Math.sin(u * 0.5); plane.rotation.x = 0.012 * Math.sin(u * 0.37 + 1);
      const p = [esLerp(-33, -27, k), esLerp(13.5, 11, k), esLerp(-30, -34, k)], at = [5, -2.5, 3];
      const dr = esDrift(t, 0.25, 0.25, 5);
      cam.near = 1; cam.far = 90000;
      esCam(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], at, esLerp(40, 37, k));
      S.sun.target.position.set(0, 0, 0); S.sun.target.updateMatrixWorld();
      // the contrails: two lines of ice behind the engines
      fx.begin();
      for (const sgn of [-1, 1]) for (let i = 0; i < 90; i++) { const a = i / 90, x = -4 - a * a * 1500 - a * 60; fx.add(x, -1.9 - 5 * a + 2 * noise1(i * 0.3, 3), sgn * 5.9 + 3 * noise1(i * 0.21, 7 + sgn), 1.2 + 26 * a, 0.5 * Math.min(1, a * 9) * (1 - a * 0.5), 1, 0.97, 0.92, hash1(i * 3.1 + sgn)); }
      fx.end();
    },
    labels(t) {
      const sh = this._shot; if (!sh) return [];
      const a = esWin(t, sh.t0 + 1.2, sh.t1 - 0.1, 0.5, 0.3);
      return [{ p: [COAST + 300, -10000, 9500], text: 'THE COAST', sub: `THE WATER IS ${Math.round(P.wallH(this._s))} m HIGH NOW`, a, side: 'l' }];
    },
    grade(t, p) { p.exposure = 1.02; p.saturation = 1.06; p.contrast = 1.06; p.warmth = 0.02; p.vignette = 0.4; p.bloom = 0.3; p.bloomThreshold = 0.94; p.grain = 0.022; },
  };
  return set;
};
