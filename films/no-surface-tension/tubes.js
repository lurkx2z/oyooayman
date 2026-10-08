/* =====================================================================
   TUBES — the capillary demo on the potting bench: four thin glass tubes standing in a shallow glass dish, clipped to
   a white card ruled in centimetres. You pour water (with a little blue ink in the dish) into the dish. Normally water
   climbs a thin tube by itself, higher the thinner the tube (h = 2σ/(ρgr): about 25, 43, 68 and 99 mm for these bores).
   With no surface tension it climbs none of them: the water in every tube stays flat at the dish's level. After the
   pour, pale "ghost" columns rise in each tube to where normal water would have stood (the same ghost style as the
   paperclip in the kitchen). Pure function of story time.
   ===================================================================== */

const NST_TB = {
  dish: { x: 2.3, z: -0.4, r: 0.07, h: 0.022 },     // on the bench top (NST_G.bench.top)
  fill: 0.011,                                      // how deep the water in the dish ends up (m)
  // tubes left → right on screen (the camera faces +Z, so screen-left is +X): thick → thin
  dx: [0.027, 0.009, -0.009, -0.027], ro: [0.0045, 0.0033, 0.0024, 0.0017], rb: [0.0024, 0.0014, 0.0008, 0.0005],
  hN: [0.025, 0.043, 0.068, 0.099],                 // normal capillary rise (m) above the dish level
  zt: -0.006,                                       // tube row, relative to the dish centre (the card is behind, +Z)
};

class NstTubes {
  constructor(parent) {
    this.root = new THREE.Group(); this.root.name = 'tubes'; parent.add(this.root);
  }

  build() {
    const D = NST_TB.dish, top = NST_G.bench.top, g = this.root;
    this.y0 = top + 0.002;                                        // the inside bottom of the dish
    const zero = this.y0 + NST_TB.fill;                            // the card's 0 line: the dish's final water level
    // the glass dish (a wall and a base) and a soft contact shadow under it
    const glass = nstGlassy('#e6f2f4', 0.05, 0.55);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(D.r, D.r, D.h, 40, 1, true), glass); wall.position.set(D.x, top + D.h / 2, D.z); wall.renderOrder = 5; g.add(wall);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(D.r, 0.0012, 5, 48), nstGlassy('#f4fbfc', 0.25, 0.5)); lip.rotation.x = Math.PI / 2; lip.position.set(D.x, top + D.h, D.z); lip.renderOrder = 5; g.add(lip);
    const base = new THREE.Mesh(new THREE.CircleGeometry(D.r, 40), nstGlassy('#dfeef0', 0.12, 0.3)); base.rotation.x = -Math.PI / 2; base.position.set(D.x, top + 0.0012, D.z); base.renderOrder = 4; g.add(base);
    // the water in the dish (blue from a few drops of ink): its height is set per frame
    this.dishWaterMat = nstGlassy('#33658a', 0.5, 0.3, { side: THREE.FrontSide });
    this.dishWater = new THREE.Mesh(new THREE.CylinderGeometry(D.r - 0.0012, D.r - 0.0012, 1, 40), this.dishWaterMat);
    this.dishWater.position.set(D.x, this.y0, D.z); this.dishWater.renderOrder = 6; g.add(this.dishWater);
    // the ink before the pour: a dark blue blot on the dish's floor
    this.ink = new THREE.Mesh(new THREE.CircleGeometry(0.012, 20), new THREE.MeshBasicMaterial({ color: '#1d4f86', transparent: true, opacity: 0.85, depthWrite: false }));
    this.ink.rotation.x = -Math.PI / 2; this.ink.position.set(D.x + 0.02, top + 0.0016, D.z - 0.03); this.ink.renderOrder = 5; g.add(this.ink);

    // the card behind the tubes, ruled every centimetre, numbered every 2 cm (canvas left = screen left = +X)
    const W = 0.112, Hc = 0.122, cy = zero - 0.006 + Hc / 2, cz = D.z + NST_TB.zt + 0.0055, cx = D.x + 0.004;     // (flush behind the tubes: no parallax against the scale)
    const cv = Tex.canvas(448, 488), c = cv.getContext('2d'), px = 448 / W;
    c.fillStyle = '#2b3237'; c.fillRect(0, 0, 448, 488);
    const yPx = (h) => 488 - (h + 0.006) * px;                    // h: metres above the zero line
    for (let mm = 0; mm <= 112; mm++) {
      const y = yPx(mm / 1000), cm = mm % 10 === 0;
      if (y < 4) break;
      c.fillStyle = cm ? 'rgba(236,240,236,0.6)' : 'rgba(236,240,236,0.2)';
      if (cm) c.fillRect(70, y - 1.5, 378, 3); else if (mm % 5 === 0) c.fillRect(70, y - 0.8, 30, 1.6); else c.fillRect(70, y - 0.6, 16, 1.2);
    }
    c.fillStyle = '#eef0ea'; c.font = 'bold 40px Georgia, serif'; c.textAlign = 'right'; c.textBaseline = 'middle';
    for (let k = 0; k <= 10; k += 2) c.fillText(String(k), 60, yPx(k / 100));
    c.font = 'bold 28px Georgia, serif'; c.fillText('cm', 62, yPx(0.111) + 6);
    const card = new THREE.Mesh(new THREE.PlaneGeometry(W, Hc), new THREE.MeshStandardMaterial({ map: Tex.tex(cv), roughness: 0.9, emissive: '#ffffff', emissiveIntensity: 0.25, name: 'nstCard' }));
    card.material.emissiveMap = card.material.map;
    card.rotation.y = Math.PI; card.position.set(cx, cy, cz); card.receiveShadow = true; g.add(card);
    // the card's wooden stand: two posts and a foot
    const wood = Mat.std('#7a5a3c', { roughness: 0.85 });
    for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.008, Hc + 0.02, 0.008), wood); p.position.set(cx + sx * (W / 2 + 0.004), top + (Hc + 0.02) / 2 + 0.004, cz + 0.002); p.castShadow = true; g.add(p); }

    // the tubes: thick glass walls, a narrow bore; the real water and the ghost of normal water inside the bore
    const tubeH = 0.118, ty = top + 0.004;
    this.cols = []; this.ghosts = []; this.caps = [];
    const colMat = nstGlassy('#2b78b4', 0.85, 0.15, { side: THREE.FrontSide });
    const ghostMat = new THREE.MeshBasicMaterial({ color: '#f4fbff', transparent: true, opacity: 0, depthWrite: false });
    const capMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false });
    this.ghostMat = ghostMat; this.capMat = capMat;
    NST_TB.dx.forEach((dx, i) => {
      const x = D.x + dx, z = D.z + NST_TB.zt, ro = NST_TB.ro[i], rb = NST_TB.rb[i];
      const outer = new THREE.Mesh(new THREE.CylinderGeometry(ro, ro, tubeH, 18, 1, true), nstGlassy('#e8f4f6', 0.07, 0.62)); outer.position.set(x, ty + tubeH / 2, z); outer.renderOrder = 8; g.add(outer);
      const bore = new THREE.Mesh(new THREE.CylinderGeometry(rb, rb, tubeH, 12, 1, true), nstGlassy('#cfe2e6', 0.05, 0.35)); bore.position.copy(outer.position); bore.renderOrder = 7; g.add(bore);
      const rim = new THREE.Mesh(new THREE.TorusGeometry((ro + rb) / 2, (ro - rb) / 2, 4, 18), nstGlassy('#f4fbfc', 0.3, 0.4)); rim.rotation.x = Math.PI / 2; rim.position.set(x, ty + tubeH, z); rim.renderOrder = 8; g.add(rim);
      // a clip holding it to the card
      const clip = new THREE.Mesh(new THREE.BoxGeometry(ro * 2 + 0.004, 0.006, 0.006), Mat.std('#3a3f44', { roughness: 0.5 })); clip.position.set(x, ty + tubeH - 0.02, z + ro + 0.002); g.add(clip);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(rb * 0.92, rb * 0.92, 1, 10), colMat); col.position.set(x, ty, z); col.renderOrder = 6; g.add(col); this.cols.push(col);
      const gh = new THREE.Mesh(new THREE.CylinderGeometry(rb * 1.05, rb * 1.05, 1, 10), ghostMat); gh.position.set(x, zero, z); gh.renderOrder = 9; gh.visible = false; g.add(gh); this.ghosts.push(gh);
      // the ghost's meniscus: a bright little line across the bore at the top of the column
      const cap = new THREE.Mesh(new THREE.BoxGeometry(rb * 2.6, 0.0011, rb * 2.6), capMat); cap.position.set(x, zero, z); cap.renderOrder = 10; cap.visible = false; g.add(cap); this.caps.push(cap);
    });
    this.zero = zero;
  }

  // the dish's water depth (m) at story time t
  level(t) {
    const T = NST;
    return NST_TB.fill * MathX.smooth(t, T.pour + 0.3, T.pourEnd + 0.25);
  }

  update(t) {
    const T = NST, on = t >= T.bench - 0.2 && t < T.stem;
    this.root.visible = on;
    if (!on) return;
    const L = this.level(t), top = NST_G.bench.top;
    this.dishWater.visible = L > 0.0002;
    this.dishWater.scale.y = Math.max(L, 0.0001); this.dishWater.position.y = this.y0 + L / 2;
    this.ink.material.opacity = 0.85 * (1 - MathX.smooth(t, T.pour + 0.35, T.pour + 0.9));
    // the real water in each tube: flat, at the dish's level (it climbs none of them)
    const ty = top + 0.004, wl = this.y0 + L;
    this.cols.forEach((c) => { const h = Math.max(0.0001, wl - ty); c.visible = wl > ty + 0.0003; c.scale.y = h; c.position.y = ty + h / 2; });
    // the ghosts of normal water: each climbs its tube after the pour, thinner tubes higher
    const ga = MathX.smooth(t, T.pourEnd + 0.35, T.pourEnd + 0.7);
    this.ghostMat.opacity = 0.7 * ga; this.capMat.opacity = 1.0 * ga;
    NST_TB.hN.forEach((hN, i) => {
      const u = MathX.clamp((t - (T.pourEnd + 0.4 + 0.22 * i)) / 0.75, 0, 1), h = hN * (1 - Math.pow(1 - u, 3));
      const gh = this.ghosts[i], cap = this.caps[i];
      gh.visible = cap.visible = ga > 0.003 && h > 0.0005;
      gh.scale.y = Math.max(h, 0.0001); gh.position.y = this.zero + h / 2; cap.position.y = this.zero + h;
    });
  }
}
