/* =====================================================================
   PARLOUR — the evening at home, c. 1905 (phase E1–E3).
   A warm front room built far from the street (a cut is a camera jump):
   a coal fire in the hearth, an oil lamp on a footstool, grandfather's
   armchair against a plain papered wall, a rug for the children, a low
   table with a game of checkers, a picture book.
   The wall behind grandfather is a live canvas: his lamp-thrown shadow and
   the shadow pictures of his story — his hands make a bird, then a ship,
   a dragon and a castle grow out of the story (never anything frightening).
   ===================================================================== */

const PARLOUR = {
  x0: -2.6, x1: 2.6, z0: 197.8, z1: 202.2, h: 2.75,
  fire: { x: 0.7 },                                  // hearth in the north wall
  chair: { x: 2.0, z: 199.95 },                      // grandfather's armchair, back to the east wall
  lamp: { x: 0.85, y: 0.36, z: 199.72 },             // oil lamp on a footstool (stool top height)
  table: { x: -1.7, z: 199.4, y: 0.4 },              // low table with the checkerboard (you kneel on its east side)
  t0: 67.6, t1: 80.4,
  // checkers: your piece double-jumps two of your friend's (rows from the far side)
  jump: { from: [5, 2], via: [[4, 3], [2, 3]], to: [[3, 4], [1, 2]], t: [71.42, 71.68], hop: 0.24 },
  book: { t0: 72.2, turn: [72.55, 73.0], down: [73.3, 73.75] },
  // the wall: grandfather's hands make a bird, then the story takes over
  art: { bird: [74.1, 75.7], ship: [75.3, 77.5], dragon: [77.1, 79.2], castle: [78.7, 80.4] },
};

/* ---- silhouette pictures, shared by the shadow wall and the picture book ----
   each draws filled shapes at (x, y) with scale s (1 = ~300 px wide) using the context's fillStyle */
const ShadowArt = {
  ship(c, x, y, s, t) {
    c.save(); c.translate(x, y); c.rotate(0.05 * Math.sin(t * 1.7)); c.scale(s, s);
    // hull with a raised stern and a bowsprit
    c.beginPath(); c.moveTo(-150, -8); c.lineTo(-128, -26); c.lineTo(-96, -24); c.lineTo(-90, -10); c.lineTo(112, -10); c.lineTo(165, -30); c.lineTo(168, -24);
    c.quadraticCurveTo(140, 30, 90, 34); c.lineTo(-110, 34); c.quadraticCurveTo(-140, 20, -150, -8); c.fill();
    c.fillRect(110, -32, 80, 4);                                    // bowsprit
    // masts and billowing square sails
    const mast = (mx, h, sails) => {
      c.fillRect(mx - 3, -10 - h, 6, h);
      sails.forEach(([y0, w, hh]) => {
        const b = 10 + 4 * Math.sin(t * 2.3 + mx);
        c.beginPath(); c.moveTo(mx - w / 2, -10 - y0); c.lineTo(mx + w / 2, -10 - y0);
        c.quadraticCurveTo(mx + w / 2 + b, -10 - y0 + hh / 2, mx + w / 2 - 4, -10 - y0 + hh); c.lineTo(mx - w / 2 + 4, -10 - y0 + hh);
        c.quadraticCurveTo(mx - w / 2 + b, -10 - y0 + hh / 2, mx - w / 2, -10 - y0); c.fill();
      });
      // pennant
      c.beginPath(); c.moveTo(mx + 3, -10 - h); c.quadraticCurveTo(mx + 20, -14 - h + 4 * Math.sin(t * 6 + mx), mx + 34, -8 - h + 3 * Math.sin(t * 7 + mx)); c.lineTo(mx + 3, -2 - h); c.fill();
    };
    mast(-60, 150, [[146, 64, 40], [100, 84, 46], [50, 96, 38]]);
    mast(20, 190, [[184, 70, 44], [134, 92, 50], [78, 104, 44]]);
    mast(90, 140, [[136, 60, 38], [92, 78, 42], [46, 88, 34]]);
    // rigging
    c.lineWidth = 2.5; c.strokeStyle = c.fillStyle; c.beginPath();
    c.moveTo(190, -30); c.lineTo(90, -150); c.moveTo(-60, -160); c.lineTo(-140, -24); c.moveTo(20, -200); c.lineTo(90, -150); c.moveTo(20, -200); c.lineTo(-60, -160); c.stroke();
    c.restore();
  },
  waves(c, x, y, w, s, t) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath(); c.moveTo(-w / 2, 40);
    for (let u = -w / 2; u <= w / 2; u += 6) c.lineTo(u, 12 * Math.sin(u * 0.045 - t * 3.2) + 6 * Math.sin(u * 0.11 + t * 2.1));
    c.lineTo(w / 2, 40); c.closePath(); c.fill();
    // curling crests
    for (let k = -4; k <= 4; k++) {
      const u = k * w / 9 + ((t * 40) % (w / 9)), h = 10 + 4 * Math.sin(k * 3 + t);
      c.beginPath(); c.moveTo(u - 26, 6); c.quadraticCurveTo(u - 4, -h * 1.6, u + 14, -h * 0.6); c.quadraticCurveTo(u + 2, -h * 0.9, u - 2, 2); c.fill();
    }
    c.restore();
  },
  dragon(c, x, y, s, t, dir = -1) {
    c.save(); c.translate(x, y); c.scale(s * dir, s);
    const f = Math.sin(t * 6.0), lw = (w) => { c.lineWidth = w; };
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = c.fillStyle;
    // far wing (behind), body, near wing
    const wing = (sx, sy, flap, k) => {
      const tipY = sy - 120 * flap * k, tipX = sx - 30;
      c.beginPath(); c.moveTo(sx, sy);
      c.lineTo(tipX, tipY); c.lineTo(sx + 40, tipY + 30 * k);
      c.quadraticCurveTo(sx + 50, sy - 20 * flap, sx + 70, tipY + 70 * k);
      c.quadraticCurveTo(sx + 70, sy - 10, sx + 95, sy - 30 * flap * k + 20);
      c.quadraticCurveTo(sx + 60, sy + 10, sx, sy); c.fill();
    };
    wing(-10, -10, 0.6 + 0.6 * f, 0.8);
    // tail: tapering S-curve with a spade
    c.beginPath(); c.moveTo(40, 0);
    for (let k = 0; k <= 12; k++) { const u = k / 12; lw(26 * (1 - u) + 4); c.lineTo(40 + u * 170, 12 * Math.sin(u * 5 + t * 3) + u * 20); c.stroke(); c.beginPath(); c.moveTo(40 + u * 170, 12 * Math.sin(u * 5 + t * 3) + u * 20); }
    const ex = 210, ey = 12 * Math.sin(5 + t * 3) + 20;
    c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + 22, ey - 14); c.lineTo(ex + 30, ey + 4); c.lineTo(ex + 18, ey + 16); c.fill();
    // body and neck
    c.beginPath(); c.ellipse(10, 0, 62, 26, -0.08, 0, Math.PI * 2); c.fill();
    lw(22); c.beginPath(); c.moveTo(-40, -6); c.quadraticCurveTo(-70, -30, -78, -62); c.stroke();
    // head: rounded snout, two little horns, a friendly eye (a hole), a curl of smoke
    c.beginPath(); c.ellipse(-92, -72, 28, 17, -0.25, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.ellipse(-118, -64, 16, 11, -0.1, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(-84, -86); c.lineTo(-70, -108); c.lineTo(-76, -84); c.fill();
    c.beginPath(); c.moveTo(-96, -88); c.lineTo(-90, -112); c.lineTo(-86, -88); c.fill();
    lw(9); c.beginPath(); c.moveTo(-20, 14); c.lineTo(-26, 40); c.moveTo(30, 18); c.lineTo(34, 42); c.stroke();     // legs tucked
    // ridge spikes along the back
    for (let k = 0; k < 6; k++) { const bx = -30 + k * 16; c.beginPath(); c.moveTo(bx - 6, -22); c.lineTo(bx, -38 + 3 * Math.sin(k)); c.lineTo(bx + 6, -22); c.fill(); }
    wing(10, -14, 0.65 + 0.7 * f, 1.0);
    c.save(); c.globalCompositeOperation = 'destination-out';
    c.beginPath(); c.ellipse(-94, -76, 4, 5, 0, 0, Math.PI * 2); c.fill(); c.restore();
    for (let k = 0; k < 3; k++) { const a = ((t * 0.9 + k / 3) % 1); c.beginPath(); c.arc(-140 - a * 60, -70 - a * 24 + 6 * Math.sin(a * 9), 4 + a * 12, 0, Math.PI * 2); c.fill(); }
    c.restore();
  },
  castle(c, x, y, s, t) {
    c.save(); c.translate(x, y); c.scale(s, s);
    // the hill
    c.beginPath(); c.moveTo(-210, 70); c.quadraticCurveTo(-100, -4, 0, -4); c.quadraticCurveTo(100, -4, 210, 70); c.lineTo(210, 140); c.lineTo(-210, 140); c.fill();
    const crenels = (x0, x1, top) => { for (let u = x0; u < x1 - 1; u += 15) c.fillRect(u, top - 12, 8, 12); };
    // curtain wall and keep
    c.fillRect(-110, -64, 220, 64); crenels(-110, 110, -64);
    c.fillRect(-48, -170, 96, 110); crenels(-48, 48, -170);
    // towers with conical roofs and flags
    const tower = (tx, w, h, flagK) => {
      c.fillRect(tx - w / 2, -h, w, h);
      c.beginPath(); c.moveTo(tx - w / 2 - 8, -h); c.lineTo(tx, -h - w * 1.6); c.lineTo(tx + w / 2 + 8, -h); c.fill();
      const fy = -h - w * 1.6;
      c.fillRect(tx - 1.5, fy - 36, 3, 36);
      c.beginPath(); c.moveTo(tx + 1.5, fy - 36);
      for (let k = 0; k <= 8; k++) { const u = k / 8; c.lineTo(tx + 1.5 + u * 36, fy - 36 + u * 6 + 4 * Math.sin(u * 4 - t * 7 + flagK)); }
      c.lineTo(tx + 1.5, fy - 21); c.fill();
    };
    tower(-112, 42, 132, 0); tower(112, 42, 132, 2); tower(0, 48, 245, 4);
    // holes: the gate, arrow slits, windows
    c.save(); c.globalCompositeOperation = 'destination-out';
    c.beginPath(); c.moveTo(-20, 0); c.lineTo(-20, -24); c.arc(0, -24, 20, Math.PI, 0); c.lineTo(20, 0); c.fill();
    for (const [wx, wy] of [[-112, -92], [112, -92], [0, -205], [-24, -120], [24, -120], [0, -150]]) { c.beginPath(); c.moveTo(wx - 4, wy + 11); c.lineTo(wx - 4, wy); c.arc(wx, wy, 4, Math.PI, 0); c.lineTo(wx + 4, wy + 11); c.fill(); }
    c.restore();
    c.restore();
  },
  // two hands crossed at the wrists, thumbs hooked into a head and neck, fingers spread as wings: a bird flapping
  bird(c, x, y, s, t) {
    c.save(); c.translate(x, y); c.scale(s, s);
    const flap = Math.sin(t * 5.2);
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = c.fillStyle;
    // forearms crossing below the wrists, down into his shadow
    c.beginPath(); c.moveTo(-70, 230); c.lineTo(-14, 26); c.lineTo(14, 30); c.lineTo(-30, 230); c.fill();
    c.beginPath(); c.moveTo(70, 230); c.lineTo(14, 26); c.lineTo(-14, 30); c.lineTo(30, 230); c.fill();
    for (const side of [-1, 1]) {
      c.save(); c.translate(side * 16, 6); c.rotate(side * (-0.15 - 0.42 * flap));
      c.beginPath(); c.ellipse(side * 26, -2, 34, 22, side * -0.2, 0, Math.PI * 2); c.fill();   // palm
      for (let k = 0; k < 4; k++) {       // fingers: long feathers fanned outward
        const a = side * (1.25 + k * 0.17), len = 104 - k * 13;
        c.lineWidth = 19 - k * 2;
        c.beginPath(); c.moveTo(side * 34, -6 + k * 4); c.lineTo(side * 34 + Math.sin(a) * len, -6 + k * 4 - Math.cos(a) * len); c.stroke();
      }
      c.restore();
    }
    // thumbs hooked together: neck, head, beak
    c.lineWidth = 20; c.beginPath(); c.moveTo(0, 4); c.quadraticCurveTo(-6, -30, 4, -58); c.stroke();
    c.beginPath(); c.ellipse(4, -66, 16, 13, -0.3, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.moveTo(16, -72); c.lineTo(42, -66); c.lineTo(16, -58); c.fill();
    c.restore();
  },
};

class Parlour {
  constructor(scene) {
    this.root = new THREE.Group(); this.root.name = 'parlour'; scene.add(this.root);
    this._v = new THREE.Vector3();
  }

  build() {
    const P = PARLOUR, g = this.root, r = new RNG(1905);
    const std = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85 }, o));
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, shadow = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = shadow; m.receiveShadow = true; g.add(m); return m; };
    const box = (w, h, d, x, y, z, mat, ry = 0) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z, 0, ry, 0);
    const W = P.x1 - P.x0, D = P.z1 - P.z0, cx = (P.x0 + P.x1) / 2, cz = (P.z0 + P.z1) / 2;

    // ---- floor: dark waxed boards; the rug
    const fl = Tex.canvas(512, 512), f = fl.getContext('2d');
    for (let i = 0; i < 10; i++) { const v = r.range(-10, 10); f.fillStyle = `rgb(${92 + v},${62 + v * 0.7},${40 + v * 0.5})`; f.fillRect(0, i * 51.2, 512, 50); }
    for (let i = 0; i < 2000; i++) { f.fillStyle = `rgba(30,18,10,${r.range(0.04, 0.12)})`; f.fillRect(r.range(0, 512), r.range(0, 512), r.range(10, 60), 1); }
    const floorT = Tex.tex(fl); floorT.repeat.set(W / 2, D / 2);
    add(new THREE.PlaneGeometry(W, D), std('#ffffff', { map: floorT, roughness: 0.5, name: 'parlourFloor' }), cx, 0, cz, -Math.PI / 2);
    const rug = Tex.canvas(512, 384), rg = rug.getContext('2d');
    rg.fillStyle = '#7a2a22'; rg.fillRect(0, 0, 512, 384);
    rg.strokeStyle = '#2a2a44'; rg.lineWidth = 30; rg.strokeRect(22, 22, 468, 340);
    rg.strokeStyle = '#d8c49a'; rg.lineWidth = 4; rg.strokeRect(44, 44, 424, 296); rg.strokeRect(8, 8, 496, 368);
    for (let i = 0; i < 26; i++) { const u = 40 + i * 17.5; rg.fillStyle = '#c8a86a'; rg.fillRect(u, 18, 6, 8); rg.fillRect(u, 358, 6, 8); }
    rg.fillStyle = '#2a2a44'; rg.beginPath(); rg.ellipse(256, 192, 120, 80, 0, 0, Math.PI * 2); rg.fill();
    rg.fillStyle = '#c8a86a'; rg.beginPath(); rg.ellipse(256, 192, 60, 38, 0, 0, Math.PI * 2); rg.fill();
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; rg.fillStyle = '#d8c49a'; rg.beginPath(); rg.arc(256 + Math.cos(a) * 92, 192 + Math.sin(a) * 60, 9, 0, Math.PI * 2); rg.fill(); }
    for (let i = 0; i < 3000; i++) { rg.fillStyle = `rgba(${r.chance(0.5) ? '20,10,8' : '220,190,150'},${r.range(0.03, 0.08)})`; rg.fillRect(r.range(0, 512), r.range(0, 384), 2, 2); }
    add(new THREE.PlaneGeometry(3.1, 2.3), std('#ffffff', { map: Tex.tex(rug, { repeat: false }), roughness: 0.98, name: 'parlourRug' }), -0.1, 0.006, 200.25, -Math.PI / 2, 0, Math.PI / 2, false);

    // ---- walls: sage-and-ochre striped paper above dark wainscot
    this.paper = this._paperCanvas(512, 512, r);
    const paperT = Tex.tex(this.paper); paperT.repeat.set(2, 1);
    const paperM = std('#ffffff', { map: paperT, roughness: 0.95, name: 'parlourPaper' });
    const wains = std('#3e2a1c', { roughness: 0.55, name: 'wainscot' }), trim = std('#4a3222', { roughness: 0.5 });
    const ph = P.h - 0.9, py = 0.9 + ph / 2;
    add(new THREE.PlaneGeometry(D, ph), paperM, P.x0, py, cz, 0, Math.PI / 2, 0, false);          // west
    add(new THREE.PlaneGeometry(W, ph), paperM, cx, py, P.z1, 0, Math.PI, 0, false);              // south
    add(new THREE.PlaneGeometry(W, ph), paperM, cx, py, P.z0, 0, 0, 0, false);                    // north
    // east wall: the shadow wall (paper × the shadows of the story, lit by the real lamp and fire)
    this.wallCv = Tex.canvas(1408, 592); this.shCv = Tex.canvas(1408, 592);
    this.wallTex = Tex.tex(this.wallCv, { repeat: false });
    this.wallM = std('#ffffff', { map: this.wallTex, roughness: 0.95, name: 'shadowWall' });
    add(new THREE.PlaneGeometry(D, ph), this.wallM, P.x1, py, cz, 0, -Math.PI / 2, 0, false);
    // wainscot panels all round, a dado rail, a picture rail, the cornice
    for (const [w, x, z, ry] of [[D, P.x0 + 0.02, cz, Math.PI / 2], [D, P.x1 - 0.02, cz, -Math.PI / 2], [W, cx, P.z0 + 0.02, 0], [W, cx, P.z1 - 0.02, Math.PI]]) {
      const m = box(w, 0.9, 0.04, x, 0.45, z, wains, ry);
      box(w, 0.05, 0.07, x, 0.92, z, trim, ry); box(w, 0.04, 0.05, x, 2.25, z, trim, ry); box(w, 0.12, 0.1, x, P.h - 0.06, z, std('#d8ccb4', { roughness: 0.8 }), ry);
      box(w, 0.12, 0.06, x, 0.06, z, trim, ry);
      m.castShadow = false;
    }
    add(new THREE.PlaneGeometry(W, D), std('#cfc4ae', { roughness: 0.95, name: 'parlourCeiling' }), cx, P.h, cz, Math.PI / 2, 0, 0, false);

    // ---- the fireplace: chimney breast, stone surround, iron grate, coals, flames; mantel with a clock
    const fx = P.fire.x, bz = P.z0 + 0.34, stone = std('#b8aa90', { roughness: 0.7, name: 'surround' }), soot = std('#120c09', { roughness: 1 });
    box(1.7, P.h - 1.22, 0.34, fx, 1.22 + (P.h - 1.22) / 2, P.z0 + 0.17, paperM);
    box(0.42, 1.12, 0.36, fx - 0.64, 0.56, P.z0 + 0.18, stone); box(0.42, 1.12, 0.36, fx + 0.64, 0.56, P.z0 + 0.18, stone);
    box(0.86, 0.36, 0.36, fx, 0.94, P.z0 + 0.18, stone);
    box(1.86, 0.06, 0.46, fx, 1.15, P.z0 + 0.22, std('#4a3020', { roughness: 0.45, name: 'mantel' }));
    add(new THREE.BoxGeometry(0.86, 0.76, 0.34), new THREE.MeshStandardMaterial({ color: '#100a08', roughness: 1, side: THREE.BackSide }), fx, 0.38, P.z0 + 0.17, 0, 0, 0, false);
    box(1.8, 0.05, 0.5, fx, 0.025, bz + 0.22, std('#2c2a28', { roughness: 0.6, name: 'hearth' }));
    const iron = std('#1c1a18', { roughness: 0.5, metalness: 0.6 });
    for (let k = 0; k < 6; k++) box(0.012, 0.2, 0.012, fx - 0.25 + k * 0.1, 0.2, bz - 0.05, iron);
    box(0.6, 0.02, 0.2, fx, 0.1, bz - 0.14, iron);
    this.coalM = std('#2a1408', { roughness: 0.9, emissive: '#ff5a1a', emissiveIntensity: 1.2, name: 'coals' });
    for (let k = 0; k < 22; k++) add(new THREE.DodecahedronGeometry(r.range(0.035, 0.06), 0), this.coalM, fx + r.range(-0.24, 0.24), 0.13 + r.range(0, 0.07), bz - 0.15 + r.range(-0.07, 0.06), r.range(0, 3), r.range(0, 3), 0, false);
    for (const [ox, a] of [[-0.08, 0.3], [0.1, -0.25]]) add(new THREE.CylinderGeometry(0.045, 0.05, 0.42, 8), std('#3a2414', { emissive: '#7a2a08', emissiveIntensity: 0.6 }), fx + ox, 0.2, bz - 0.13, 0, a, Math.PI / 2);
    // flames: soft additive billboards that lick and flicker
    const flameTex = this._flameTex();
    this.flames = [];
    for (let k = 0; k < 7; k++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ map: flameTex, color: new THREE.Color(1.0, 0.62, 0.3).multiplyScalar(2.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, name: 'flame' }));
      m.position.set(fx - 0.22 + k * 0.073, 0.17, bz - 0.13 + (k % 2) * 0.03); m.renderOrder = 5; g.add(m);
      this.flames.push({ m, k, w: 0.13 + r.range(0, 0.06), h: 0.28 + r.range(0, 0.16) });
    }
    this.fireLight = new THREE.PointLight('#ffa060', 0, 9, 1.3); this.fireLight.position.set(fx, 0.45, P.z0 + 0.6); g.add(this.fireLight);
    // mantel clock, candlesticks, a vase; a framed picture above
    const brass = std('#b08a48', { roughness: 0.3, metalness: 0.9, name: 'brass' }), wood2 = std('#5a3a24', { roughness: 0.5 });
    box(0.24, 0.26, 0.12, fx, 1.31, P.z0 + 0.2, wood2);
    add(new THREE.CylinderGeometry(0.075, 0.075, 0.01, 20), std('#ece4d0', { roughness: 0.6 }), fx, 1.32, P.z0 + 0.265, Math.PI / 2, 0, 0, false);
    this.clockHand = add(new THREE.BoxGeometry(0.004, 0.06, 0.003), std('#111'), fx, 1.32, P.z0 + 0.272, 0, 0, 0, false);
    for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(0.025, 0.04, 0.22, 10), brass, fx + s * 0.6, 1.29, P.z0 + 0.22); add(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 8), std('#f0e8d4'), fx + s * 0.6, 1.45, P.z0 + 0.22); }
    add(new THREE.SphereGeometry(0.07, 12, 8).scale(1, 1.3, 1), std('#3a5a6a', { roughness: 0.3 }), fx - 0.32, 1.27, P.z0 + 0.22);
    const pic = Tex.canvas(256, 192), pc = pic.getContext('2d');
    const sky = pc.createLinearGradient(0, 0, 0, 192); sky.addColorStop(0, '#9aa88c'); sky.addColorStop(1, '#d8c89a'); pc.fillStyle = sky; pc.fillRect(0, 0, 256, 192);
    pc.fillStyle = '#5a6a44'; pc.beginPath(); pc.moveTo(0, 130); pc.quadraticCurveTo(90, 90, 256, 120); pc.lineTo(256, 192); pc.lineTo(0, 192); pc.fill();
    pc.fillStyle = '#3a4a30'; for (let i = 0; i < 6; i++) { pc.beginPath(); pc.arc(30 + i * 40, 118 - (i % 2) * 8, 14, 0, Math.PI * 2); pc.fill(); }
    box(0.86, 0.66, 0.04, fx, 1.82, P.z0 + 0.36, std('#6a4a24', { roughness: 0.4, metalness: 0.3 }));
    add(new THREE.PlaneGeometry(0.74, 0.54), std('#ffffff', { map: Tex.tex(pic, { repeat: false }), roughness: 0.6 }), fx, 1.82, P.z0 + 0.385, 0, 0, 0, false);

    // ---- grandfather's wing armchair (oxblood leather) against the east wall
    const C = P.chair, lea = std('#5a2620', { roughness: 0.55, name: 'leather' });
    box(0.62, 0.2, 0.66, C.x + 0.12, 0.34, C.z, lea);                      // seat cushion
    box(0.66, 0.24, 0.7, C.x + 0.12, 0.13, C.z, std('#3a1a16'));
    box(0.16, 0.95, 0.74, C.x + 0.46, 0.72, C.z, lea);                     // back
    for (const s of [-1, 1]) { box(0.66, 0.22, 0.12, C.x + 0.12, 0.55, C.z + s * 0.36, lea); box(0.2, 0.36, 0.1, C.x + 0.36, 1.0, C.z + s * 0.33, lea); }  // arms, wings
    // footstool with the oil lamp
    const L = P.lamp;
    box(0.42, 0.08, 0.32, L.x, L.y - 0.04, L.z, std('#5a3a28', { roughness: 0.6 }));
    for (const [ox, oz] of [[-0.17, -0.12], [0.17, -0.12], [-0.17, 0.12], [0.17, 0.12]]) box(0.04, L.y - 0.08, 0.04, L.x + ox, (L.y - 0.08) / 2, L.z + oz, wood2);
    this._lamp(L.x, L.y, L.z, brass);
    // mother's chair beside the hearth (a plain spindle chair) and a sewing basket
    box(0.44, 0.04, 0.42, 1.62, 0.44, 198.42, wood2); box(0.44, 0.5, 0.04, 1.75, 0.7, 198.25, wood2, -0.7);
    for (const [ox, oz] of [[-0.18, -0.17], [0.18, -0.17], [-0.18, 0.17], [0.18, 0.17]]) box(0.03, 0.44, 0.03, 1.62 + ox, 0.22, 198.42 + oz, wood2);
    add(new THREE.CylinderGeometry(0.16, 0.13, 0.14, 14, 1, true), std('#a8844e', { roughness: 0.9, side: THREE.DoubleSide }), 1.25, 0.07, 198.35);
    // the low table with the checkerboard (south-west), a shelf of books, the window on the west wall
    const T = P.table;
    box(0.66, 0.04, 0.66, T.x, T.y - 0.02, T.z, wood2);
    for (const [ox, oz] of [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]]) box(0.04, T.y - 0.04, 0.04, T.x + ox, (T.y - 0.04) / 2, T.z + oz, wood2);
    this._checkers(T, r);
    // a candle on the table for the game
    add(new THREE.CylinderGeometry(0.035, 0.04, 0.012, 14), brass, T.x + 0.02, T.y + 0.006, T.z - 0.25);
    add(new THREE.CylinderGeometry(0.011, 0.011, 0.09, 10), std('#efe6d0', { roughness: 0.6 }), T.x + 0.02, T.y + 0.057, T.z - 0.25);
    this.candleFlame = new THREE.Mesh(new THREE.PlaneGeometry(0.018, 0.04).translate(0, 0.016, 0), new THREE.MeshBasicMaterial({ map: this._flameTex(), color: new THREE.Color(1.0, 0.78, 0.5).multiplyScalar(3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, name: 'candleFlame' }));
    this.candleFlame.position.set(T.x + 0.02, T.y + 0.104, T.z - 0.25); this.candleFlame.renderOrder = 7; g.add(this.candleFlame);
    this.candleLight = new THREE.PointLight('#ffc080', 0, 3.2, 1.6); this.candleLight.position.set(T.x + 0.02, T.y + 0.16, T.z - 0.25); g.add(this.candleLight);
    // moonlight through the west window: a faint cool fill so the firelight has something to warm against
    this.moon = new THREE.PointLight('#8aa0d0', 0, 6, 1.2); this.moon.position.set(P.x0 + 0.5, 1.7, 200.6); g.add(this.moon);
    box(1.1, 1.4, 0.3, -1.85, 0.7, P.z0 + 0.16, wood2);
    for (let k = 0; k < 3; k++) for (let i = 0; i < 12; i++) box(0.06, r.range(0.2, 0.27), 0.2, -2.3 + i * 0.08, 0.35 + k * 0.42, P.z0 + 0.2, std(r.pick(['#5a2a20', '#2a3a4a', '#3a4a2a', '#6a5030', '#4a2a3a']), { roughness: 0.8 }));
    const win = new THREE.MeshBasicMaterial({ color: new THREE.Color('#0d1626'), name: 'nightWindow' });
    add(new THREE.PlaneGeometry(1.0, 1.4), win, P.x0 + 0.01, 1.65, 200.6, 0, Math.PI / 2, 0, false);
    const sash = std('#e4dccb', { roughness: 0.6 });
    for (const dz of [-0.5, 0, 0.5]) box(0.04, 1.42, 0.04, P.x0 + 0.03, 1.65, 200.6 + dz, sash);
    for (const dy of [-0.7, 0, 0.7]) box(0.04, 0.04, 1.04, P.x0 + 0.03, 1.65 + dy, 200.6, sash);
    const drape = std('#5a1e1c', { roughness: 0.95, side: THREE.DoubleSide, name: 'drape' });
    for (const s of [-1, 1]) { const dg = new THREE.PlaneGeometry(0.42, 2.2, 8, 1), dp = dg.attributes.position; for (let i = 0; i < dp.count; i++) dp.setZ(i, 0.04 * Math.sin(dp.getX(i) * 30)); dg.computeVertexNormals(); add(dg, drape, P.x0 + 0.08, 1.48, 200.6 + s * 0.68, 0, Math.PI / 2, 0, false); }

    // ---- the picture book (held in your hands; parented to the camera in FILM.build)
    this.book = this._book();
  }

  _paperCanvas(w, h, r) {
    const cv = Tex.canvas(w, h), c = cv.getContext('2d');
    c.fillStyle = '#9a9c78'; c.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 64) { c.fillStyle = '#868a66'; c.fillRect(x, 0, 22, h); c.fillStyle = '#b4a678'; c.fillRect(x + 26, 0, 3, h); c.fillRect(x + 59, 0, 3, h); }
    c.fillStyle = 'rgba(200,180,120,0.55)';
    for (let x = 0; x < w; x += 64) for (let y = 0; y < h; y += 48) {
      const ox = x + 43, oy = y + ((x / 64) % 2) * 24 + 12;
      c.beginPath(); c.moveTo(ox, oy - 9); c.quadraticCurveTo(ox + 7, oy - 2, ox, oy + 9); c.quadraticCurveTo(ox - 7, oy - 2, ox, oy - 9); c.fill();
    }
    for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(${r.chance(0.5) ? '40,36,20' : '230,220,180'},${r.range(0.02, 0.06)})`; c.fillRect(r.range(0, w), r.range(0, h), 2, 2); }
    return cv;
  }

  _flameTex() {
    const cv = Tex.canvas(64, 128), c = cv.getContext('2d');
    const img = c.createImageData(64, 128);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 64; x++) {
      const u = (x - 32) / 32, v = 1 - y / 128;                     // v: 0 bottom → 1 top
      const wdt = 0.85 * Math.pow(Math.sin(Math.PI * Math.min(1, v * 1.1 + 0.08)), 0.7) * (1 - v * 0.55);
      const d = Math.abs(u) / Math.max(0.02, wdt), a = MathX.clamp(1 - d, 0, 1) * MathX.clamp(1.3 - v * 1.2, 0, 1);
      const core = MathX.clamp(1 - d * 1.6, 0, 1) * (1 - v);
      const i = (y * 64 + x) * 4;
      img.data[i] = 255; img.data[i + 1] = 150 + 105 * core; img.data[i + 2] = 60 + 150 * core; img.data[i + 3] = 255 * a * a;
    }
    c.putImageData(img, 0, 0);
    return Tex.tex(cv, { repeat: false });
  }

  _lamp(x, y, z, brass) {
    const g = this.root;
    const lathe = (pts, mat, yy) => { const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), 20), mat); m.position.set(x, yy, z); m.castShadow = true; g.add(m); return m; };
    lathe([[0, 0], [0.07, 0], [0.072, 0.012], [0.05, 0.03], [0.022, 0.05], [0.018, 0.12], [0.03, 0.135], [0, 0.14]], brass, y);
    lathe([[0, 0], [0.04, 0.005], [0.068, 0.04], [0.07, 0.07], [0.05, 0.1], [0.018, 0.11], [0, 0.11]], new THREE.MeshStandardMaterial({ color: '#a86a2a', roughness: 0.15, transparent: true, opacity: 0.75, name: 'lampFont' }), y + 0.13);
    lathe([[0.02, 0], [0.032, 0.0], [0.034, 0.02], [0.02, 0.025]], brass, y + 0.235);
    // the glass chimney: a bulge round the flame, a tall narrow neck
    const ch = lathe([[0.022, 0], [0.04, 0.03], [0.042, 0.06], [0.026, 0.1], [0.02, 0.2], [0.021, 0.22]], new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, name: 'lampGlass' }), y + 0.255);
    ch.castShadow = false; ch.renderOrder = 6;
    // the flame and its halo
    const fy = y + 0.295;
    this.lampFlame = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.06).translate(0, 0.02, 0), new THREE.MeshBasicMaterial({ map: this._flameTex(), color: new THREE.Color(1.0, 0.75, 0.45).multiplyScalar(3.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, name: 'lampFlame' }));
    this.lampFlame.position.set(x, fy - 0.015, z); this.lampFlame.renderOrder = 7; g.add(this.lampFlame);
    this.halo = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: Tex.softDot(), color: new THREE.Color(1.0, 0.7, 0.4).multiplyScalar(0.4), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, name: 'lampHalo' }));
    this.halo.position.set(x, fy + 0.01, z); this.halo.renderOrder = 8; g.add(this.halo);
    this.lampLight = new THREE.PointLight('#ffc68c', 0, 7, 1.4); this.lampLight.position.set(x, fy + 0.03, z); g.add(this.lampLight);
    this.lampPos = new THREE.Vector3(x, fy, z);
  }

  // the board: 8×8 on the table top; pieces by square [row, col], row 0 on the far (north) side
  _checkers(T, r) {
    const cv = Tex.canvas(256, 256), c = cv.getContext('2d');
    c.fillStyle = '#5a3a20'; c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? '#2a1a10' : '#d8c49a'; c.fillRect(16 + j * 28, 16 + i * 28, 28, 28); }
    const B = this.board = { x: T.x, y: T.y + 0.012, z: T.z, s: 0.042 };
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.012, 0.4), [0, 0, new THREE.MeshStandardMaterial({ map: Tex.tex(cv, { repeat: false }), roughness: 0.5 }), 0, 0, 0].map((x) => x || new THREE.MeshStandardMaterial({ color: '#4a2e18' })));
    m.position.set(T.x, T.y + 0.006, T.z); m.receiveShadow = true; this.root.add(m);
    const geo = new THREE.CylinderGeometry(0.017, 0.017, 0.01, 18);
    const red = new THREE.MeshStandardMaterial({ color: '#a32a20', roughness: 0.4, name: 'checkerRed' }), blk = new THREE.MeshStandardMaterial({ color: '#1a1614', roughness: 0.4, name: 'checkerBlack' });
    const black = [[4, 3], [2, 3], [0, 1], [0, 5], [0, 7], [1, 4], [1, 6], [2, 1], [2, 7]];
    const reds = [[5, 2], [5, 4], [5, 6], [6, 1], [6, 5], [7, 0], [7, 4], [6, 7], [7, 6]];
    this.pieces = {};
    const put = (rc, mat) => { const p = new THREE.Mesh(geo, mat); p.castShadow = true; p.position.copy(this.square(rc)); this.root.add(p); this.pieces[rc.join(',')] = p; return p; };
    black.forEach((rc) => put(rc, blk)); reds.forEach((rc) => put(rc, red));
    this.mover = this.pieces['5,2'];
  }

  // (you kneel on the east side, so the far side is west and columns run north → south... i.e. left → right)
  square([row, col], out = new THREE.Vector3()) {
    const B = this.board;
    return out.set(B.x + (row - 3.5) * B.s, B.y + 0.005, B.z - (col - 3.5) * B.s);
  }

  // where your piece is at time t (lifted, hopping, set down)
  moverAt(t, out) {
    const J = PARLOUR.jump, a = this.square(J.from), b = this.square(J.to[0]), c2 = this.square(J.to[1]);
    const hop = (p, q, u) => out.copy(p).lerp(q, u).setY(p.y + 0.012 + 0.05 * Math.sin(Math.PI * u));
    if (t < 71.3) return out.copy(a);
    if (t < J.t[0]) return out.copy(a).setY(a.y + 0.012 * MathX.smooth(t, 71.3, 71.4));
    if (t < J.t[0] + J.hop) return hop(a, b, Ease.inOutSine((t - J.t[0]) / J.hop));
    if (t < J.t[1]) return out.copy(b).setY(b.y + 0.012);
    if (t < J.t[1] + J.hop) return hop(b, c2, Ease.inOutSine((t - J.t[1]) / J.hop));
    return out.copy(c2).setY(c2.y + 0.012 * (1 - MathX.smooth(t, J.t[1] + J.hop, J.t[1] + J.hop + 0.06)));
  }

  _book() {
    const book = new THREE.Group(); book.name = 'pictureBook';
    const pw = 0.105, ph2 = 0.145;
    const cover = new THREE.MeshStandardMaterial({ color: '#6a2420', roughness: 0.8, name: 'bookCover' });
    const q = new RNG(77), pageTex = (draw) => { const cv = Tex.canvas(256, 356), c = cv.getContext('2d'); c.fillStyle = '#efe3c6'; c.fillRect(0, 0, 256, 356); c.fillStyle = 'rgba(120,90,50,0.08)'; for (let i = 0; i < 400; i++) c.fillRect(q.range(0, 256), q.range(0, 356), 2, 2); c.fillStyle = '#3a2a1c'; draw(c); return new THREE.MeshStandardMaterial({ map: Tex.tex(cv, { repeat: false }), roughness: 0.9 }); };
    const lines = (c, y0, n, x0 = 28, x1 = 228) => { for (let i = 0; i < n; i++) { const w = (x1 - x0) * (i === n - 1 ? 0.55 : 0.92 + 0.08 * Math.sin(i * 7)); c.fillRect(x0, y0 + i * 15, w, 5); } };
    const textPage = pageTex((c) => { c.font = '700 54px Lora, serif'; c.fillText('O', 26, 76); lines(c, 40, 3, 80); lines(c, 96, 14); });
    const shipPage = pageTex((c) => { ShadowArt.waves(c, 128, 236, 220, 0.9, 0.6); ShadowArt.ship(c, 128, 218, 0.52, 0.4); lines(c, 286, 3); });
    const dragonPage = pageTex((c) => { ShadowArt.dragon(c, 132, 160, 0.62, 0.5); lines(c, 270, 4); });
    const castlePage = pageTex((c) => { lines(c, 30, 6); ShadowArt.castle(c, 128, 286, 0.4, 0.3); });
    // covers: a slightly bigger board under each half, then the page blocks
    for (const s of [-1, 1]) {
      const cb = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.01, ph2 + 0.012, 0.004), cover); cb.position.set(s * (pw / 2 + 0.004), 0, -0.006); cb.rotation.y = -s * 0.1; book.add(cb);
      const blk = new THREE.Mesh(new THREE.BoxGeometry(pw, ph2, 0.008), new THREE.MeshStandardMaterial({ color: '#e8dcc0', roughness: 0.95 })); blk.position.set(s * pw / 2, 0, -0.001); blk.rotation.y = -s * 0.1; book.add(blk);
    }
    const page = (mat, side) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph2), mat); m.position.set(side * pw / 2, 0, 0.0035); m.rotation.y = -side * 0.1; book.add(m); return m; };
    this.pageL = page(textPage, -1); this.pageR = page(castlePage, 1);    // under the turning page: the castle spread
    this.leftAfter = dragonPage; this.leftBefore = textPage;
    // the turning page: front shows the ship, back the dragon
    const turn = new THREE.Group(); turn.position.z = 0.005; book.add(turn);
    const fr = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph2).translate(pw / 2, 0, 0), shipPage); turn.add(fr);
    const bk = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph2).translate(pw / 2, 0, 0), dragonPage); bk.rotation.y = Math.PI; bk.position.x = 0; turn.add(bk);
    bk.geometry = new THREE.PlaneGeometry(pw, ph2).translate(-pw / 2, 0, 0);
    this.turnPage = turn;
    book.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    book.visible = false;
    return book;
  }

  // the turning page's outer bottom corner (for the hand that turns it)
  pageCorner(out) { return out.set(0.1, -0.06, 0).applyMatrix4(this.turnPage.matrixWorld); }

  _drawWall(t) {
    const c = this.wallCv.getContext('2d'), W = this.wallCv.width, H = this.wallCv.height, A = PARLOUR.art;
    const s = this.shCv.getContext('2d');
    // wallpaper (the same paper as the other walls, at the same scale: 4.4 m ≙ 2 repeats per 2.6 m)
    const rep = (4.4 / 2.6) * 2, tw = W / rep;
    for (let i = 0; i < rep + 1; i++) c.drawImage(this.paper, i * tw, 0, tw, H * 1.0);
    // the shadow layer: white = no shadow, dark brown = shadow (multiplied onto the paper)
    s.globalCompositeOperation = 'source-over'; s.globalAlpha = 1; s.fillStyle = '#ffffff'; s.fillRect(0, 0, W, H);
    const fl = 1 + 0.006 * noise1(t * 9, 3), jx = 2.5 * noise1(t * 7, 5), jy = 2.0 * noise1(t * 6.3, 8);
    s.save(); s.translate(W / 2 + jx, H / 2 + jy); s.scale(fl, fl); s.translate(-W / 2, -H / 2);
    s.fillStyle = 'rgb(58,38,26)';
    // grandfather's head and shoulders, and the chair's wings, thrown up behind him by the low lamp
    const sway = 6 * Math.sin(t * 0.9), hx = 716 + sway, hy = 412;
    s.beginPath(); s.ellipse(hx, hy, 50, 60, 0.05, 0, Math.PI * 2); s.fill();
    s.beginPath(); s.moveTo(hx - 150, H); s.quadraticCurveTo(hx - 140, hy + 70, hx - 40, hy + 52); s.lineTo(hx + 40, hy + 52); s.quadraticCurveTo(hx + 140, hy + 70, hx + 150, H); s.fill();
    s.beginPath(); s.moveTo(hx - 230, H); s.lineTo(hx - 230, hy + 110); s.quadraticCurveTo(hx - 200, hy + 70, hx - 150, hy + 95); s.lineTo(hx + 150, hy + 95); s.quadraticCurveTo(hx + 200, hy + 70, hx + 230, hy + 110); s.lineTo(hx + 230, H); s.fill();
    // his gesturing hands while he tells the story, then raised for the shadow bird
    const raise = MathX.smooth(t, A.bird[0] - 0.2, A.bird[0] + 0.4);
    if (raise < 1) {
      s.globalAlpha = 1 - raise;
      for (const side of [-1, 1]) {
        const gx = hx + side * (110 + 30 * noise1(t * 1.4, side + 4)), gy = hy - 20 + 40 * noise1(t * 1.7, side + 9);
        s.beginPath(); s.ellipse(gx, gy, 34, 26, side * 0.5, 0, Math.PI * 2); s.fill();
        s.lineWidth = 34; s.strokeStyle = s.fillStyle; s.beginPath(); s.moveTo(gx, gy); s.lineTo(hx + side * 60, hy + 90); s.stroke();
      }
      s.globalAlpha = 1;
    }
    const fade = (span, inT = 0.5, outT = 0.5) => MathX.smooth(t, span[0], span[0] + inT) * (1 - MathX.smooth(t, span[1] - outT, span[1]));
    let a = fade(A.bird, 0.4, 0.5) * raise;
    if (a > 0.01) { s.globalAlpha = a; ShadowArt.bird(s, 730, 300 - 30 * raise, 1.45, t); }
    a = fade(A.ship, 0.6, 0.5);
    if (a > 0.01) {
      const u = (t - A.ship[0]) / (A.ship[1] - A.ship[0]), sc = 1.05 + 0.15 * u;
      s.globalAlpha = a; ShadowArt.waves(s, 716, 392, 900, 1.0, t); ShadowArt.ship(s, 600 + 220 * u, 366 + 4 * Math.sin(t * 1.7), sc, t);
    }
    a = fade(A.dragon, 0.5, 0.5);
    if (a > 0.01) {
      const u = (t - A.dragon[0]) / (A.dragon[1] - A.dragon[0]);
      s.globalAlpha = a; ShadowArt.dragon(s, 1000 - 560 * u, 250 + 40 * Math.sin(u * 5), 1.5, t, 1);
    }
    a = fade(A.castle, 0.7, 0.01);
    if (a > 0.01) {
      const rise = Ease.outCubic(MathX.clamp((t - A.castle[0]) / 1.0, 0, 1));
      s.globalAlpha = a; ShadowArt.castle(s, 716, 470 + 260 * (1 - rise), 1.3, t);
    }
    s.restore(); s.globalAlpha = 1;
    // multiply the (softened) shadows onto the paper
    c.save(); c.globalCompositeOperation = 'multiply'; c.filter = 'blur(3px)'; c.drawImage(this.shCv, 0, 0); c.restore();
    this.wallTex.needsUpdate = true;
  }

  // the picture book: open in your hands, a page turns, then it is lowered as you look up (posed before the hands are aimed at it)
  poseBook(t) {
    const B = PARLOUR.book, bookOn = t >= B.t0 && t < B.down[1];
    this.book.visible = bookOn;
    if (!bookOn) return;
    const turn = Ease.inOutSine(MathX.clamp((t - B.turn[0]) / (B.turn[1] - B.turn[0]), 0, 1));
    this.turnPage.rotation.y = -Math.PI * turn;
    this.turnPage.position.z = 0.005 + 0.004 * Math.sin(Math.PI * turn);
    this.pageL.material = turn > 0.98 ? this.leftAfter : this.leftBefore;
    const dn = Ease.inOutSine(MathX.clamp((t - B.down[0]) / (B.down[1] - B.down[0]), 0, 1));
    this.book.position.set(0, MathX.lerp(-0.045, -0.6, dn), MathX.lerp(-0.47, -0.36, dn));
    this.book.rotation.set(MathX.lerp(-0.5, -1.1, dn), 0, 0);
  }

  update(t, camera, visible) {
    this.root.visible = visible;
    this.fireLight.intensity = this.lampLight.intensity = this.candleLight.intensity = this.moon.intensity = 0;
    if (!visible) return;
    this.moon.intensity = 0.5;
    const ck = 0.9 + 0.1 * noise1(t * 11, 31);
    this.candleLight.intensity = 0.9 * ck; this.candleFlame.scale.set(1, ck, 1);
    this.candleFlame.rotation.y = Math.atan2(camera.position.x - this.candleFlame.position.x, camera.position.z - this.candleFlame.position.z);
    // fire: flickering light, glowing coals, licking flames
    const fk = 0.82 + 0.12 * noise1(t * 6.5, 11) + 0.06 * noise1(t * 17, 12);
    this.fireLight.intensity = 5.2 * fk;
    this.coalM.emissiveIntensity = 1.0 + 0.4 * noise1(t * 3, 13);
    for (const F of this.flames) {
      const n = noise1(t * 4.2 + F.k * 3.1, F.k + 20), n2 = noise1(t * 9 + F.k, F.k + 40);
      F.m.scale.set(F.w * (0.85 + 0.2 * n2), F.h * (0.7 + 0.45 * n), 1);
      F.m.rotation.set(0, Math.atan2(camera.position.x - F.m.position.x, camera.position.z - F.m.position.z), 0.12 * n2);
    }
    // the lamp: a steadier flame
    const lk = 0.95 + 0.05 * noise1(t * 8, 21);
    this.lampLight.intensity = 2.3 * lk;
    this.lampFlame.scale.set(1, lk, 1);
    this.lampFlame.rotation.y = Math.atan2(camera.position.x - this.lampFlame.position.x, camera.position.z - this.lampFlame.position.z);
    this.halo.quaternion.copy(camera.quaternion);
    this.clockHand.rotation.z = -Math.floor(t) * 0.1047;
    // checkers: your piece hops; the two it jumps are swept off as it passes over them
    this.moverAt(t, this.mover.position);
    const J = PARLOUR.jump;
    J.via.forEach((rc, i) => { const p = this.pieces[rc.join(',')], k = 1 - MathX.smooth(t, J.t[i] + J.hop * 0.5, J.t[i] + J.hop * 0.5 + 0.08); p.scale.setScalar(Math.max(0.001, k)); p.visible = k > 0.01; });
    this._drawWall(t);
  }
}
