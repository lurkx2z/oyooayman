/* =====================================================================
   WORLD — one battlefield, seen from many angles. A road runs north
   (−Z) through a ruined stone village (z +30…−20), out across muddy
   fields (the tank road), to a zigzag trench line with a bunker and
   machine-gun nests (z ≈ −80), over a low ridge to an artillery battery
   (z ≈ −125). Craters, wire, steel hedgehogs, sandbags, burnt trees,
   wrecks, fires and smoke columns; a low hazy sun from the west.
   Colour: mud brown, charcoal, grey, desaturated green, smoke, steel.
   ===================================================================== */

installFog({ bankScale: 0.02, bankAmount: 0.5, lowHeight: 6, lowAmount: 0.9, cap: 0.92 });

const XW = {
  road: { x: 0, w: 7 },
  village: { z0: -20, z1: 30 },
  trench: { z: -80 }, ridge: { z: -152, h: 6 }, battery: { z: -126 },
  bunker: [16, -84], mg: [[-14, -79], [30, -81]],
  eren: [-22, -42],                                   // where he transforms
};
// the ground height (m) at (x, z): rolling fields, the ridge, the road's camber, craters, the trench
const xCraters = (() => { const r = new RNG(404), c = []; for (let i = 0; i < 70; i++) { const x = r.range(-90, 90), z = r.range(-150, 10); if (Math.abs(x) < 6) continue; c.push([x, z, r.range(1.5, 5.5)]); } return c; })();
function xTrenchDist(x, z) {
  // a zigzag line along z ≈ −80: distance to it
  const zz = XW.trench.z + 3 * Math.sign(Math.sin(x * 0.12)) * Math.min(1, Math.abs(Math.sin(x * 0.12)) * 4);
  return Math.abs(z - zz);
}
function xGround(x, z) {
  let h = 0.6 * Math.sin(x * 0.045) * Math.cos(z * 0.035) + 0.35 * Math.sin(x * 0.11 + z * 0.07);
  h += XW.ridge.h * Math.exp(-(((z - XW.ridge.z) / 12) ** 2)) * (0.8 + 0.2 * Math.sin(x * 0.03));
  h *= MathX.smooth(Math.abs(x), 3, 14) * 0.85 + 0.15;                     // the road is flat-ish
  for (const [cx, cz, r] of xCraters) { const d = Math.hypot(x - cx, z - cz) / r; if (d < 1.6) h += d < 1 ? -0.9 * r * 0.3 * (1 - d * d) : 0.25 * r * 0.3 * Math.sin((d - 1) / 0.6 * Math.PI); }
  if (Math.abs(x) < 70) { const td = xTrenchDist(x, z); if (td < 2.2) h -= 1.9 * (1 - MathX.smooth(td, 0.9, 2.2)); }
  return h;
}

class XWorld {
  constructor(scene, renderer) {
    this.scene = scene; this.renderer = renderer;
    this.root = new THREE.Group(); scene.add(this.root);
    this.batch = new Batcher(); this.r = new RNG(1944);
    this.windows = []; this.fires = []; this.smokeCols = [];
  }

  build() {
    this._materials();
    this._terrain();
    this._road();
    this._village();
    this._fields();
    this._trench();
    this._battery();
    this._sky();
    this._lights();
    this.batch.build(this.root, 'xw');
    this._envMap();
    this.scene.fog = new THREE.FogExp2('#7a7268', 0.0032);
  }

  _materials() {
    const r = this.r, std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.9 }, o));
    // mud: a large tile with puddles, tracks and scattered grit
    const S = 512, mc = Tex.canvas(S, S), m = mc.getContext('2d');
    m.fillStyle = '#5a4a38'; m.fillRect(0, 0, S, S);
    for (let i = 0; i < 500; i++) { m.fillStyle = `rgba(${r.chance(0.5) ? '40,32,24' : '110,96,74'},${r.range(0.04, 0.12)})`; m.beginPath(); m.arc(r.range(0, S), r.range(0, S), r.range(3, 40), 0, 7); m.fill(); }
    for (let i = 0; i < 30; i++) { m.fillStyle = `rgba(70,74,60,${r.range(0.1, 0.25)})`; m.beginPath(); m.arc(r.range(0, S), r.range(0, S), r.range(10, 50), 0, 7); m.fill(); }   // dead grass
    for (let i = 0; i < 2500; i++) { m.fillStyle = `rgba(${r.chance(0.5) ? '20,16,12' : '150,135,110'},${r.range(0.1, 0.3)})`; m.fillRect(r.range(0, S), r.range(0, S), r.range(1, 3), r.range(1, 3)); }
    Tex.noise(m, S, S, 14, r);
    const mud = Tex.tex(mc); this.mMud = std('#ffffff', { map: mud, roughness: 0.95, name: 'mud' });
    this.mMud.vertexColors = true;
    // road: packed dirt with ruts
    const rc = Tex.canvas(256, 256), rd = rc.getContext('2d'); rd.fillStyle = '#6a5a44'; rd.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 300; i++) { rd.fillStyle = `rgba(${r.chance(0.5) ? '50,40,30' : '130,115,90'},${r.range(0.05, 0.14)})`; rd.beginPath(); rd.arc(r.range(0, 256), r.range(0, 256), r.range(2, 18), 0, 7); rd.fill(); }
    for (const x of [62, 82, 174, 194]) { rd.fillStyle = 'rgba(40,32,24,0.35)'; rd.fillRect(x, 0, 12, 256); }
    Tex.noise(rd, 256, 256, 12, r);
    this.mRoad = std('#ffffff', { map: Tex.tex(rc), roughness: 0.92, name: 'road' });
    // stone for the village: rough blocks
    const sc = Tex.canvas(256, 256), s = sc.getContext('2d'); s.fillStyle = '#8a8274'; s.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 22) for (let x = (y / 22) % 2 ? -18 : 0; x < 256; x += 40) { const v = r.range(-14, 14); s.fillStyle = `rgb(${130 + v},${122 + v},${108 + v})`; s.fillRect(x + 2, y + 2, 36, 18); }
    for (let i = 0; i < 200; i++) { s.fillStyle = `rgba(30,26,22,${r.range(0.05, 0.15)})`; s.fillRect(r.range(0, 256), r.range(0, 256), r.range(2, 12), r.range(1, 5)); }
    Tex.noise(s, 256, 256, 10, r);
    this.mStone = std('#ffffff', { map: Tex.tex(sc), roughness: 0.92, name: 'stone' });
    this.mStoneDk = std('#5e584e', { roughness: 0.95, name: 'stoneDk' });
    this.mPlaster = std('#a49a86', { roughness: 0.95, name: 'plaster' });
    this.mWood = std('#3b2f24', { roughness: 0.9, name: 'woodBurnt' });
    this.mSand = std('#7a6c52', { roughness: 0.95, name: 'sandbag' });
    this.mSteel = std('#3a3a36', { roughness: 0.55, metalness: 0.5, name: 'steel' });
    this.mRust = std('#5a3a26', { roughness: 0.8, metalness: 0.3, name: 'rust' });
    this.mConcrete = std('#7d7a72', { roughness: 0.9, name: 'concrete' });
    this.mGlass = new THREE.MeshStandardMaterial({ color: '#8b9aa0', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.55, name: 'glassWin' });
  }

  _terrain() {
    // a 360 m square, denser near the action
    const N = 220, L = 360, g = new THREE.PlaneGeometry(L, L, N, N); g.rotateX(-Math.PI / 2); g.translate(0, 0, -60);
    const P = g.attributes.position, col = new Float32Array(P.count * 3), uv = g.attributes.uv;
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), z = P.getZ(i), h = xGround(x, z); P.setY(i, h);
      const n = 0.5 + 0.5 * Math.sin(x * 0.07 + Math.sin(z * 0.05) * 2), wet = MathX.smooth(-h, 0.1, 0.8), grass = MathX.smooth(Math.abs(x), 20, 60) * (0.4 + 0.6 * n) * (1 - wet);
      col[i * 3] = MathX.lerp(1, 0.86, grass) * (1 - 0.3 * wet); col[i * 3 + 1] = MathX.lerp(1, 0.98, grass) * (1 - 0.28 * wet); col[i * 3 + 2] = MathX.lerp(1, 0.84, grass) * (1 - 0.25 * wet);
      uv.setXY(i, x / 9, z / 9);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, this.mMud); m.receiveShadow = true; m.name = 'terrain'; this.root.add(m); this.terrain = m;
    // a far ring of hills under the haze
    const fh = new THREE.Mesh(new THREE.CylinderGeometry(420, 420, 30, 64, 1, true), new THREE.MeshBasicMaterial({ color: '#6e675c', side: THREE.BackSide, fog: true }));
    fh.position.set(0, 2, -60); this.root.add(fh);
  }

  _road() {
    const R = XW.road, g = new THREE.PlaneGeometry(R.w, 200, 4, 100); g.rotateX(-Math.PI / 2); g.translate(R.x, 0, -60);
    const P = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); P.setY(i, xGround(x, z) + 0.04 + 0.06 * (1 - Math.abs(x - R.x) / (R.w / 2))); uv.setXY(i, (x - R.x) / R.w, z / 7); }
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, this.mRoad); m.receiveShadow = true; this.root.add(m);
  }

  // a ruined house: stone walls with broken tops, holes for windows and doors, a few panes left, rubble
  _house(cx, cz, w, d, h, ry, broken = 0.5) {
    const r = this.r, B = this.batch, rot = new THREE.Matrix4().makeRotationY(ry);
    const base = new THREE.Vector3(cx, xGround(cx, cz), cz);
    const put = (geo, mat, x, y, z, rx = 0, ryy = 0, rz = 0) => {
      const M2 = new THREE.Matrix4().makeRotationY(ry).multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ryy, rz)));
      M2.setPosition(new THREE.Vector3(x, y, z).applyMatrix4(rot).add(base)); B.add(geo, mat, M2);
    };
    const walls = [[0, d / 2, w, 0], [0, -d / 2, w, Math.PI], [w / 2, 0, d, -Math.PI / 2], [-w / 2, 0, d, Math.PI / 2]];
    walls.forEach(([x, z, len, a], wi) => {
      if (r.chance(broken * 0.35)) return;                                                   // a wall gone entirely
      const nseg = Math.ceil(len / 1.2), segW = len / nseg;
      for (let i = 0; i < nseg; i++) {
        const u = (i + 0.5) * segW - len / 2, top = h * (1 - broken * r.range(0, 0.85)) * (0.8 + 0.2 * Math.cos(i * 1.7));
        const win = i % 3 === 1 && top > 2.2;
        const px = x + Math.cos(a) * u, pz = z - Math.sin(a) * u;
        if (win) {
          put(new THREE.BoxGeometry(segW, 0.9, 0.45), this.mStone, px, 0.45, pz, 0, a, 0);
          put(new THREE.BoxGeometry(segW, Math.max(0.2, top - 2.1), 0.45), this.mStone, px, 2.1 + (top - 2.1) / 2, pz, 0, a, 0);
          if (r.chance(0.6)) { const pane = new THREE.Mesh(new THREE.PlaneGeometry(segW * 0.8, 1.1), this.mGlass); const wp = new THREE.Vector3(px + Math.sin(a) * 0.05, 0, pz + Math.cos(a) * 0.05).applyMatrix4(rot).add(new THREE.Vector3(cx, xGround(cx, cz), cz)); pane.position.set(wp.x, wp.y + 1.5, wp.z); pane.rotation.y = a + ry; this.root.add(pane); this.windows.push(pane); }
        } else put(new THREE.BoxGeometry(segW, top, 0.45), this.mStone, px, top / 2, pz, 0, a, 0);
      }
    });
    // rubble and charred beams
    for (let i = 0; i < 9; i++) { const s = r.range(0.3, 0.9); put(new THREE.BoxGeometry(s, s * 0.6, s * 0.8), r.chance(0.5) ? this.mStone : this.mStoneDk, r.range(-w / 2, w / 2), s * 0.25, r.range(-d / 2, d / 2), r.range(-0.4, 0.4), r.range(0, 3), r.range(-0.4, 0.4)); }
    for (let i = 0; i < 3; i++) put(new THREE.BoxGeometry(0.2, 0.2, w * 0.9), this.mWood, r.range(-w / 3, w / 3), h * r.range(0.5, 0.9), r.range(-d / 3, d / 3), r.range(-0.5, 0.5), Math.PI / 2 + r.range(-0.3, 0.3), r.range(-0.3, 0.3));
  }

  _village() {
    const r = this.r, V = XW.village;
    for (let z = V.z1; z > V.z0; z -= r.range(9, 13)) for (const s of [-1, 1]) {
      const w = r.range(6, 9), d = r.range(6, 8), x = s * (XW.road.w / 2 + 2.5 + d / 2 + r.range(0, 2));
      this._house(x, z, w, d, r.range(5, 8), s > 0 ? -Math.PI / 2 : Math.PI / 2, r.range(0.3, 0.8));
    }
    // the church tower: tall, its top broken
    const tx = -13, tz = -8, g0 = xGround(tx, tz);
    this.batch.box(4.2, 15, 4.2, tx, g0 + 7.5, tz, this.mStone);
    this.batch.box(4.6, 0.5, 4.6, tx, g0 + 15, tz, this.mStoneDk);
    for (const [dx, dz, hh] of [[-1.6, -1.6, 3], [1.6, -1.6, 1.5], [-1.6, 1.6, 2.2]]) this.batch.box(1.0, hh, 1.0, tx + dx, g0 + 15.2 + hh / 2, tz + dz, this.mStone);
    this.tower = [tx, tz];
    // a burnt-out truck by the road
    this.batch.box(2.3, 1.4, 5.5, -5.6, xGround(-5.6, 12) + 1.0, 12, this.mRust, 0.2);
    this.batch.box(2.2, 1.2, 2.0, -5.9, xGround(-5.9, 15) + 1.9, 14.6, this.mRust, 0.2);
  }

  _fields() {
    const r = this.r, B = this.batch;
    // steel hedgehogs, wire on posts, burnt trees, sandbag walls, a few wrecks
    const hedge = (x, z) => { const y = xGround(x, z); for (const [rx, rz] of [[0.6, 0], [-0.6, 0.0], [0, 0.6]]) B.add(new THREE.BoxGeometry(0.18, 2.2, 0.18), this.mSteel, Geo.matrix(x, y + 0.7, z, rx, r.range(0, 3), rz)); };
    for (let i = 0; i < 26; i++) { const x = r.range(-60, 60), z = r.range(-95, -50); if (Math.abs(x) < 6) continue; hedge(x, z); }
    for (let z = -74; z > -76; z -= 4) for (let x = -64; x < 64; x += 3.2) { if (Math.abs(x) < 5) continue; const y = xGround(x, z); B.add(new THREE.BoxGeometry(0.08, 1.2, 0.08), this.mWood, Geo.matrix(x, y + 0.6, z, 0.1, 0, 0.1)); B.add(new THREE.BoxGeometry(3.2, 0.03, 0.03), this.mRust, Geo.matrix(x + 1.6, y + 0.9, z)); B.add(new THREE.BoxGeometry(3.2, 0.03, 0.03), this.mRust, Geo.matrix(x + 1.6, y + 0.4, z + 0.2, 0, 0.1)); }
    for (let i = 0; i < 40; i++) {
      const x = r.range(-90, 90), z = r.range(-140, 25); if (Math.abs(x) < 8 || (z > -20 && Math.abs(x) < 26)) continue;
      const y = xGround(x, z), h = r.range(4, 9);
      B.add(new THREE.CylinderGeometry(0.12, 0.3, h, 6), this.mWood, Geo.matrix(x, y + h / 2, z, r.range(-0.15, 0.15), 0, r.range(-0.15, 0.15)));
      for (let k = 0; k < 3; k++) B.add(new THREE.CylinderGeometry(0.04, 0.09, h * 0.4, 5), this.mWood, Geo.matrix(x, y + h * r.range(0.55, 0.85), z, r.range(-1, 1), r.range(0, 6), r.range(0.6, 1.1)));
    }
    // a destroyed tank hulk in the field (a landmark)
    B.box(5.5, 1.8, 3.0, 18, xGround(18, -55) + 0.8, -55, this.mRust, 0.7);
    B.box(2.2, 0.8, 2.2, 17.4, xGround(18, -55) + 1.8, -54.2, this.mRust, 1.2);
  }

  _trench() {
    const r = this.r, B = this.batch, z0 = XW.trench.z;
    // sandbags along the parapet
    for (let x = -66; x < 66; x += 0.9) {
      if (Math.abs(x) < 4.5) continue;
      const zz = z0 + 3 * Math.sign(Math.sin(x * 0.12)) * Math.min(1, Math.abs(Math.sin(x * 0.12)) * 4) - 2.2, y = xGround(x, zz);
      for (let k = 0; k < 2; k++) B.add(new THREE.CapsuleGeometry(0.22, 0.45, 2, 5), this.mSand, Geo.matrix(x + r.range(-0.1, 0.1), y + 0.2 + k * 0.32, zz, 0, 0, Math.PI / 2 + r.range(-0.1, 0.1)));
    }
    // the bunker: a concrete box with a firing slit, half dug in
    const [bx, bz] = XW.bunker, by = xGround(bx, bz);
    B.box(8, 3.2, 6, bx, by + 1.0, bz, this.mConcrete); B.box(8.6, 0.6, 6.6, bx, by + 2.9, bz, this.mConcrete);
    B.box(4.5, 0.35, 0.3, bx, by + 1.9, bz + 3.05, this.mStoneDk);
    this.bunker = [bx, bz];
    // machine-gun nests: a sandbag ring with a gun on a tripod
    this.mgs = XW.mg.map(([x, z]) => {
      const y = xGround(x, z);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 1.6 - Math.PI * 0.3; B.add(new THREE.CapsuleGeometry(0.22, 0.45, 2, 5), this.mSand, Geo.matrix(x + Math.sin(a) * 1.6, y + 0.25, z + Math.cos(a) * 1.6, 0, a, Math.PI / 2)); B.add(new THREE.CapsuleGeometry(0.22, 0.45, 2, 5), this.mSand, Geo.matrix(x + Math.sin(a) * 1.55, y + 0.6, z + Math.cos(a) * 1.55, 0, a + 0.2, Math.PI / 2)); }
      const gun = new THREE.Group(); gun.position.set(x, y + 0.85, z + 0.9); this.root.add(gun);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.9), this.mSteel); body.castShadow = true; gun.add(body);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.7, 6), this.mSteel); bar.rotation.x = Math.PI / 2; bar.position.z = 0.75; gun.add(bar);
      for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 4), this.mSteel); l.position.set(s * 0.25, -0.4, 0.2); l.rotation.z = s * 0.4; gun.add(l); }
      return { x, z, y, gun };
    });
  }

  _battery() {
    const B = this.batch, z = XW.battery.z;
    this.guns = [-24, -8, 8, 24].map((x) => {
      const y = xGround(x, z), g = new THREE.Group(); g.position.set(x, y, z); this.root.add(g);
      const add = (geo, m, px, py, pz, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, m); o.position.set(px, py, pz); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
      add(new THREE.BoxGeometry(2.0, 1.2, 0.12), this.mSteel, 0, 0.9, 0.3);                                          // shield
      for (const s of [-1, 1]) add(new THREE.CylinderGeometry(0.6, 0.6, 0.18, 12), this.mWood, s * 0.95, 0.6, -0.1, 0, 0, Math.PI / 2);
      for (const s of [-1, 1]) add(new THREE.BoxGeometry(0.15, 0.15, 3.2), this.mSteel, s * 0.6, 0.35, -1.7, 0, s * 0.25, 0);   // trails
      const brl = new THREE.Group(); brl.position.set(0, 1.05, 0.1); g.add(brl);
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3.4, 8), this.mSteel); tube.rotation.x = Math.PI / 2; tube.position.z = 1.5; tube.castShadow = true; brl.add(tube);
      brl.rotation.x = -0.55;                                                                                           // laid high: firing over the ridge
      for (let i = 0; i < 6; i++) B.add(new THREE.CapsuleGeometry(0.22, 0.45, 2, 5), this.mSand, Geo.matrix(x - 2.4 + i * 0.95, y + 0.25, z + 2.5, 0, 0, Math.PI / 2));
      return { x, z, y, g, brl };
    });
  }

  _sky() {
    // a hazy dome: brown-grey overhead, a low warm glow in the west, smoke smeared across
    const g = new THREE.SphereGeometry(900, 32, 16), cv = Tex.canvas(512, 256), x = cv.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#5c5a58'); gr.addColorStop(0.42, '#86817a'); gr.addColorStop(0.5, '#a49a8a'); gr.addColorStop(1, '#8d8578');
    x.fillStyle = gr; x.fillRect(0, 0, 512, 256);
    const r = this.r; for (let i = 0; i < 120; i++) { x.fillStyle = `rgba(${r.chance(0.6) ? '70,66,62' : '150,140,125'},${r.range(0.04, 0.12)})`; x.beginPath(); x.ellipse(r.range(0, 512), r.range(30, 125), r.range(30, 120), r.range(6, 22), 0, 0, 7); x.fill(); }
    const sun = x.createRadialGradient(384, 118, 0, 384, 118, 90); sun.addColorStop(0, 'rgba(255,214,160,0.85)'); sun.addColorStop(0.3, 'rgba(240,170,110,0.35)'); sun.addColorStop(1, 'rgba(240,170,110,0)');
    x.fillStyle = sun; x.fillRect(0, 0, 512, 256);
    const t = Tex.tex(cv, { repeat: false });
    const sky = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false })); sky.rotation.y = Math.PI * 0.5; sky.renderOrder = -1;
    this.sky = sky; this.root.add(sky);
  }

  _lights() {
    const s = this.scene;
    this.hemi = new THREE.HemisphereLight('#b5ada0', '#4a3e30', 0.75); s.add(this.hemi);
    const sun = new THREE.DirectionalLight('#ffd9b0', 2.4); sun.position.set(-60, 28, -10); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
    Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 260 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
    s.add(sun); s.add(sun.target); this.sun = sun;
    // a warm point for the transformation / explosions, a cold one for Killua's lightning (moved by the film)
    this.warm = new THREE.PointLight('#ff9a4a', 0, 60, 1.5); s.add(this.warm);
    this.cold = new THREE.PointLight('#b9e4ff', 0, 18, 1.6); s.add(this.cold);
    for (const L of [this.hemi, sun, this.warm, this.cold]) L.layers.enable(1);
  }
  // the sun's shadow box follows the action
  focus(x, z, r = 40) {
    const S = this.sun; S.target.position.set(x, 0, z); S.position.set(x - 60, 28, z - 10);
    Object.assign(S.shadow.camera, { left: -r, right: r, top: r, bottom: -r }); S.shadow.camera.updateProjectionMatrix(); S.target.updateMatrixWorld();
  }

  _envMap() {
    const pm = new THREE.PMREMGenerator(this.renderer), es = new THREE.Scene();
    es.add(this.sky.clone());
    const gr = new THREE.Mesh(new THREE.CircleGeometry(800, 24), new THREE.MeshBasicMaterial({ color: '#4a4034' })); gr.rotation.x = -Math.PI / 2; gr.position.y = -2; es.add(gr);
    const rt = pm.fromScene(es, 0.04, 0.5, 2000);
    this.scene.environment = rt.texture; this.scene.environmentIntensity = 0.35; pm.dispose();
  }

  update(t) {}
}
