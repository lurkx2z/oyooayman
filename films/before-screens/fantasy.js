/* =====================================================================
   IMAGINATION — "a stick could become anything".
   A pure overlay on the real street, driven by SCRIPT_TRACKS.castle /
   .gear / .sword: stone walls with battlements rise out of the ground on
   both sides, towers and a gatehouse close the far end, banners unfurl,
   torches flare; your stick grows a steel blade and a crossguard; your
   friend and the others gain helms, painted shields, swords and capes.
   At the smash cut every track snaps to 0 and the plain street is back.
   ===================================================================== */

const CASTLE = { z0: -16, z1: -47, wallX: 7.7, wallH: 10, gateZ: -48.5 };

class ImaginationSet {
  constructor(scene, kids, hands) {
    this.kids = kids; this.hands = hands;
    this.root = new THREE.Group(); this.root.name = 'imagination'; scene.add(this.root);
    const r = new RNG(1210);
    // stone: grey-ochre blocks with dark mortar
    const cv = Tex.canvas(256, 256), c = cv.getContext('2d');
    c.fillStyle = '#4e4840'; c.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 8; row++) for (let k = -1; k < 5; k++) {
      const x = k * 64 + (row % 2) * 32, v = r.range(-18, 14);
      c.fillStyle = `rgb(${142 + v},${132 + v},${116 + v})`; c.fillRect(x + 2, row * 32 + 2, 60, 28);
      c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x + 2, row * 32 + 24, 60, 6);
    }
    Tex.blotches(c, 256, 256, 30, 6, 30, () => `rgba(${r.chance(0.5) ? '60,70,40' : '90,80,70'},${r.range(0.08, 0.2)})`, r);
    const stoneT = Tex.tex(cv); stoneT.repeat.set(1, 1);
    const stone = new THREE.MeshStandardMaterial({ map: stoneT, roughness: 0.95, name: 'castleStone' });
    const roofM = new THREE.MeshStandardMaterial({ color: '#3a4a6a', roughness: 0.7, name: 'castleRoof' });
    this.rising = [];      // [group, delay]
    const wallSeg = (x, z, len, side, delay) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); this.root.add(g);
      const H = CASTLE.wallH;
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, H, len), stone); body.position.y = H / 2;
      body.material = stone; body.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * (i % 2 ? H / 2 : len / 2); });
      g.add(body);
      for (let k = 0; k < Math.floor(len / 1.1); k++) { const mer = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 0.6), stone); mer.position.set(0, H + 0.45, -len / 2 + 0.55 + k * 1.1); g.add(mer); }
      // a slit window or two
      for (let k = 0; k < 2; k++) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.1, 0.28), new THREE.MeshBasicMaterial({ color: '#16120e' })); w.position.set(-side * 0.72, 5 + k * 2.4, (k - 0.5) * len * 0.4); g.add(w); }
      g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      this.rising.push([g, delay]);
      return g;
    };
    const tower = (x, z, rad, H, delay) => {
      const g = new THREE.Group(); g.position.set(x, 0, z); this.root.add(g);
      const body = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 1.08, H, 14), stone); body.position.y = H / 2; g.add(body);
      body.geometry.attributes.uv.array.forEach((v, i, a) => { a[i] = v * (i % 2 ? H / 2 : rad * 3); });
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2, mer = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.5), stone); mer.position.set(Math.cos(a) * rad, H + 0.45, Math.sin(a) * rad); mer.rotation.y = -a; g.add(mer); }
      const roof = new THREE.Mesh(new THREE.ConeGeometry(rad * 1.25, rad * 2.2, 14), roofM); roof.position.y = H + 1.2 + rad * 1.1; g.add(roof);
      g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      this.rising.push([g, delay]);
    };
    const C = CASTLE, segLen = 6;
    let d = 0;
    for (let z = C.z0 - segLen / 2; z > C.z1 + segLen / 2 - 0.1; z -= segLen) {
      for (const side of [-1, 1]) wallSeg(side * C.wallX, z, segLen + 0.05, side, d);
      d += 0.09;
    }
    for (const side of [-1, 1]) { tower(side * C.wallX, C.z0 - 0.5, 1.9, 13, 0.0); tower(side * C.wallX, -31.5, 1.7, 12.5, 0.25); tower(side * 4.6, C.gateZ, 2.1, 15, 0.45); }
    // the gatehouse across the far end, with a raised portcullis
    const gate = new THREE.Group(); gate.position.set(0, 0, C.gateZ); this.root.add(gate);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(7.2, 4.5, 1.8), stone); lintel.position.y = 8.6; gate.add(lintel);
    for (let k = 0; k < 6; k++) { const mer = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 1.9), stone); mer.position.set(-3 + k * 1.2, 11.3, 0); gate.add(mer); }
    const iron = new THREE.MeshStandardMaterial({ color: '#2a2a2c', metalness: 0.7, roughness: 0.5 });
    for (let k = 0; k < 9; k++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 0.08), iron); bar.position.set(-2.6 + k * 0.65, 5.4, 0.3); gate.add(bar); }
    for (let k = 0; k < 3; k++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.08, 0.08), iron); bar.position.set(0, 4.6 + k * 0.7, 0.3); gate.add(bar); }
    gate.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.rising.push([gate, 0.5]);
    // banners: red and blue with a gold emblem, hung on the walls
    const emblem = (bg, fg) => {
      const bc = Tex.canvas(128, 320), b = bc.getContext('2d');
      b.fillStyle = bg; b.fillRect(0, 0, 128, 320);
      b.fillStyle = fg; b.fillRect(0, 0, 128, 14); b.fillRect(0, 306, 128, 14);
      b.beginPath(); b.moveTo(64, 70); for (let i = 1; i <= 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 22 : 52; b.lineTo(64 + Math.cos(a) * rr, 130 + Math.sin(a) * rr); } b.closePath(); b.fill();
      b.fillRect(56, 190, 16, 90); b.fillRect(36, 210, 56, 12);
      return Tex.tex(bc, { repeat: false });
    };
    const banMats = [new THREE.MeshStandardMaterial({ map: emblem('#8e2a26', '#e0b84a'), roughness: 0.9, side: THREE.DoubleSide }), new THREE.MeshStandardMaterial({ map: emblem('#22406e', '#e0b84a'), roughness: 0.9, side: THREE.DoubleSide })];
    this.banners = [];
    let bi = 0;
    for (let z = C.z0 - 4; z > C.z1 + 2; z -= 7) for (const side of [-1, 1]) {
      const geo = new THREE.PlaneGeometry(1.4, 4.2, 1, 8); geo.translate(0, -2.1, 0);
      const m = new THREE.Mesh(geo, banMats[(bi++) % 2]); m.position.set(side * (C.wallX - 0.75), 9.3, z); m.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      this.root.add(m); this.banners.push(m);
    }
    // torches on brackets: flames are soft additive billboards, two lights flicker warm
    this.torchPos = [];
    for (let z = C.z0 - 2.5; z > C.z1 + 1; z -= 7) for (const side of [-1, 1]) {
      const p = new THREE.Vector3(side * (C.wallX - 0.85), 3.4, z);
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.08), iron); br.position.copy(p).add(new THREE.Vector3(side * 0.25, -0.15, 0)); this.root.add(br);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.07, 0.22, 8), iron); cup.position.copy(p); this.root.add(cup);
      this.torchPos.push(p);
    }
    this.flames = new BillboardSystem(scene, 120, true);
    this.torchLights = [0, 1].map((k) => { const l = new THREE.PointLight('#ffa040', 0, 14, 1.6); l.position.copy(this.torchPos[k * 3 + 1] || this.torchPos[0]); scene.add(l); return l; });
    // knight gear for the kids (id → items)
    this.gear = [];
    const helmM = new THREE.MeshStandardMaterial({ color: '#a8acb0', metalness: 0.85, roughness: 0.35, name: 'helmSteel' });
    const shieldFace = (bg, fg) => { const sc = Tex.canvas(128, 160), s = sc.getContext('2d'); s.fillStyle = bg; s.fillRect(0, 0, 128, 160); s.fillStyle = fg; s.fillRect(54, 0, 20, 160); s.fillRect(0, 60, 128, 20); return Tex.tex(sc, { repeat: false }); };
    const shieldShape = new THREE.Shape(); shieldShape.moveTo(-0.22, 0.2); shieldShape.lineTo(0.22, 0.2); shieldShape.lineTo(0.22, 0.0); shieldShape.quadraticCurveTo(0.2, -0.22, 0, -0.32); shieldShape.quadraticCurveTo(-0.2, -0.22, -0.22, 0.0); shieldShape.closePath();
    const shieldGeo = new THREE.ExtrudeGeometry(shieldShape, { depth: 0.03, bevelEnabled: false });
    { const pos = shieldGeo.attributes.position, uv = shieldGeo.attributes.uv; for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + 0.22) / 0.44, (pos.getY(i) + 0.32) / 0.52); }
    const capeM = new THREE.MeshStandardMaterial({ color: '#8e2a26', roughness: 0.95, side: THREE.DoubleSide, name: 'cape' });
    const swordGeo = () => {
      const g = new THREE.Group();
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.6, 0.008), new THREE.MeshStandardMaterial({ color: '#d0d4d8', metalness: 0.95, roughness: 0.18, name: 'bladeSteel' })); blade.position.y = 0.38; g.add(blade);
      const guard = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.025), new THREE.MeshStandardMaterial({ color: '#c8a040', metalness: 0.9, roughness: 0.3 })); guard.position.y = 0.07; g.add(guard);
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.12, 6), new THREE.MeshStandardMaterial({ color: '#4a2e1e', roughness: 0.8 })); g.add(grip);
      return g;
    };
    const kit = [['runner', '#8e2a26', '#e0b84a', true], ['tagIt', '#22406e', '#e0b84a', true], ['tag3', '#2e5a3a', '#e8e0c8', true], ['tag2', '#6a2a6a', '#e0b84a', false], ['tag4', '#22406e', '#d8d0b8', false]];
    for (const [id, bg, fg, sword] of kit) {
      const k = kids.byId[id]; if (!k) continue;
      const items = [];
      const helm = new THREE.Group();
      const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.12, 0.2, 12), helmM); h1.position.y = 0.03; helm.add(h1);
      const slit = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.02), new THREE.MeshBasicMaterial({ color: '#0a0a0a' })); slit.position.set(0, 0.04, 0.122); helm.add(slit);
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.2), new THREE.MeshStandardMaterial({ color: bg, roughness: 0.9 })); crest.position.y = 0.16; helm.add(crest);
      k.j.head.add(helm); items.push(helm);
      const sh = new THREE.Mesh(shieldGeo, new THREE.MeshStandardMaterial({ map: shieldFace(bg, fg), roughness: 0.6, metalness: 0.1 }));
      sh.position.set(0.04, -0.12, 0.06); sh.rotation.set(0, -Math.PI / 2 + 0.2, 0); k.j.la.el.add(sh); items.push(sh);
      if (sword) { const sw = swordGeo(); sw.position.set(0, -0.26, 0.03); sw.rotation.x = -Math.PI / 2 + 0.3; k.j.ra.el.add(sw); items.push(sw); }
      const cg = new THREE.PlaneGeometry(0.42, 0.62, 2, 4); cg.translate(0, -0.31, 0);
      const cape = new THREE.Mesh(cg, capeM); cape.position.set(0, 0.52, -0.13); cape.rotation.x = 0.12; k.j.spine.add(cape); items.push(cape);
      items.forEach((o) => { o.traverse((q) => { if (q.isMesh) q.castShadow = true; }); o.visible = false; });
      this.gear.push({ k, items });
    }
    // your stick (always yours from the pick-up on) and the blade it grows
    const stickPts = [[0, -0.08, 0], [0.01, 0.15, 0.01], [-0.005, 0.38, 0.0], [0.012, 0.6, 0.012], [0.004, 0.72, 0.006]].map((p) => new THREE.Vector3(...p));
    this.stick = new THREE.Group();
    const bark = new THREE.MeshStandardMaterial({ color: '#6e5238', roughness: 0.92, name: 'stickBark' });
    this.stick.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(stickPts), 12, 0.014, 6), bark));
    const twig = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.007, 0.12, 4), bark); twig.position.set(0.03, 0.45, 0); twig.rotation.z = -0.8; this.stick.add(twig);
    this.blade = swordGeo(); this.blade.children[2].visible = false; this.stick.add(this.blade);
    this.stick.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.groundStick = this.stick.clone(); scene.add(this.groundStick);
    this.groundStick.position.set(2.06, 0.075, -30.62); this.groundStick.rotation.set(Math.PI / 2, 0, 0.6); this.groundStick.children[2].visible = false;
    hands.right.g.add(this.stick);
    this.stick.position.set(0.0, 0.065, 0.03); this.stick.rotation.set(0, 0, -Math.PI / 2);   // along the thumb side of the fist this.stick.scale.setScalar(1 / hands.o.scale);
    this.dust = new BillboardSystem(scene, 160, false); this.dust.uniforms.uLight.value = 0.9;
    this.sparks = new BillboardSystem(scene, 80, true);
    this.clashes = [48.15, 49.05, 49.95];
    this._v = new THREE.Vector3();
  }

  update(t, cam) {
    const S = SCRIPT_TRACKS, rise = S.castle.value(t), gear = S.gear.value(t), sword = S.sword.value(t);
    const on = rise > 0.001;
    this.root.visible = on; this.flames.mesh.visible = on; this.dust.mesh.visible = on;
    for (const l of this.torchLights) l.visible = on;
    // walls and towers grow out of the ground one after another (with a little overshoot)
    for (const [g, delay] of this.rising) {
      const k = MathX.clamp(rise * 1.6 - delay * 1.2, 0, 1), e = k < 1 ? Ease.outBack(k) : 1;
      g.scale.set(1, Math.max(0.001, e), 1); g.visible = k > 0.001;
    }
    for (const [i, b] of this.banners.entries()) {
      b.scale.y = Math.max(0.001, MathX.clamp(rise * 1.4 - 0.4 - i * 0.02, 0, 1));
      b.rotation.x = Math.sin(t * 1.7 + i) * 0.06;
    }
    // torches flare once the walls are up
    const fire = MathX.clamp(rise * 2 - 1, 0, 1);
    this.flames.begin(null);
    if (on) for (const [i, p] of this.torchPos.entries()) for (let k = 0; k < 6; k++) {
      const ph = (t * 3.2 + k / 6 + i * 0.13) % 1, h = hash2(i, k + Math.floor(t * 3.2 + k / 6 + i * 0.13));
      // small licking tongues: hot yellow at the root, orange and fading as they rise
      this.flames.push(p.x + (h - 0.5) * 0.05, p.y + 0.1 + ph * 0.3, p.z + (hash1(i * 7 + k) - 0.5) * 0.05, (0.13 - ph * 0.08) * fire, h * 6, (1 - ph) * 0.55 * fire, 0.75, 1.0, 0.75 - ph * 0.45, 0.25 - ph * 0.2);
    }
    this.flames.end();
    for (const [i, l] of this.torchLights.entries()) l.intensity = fire * (5 + 1.5 * noise1(t * 9, 70 + i));
    // dust kicked up where the walls burst out of the ground
    this.dust.begin(null);
    if (on && rise < 0.95) for (let i = 0; i < 40; i++) {
      const side = i % 2 ? 1 : -1, z = CASTLE.z0 - (i / 40) * (CASTLE.z0 - CASTLE.z1), h = hash1(i * 13);
      this.dust.push(side * (CASTLE.wallX - 0.9 - h * 0.6), 0.3 + h * 0.8, z, 1.0 + h, h * 6, 0.18 * (1 - rise), 0.7, 0.86, 0.78, 0.66);
    }
    this.dust.end();
    // sparks fly where the blades meet (in front of you, at the friend's sword)
    this.sparks.begin(null);
    if (on) for (const tc of this.clashes) {
      const age = t - tc;
      if (age < 0 || age > 0.45) continue;
      const fwd = new THREE.Vector3(0, 0, -0.75).applyQuaternion(cam.quaternion).add(cam.position);
      for (let i = 0; i < 26; i++) {
        const h1 = hash2(i, Math.round(tc * 10)), h2 = hash2(i + 50, 7), h3 = hash2(i + 90, 11);
        const v = 1.6 + 2.4 * h1, a = h2 * Math.PI * 2;
        this.sparks.push(fwd.x + Math.cos(a) * v * age, fwd.y + 0.15 + (Math.sin(a) * 0.8 + 0.6) * v * age - 4 * age * age, fwd.z + (h3 - 0.5) * v * age,
          0.012 + 0.01 * (1 - age / 0.45), 0, (1 - age / 0.45), 1, 1.0, 0.8, 0.4);
      }
    }
    this.sparks.end(); this.sparks.mesh.visible = on;
    // knight gear grows onto the kids
    for (const { items } of this.gear) for (const o of items) { o.visible = gear > 0.01; o.scale.setScalar(Math.max(0.001, Ease.outBack(MathX.clamp(gear, 0, 1)))); }
    // your stick: on the ground until you pick it up, then in your hand; its blade grows out of the tip
    const held = t >= 43.25 && t < 56;
    this.groundStick.visible = t >= 42.0 && t < 43.25;
    this.stick.visible = held;
    this.blade.visible = sword > 0.01;
    this.blade.scale.set(1, Math.max(0.001, sword), 1);
    this.stick.children[0].visible = this.stick.children[1].visible = sword < 0.6;
  }
}
