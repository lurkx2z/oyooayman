/* =====================================================================
   APARTMENT — an ordinary flat at night, built once:
   the living room (couch, armchair, beanbag, coffee table, TV, floor lamp,
   fairy lights, bookshelf, plants, a window onto the city), the hallway
   and the bathroom (sink, counter, the mirror). Warm, lived-in, normal —
   nothing here is meant to look scary; the strangeness is all perception.
   Also: your own legs while you sit on the couch.
   ===================================================================== */

class Apartment {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group(); this.root.name = 'apartment'; scene.add(this.root);
    this.r = new RNG(77);
  }

  build() {
    const g = this.root, r = this.r, L = APT.living, H = APT.hall, B = APT.bath;
    const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o));
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, shadow = true, parent = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m; };
    const box = (w, h, d, x, y, z, mat, ry = 0, shadow = true) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, 0, ry, 0, shadow);
    const rbox = (w, h, d, rad, x, y, z, mat, ry = 0) => add(new THREE.RoundedBoxGeometry(w, h, d, 3, rad), mat, x, y, z, 0, ry, 0);
    this.std = std; this.add = add; this.box = box;

    // ---- materials
    const fl = Tex.canvas(512, 512), f = fl.getContext('2d');
    for (let i = 0; i < 8; i++) for (let k = 0; k < 3; k++) { const v = r.range(-10, 10), off = (i % 2) * 170; f.fillStyle = `rgb(${176 + v},${140 + v * 0.8},${102 + v * 0.6})`; f.fillRect(k * 256 - off, i * 64, 254, 62); }
    for (let i = 0; i < 1800; i++) { f.fillStyle = `rgba(100,70,40,${r.range(0.03, 0.08)})`; f.fillRect(r.range(0, 512), r.range(0, 512), r.range(8, 46), 1); }
    const floorT = Tex.tex(fl); floorT.repeat.set(3, 3);
    const floorM = std('#ffffff', { map: floorT, roughness: 0.55, name: 'floor' });
    const wallCv = Tex.canvas(256, 256), wc = wallCv.getContext('2d'); wc.fillStyle = '#ddd6cb'; wc.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2500; i++) { wc.fillStyle = `rgba(${r.chance(0.5) ? '120,110,100' : '255,250,240'},${r.range(0.02, 0.05)})`; wc.fillRect(r.range(0, 256), r.range(0, 256), 2, 2); }
    const wallT = Tex.tex(wallCv); wallT.repeat.set(3, 2);
    const wallM = std('#ffffff', { map: wallT, roughness: 0.92, name: 'wall' });
    const ceilM = std('#e8e4dc', { roughness: 0.95 }), trim = std('#efebe4', { roughness: 0.7 });
    const wood = std('#8a6a4c', { roughness: 0.6, name: 'wood' }), darkWood = std('#4a3628', { roughness: 0.55 }), metal = std('#2a2c30', { roughness: 0.4, metalness: 0.6 });

    // ---- shells: floor, ceiling, walls (inward), skirting
    const room = (x0, x1, z0, z1, h, holes = {}) => {
      const W = x1 - x0, D = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      add(new THREE.PlaneGeometry(W, D), floorM, cx, 0, cz, -Math.PI / 2, 0, 0, false);
      add(new THREE.PlaneGeometry(W, D), ceilM, cx, h, cz, Math.PI / 2, 0, 0, false);
      // a wall with optional door openings [[a0, a1, top]] measured along the wall
      const wall = (len, px, pz, ry, along, openings = []) => {
        let a = 0;
        const segs = [...openings].sort((p, q) => p[0] - q[0]);
        for (const [o0, o1, top] of segs) {
          if (o0 > a) seg(a, o0, 0, h);
          seg(o0, o1, top, h);
          a = o1;
        }
        if (a < len) seg(a, len, 0, h);
        function seg(s0, s1, y0, y1) {
          const w = s1 - s0, mid = (s0 + s1) / 2 - len / 2, m = add(new THREE.PlaneGeometry(w, y1 - y0), wallM, px + along[0] * mid, (y0 + y1) / 2, pz + along[1] * mid, 0, ry, 0, false);
          m.material = wallM;
          if (y0 === 0) { const sk = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 0.012), trim); sk.position.copy(m.position).setY(0.04); sk.rotation.y = ry; sk.position.x += Math.sin(ry) * 0.006; sk.position.z += Math.cos(ry) * 0.006; g.add(sk); }
        }
      };
      wall(W, cx, z0, 0, [1, 0], holes.n || []);                 // north wall faces +z
      wall(W, cx, z1, Math.PI, [-1, 0], holes.s || []);          // south wall faces −z
      wall(D, x0, cz, Math.PI / 2, [0, -1], holes.w || []);      // west wall faces +x  (along: from z1 to z0)
      wall(D, x1, cz, -Math.PI / 2, [0, 1], holes.e || []);      // east wall faces −x
    };
    // openings: the doorway living → hall (west wall of the living room), hall → bathroom (west end of the hall)
    const Lz = (z) => L.z1 - z;        // living west wall runs z1 → z0
    room(L.x0, L.x1, L.z0, L.z1, L.h, { w: [[Lz(APT.door.z1), Lz(APT.door.z0), 2.05]], e: [] });
    room(H.x0, H.x1, H.z0, H.z1, 2.5, { e: [[APT.door.z0 - H.z0, APT.door.z1 - H.z0, 2.05]], w: [[H.z1 - APT.door.z1, H.z1 - APT.door.z0, 2.05]] });
    room(B.x0, B.x1, B.z0, B.z1, 2.45, { e: [[APT.door.z0 - B.z0, APT.door.z1 - B.z0, 2.05]] });
    // door casings
    for (const x of [L.x0, H.x0]) for (const z of [APT.door.z0 - 0.03, APT.door.z1 + 0.03]) box(0.14, 2.08, 0.05, x, 1.04, z, trim, 0, false);
    for (const x of [L.x0, H.x0]) box(0.14, 0.06, APT.door.z1 - APT.door.z0 + 0.12, x, 2.08, (APT.door.z0 + APT.door.z1) / 2, trim, 0, false);
    // the window (east wall of the living room): the city at night, curtains half drawn
    const city = Tex.canvas(512, 384), cc = city.getContext('2d');
    const sky = cc.createLinearGradient(0, 0, 0, 384); sky.addColorStop(0, '#0b1020'); sky.addColorStop(0.7, '#1c2238'); sky.addColorStop(1, '#2c2a3a'); cc.fillStyle = sky; cc.fillRect(0, 0, 512, 384);
    for (let b = 0; b < 26; b++) {
      const bx = r.range(-20, 500), bw = r.range(24, 70), bh = r.range(60, 260), by = 384 - bh;
      cc.fillStyle = `rgb(${r.range(14, 26)},${r.range(16, 28)},${r.range(26, 40)})`; cc.fillRect(bx, by, bw, bh);
      for (let wy = by + 8; wy < 380; wy += 12) for (let wx = bx + 5; wx < bx + bw - 6; wx += 10) if (r.chance(0.32)) { cc.fillStyle = r.chance(0.7) ? 'rgba(255,200,130,0.85)' : 'rgba(170,200,255,0.7)'; cc.fillRect(wx, wy, 5, 6); }
    }
    for (let i = 0; i < 40; i++) { cc.fillStyle = 'rgba(255,170,90,0.5)'; cc.beginPath(); cc.arc(r.range(0, 512), r.range(330, 384), r.range(1, 3), 0, Math.PI * 2); cc.fill(); }
    add(new THREE.PlaneGeometry(1.7, 1.35), new THREE.MeshBasicMaterial({ map: Tex.tex(city, { repeat: false }), name: 'cityWindow' }), L.x1 - 0.01, 1.55, -0.2, 0, -Math.PI / 2, 0, false);
    const sash = std('#efebe4', { roughness: 0.6 });
    for (const dz of [-0.85, 0, 0.85]) box(0.05, 1.4, 0.05, L.x1 - 0.03, 1.55, -0.2 + dz, sash, 0, false);
    for (const dy of [-0.68, 0.68]) box(0.05, 0.05, 1.75, L.x1 - 0.03, 1.55 + dy, -0.2, sash, 0, false);
    box(0.14, 0.04, 1.8, L.x1 - 0.07, 0.86, -0.2, sash, 0, false);
    const curM = std('#c9bfae', { roughness: 0.95, side: THREE.DoubleSide, name: 'curtain' });
    for (const [dz, w] of [[-1.05, 0.55], [0.75, 0.45]]) { const cg = new THREE.PlaneGeometry(w, 2.3, 10, 1), cp = cg.attributes.position; for (let i = 0; i < cp.count; i++) cp.setZ(i, 0.035 * Math.sin(cp.getX(i) * 28)); cg.computeVertexNormals(); add(cg, curM, L.x1 - 0.1, 1.3, -0.2 + dz, 0, -Math.PI / 2, 0, false); }
    box(0.03, 0.03, 2.6, L.x1 - 0.1, 2.46, -0.2, metal, 0, false);

    // ---- couch (you), against the south wall
    const fab = std('#55636a', { roughness: 0.95, name: 'couch' }), fab2 = std('#4c5960', { roughness: 0.95 });
    rbox(2.5, 0.3, 0.92, 0.05, 0.3, 0.2, 2.1, fab2);
    for (const x of [-0.32, 0.92]) rbox(1.2, 0.16, 0.8, 0.06, x, 0.42, 2.06, fab);
    rbox(2.5, 0.5, 0.24, 0.08, 0.3, 0.62, 2.48, fab2);
    for (const x of [-0.32, 0.92]) rbox(1.15, 0.42, 0.2, 0.08, x, 0.68, 2.3, fab).rotation.x = -0.12;
    for (const x of [-0.98, 1.58]) rbox(0.22, 0.55, 0.92, 0.08, x, 0.4, 2.1, fab2);
    rbox(0.42, 0.38, 0.14, 0.06, -0.62, 0.68, 2.22, std('#b58a5a', { roughness: 0.95 })).rotation.set(-0.2, 0.25, 0.08);   // a cushion
    const throwB = std('#7a3e36', { roughness: 0.98 }); rbox(0.6, 0.04, 0.85, 0.02, -0.75, 0.52, 2.05, throwB).rotation.z = 0.05;
    // ---- armchair (Jay)
    const tan = std('#8a5a3c', { roughness: 0.6, name: 'leather' }), J = APT.jay;
    const chair = new THREE.Group(); chair.position.set(J.x, 0, J.z); chair.rotation.y = Math.PI + MathX.deg(-138); g.add(chair);
    const cAdd = (geo, mat, x, y, z) => add(geo, mat, x, y, z, 0, 0, 0, true, chair);
    cAdd(new THREE.RoundedBoxGeometry(0.82, 0.22, 0.8, 3, 0.05), tan, 0, 0.32, -0.02);
    cAdd(new THREE.RoundedBoxGeometry(0.84, 0.2, 0.84, 3, 0.04), std('#5a3a26'), 0, 0.14, -0.02);
    cAdd(new THREE.RoundedBoxGeometry(0.84, 0.62, 0.18, 3, 0.07), tan, 0, 0.68, -0.38).rotation.x = -0.16;
    for (const s of [-1, 1]) cAdd(new THREE.RoundedBoxGeometry(0.14, 0.3, 0.78, 3, 0.05), tan, s * 0.42, 0.5, -0.02);
    for (const [x, z] of [[-0.36, -0.36], [0.36, -0.36], [-0.36, 0.32], [0.36, 0.32]]) cAdd(new THREE.CylinderGeometry(0.018, 0.014, 0.06, 6), metal, x, 0.03, z);
    // ---- beanbag (Mia)
    const bb = new THREE.SphereGeometry(0.42, 20, 14), bp = bb.attributes.position;
    for (let i = 0; i < bp.count; i++) { const y = bp.getY(i); bp.setY(i, y < 0 ? y * 0.55 : y * 0.75 - 0.08 * Math.max(0, 1 - Math.hypot(bp.getX(i), bp.getZ(i) + 0.12) / 0.3)); bp.setX(i, bp.getX(i) * (1 + 0.1 * (y < 0 ? 1 : 0))); }
    bb.computeVertexNormals();
    add(bb, std('#3f5a4c', { roughness: 0.9, name: 'beanbag' }), APT.mia.x + 0.12, 0.24, APT.mia.z + 0.16, 0, MathX.deg(37), 0);
    // ---- coffee table with the evening on it (cans, snacks, a remote; a grinder and lighter — implied, never featured)
    const T = { x: 0.3, z: 0.85 };
    box(1.15, 0.04, 0.6, T.x, 0.42, T.z, wood);
    box(1.05, 0.02, 0.5, T.x, 0.16, T.z, wood);
    for (const [dx, dz] of [[-0.53, -0.26], [0.53, -0.26], [-0.53, 0.26], [0.53, 0.26]]) box(0.03, 0.42, 0.03, T.x + dx, 0.21, T.z + dz, metal);
    const can = new THREE.CylinderGeometry(0.033, 0.033, 0.12, 14);
    for (const [dx, dz, c, tip] of [[-0.3, 0.12, '#c94a3a', 0], [-0.18, -0.1, '#3a7ac9', 0], [0.42, 0.18, '#e0c040', 1.55]]) { const m = add(can, std(c, { roughness: 0.35, metalness: 0.7, name: 'can' }), T.x + dx, 0.5 + (tip ? -0.04 : 0), T.z + dz, 0, 0, tip); }
    add(new THREE.SphereGeometry(0.09, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std('#b8a48a', { side: THREE.DoubleSide, roughness: 0.5 }), T.x + 0.05, 0.53, T.z - 0.05);   // snack bowl
    for (let i = 0; i < 14; i++) add(new THREE.IcosahedronGeometry(0.014, 0), std('#d8a040', { flatShading: true }), T.x + 0.05 + r.range(-0.05, 0.05), 0.5 + r.range(0, 0.02), T.z - 0.05 + r.range(-0.07, 0.07), r.range(0, 3), r.range(0, 3), 0, false);
    box(0.05, 0.02, 0.17, T.x + 0.3, 0.45, T.z - 0.12, std('#1c1d20', { roughness: 0.5 }), 0.4);
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.035, 14), std('#5a6068', { roughness: 0.3, metalness: 0.8 }), T.x - 0.42, 0.457, T.z - 0.18);
    box(0.022, 0.06, 0.012, T.x - 0.36, 0.45, T.z - 0.08, std('#2f6ac0', { roughness: 0.4 }), 1.2);
    // ---- the TV on a low media unit (north wall), a speaker, a console, a plant
    box(1.9, 0.48, 0.42, 0.3, 0.24, L.z0 + 0.22, darkWood);
    box(1.36, 0.8, 0.05, 0.3, 0.95, L.z0 + 0.12, std('#0c0d0f', { roughness: 0.3, name: 'tvBody' }));
    this.tvCv = Tex.canvas(256, 144); this.tvTex = Tex.tex(this.tvCv, { repeat: false });
    this.tvM = new THREE.MeshBasicMaterial({ map: this.tvTex, toneMapped: true, name: 'tvScreen' });
    add(new THREE.PlaneGeometry(1.3, 0.74), this.tvM, 0.3, 0.95, L.z0 + 0.148, 0, 0, 0, false);
    box(0.16, 0.26, 0.16, 1.1, 0.61, L.z0 + 0.22, std('#2a2a2c', { roughness: 0.8 }));        // speaker
    add(new THREE.CylinderGeometry(0.055, 0.055, 0.01, 16), std('#151517'), 1.1, 0.64, L.z0 + 0.305, Math.PI / 2, 0, 0, false);
    box(0.3, 0.06, 0.24, -0.4, 0.51, L.z0 + 0.22, std('#e8e8e6', { roughness: 0.4 }));        // console
    this._plant(-0.75, 0.48, L.z0 + 0.22, 0.32);
    this._plant(L.x1 - 0.35, 0, L.z1 - 0.4, 0.9);
    this._plant(L.x0 + 0.35, 0, L.z0 + 0.4, 0.75);
    // ---- bookshelf (west wall, north end), posters, fairy lights along the north wall
    box(0.32, 1.8, 1.0, L.x0 + 0.17, 0.9, -1.6, darkWood);
    for (let s = 0; s < 4; s++) for (let i = 0; i < 9; i++) if (r.chance(0.8)) box(0.2, r.range(0.18, 0.28), 0.06, L.x0 + 0.2, 0.25 + s * 0.42, -2.0 + i * 0.09, std(r.pick(['#6a3a2a', '#2a4a6a', '#c9a04a', '#3a5a3a', '#7a6a5a', '#a84a3a', '#d8d0c0']), { roughness: 0.8 }));
    const poster = (w, h, x, y, z, ry, seed) => {
      const cv = Tex.canvas(256, 340), c = cv.getContext('2d'), q = new RNG(seed);
      const bg = c.createLinearGradient(0, 0, 0, 340); bg.addColorStop(0, q.pick(['#e8b468', '#2a4a5a', '#d86a4a'])); bg.addColorStop(1, q.pick(['#3a2a4a', '#e8d8b8', '#1a3a3a'])); c.fillStyle = bg; c.fillRect(0, 0, 256, 340);
      c.fillStyle = 'rgba(255,255,255,0.75)'; c.beginPath(); c.arc(128, 150, 64, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(20,20,30,0.6)'; c.fillRect(0, 230, 256, 6);
      box(w + 0.04, h + 0.04, 0.025, x, y, z, std('#1a1a1c'), ry, false);
      add(new THREE.PlaneGeometry(w, h), std('#ffffff', { map: Tex.tex(cv, { repeat: false }), roughness: 0.6 }), x + Math.sin(ry) * 0.014, y, z + Math.cos(ry) * 0.014, 0, ry, 0, false);
    };
    poster(0.5, 0.68, -1.6, 1.6, L.z0 + 0.02, 0, 4);
    poster(0.6, 0.8, L.x0 + 0.02, 1.55, -0.1, Math.PI / 2, 9);
    poster(0.42, 0.56, 1.95, 1.62, L.z0 + 0.02, 0, 13);
    const wire = []; this.fairy = [];
    const fairyM = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.72, 0.4).multiplyScalar(2.4), toneMapped: false, name: 'fairy' });
    for (let i = 0; i <= 28; i++) {
      const u = i / 28, x = L.x0 + 0.4 + u * 5.2, y = 2.38 - 0.1 * Math.abs(Math.sin(u * Math.PI * 4));
      wire.push(new THREE.Vector3(x, y, L.z0 + 0.03));
      if (i % 1 === 0) { const b = add(new THREE.SphereGeometry(0.012, 6, 4), fairyM, x, y - 0.02, L.z0 + 0.04, 0, 0, 0, false); this.fairy.push(b); }
    }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wire), 80, 0.002, 3, false), std('#222'), 0, 0, 0, 0, 0, 0, false);
    // ---- rug
    const rug = Tex.canvas(512, 384), rg = rug.getContext('2d');
    rg.fillStyle = '#c9bca6'; rg.fillRect(0, 0, 512, 384);
    rg.strokeStyle = '#8a6a4a'; rg.lineWidth = 10; rg.strokeRect(24, 24, 464, 336);
    for (let i = 0; i < 9; i++) { rg.strokeStyle = i % 2 ? '#5a6a6a' : '#b8735a'; rg.lineWidth = 6; rg.beginPath(); rg.moveTo(40 + i * 54, 60); rg.lineTo(70 + i * 54, 192); rg.lineTo(40 + i * 54, 324); rg.stroke(); }
    for (let i = 0; i < 4000; i++) { rg.fillStyle = `rgba(${r.chance(0.5) ? '60,50,40' : '255,250,240'},${r.range(0.03, 0.08)})`; rg.fillRect(r.range(0, 512), r.range(0, 384), 2, 2); }
    add(new THREE.PlaneGeometry(2.8, 2.0), std('#ffffff', { map: Tex.tex(rug, { repeat: false }), roughness: 0.98, name: 'rug' }), 0.3, 0.006, 0.95, -Math.PI / 2, 0, 0, false);
    // ---- lamps: a floor lamp in the south-west corner, a small table lamp by the couch
    const lampM = std('#1e1f22', { roughness: 0.4, metalness: 0.6 }), shadeM = std('#efe4cc', { roughness: 0.9, emissive: '#ffcf96', emissiveIntensity: 0.55, side: THREE.DoubleSide, name: 'shade' });
    add(new THREE.CylinderGeometry(0.15, 0.17, 0.03, 18), lampM, -2.55, 0.015, 2.2);
    add(new THREE.CylinderGeometry(0.012, 0.012, 1.45, 8), lampM, -2.55, 0.74, 2.2);
    add(new THREE.CylinderGeometry(0.16, 0.24, 0.3, 20, 1, true), shadeM, -2.55, 1.55, 2.2, 0, 0, 0, false);
    box(0.36, 0.5, 0.36, 2.0, 0.25, 2.3, wood);
    add(new THREE.CylinderGeometry(0.06, 0.08, 0.22, 12), std('#c8b8a0', { roughness: 0.5 }), 2.0, 0.61, 2.3);
    add(new THREE.CylinderGeometry(0.1, 0.15, 0.17, 16, 1, true), shadeM, 2.0, 0.8, 2.3, 0, 0, 0, false);
    this.lampFloor = new THREE.SpotLight('#ffcf98', 0, 11, MathX.deg(62), 0.9, 1.4);
    this.lampFloor.position.set(-2.5, 1.62, 2.12); this.lampFloor.target.position.set(0.3, 0.4, 0.6);
    this.lampFloor.castShadow = true; this.lampFloor.shadow.mapSize.set(1024, 1024); this.lampFloor.shadow.bias = -0.0008; this.lampFloor.shadow.camera.near = 0.2;
    g.add(this.lampFloor, this.lampFloor.target);
    this.lampGlow = new THREE.PointLight('#ffcf98', 0, 5, 1.6); this.lampGlow.position.set(-2.55, 1.6, 2.2); g.add(this.lampGlow);
    this.lampSide = new THREE.PointLight('#ffd4a6', 0, 4.5, 1.6); this.lampSide.position.set(2.0, 0.85, 2.25); g.add(this.lampSide);
    // warm bounce off the ceiling and the walls (the room is lit by lamps, never black)
    this.bounce = new THREE.PointLight('#ffd8b0', 0, 7, 1.2); this.bounce.position.set(-0.6, 2.2, 1.2); g.add(this.bounce);
    this.tvLight = new THREE.PointLight('#a8c0ff', 0, 5, 1.5); this.tvLight.position.set(0.3, 0.95, L.z0 + 0.7); g.add(this.tvLight);
    this.cityLight = new THREE.PointLight('#7c8ec8', 0, 5, 1.4); this.cityLight.position.set(L.x1 - 0.6, 1.6, -0.2); g.add(this.cityLight);
    // ---- hallway: coats on hooks, a framed print, a small ceiling light
    box(0.03, 0.04, 0.8, H.x1 - 1.4, 1.65, H.z1 - 0.03, trim, Math.PI / 2, false);
    for (const [dx, c] of [[-0.25, '#3a4a3a'], [0.05, '#8a7a5a'], [0.3, '#2a2a30']]) { const cg = new THREE.CylinderGeometry(0.11, 0.16, 0.85, 8); add(cg, std(c, { roughness: 0.95 }), H.x1 - 1.4 + dx, 1.22, H.z1 - 0.12); }
    poster(0.45, 0.6, H.x0 + 1.2, 1.55, H.z0 + 0.02, 0, 21);
    this.hallLight = new THREE.PointLight('#fff0dc', 0, 4, 1.5); this.hallLight.position.set(-4.5, 2.35, 1.1); g.add(this.hallLight);
    add(new THREE.CylinderGeometry(0.14, 0.14, 0.05, 18), std('#f4f0e8', { emissive: '#fff2dc', emissiveIntensity: 0.8 }), -4.5, 2.47, 1.1, 0, 0, 0, false);
    // ---- bathroom: tiles, counter, sink, tap, the mirror frame (the mirror itself: Mirror), towel, cup
    const tile = Tex.canvas(256, 256), tc = tile.getContext('2d'); tc.fillStyle = '#c8ccc8'; tc.fillRect(0, 0, 256, 256);
    tc.fillStyle = '#e8ebe8'; for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) tc.fillRect(x * 64 + 2, y * 64 + 2, 60, 60);
    const tileT = Tex.tex(tile); tileT.repeat.set(4, 3);
    const tileM = std('#ffffff', { map: tileT, roughness: 0.35, name: 'tiles' });
    add(new THREE.PlaneGeometry(B.z1 - B.z0, 1.2), tileM, B.x0 + 0.005, 0.6, (B.z0 + B.z1) / 2, 0, Math.PI / 2, 0, false);
    box(0.55, 0.06, 1.2, B.x0 + 0.3, 0.86, 1.1, std('#e6e1d8', { roughness: 0.3 }));
    box(0.5, 0.8, 1.15, B.x0 + 0.28, 0.42, 1.1, std('#5a6a72', { roughness: 0.6 }));
    add(new THREE.CylinderGeometry(0.2, 0.15, 0.1, 20, 1, true), std('#f4f4f2', { roughness: 0.2, side: THREE.DoubleSide, name: 'sinkGlass' }), B.x0 + 0.3, 0.86, 1.1);
    add(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 8), std('#c9ccd0', { roughness: 0.2, metalness: 0.9 }), B.x0 + 0.08, 0.98, 1.1);
    add(new THREE.CylinderGeometry(0.01, 0.01, 0.12, 8), std('#c9ccd0', { roughness: 0.2, metalness: 0.9 }), B.x0 + 0.13, 1.07, 1.1, 0, 0, Math.PI / 2);
    add(new THREE.CylinderGeometry(0.035, 0.03, 0.1, 12), std('#7ab0b8', { roughness: 0.4 }), B.x0 + 0.12, 0.94, 1.55);
    box(0.06, 0.6, 0.4, B.x0 + 0.04, 1.2, 0.35, std('#d8c8a8', { roughness: 0.98 }));          // towel
    this.mirrorRect = { x: B.x0 + 0.015, y: 1.58, z: 1.1, w: 0.78, h: 0.92 };
    box(0.03, this.mirrorRect.h + 0.05, this.mirrorRect.w + 0.05, B.x0 + 0.01, this.mirrorRect.y, this.mirrorRect.z, std('#2a2a2e', { roughness: 0.4 }), 0, false);
    this.bathLight = new THREE.PointLight('#f4f6ff', 0, 4.5, 1.4); this.bathLight.position.set(B.x0 + 0.7, 2.25, 1.1); g.add(this.bathLight);
    box(0.5, 0.05, 0.12, B.x0 + 0.04, this.mirrorRect.y + 0.56, this.mirrorRect.z, std('#f4f2ee', { emissive: '#fff6ea', emissiveIntensity: 0.9 }), 0, false);   // light bar over the mirror

    // ---- your legs on the couch (jeans, white socks / sneakers): seen when you look down at your hands
    this.legs = new THREE.Group(); g.add(this.legs);
    const jeans = std('#5a6d8c', { roughness: 0.9, name: 'jeans' }), shoeM = std('#e2ded6', { roughness: 0.6 }), soleM = std('#c8c2b8', { roughness: 0.8 });
    const S = APT.seat;
    for (const s of [-1, 1]) {
      const x = S.x + s * 0.11;
      const th = new THREE.Mesh(smoothLoft([[0, 0.085, 0.078], [0.2, 0.078, 0.07], [0.4, 0.066, 0.06], [0.47, 0.06, 0.056]], 12), jeans);
      th.position.set(x, 0.53, S.z + 0.08); th.rotation.set(-Math.PI / 2 + 0.04, s * 0.04, 0); this.legs.add(th);
      const kn = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 8), jeans); kn.position.set(x + s * 0.01, 0.51, S.z - 0.38); this.legs.add(kn);
      const sh = new THREE.Mesh(smoothLoft([[0, 0.06, 0.056], [0.22, 0.052, 0.05], [0.44, 0.046, 0.044]], 12), jeans);
      sh.position.set(x + s * 0.015, 0.06, S.z - 0.46); sh.rotation.set(0.17, 0, 0); this.legs.add(sh);
      const sn = new THREE.Mesh(loftZ([[-0.06, 0.05, 0.035, 0.035], [0.06, 0.055, 0.04, 0.04], [0.16, 0.045, 0.028, 0.028], [0.2, 0.03, 0.02, 0.02]], 8), shoeM);
      sn.position.set(x + s * 0.02, 0.045, S.z - 0.52); sn.rotation.y = Math.PI + s * 0.12; this.legs.add(sn);
      const so = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.28), soleM); so.position.set(x + s * 0.02, 0.01, S.z - 0.6); so.rotation.y = s * 0.12; this.legs.add(so);
    }
    this.legs.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    // where your hands rest: the top of each thigh, a little behind the knee
    this.thighSpot = (side, out) => out.set(S.x + side * 0.11, 0.62, S.z - 0.24);

    // a faint haze in the warm air (implied, never shown)
    this.scene.fog = new THREE.FogExp2(new THREE.Color('#3a342e'), 0.03);
  }

  _plant(x, y, z, h) {
    const pot = this.std('#c8b8a0', { roughness: 0.6 }), leaf = this.std('#3e6a3e', { roughness: 0.8, side: THREE.DoubleSide, name: 'leaf' });
    this.add(new THREE.CylinderGeometry(0.09 * h + 0.05, 0.07 * h + 0.04, 0.22 * h + 0.06, 12), pot, x, y + (0.22 * h + 0.06) / 2, z);
    const q = new RNG(Math.floor(x * 100 + z * 10));
    for (let i = 0; i < 9; i++) {
      const a = q.range(0, Math.PI * 2), tilt = q.range(0.25, 0.9), len = h * q.range(0.35, 0.6);
      const lg = new THREE.PlaneGeometry(0.06 * h + 0.04, len); lg.translate(0, len / 2, 0);
      const m = this.add(lg, leaf, x, y + 0.22 * h + 0.06, z, 0, a, tilt, false);
      m.rotation.order = 'YXZ'; m.rotation.set(tilt, a, 0);
    }
  }

  // the TV: a show nobody is really watching (abstract shapes, slow cuts)
  _drawTV(t) {
    const c = this.tvCv.getContext('2d'), W = 256, H = 144, shot = Math.floor(t / 2.7), u = (t % 2.7) / 2.7, q = new RNG(900 + shot);
    const a = q.pick(['#2a4a6a', '#6a3a2a', '#1a5a4a', '#5a4a7a']), b = q.pick(['#e8c08a', '#8ac0e8', '#e88a6a', '#c8e88a']);
    const gr = c.createLinearGradient(0, 0, W, H); gr.addColorStop(0, a); gr.addColorStop(1, b); c.fillStyle = gr; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) { c.fillStyle = `rgba(255,255,255,${q.range(0.1, 0.3)})`; c.beginPath(); c.arc(q.range(0, W) + u * q.range(-30, 30), q.range(20, H), q.range(10, 40), 0, Math.PI * 2); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, H * 0.7, W, H * 0.3);
    this.tvTex.needsUpdate = true;
    return 0.6 + 0.4 * noise1(t * 0.8, 3);
  }

  update(t, camera) {
    const tv = this._drawTV(t);
    this.tvLight.intensity = 1.1 * tv;
    this.lampFloor.intensity = 8.5; this.lampGlow.intensity = 1.6; this.lampSide.intensity = 1.8; this.cityLight.intensity = 0.6; this.bounce.intensity = 1.1;
    this.hallLight.intensity = 1.6; this.bathLight.intensity = 2.0;
    this.fairy.forEach((b, i) => b.scale.setScalar(0.85 + 0.15 * Math.sin(t * 1.3 + i * 1.7)));
    this.legs.visible = SCRIPT_TRACKS.legs.value(t) > 0.5;
  }
}
