/* =====================================================================
   MODERN ROOM — the evening bedroom the film starts (and ends) in.
   Built inside the viewer's 1905 house: its door IS that house's front door,
   so opening it reveals the sunlit street. Blue dusk behind the curtains,
   a warm desk lamp, a dark TV, sneakers on the rug, the bed you sit on.
   Also: the phone (feed UI on a canvas: 1 % battery → low-battery card →
   dead black glass that reflects the lamp) and your own legs while seated.
   ===================================================================== */

class ModernRoom {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.root.name = 'modernRoom';
    scene.add(this.root);
    this.R = BS.room;
    this._v = new THREE.Vector3();
  }

  build(hands) {
    const R = this.R, g = this.root, y0 = R.y, y1 = R.y + R.h;
    const r = new RNG(2026);
    const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o));
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = shadow; m.receiveShadow = true; g.add(m); return m; };
    const box = (w, h, d, x, y, z, mat, ry = 0) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, 0, ry, 0);

    // ---- floor: warm oak planks
    const fl = Tex.canvas(512, 512), f = fl.getContext('2d');
    for (let i = 0; i < 8; i++) for (let k = 0; k < 3; k++) {
      const v = r.range(-12, 12), off = (i % 2) * 170;
      f.fillStyle = `rgb(${164 + v},${122 + v * 0.8},${84 + v * 0.6})`; f.fillRect(k * 256 - off, i * 64, 254, 62);
    }
    for (let i = 0; i < 1600; i++) { f.fillStyle = `rgba(90,60,30,${r.range(0.03, 0.09)})`; f.fillRect(r.range(0, 512), r.range(0, 512), r.range(8, 40), 1); }
    const floorT = Tex.tex(fl); floorT.repeat.set(R.x1 - R.x0, R.z1 - R.z0).multiplyScalar(0.5);
    const floorM = std('#ffffff', { map: floorT, roughness: 0.55, name: 'roomFloor' });
    add(new THREE.PlaneGeometry(R.x1 - R.x0, R.z1 - R.z0), floorM, (R.x0 + R.x1) / 2, y0 + 0.002, (R.z0 + R.z1) / 2, -Math.PI / 2);
    // ---- walls (inward facing), ceiling, skirting
    const wallM = std('#97a6ae', { roughness: 0.92, name: 'roomWall' }), white = std('#eceae4', { roughness: 0.7, name: 'roomTrim' });
    const W = R.x1 - R.x0, D = R.z1 - R.z0, cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2, cy = y0 + R.h / 2;
    const wall = (w, x, z, ry) => add(new THREE.PlaneGeometry(w, R.h), wallM, x, cy, z, 0, ry, 0);
    wall(D, R.x1, cz, -Math.PI / 2); wall(W, cx, R.z0, 0); wall(W, cx, R.z1, Math.PI);
    // west wall with the door opening
    const dz0 = R.doorZ - R.doorW / 2 - 0.04, dz1 = R.doorZ + R.doorW / 2 + 0.04, dh = R.doorH + 0.03;
    add(new THREE.PlaneGeometry(dz0 - R.z0, R.h), wallM, R.x0, cy, (R.z0 + dz0) / 2, 0, Math.PI / 2, 0);
    add(new THREE.PlaneGeometry(R.z1 - dz1, R.h), wallM, R.x0, cy, (dz1 + R.z1) / 2, 0, Math.PI / 2, 0);
    add(new THREE.PlaneGeometry(dz1 - dz0, R.h - dh), wallM, R.x0, y0 + dh + (R.h - dh) / 2, R.doorZ, 0, Math.PI / 2, 0);
    // thick outer shell so no daylight leaks through anywhere but the door gaps
    for (const [w, h, d, x, y, z] of [[0.2, R.h + 0.4, D + 0.4, R.x1 + 0.1, cy, cz], [W + 0.4, R.h + 0.4, 0.2, cx, cy, R.z0 - 0.1], [W + 0.4, R.h + 0.4, 0.2, cx, cy, R.z1 + 0.1], [W + 0.4, 0.2, D + 0.4, cx, y1 + 0.1, cz]]) {
      const m = box(w, h, d, x, y, z, std('#222')); m.material.colorWrite = false; m.material.depthWrite = false;   // shadow caster only
    }
    for (const [w, h, d, x, y, z] of [[0.08, R.h, dz0 - R.z0, R.x0 - 0.05, cy, (R.z0 + dz0) / 2], [0.08, R.h, R.z1 - dz1, R.x0 - 0.05, cy, (dz1 + R.z1) / 2], [0.08, R.h - dh, dz1 - dz0, R.x0 - 0.05, y0 + dh + (R.h - dh) / 2, R.doorZ]]) {
      const m = box(w, h, d, x, y, z, std('#222')); m.material.colorWrite = false; m.material.depthWrite = false;
    }
    add(new THREE.PlaneGeometry(W, D), std('#e8e6e0', { roughness: 0.95, name: 'roomCeiling' }), cx, y1, cz, Math.PI / 2);
    for (const [w, x, z, ry] of [[D, R.x1 - 0.01, cz, Math.PI / 2], [W, cx, R.z0 + 0.01, 0], [W, cx, R.z1 - 0.01, 0]]) box(w, 0.09, 0.015, x, y0 + 0.045, z, white, ry);
    // door casing
    for (const z of [dz0 - 0.035, dz1 + 0.035]) box(0.03, dh + 0.07, 0.07, R.x0 + 0.015, y0 + (dh + 0.07) / 2, z, white);
    box(0.03, 0.07, dz1 - dz0 + 0.14, R.x0 + 0.015, y0 + dh + 0.035, R.doorZ, white);

    // ---- the door (white panel, lever handle); hinge on the south side, opens outward
    const hinge = new THREE.Group(); hinge.position.set(R.x0, y0, R.doorZ + R.doorW / 2); g.add(hinge);
    const doorM = std('#f2f0ea', { roughness: 0.5, name: 'roomDoor' }), steel = std('#b9bcbf', { roughness: 0.3, metalness: 0.85, name: 'handleMetal' });
    const leaf = new THREE.Group(); hinge.add(leaf);
    const dp = new THREE.Mesh(new THREE.BoxGeometry(0.04, R.doorH, R.doorW - 0.012), doorM); dp.position.set(0, R.doorH / 2 + 0.008, -R.doorW / 2); dp.castShadow = true; leaf.add(dp);
    for (const yy of [0.62, 1.5]) { const pnl = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.62, R.doorW - 0.24), doorM); pnl.position.set(0.026, yy, -R.doorW / 2); leaf.add(pnl); }
    const lever = new THREE.Group(); lever.position.set(0.04, 1.0, -R.doorW + 0.085); leaf.add(lever);
    lever.add(new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 14).rotateZ(Math.PI / 2), steel));
    const lv = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.12), steel); lv.position.set(0.035, 0, 0.05); lever.add(lv);
    const lv2 = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.04, 8).rotateZ(Math.PI / 2), steel); lv2.position.set(0.02, 0, 0); lever.add(lv2);
    this.doorHinge = hinge;
    // daylight round the closed door: warm light in the gaps and a line under it, spilling on the floor
    const leakM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.86, 0.62).multiplyScalar(3.2), toneMapped: false, fog: false, name: 'leak' });
    const leakP = new THREE.Mesh(new THREE.PlaneGeometry(dz1 - dz0 + 0.02, dh + 0.02), leakM); leakP.position.set(R.x0 - 0.12, y0 + dh / 2, R.doorZ); leakP.rotation.y = Math.PI / 2; g.add(leakP);
    const spillT = Tex.softDot();
    const spillM = new THREE.MeshBasicMaterial({ map: spillT, color: new THREE.Color(1.0, 0.8, 0.55), transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, name: 'spill' });
    const spill = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.6), spillM); spill.position.set(R.x0 + 0.42, y0 + 0.004, R.doorZ); spill.rotation.x = -Math.PI / 2; g.add(spill);
    this.leak = { panel: leakP, spill, mat: leakM };

    // ---- bed against the east wall (you sit on its west edge)
    const bx0 = 12.5, bx1 = R.x1 - 0.02, bz0 = 0.25, bz1 = 2.35, bed = std('#5b4a3c', { roughness: 0.7, name: 'bedFrame' });
    box(bx1 - bx0, 0.28, bz1 - bz0, (bx0 + bx1) / 2, y0 + 0.14, (bz0 + bz1) / 2, bed);
    box(bx1 - bx0 - 0.04, 0.16, bz1 - bz0 - 0.04, (bx0 + bx1) / 2, y0 + 0.36, (bz0 + bz1) / 2, std('#e8e4dc', { roughness: 0.9 }));
    // duvet: soft rumpled slab hanging over the edge
    const duv = new THREE.BoxGeometry(bx1 - bx0 + 0.08, 0.1, bz1 - bz0 - 0.4, 10, 2, 16), dp2 = duv.attributes.position;
    for (let i = 0; i < dp2.count; i++) { const x = dp2.getX(i), z = dp2.getZ(i); dp2.setY(i, dp2.getY(i) + 0.035 * Math.sin(x * 9 + z * 4) * Math.cos(z * 7) + (x < -(bx1 - bx0) / 2 + 0.02 ? -0.12 : 0)); }
    duv.computeVertexNormals();
    add(duv, std('#38506a', { roughness: 0.95, name: 'duvet' }), (bx0 + bx1) / 2 - 0.02, y0 + 0.49, (bz0 + bz1) / 2 + 0.18);
    const pil = new THREE.SphereGeometry(0.3, 12, 8); pil.scale(1.2, 0.3, 0.75);
    add(pil, std('#e9e5dc', { roughness: 0.95 }), (bx0 + bx1) / 2 + 0.05, y0 + 0.56, bz0 + 0.3);
    box(bx1 - bx0 + 0.04, 0.9, 0.05, (bx0 + bx1) / 2, y0 + 0.45, bz0 - 0.02, bed);
    // ---- desk with the lamp under the curtained window (north wall)
    const desk = std('#d8d2c6', { roughness: 0.6, name: 'desk' });
    box(1.3, 0.04, 0.6, 11.2, y0 + 0.74, R.z0 + 0.32, desk);
    for (const [x, z] of [[10.6, R.z0 + 0.06], [11.8, R.z0 + 0.06], [10.6, R.z0 + 0.58], [11.8, R.z0 + 0.58]]) box(0.04, 0.72, 0.04, x, y0 + 0.36, z, desk);
    box(0.36, 0.022, 0.25, 11.35, y0 + 0.77, R.z0 + 0.34, std('#3a3d42', { roughness: 0.35, metalness: 0.6, name: 'laptopShell' }));   // a closed laptop
    for (let i = 0; i < 4; i++) box(0.03 + i * 0.004, 0.22, 0.16, 10.62 + i * 0.04, y0 + 0.87, R.z0 + 0.2, std(['#7a3b32', '#2e4a5a', '#c9a24a', '#3e5a3a'][i], { roughness: 0.8 }));
    // desk lamp (warm)
    const lampM = std('#2a2c2e', { roughness: 0.4, metalness: 0.5 });
    add(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 16), lampM, 11.75, y0 + 0.77, R.z0 + 0.3);
    add(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 6), lampM, 11.75, y0 + 0.95, R.z0 + 0.3, 0, 0, 0.25);
    add(new THREE.ConeGeometry(0.09, 0.13, 16, 1, true), lampM, 11.71, y0 + 1.12, R.z0 + 0.3, 0, 0, 0.5);
    const bulb = add(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.78, 0.5).multiplyScalar(4), toneMapped: false }), 11.69, y0 + 1.08, R.z0 + 0.3, 0, 0, 0, false);
    this.bulbM = bulb.material;
    this.lamp = new THREE.PointLight('#ffb070', 3.2, 7, 1.6); this.lamp.position.set(11.66, y0 + 1.04, R.z0 + 0.33); g.add(this.lamp);
    // window with drawn curtains, dusk blue glowing through
    const winM = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.32, 0.42, 0.62), name: 'duskWindow' });
    add(new THREE.PlaneGeometry(1.2, 1.25), winM, 11.2, y0 + 1.55, R.z0 + 0.012, 0, 0, 0, false);
    this.winM = winM;
    const curM = std('#3c4a5e', { roughness: 0.95, emissive: '#16233a', side: THREE.DoubleSide, name: 'curtains' });
    this.curM = curM;
    // at night (phase E): light from outside glows through the curtains, and children's shadows run across them
    this.curtainCv = Tex.canvas(320, 320); this.curtainTex = Tex.tex(this.curtainCv, { repeat: false });
    this.curtainGlow = add(new THREE.PlaneGeometry(1.5, 1.6), new THREE.MeshBasicMaterial({ map: this.curtainTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, name: 'curtainGlow' }), 11.2, y0 + 1.5, R.z0 + 0.11, 0, 0, 0, false);
    this.curtainGlow.renderOrder = 4;
    for (const s of [-1, 1]) {
      const cg = new THREE.PlaneGeometry(0.72, 1.6, 8, 1), cp = cg.attributes.position;
      for (let i = 0; i < cp.count; i++) cp.setZ(i, 0.03 * Math.sin(cp.getX(i) * 26));
      cg.computeVertexNormals();
      add(cg, curM, 11.2 + s * 0.38, y0 + 1.5, R.z0 + 0.07, 0, 0, 0, false);
    }
    box(1.7, 0.03, 0.03, 11.2, y0 + 2.33, R.z0 + 0.08, lampM);
    this.dusk = new THREE.PointLight('#6f8ec4', 0.9, 6, 1.5); this.dusk.position.set(11.2, y0 + 1.6, R.z0 + 0.6); g.add(this.dusk);
    // chair with a hoodie draped over it
    box(0.44, 0.04, 0.44, 11.1, y0 + 0.46, R.z0 + 0.85, std('#2e3236', { roughness: 0.6 }));
    box(0.44, 0.5, 0.04, 11.1, y0 + 0.72, R.z0 + 1.06, std('#2e3236', { roughness: 0.6 }));
    for (const [x, z] of [[10.9, R.z0 + 0.65], [11.3, R.z0 + 0.65], [10.9, R.z0 + 1.05], [11.3, R.z0 + 1.05]]) box(0.03, 0.46, 0.03, x, y0 + 0.23, z, std('#2e3236'));
    const hood = new THREE.BoxGeometry(0.5, 0.42, 0.1, 6, 6, 1), hp = hood.attributes.position;
    for (let i = 0; i < hp.count; i++) hp.setZ(i, hp.getZ(i) + 0.03 * Math.sin(hp.getX(i) * 14) + 0.02 * Math.cos(hp.getY(i) * 11));
    hood.computeVertexNormals();
    add(hood, std('#8a3a34', { roughness: 0.95 }), 11.1, y0 + 0.82, R.z0 + 1.09);
    // ---- the TV on a low dresser by the door: dark, no standby light
    const dres = std('#e6e2da', { roughness: 0.6 });
    box(1.1, 0.5, 0.42, 10.55, y0 + 0.25, R.z1 - 0.23, dres);
    box(0.9, 0.52, 0.04, 10.55, y0 + 0.82, R.z1 - 0.2, std('#121416', { roughness: 0.15, metalness: 0.3, name: 'tvGlass' }));
    box(0.25, 0.04, 0.16, 10.55, y0 + 0.52, R.z1 - 0.22, std('#1a1c1e'));
    // shelf with bits and pieces on the south wall, a plant, posters
    box(1.0, 0.025, 0.22, 11.9, y0 + 1.55, R.z1 - 0.11, desk);
    for (let i = 0; i < 6; i++) box(0.05, r.range(0.14, 0.24), 0.15, 11.5 + i * 0.07, y0 + 1.66, R.z1 - 0.12, std(['#a83a2a', '#2a5a8a', '#e0c050', '#3a3a3a', '#5a8a5a', '#c87a4a'][i], { roughness: 0.8 }));
    add(new THREE.CylinderGeometry(0.06, 0.05, 0.12, 10), std('#c8b8a0'), 12.25, y0 + 1.62, R.z1 - 0.12);
    add(new THREE.IcosahedronGeometry(0.12, 0), std('#4a7a3a', { flatShading: true }), 12.25, y0 + 1.76, R.z1 - 0.12);
    const poster = (w, h, x, y, z, ry, seed) => {
      const cv = Tex.canvas(256, 360), c = cv.getContext('2d'), q = new RNG(seed);
      const bg = c.createLinearGradient(0, 0, 0, 360); bg.addColorStop(0, q.pick(['#2a3a5a', '#5a2a3a', '#1e4a4a'])); bg.addColorStop(1, q.pick(['#e09a4a', '#d8c070', '#7ab0c0']));
      c.fillStyle = bg; c.fillRect(0, 0, 256, 360);
      for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(255,255,255,${q.range(0.08, 0.3)})`; c.beginPath(); c.arc(q.range(20, 236), q.range(40, 300), q.range(10, 60), 0, Math.PI * 2); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(30, 310, 196, 10); c.fillRect(60, 330, 136, 6);
      add(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: Tex.tex(cv, { repeat: false }), roughness: 0.6 }), x, y, z, 0, ry, 0, false);
    };
    poster(0.5, 0.7, R.x0 + 0.01, y0 + 1.55, 0.05, Math.PI / 2, 3);
    poster(0.42, 0.6, 12.95, y0 + 1.45, R.z1 - 0.01, Math.PI, 8);
    // rug and sneakers
    const rug = Tex.canvas(256, 256), rg = rug.getContext('2d');
    rg.fillStyle = '#9c8f7e'; rg.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2500; i++) { rg.fillStyle = `rgba(${r.chance(0.5) ? '70,60,50' : '200,190,175'},${r.range(0.05, 0.15)})`; rg.fillRect(r.range(0, 256), r.range(0, 256), 2, 2); }
    rg.strokeStyle = 'rgba(70,60,52,0.5)'; rg.lineWidth = 6; rg.beginPath(); rg.arc(128, 128, 118, 0, Math.PI * 2); rg.stroke();
    add(new THREE.CircleGeometry(0.85, 32), new THREE.MeshStandardMaterial({ map: Tex.tex(rug, { repeat: false }), roughness: 0.98 }), 11.6, y0 + 0.006, 1.45, -Math.PI / 2, 0, 0, false);
    const shoeG = loftZ([[-0.13, 0.045, 0.035, 0.035], [0.0, 0.05, 0.045, 0.04], [0.1, 0.045, 0.03, 0.03], [0.14, 0.03, 0.02, 0.02]], 8);
    const sneaker = std('#e8e8e6', { roughness: 0.6 }), soleM = std('#c94a3a', { roughness: 0.7 });
    for (const [x, z, a] of [[11.95, 1.15, 2.2], [11.85, 1.38, 1.7]]) { add(shoeG, sneaker, x, y0 + 0.04, z, 0, a, 0); add(new THREE.BoxGeometry(0.1, 0.02, 0.27), soleM, x, y0 + 0.01, z, 0, a, 0); }
    // a backpack slumped by the desk
    add(loftGeo([[-0.2, 0.15, 0.08], [0.15, 0.16, 0.09], [0.22, 0.12, 0.07]], 8), std('#2a4a6a', { roughness: 0.9 }), 12.1, y0 + 0.2, R.z0 + 0.3, 0.2, 0.4, 0);

    // ---- your own legs while you sit on the bed (grey joggers, white socks)
    const legs = new THREE.Group(); g.add(legs);
    const jog = std('#4a4f58', { roughness: 0.95, name: 'joggers' }), sock = std('#e6e4de', { roughness: 0.95 });
    const seatY = y0 + 0.45;
    for (const s of [-1, 1]) {
      const z = BS.seat.z + s * 0.1;
      const thigh = new THREE.Mesh(smoothLoft([[0, 0.075, 0.07], [0.22, 0.068, 0.062], [0.4, 0.058, 0.055]], 10), jog);
      thigh.position.set(12.6, seatY + 0.07, z); thigh.rotation.z = Math.PI / 2 + 0.08; legs.add(thigh);
      const shin = new THREE.Mesh(smoothLoft([[0, 0.055, 0.052], [0.2, 0.05, 0.047], [0.4, 0.042, 0.04]], 10), jog);
      shin.position.set(12.2, seatY + 0.04, z); shin.rotation.z = Math.PI - 0.2; legs.add(shin);
      const foot = new THREE.Mesh(loftZ([[-0.05, 0.04, 0.03, 0.03], [0.08, 0.045, 0.025, 0.025], [0.15, 0.035, 0.018, 0.018]], 8), sock);
      foot.position.set(12.11, y0 + 0.035, z); foot.rotation.y = -Math.PI / 2; legs.add(foot);
    }
    legs.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    this.legs = legs;

    // ---- the phone, held in the right hand; at the end it also lies on the bed (charging, lighting up)
    this._phone(hands);
    this._bedPhone();
  }

  _bedPhone() {
    const bp = new THREE.Group();
    bp.add(new THREE.Mesh(this.phone.children[0].geometry, this.phone.children[0].material));
    this.bedScreen = new THREE.Mesh(this.screen.geometry, this.screenOn); this.bedScreen.position.z = 0.0044; bp.add(this.bedScreen);
    this.bedGlow = new THREE.PointLight('#cfe0ff', 0, 1.1, 1.5); this.bedGlow.position.set(0, 0, 0.1); bp.add(this.bedGlow);
    bp.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    this.bedPhoneSpot = new THREE.Vector3(12.72, BS.room.y + 0.535, 0.95);
    bp.position.copy(this.bedPhoneSpot);
    bp.rotation.set(-Math.PI / 2, 0, 0.5);
    bp.visible = false;
    this.root.add(bp);
    this.bedPhone = bp;
  }

  // lock screen at night: big clock, charging, a growing stack of (generic, logo-free) notifications
  _drawNotif(t) {
    const c = this.screenCv.getContext('2d'), W = 270, H = 576;
    const bg = c.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#1d2a4a'); bg.addColorStop(1, '#3a2048');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    const gl = c.createRadialGradient(200, 120, 10, 200, 120, 220); gl.addColorStop(0, 'rgba(120,90,200,0.45)'); gl.addColorStop(1, 'rgba(120,90,200,0)'); c.fillStyle = gl; c.fillRect(0, 0, W, H);
    c.textBaseline = 'middle';
    // status bar: signal, battery full and charging
    c.fillStyle = '#f2f2f2'; for (let j = 0; j < 4; j++) c.fillRect(160 + j * 7, 30 - j * 4, 4, 4 + j * 4);
    c.strokeStyle = '#f2f2f2'; c.lineWidth = 2; c.strokeRect(200, 16, 36, 16); c.fillRect(237, 21, 3, 6);
    c.fillStyle = '#4cd964'; c.fillRect(202, 18, 32, 12);
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(220, 17); c.lineTo(212, 25); c.lineTo(218, 25); c.lineTo(215, 31); c.lineTo(224, 22); c.lineTo(218, 22); c.fill();
    // the time
    c.textAlign = 'center'; c.fillStyle = '#ffffff'; c.font = '600 66px Inter, Arial, sans-serif'; c.fillText('10:24', W / 2, 112);
    c.font = '500 16px Inter, Arial, sans-serif'; c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillText('Friday, 14 June', W / 2, 158);
    // the stack: a new one slides in with each buzz; a thumb flick scrolls through the rest
    const count = t < 80.42 ? 45 : t < 80.72 ? 46 : 47;
    const items = [['#34c759', 'Group chat', '12 new messages'], ['#ff3b30', 'Video app', 'Recommended for you'], ['#af52de', 'Game', 'Your energy is full! Come back'],
      ['#007aff', 'Messages', 'are you online??'], ['#ff9500', 'Shop', 'Flash sale ends tonight'], ['#5856d6', 'Streaming', 'New episode available'],
      ['#ff2d55', 'Photos', 'You have a new memory'], ['#30b0c7', 'News', '5 stories you missed'], ['#34c759', 'Group chat', '3 new messages'], ['#ffcc00', 'Game', 'Don’t lose your streak']];
    const scroll = MathX.smooth(t, 81.9, 82.2) * 150 + MathX.smooth(t, 82.35, 82.65) * 150;
    const slide = (k) => (k === 0 ? MathX.smooth(t, 80.72, 80.9) : 1);
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.roundRect(70, 186 - scroll, 130, 26, 13); c.fill();
    c.fillStyle = '#ffffff'; c.font = '600 13px Inter, Arial, sans-serif'; c.fillText(`${count} notifications`, W / 2, 199.5 - scroll);
    c.textAlign = 'left';
    items.forEach(([col, app, msg], k) => {
      const y = 224 + k * 70 - scroll - (1 - slide(k)) * 60;
      if (y > H || y < -70) return;
      c.globalAlpha = slide(k);
      c.fillStyle = 'rgba(245,245,250,0.86)'; c.beginPath(); c.roundRect(12, y, 246, 62, 14); c.fill();
      c.fillStyle = col; c.beginPath(); c.roundRect(22, y + 13, 36, 36, 9); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(40, y + 31, 8, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1c1c1e'; c.font = '600 14px Inter, Arial, sans-serif'; c.fillText(app, 68, y + 22);
      c.fillStyle = '#3a3a3c'; c.font = '400 13px Inter, Arial, sans-serif'; c.fillText(msg, 68, y + 42);
      c.fillStyle = '#8e8e93'; c.font = '400 11px Inter, Arial, sans-serif'; c.fillText(k < 2 ? 'now' : `${k * 3}m ago`, 206, y + 22);
      c.globalAlpha = 1;
    });
    this.screenTex.needsUpdate = true;
  }

  // light through the curtains from outside, and children running past (three shadows, one with a hoop)
  _drawCurtain(t) {
    const c = this.curtainCv.getContext('2d'), W = 320, H = 320;
    c.globalCompositeOperation = 'source-over'; c.filter = 'none';
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(W * 0.62, H * 0.3, 10, W * 0.55, H * 0.45, W * 0.75);
    g.addColorStop(0, 'rgba(255,196,120,0.95)'); g.addColorStop(0.5, 'rgba(230,150,80,0.5)'); g.addColorStop(1, 'rgba(120,60,30,0.0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.filter = 'blur(3px)'; c.fillStyle = '#000'; c.strokeStyle = '#000'; c.lineCap = 'round';
    const kid = (x, base, h, ph, skirt, hoop) => {
      const sw = Math.sin(ph), head = h * 0.16;
      c.beginPath(); c.arc(x, base - h + head, head, 0, Math.PI * 2); c.fill();
      c.lineWidth = h * 0.16; c.beginPath(); c.moveTo(x, base - h + head * 2); c.lineTo(x + 2, base - h * 0.45); c.stroke();
      if (skirt) { c.beginPath(); c.moveTo(x - 2, base - h * 0.62); c.lineTo(x - h * 0.16, base - h * 0.32); c.lineTo(x + h * 0.18, base - h * 0.32); c.fill(); }
      c.lineWidth = h * 0.07;
      c.beginPath(); c.moveTo(x + 2, base - h * 0.45); c.lineTo(x + 2 + sw * h * 0.22, base); c.moveTo(x + 2, base - h * 0.45); c.lineTo(x + 2 - sw * h * 0.22, base); c.stroke();
      c.beginPath(); c.moveTo(x, base - h * 0.74); c.lineTo(x - sw * h * 0.2, base - h * 0.5); c.moveTo(x, base - h * 0.74); c.lineTo(x + sw * h * 0.2, base - h * 0.48); c.stroke();
      if (hoop) { c.lineWidth = 3; c.beginPath(); c.arc(x + h * 0.42, base - h * 0.22, h * 0.22, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.moveTo(x + sw * h * 0.2, base - h * 0.48); c.lineTo(x + h * 0.36, base - h * 0.3); c.stroke(); }
    };
    // they run left to right across the window (as seen from inside)
    [[82.55, 150, false, true], [82.95, 134, true, false], [83.35, 142, false, false]].forEach(([t0, h, skirt, hoop], i) => {
      const u = (t - t0) / 1.25;
      if (u < -0.1 || u > 1.1) return;
      kid(-60 + u * (W + 120), H - 18 - i * 4, h, (t - t0) * 15 + i, skirt, hoop);
    });
    c.filter = 'none';
    this.curtainTex.needsUpdate = true;
  }

  _phone(hands) {
    const ph = new THREE.Group();
    const body = new THREE.Mesh(new THREE.RoundedBoxGeometry(0.072, 0.152, 0.0085, 3, 0.008), new THREE.MeshStandardMaterial({ color: '#4a4e56', roughness: 0.4, metalness: 0.3, name: 'phoneBody' }));
    ph.add(body);
    this.screenCv = Tex.canvas(270, 576);
    this.screenTex = Tex.tex(this.screenCv, { repeat: false });
    this.screenOn = new THREE.MeshBasicMaterial({ map: this.screenTex, toneMapped: true, name: 'phoneScreen' });
    // dead screen: black glass with the lamp's reflection smeared across it
    const ref = Tex.canvas(128, 256), rc = ref.getContext('2d');
    rc.fillStyle = '#050607'; rc.fillRect(0, 0, 128, 256);
    const gr = rc.createRadialGradient(92, 60, 2, 92, 60, 70); gr.addColorStop(0, 'rgba(255,190,120,0.55)'); gr.addColorStop(1, 'rgba(255,190,120,0)');
    rc.fillStyle = gr; rc.fillRect(0, 0, 128, 256);
    const lg = rc.createLinearGradient(0, 0, 128, 256); lg.addColorStop(0, 'rgba(120,150,200,0.0)'); lg.addColorStop(0.45, 'rgba(120,150,200,0.10)'); lg.addColorStop(0.55, 'rgba(120,150,200,0.0)');
    rc.fillStyle = lg; rc.fillRect(0, 0, 128, 256);
    this.screenOff = new THREE.MeshBasicMaterial({ map: Tex.tex(ref, { repeat: false }), name: 'phoneDead' });
    this.screen = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.1446), this.screenOn);
    this.screen.position.z = 0.0044;
    ph.add(this.screen);
    this.glow = new THREE.PointLight('#cfe0ff', 0.35, 0.9, 1.5); this.glow.position.set(0, 0, 0.12); ph.add(this.glow);
    // in the hand: long axis along the thumb direction (local X), screen facing the palm normal (local +Z)
    ph.position.set(0.034, 0.074, 0.024);
    ph.rotation.set(0, 0, -Math.PI / 2);
    ph.scale.setScalar(1 / hands.o.scale);
    hands.right.g.add(ph);
    this.phone = ph;
    this._feedImgs = [0, 1, 2, 3, 4].map((i) => this._thumb(i));
  }

  // generic, logo-free feed thumbnails (abstract scenes)
  _thumb(i) {
    const cv = Tex.canvas(250, 300), c = cv.getContext('2d'), q = new RNG(500 + i);
    const pal = [['#ff6a3d', '#3a1c71'], ['#12c2e9', '#f64f59'], ['#f7b733', '#fc4a1a'], ['#00b09b', '#96c93d'], ['#8e2de2', '#4a00e0']][i % 5];
    const g = c.createLinearGradient(0, 0, 250, 300); g.addColorStop(0, pal[0]); g.addColorStop(1, pal[1]);
    c.fillStyle = g; c.fillRect(0, 0, 250, 300);
    for (let k = 0; k < 7; k++) { c.fillStyle = `rgba(255,255,255,${q.range(0.1, 0.35)})`; c.beginPath(); c.arc(q.range(0, 250), q.range(0, 300), q.range(8, 50), 0, Math.PI * 2); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.moveTo(0, 300); c.lineTo(0, 210); c.quadraticCurveTo(125, 160 + q.range(-20, 20), 250, 220); c.lineTo(250, 300); c.fill();
    return cv;
  }

  _drawScreen(t) {
    const c = this.screenCv.getContext('2d'), W = 270, H = 576;
    const lowA = MathX.smooth(t, 1.45, 1.6), off = MathX.smooth(t, 1.95, 2.08);
    c.fillStyle = '#0d0e10'; c.fillRect(0, 0, W, H);
    // feed: cards scroll up with each swipe
    const scroll = MathX.smooth(t, 0.42, 0.72) * 330 + MathX.smooth(t, 1.02, 1.32) * 330;
    for (let k = 0; k < 4; k++) {
      const y = 60 + k * 330 - scroll;
      if (y > H || y < -330) continue;
      c.drawImage(this._feedImgs[k % 5], 10, y, 250, 300);
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(18, y + 262, 120, 7); c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(18, y + 276, 170, 6);
      // generic reaction icons
      c.fillStyle = 'rgba(255,255,255,0.92)';
      for (let j = 0; j < 3; j++) { c.beginPath(); c.arc(238, y + 150 + j * 42, 11, 0, Math.PI * 2); c.fill(); }
    }
    // status bar: time, signal, battery 1 % in red
    c.fillStyle = '#0d0e10'; c.fillRect(0, 0, W, 44);
    c.fillStyle = '#f2f2f2'; c.font = '600 20px Inter, Arial, sans-serif'; c.textBaseline = 'middle'; c.fillText('9:47', 20, 24);
    for (let j = 0; j < 4; j++) c.fillRect(160 + j * 7, 30 - j * 4, 4, 4 + j * 4);
    c.strokeStyle = '#f2f2f2'; c.lineWidth = 2; c.strokeRect(200, 16, 36, 16); c.fillRect(237, 21, 3, 6);
    c.fillStyle = (Math.floor(t * 2.5) % 2 === 0 || t > 1.45) ? '#ff3b30' : '#a02a24'; c.fillRect(202, 18, 3, 12);
    c.fillStyle = '#ff3b30'; c.font = '700 13px Inter, Arial, sans-serif'; c.fillText('1%', 210, 24.5);
    // low-battery card
    if (lowA > 0) {
      c.fillStyle = `rgba(0,0,0,${0.55 * lowA})`; c.fillRect(0, 0, W, H);
      c.globalAlpha = lowA;
      c.fillStyle = '#26282c'; c.beginPath(); c.roundRect(30, 210, 210, 150, 16); c.fill();
      c.fillStyle = '#ffffff'; c.font = '700 19px Inter, Arial, sans-serif'; c.textAlign = 'center'; c.fillText('Low Battery', 135, 246);
      c.fillStyle = '#c8c8cc'; c.font = '400 14px Inter, Arial, sans-serif'; c.fillText('1% battery remaining', 135, 274);
      c.fillStyle = '#3a3c42'; c.fillRect(30, 300, 210, 1);
      c.fillStyle = '#4a9eff'; c.font = '600 16px Inter, Arial, sans-serif'; c.fillText('OK', 135, 330);
      c.textAlign = 'left'; c.globalAlpha = 1;
    }
    if (off > 0) { c.fillStyle = `rgba(0,0,0,${off})`; c.fillRect(0, 0, W, H); }
    this.screenTex.needsUpdate = true;
  }

  update(t, visible = true) {
    this.root.visible = visible;
    if (!visible) { this.phone.visible = false; return; }
    const S = SCRIPT_TRACKS, E = t >= PARLOUR.t1;
    const leak = S.leak.value(t);
    // door
    const open = S.door.value(t);
    this.doorHinge.rotation.y = open * MathX.deg(100);      // swings outward, away from you
    this.leak.mat.color.setRGB(1.0, 0.86, 0.62).multiplyScalar(3.2 * leak + 0.01);
    this.leak.spill.material.opacity = 0.32 * leak;
    this.legs.visible = false;   // (the lap reads as dark blobs at this angle; the phone is held up instead)
    if (!E) {
      // phone: live screen until it dies, then dead glass
      const dead = t >= 2.08;
      this.screen.material = dead ? this.screenOff : this.screenOn;
      if (!dead) this._drawScreen(t);
      this.glow.intensity = 0.16 * S.phoneLight.value(t);
      this.phone.visible = t < 4.3;
      this.bedPhone.visible = false; this.bedGlow.intensity = 0; this.curtainGlow.material.opacity = 0;
      this.lamp.intensity = 3.2; this.dusk.intensity = 0.9;
      // (restore the evening look, in case we scrubbed back from the end)
      this.bulbM.color.setRGB(1.0, 0.78, 0.5).multiplyScalar(4); this.winM.color.setRGB(0.32, 0.42, 0.62); this.curM.emissive.set('#16233a');
      this.leak.panel.position.x = BS.room.x0 - 0.12; this.leak.panel.scale.set(1, 1, 1);
      return;
    }
    // ---- the end: the same room at night, lamp off; the phone lights up on the bed
    this.lamp.intensity = 0; this.bulbM.color.setRGB(0.12, 0.1, 0.08);
    this.dusk.intensity = 0.9; this.winM.color.setRGB(0.12, 0.16, 0.27); this.curM.emissive.set('#0c1424');
    const grab = 81.38, down = 85.7;
    const held = t >= grab && t < down;
    this.phone.visible = held;
    this.bedPhone.visible = !held;
    this.screen.material = this.screenOn;
    if (t < down) this._drawNotif(t);
    this.glow.intensity = held ? 0.2 : 0;
    // on the bed: buzzing as the notifications land, then (later) face-down, dark
    const buzz = (t >= 80.42 && t < 80.62) || (t >= 80.72 && t < 80.92);
    const faceDown = t >= down;
    this.bedPhone.position.copy(this.bedPhoneSpot);
    if (buzz) this.bedPhone.position.add(this._v.set(noise1(t * 90, 1) * 0.0025, 0, noise1(t * 90, 2) * 0.0025));
    this.bedPhone.rotation.set(faceDown ? Math.PI / 2 : -Math.PI / 2, 0, faceDown ? -0.35 : 0.5 + (buzz ? 0.02 * noise1(t * 80, 3) : 0));
    if (faceDown) this.bedPhone.position.y += 0.004;
    this.bedScreen.visible = !faceDown;
    this.bedGlow.intensity = !held && !faceDown ? 0.28 : 0;
    // the kids running past outside, as shadows on the backlit curtain
    const cg = MathX.smooth(t, 82.2, 82.6) * (1 - MathX.smooth(t, 84.6, 85.2));
    this.curtainGlow.material.opacity = 0.85 * cg;
    if (cg > 0.001) this._drawCurtain(t);
    // the doorway: when it opens there is only light beyond it
    this.leak.panel.position.x = BS.room.x0 - 1.0; this.leak.panel.scale.set(3.2, 1.4, 1);
  }
}
