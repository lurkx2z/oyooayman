/* =====================================================================
   TRAIN — three commuter cars. The front car is a full interior (you are in it): longitudinal benches, poles,
   grab rails and straps, sliding doors, windows, ceiling light strips, an LED destination line, posters, and
   the driver's cab behind a bulkhead door with a window: the console, the empty seat, the dead man's handle
   (sprung up since the driver vanished) and the emergency-brake lamp. The other two cars are shells with lit
   windows for the outside shots. Car-local metres: x across (+x right), y up from the car floor, z from the
   nose (0) toward the back (+z). Everything here moves with the train (built in its own materials, kept out
   of Look's world-space grime, which would crawl on a moving body).
   ===================================================================== */

const MD_CAR = {
  W: MD_G.carW, H: MD_G.carH, L: MD_G.carLen,
  wall: 1.38,                                    // interior wall face (|x|)
  doors: [6.1, 14.2], doorW: 1.4,                // door bay centres (both sides)
  benches: [[2.62, 5.3], [6.95, 13.35], [15.05, 19.55]],
  seatH: 0.45, seatD: 0.47,
  win: [0.94, 1.9],                              // window glass y range
};

// the straps' swing: they lean forward under braking, swing back when the train stops (pure function of t)
function mdStrapAngle(t, i) {
  const a = MD_TRAIN.a(t) / 1.4;
  const ph = i * 0.7;
  const kick = MathX.impulse(t, MD.brake, 1.1) * Math.sin((t - MD.brake) * 3.4 + ph) * 0.12 + MathX.impulse(t, MD.stop, 1.3) * Math.sin(Math.max(0, t - MD.stop) * 3.4 + ph) * 0.22
    + MathX.impulse(t, MD.hit + 0.05, 1.6) * Math.sin(Math.max(0, t - MD.hit) * 3.1 + ph) * 0.3;
  const sway = (t < MD.stop ? 0.03 * Math.sin(t * 2.1 + ph) * (MD_TRAIN.v(t) / 16) : 0);
  return 0.32 * a + kick + sway;
}

class MdTrain {
  constructor(scene) {
    this.g = new THREE.Group(); this.g.name = 'train'; scene.add(this.g);
    const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8 }, o));
    this.m = {
      paint: M('#c4c8cc', { roughness: 0.45, metalness: 0.25 }),
      band: M('#23282e', { roughness: 0.3, metalness: 0.2 }),
      stripe: M('#2f6b70', { roughness: 0.5 }),
      yellow: M('#d6a92a', { roughness: 0.55 }),
      under: M('#2a2b2d', { roughness: 0.85 }),
      wall: M('#d9d5cb', { roughness: 0.7 }),
      wallLow: M('#8e9198', { roughness: 0.75 }),
      ceiling: M('#e8e6e0', { roughness: 0.75 }),
      floor: new THREE.MeshStandardMaterial({ map: this._floorTex(), roughness: 0.82, name: 'car floor' }),
      seat: new THREE.MeshStandardMaterial({ map: this._moquette(), roughness: 0.95, name: 'moquette' }),
      seatShell: M('#3a4552', { roughness: 0.6 }),
      steel: M('#c8ccd0', { roughness: 0.22, metalness: 0.9 }),
      grip: M('#c9a63a', { roughness: 0.45 }),
      strap: M('#2a2d31', { roughness: 0.7 }),
      door: M('#b9bcc0', { roughness: 0.5, metalness: 0.3 }),
      doorEdge: M('#d39b25', { roughness: 0.5 }),
      dark: M('#1d2024', { roughness: 0.6 }),
      rubber: M('#151617', { roughness: 0.9 }),
      lightStrip: new THREE.MeshStandardMaterial({ color: '#fffaf0', emissive: '#fff4e2', emissiveIntensity: 2.2, roughness: 0.5, name: 'car lights' }),
      glass: new THREE.MeshBasicMaterial({ color: '#c8d6dc', transparent: true, opacity: 0.07, depthWrite: false, name: 'car glass' }),   // (no specular: the car's own lamps made orbs on it)
      glassOut: new THREE.MeshStandardMaterial({ color: '#1e262c', roughness: 0.12, metalness: 0.4, transparent: true, opacity: 0.55, depthWrite: false, name: 'shell glass' }),
      // the windscreen (seen from inside the cab): no specular, or the cab's own lamps make orbs on it
      wsGlass: new THREE.MeshBasicMaterial({ color: '#141a1f', transparent: true, opacity: 0.3, depthWrite: false, name: 'windscreen glass' }),
      litWin: new THREE.MeshStandardMaterial({ color: '#3a3830', emissive: '#f6ead2', emissiveIntensity: 0.75, roughness: 0.6, name: 'lit windows' }),
      console: M('#2b3036', { roughness: 0.55 }),
      lamp: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff3020').multiplyScalar(3.5), name: 'brake lamp' }),
      screen: new THREE.MeshBasicMaterial({ color: new THREE.Color('#6f9ab0').multiplyScalar(0.6), name: 'cab screen' }),
      head: new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff6e8').multiplyScalar(4), name: 'headlight' }),
    };
    this.front = new THREE.Group(); this.g.add(this.front);
    this._shell(this.front, true);
    this._interior(this.front);
    this._cab(this.front);
    // two more cars behind (shells with lit windows)
    for (let k = 1; k <= 2; k++) { const c = new THREE.Group(); c.position.z = k * (MD_CAR.L + 0.6); this._shell(c, false); this.g.add(c); }
    // interior lights (no shadows): fill the car with the strips' light
    this.lights = [];
    for (const z of [4.5, 10.2, 16.5]) { const L = new THREE.PointLight('#fff1dc', 5.5, 9, 1.6); L.position.set(0, 2.0, z); this.front.add(L); this.lights.push(L); }
    this.g.traverse((o) => { if (o.isMesh) { o.castShadow = !/glass/.test(o.material.name || '') && o.material !== this.m.lightStrip; o.receiveShadow = true; } });
  }

  _floorTex() {
    const c = Tex.canvas(256, 256), x = c.getContext('2d'), r = new RNG(31);
    x.fillStyle = '#4a4d50'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) { x.fillStyle = r.pick(['#5c5f62', '#3c3f42', '#6b6d6e', '#2f3134']); x.fillRect(r.range(0, 256), r.range(0, 256), 1.5, 1.5); }
    const t = Tex.tex(c); t.repeat.set(2, 8); return t;
  }
  _moquette() {
    const c = Tex.canvas(128, 128), x = c.getContext('2d'), r = new RNG(32);
    x.fillStyle = '#2d4660'; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) { x.fillStyle = (i + j) % 3 ? '#35516e' : '#8a3a3a'; x.fillRect(i * 14 + 3, j * 14 + 3, 6, 2); }
    for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(0,0,0,${r.range(0.05, 0.2)})`; x.fillRect(r.range(0, 128), r.range(0, 128), 1, 1); }
    const t = Tex.tex(c); t.repeat.set(1.5, 1.5); return t;
  }

  // a side wall with openings (windows, doors), at x = s·W/2, as boxes around the holes
  _side(B, s, full) {
    const C = MD_CAR, m = this.m, xo = s * (C.W / 2 - 0.04), L = C.L;
    const holes = [];
    for (const [a, b] of [[2.75, 5.25], [7.0, 10.1], [10.2, 13.3], [15.1, 17.3], [17.4, 19.5]]) holes.push([a, b, C.win[0], C.win[1], 'win']);
    for (const zc of C.doors) holes.push([zc - C.doorW / 2, zc + C.doorW / 2, 0.0, 2.0, 'door']);
    holes.push([0.25, 1.9, 1.0, 1.85, 'cabwin']);
    // bands: below the windows, above them, the roof edge
    const box = (w, h, d, x, y, z, mat) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); o.position.set(x, y, z); B.add(o); return o; };
    // continuous strips with gaps where doors are
    const spans = [[0.0, C.doors[0] - C.doorW / 2], [C.doors[0] + C.doorW / 2, C.doors[1] - C.doorW / 2], [C.doors[1] + C.doorW / 2, L]];
    for (const [a, b] of spans) {
      box(0.08, C.win[0] + 0.25, b - a, xo, (C.win[0] - 0.25) / 2, (a + b) / 2, m.paint);                   // below windows (down to the solebar)
      box(0.085, 0.16, b - a, xo + s * 0.005, 0.25, (a + b) / 2, m.stripe);
    }
    box(0.08, C.H + 0.35 - C.win[1], L, xo, (C.win[1] + C.H + 0.35) / 2, L / 2, m.paint);                    // above windows
    // pillars between window openings (paint), the dark window band behind the glass outside
    const winZ = holes.filter((h) => h[4] !== 'door').map((h) => [h[0], h[1]]).sort((p, q) => p[0] - q[0]);
    let z = 0;
    const solid = [];
    for (const [a, b] of winZ) { if (a > z + 0.01) solid.push([z, a]); z = b; }
    solid.push([z, L]);
    for (const [a, b] of solid) {
      const segs = [];
      let s0 = a; for (const zc of C.doors) { const d0 = zc - C.doorW / 2, d1 = zc + C.doorW / 2; if (d1 <= s0 || d0 >= b) continue; if (d0 > s0) segs.push([s0, d0]); s0 = Math.max(s0, d1); }
      if (b > s0) segs.push([s0, b]);
      for (const [p, q] of segs) if (q - p > 0.01) box(0.08, C.win[1] - C.win[0], q - p, xo, (C.win[0] + C.win[1]) / 2, (p + q) / 2, m.paint);
    }
    // doors: closed sliding leaves with windows and yellow edges (the door gap is a dark seam)
    for (const zc of C.doors) {
      for (const e of [-1, 1]) {
        const lz = zc + e * C.doorW / 4;
        box(0.05, 0.98, C.doorW / 2 - 0.02, xo - s * 0.02, 0.49, lz, m.door);
        box(0.05, 0.14, C.doorW / 2 - 0.02, xo - s * 0.02, 1.93, lz, m.door);
        for (const ez of [-1, 1]) box(0.05, 0.9, 0.08, xo - s * 0.02, 1.43, lz + ez * (C.doorW / 4 - 0.05), m.door);
        box(0.06, 2.0, 0.035, xo - s * 0.025, 1.0, zc + e * 0.02, m.doorEdge);
        const gl = new THREE.Mesh(new THREE.PlaneGeometry(C.doorW / 2 - 0.16, 0.86), m.glass); gl.position.set(xo - s * 0.02, 1.43, lz); gl.rotation.y = s * Math.PI / 2; B.add(gl);
      }
    }
    // window glass (inside the openings)
    for (const [a, b, y0, y1, k] of holes) {
      if (k === 'door') continue;
      const gl = new THREE.Mesh(new THREE.PlaneGeometry(b - a, y1 - y0), full ? m.glass : m.glassOut);
      gl.position.set(xo, (y0 + y1) / 2, (a + b) / 2); gl.rotation.y = s * Math.PI / 2; B.add(gl);
      if (!full && k === 'win') { const lw = new THREE.Mesh(new THREE.PlaneGeometry(b - a - 0.05, y1 - y0 - 0.05), m.litWin); lw.position.set(xo - s * 0.35, (y0 + y1) / 2, (a + b) / 2); lw.rotation.y = s * Math.PI / 2; B.add(lw); }
      // rubber frames
      box(0.1, 0.05, b - a, xo, y0, (a + b) / 2, m.rubber); box(0.1, 0.05, b - a, xo, y1, (a + b) / 2, m.rubber);
    }
  }

  _shell(g, full) {
    const C = MD_CAR, m = this.m, B = new THREE.Group(); g.add(B);
    const box = (w, h, d, x, y, z, mat) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); o.position.set(x, y, z); B.add(o); return o; };
    for (const s of [-1, 1]) this._side(B, s, full);
    // roof (three facets) and its equipment
    box(C.W - 0.6, 0.08, C.L, 0, C.H + 0.38, C.L / 2, m.paint);
    for (const s of [-1, 1]) { const r = box(0.42, 0.08, C.L, s * (C.W / 2 - 0.2), C.H + 0.3, C.L / 2, m.paint); r.rotation.z = -s * 0.42; }
    box(1.2, 0.3, 2.6, 0, C.H + 0.55, C.L * 0.5, m.under);
    // underframe, bogies with wheels
    box(C.W - 0.3, 0.55, C.L - 1.0, 0, -0.32, C.L / 2, m.under);
    for (const zb of [3.2, C.L - 3.2]) {
      box(2.2, 0.35, 2.8, 0, -0.62, zb, m.under);
      for (const dz of [-1.05, 1.05]) for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.14, 16), m.under); w.rotation.z = Math.PI / 2; w.position.set(s * 0.72, -0.68, zb + dz); B.add(w); }
    }
    for (let z = 5; z < C.L - 5; z += 3.3) box(1.4, 0.5, 1.8, (z % 2 ? 0.4 : -0.4), -0.7, z, m.under);
    // the back end (gangway) and, on the front car, the nose
    box(C.W - 0.1, C.H + 0.4, 0.08, 0, (C.H + 0.4) / 2 - 0.05, C.L - 0.04, m.paint);
    if (full) {
      // nose: a sloped dark windscreen over a yellow warning panel, headlights, a coupler
      box(C.W - 0.04, 0.95, 0.12, 0, 0.42, -0.02, m.yellow);
      const ws = box(C.W - 0.3, 1.25, 0.06, 0, 1.55, 0.12, m.wsGlass); ws.rotation.x = -0.18;
      box(C.W - 0.04, 0.5, 0.12, 0, 2.35, 0.0, m.paint);
      for (const s of [-1, 1]) { box(0.3, 0.14, 0.05, s * 1.0, 0.75, -0.1, m.head); box(0.12, 0.08, 0.05, s * 1.0, 0.55, -0.1, m.lamp); box(0.14, C.H + 0.4, 0.4, s * (C.W / 2 - 0.07), (C.H + 0.4) / 2 - 0.05, 0.15, m.paint); }
      box(0.5, 0.3, 0.6, 0, -0.35, -0.25, m.under);
      // interior face of the windscreen (glass you look through from the cab door)
      const wsIn = new THREE.Mesh(new THREE.PlaneGeometry(C.W - 0.36, 1.2), m.glass); wsIn.position.set(0, 1.55, 0.16); wsIn.rotation.x = -0.18; B.add(wsIn);
    } else {
      box(C.W - 0.1, C.H + 0.4, 0.08, 0, (C.H + 0.4) / 2 - 0.05, 0.04, m.paint);
      // a pantograph on the second car's roof
      if (g.position.z < 25) {
        const p = new THREE.Group(); p.position.set(0, C.H + 0.62, 9); B.add(p);
        const a1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 2.0), m.steel); a1.position.set(0, 0.55, 0.6); a1.rotation.x = 0.6; p.add(a1);
        const a2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 2.0), m.steel); a2.position.set(0, 1.55, 0.6); a2.rotation.x = -0.6; p.add(a2);
        const hd = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.25), m.steel); hd.position.set(0, 2.15, 0.0); p.add(hd);
      }
    }
  }

  _interior(g) {
    const C = MD_CAR, m = this.m, W = C.wall;
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); g.add(o); return o; };
    const box = (w, h, d, x, y, z, mat) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
    const z0 = C.benches[0][0] - 0.2, z1 = C.L - 0.1;
    // floor, ceiling (flat centre + coved sides), inner wall linings around the windows
    box(C.W - 0.12, 0.05, z1 - z0, 0, -0.025, (z0 + z1) / 2, m.floor);
    box(1.9, 0.04, z1 - z0, 0, C.H, (z0 + z1) / 2, m.ceiling);
    for (const s of [-1, 1]) {
      const cv = box(0.46, 0.04, z1 - z0, s * 1.15, C.H - 0.1, (z0 + z1) / 2, m.ceiling); cv.rotation.z = s * 0.45;
      // light strips (diffusers) along each side of the ceiling
      box(0.18, 0.02, z1 - z0 - 0.6, s * 0.62, C.H - 0.015, (z0 + z1) / 2, m.lightStrip);
      // linings: below the windows (darker), above the windows (the poster band)
      box(0.04, C.win[0] - 0.45, z1 - z0, s * W, 0.45 + (C.win[0] - 0.45) / 2, (z0 + z1) / 2, m.wallLow);
      box(0.04, C.H - 0.12 - C.win[1], z1 - z0, s * W, C.win[1] + (C.H - 0.12 - C.win[1]) / 2, (z0 + z1) / 2, m.wall);
      // window reveals and pillars on the inside
      for (const [a, b] of [[2.75, 5.25], [7.0, 10.1], [10.2, 13.3], [15.1, 17.3], [17.4, 19.5]]) {
        box(0.12, 0.04, b - a, s * (W - 0.05), C.win[0] - 0.02, (a + b) / 2, m.wall);
        box(0.12, 0.03, b - a, s * (W - 0.05), C.win[1] + 0.015, (a + b) / 2, m.wall);
      }
      for (const zp of [5.25, 7.0, 10.15, 13.3, 15.1, 17.35, 19.5]) box(0.1, C.win[1] - C.win[0], 0.1, s * (W - 0.03), (C.win[0] + C.win[1]) / 2, zp, m.wall);
      // posters above the windows (generic: a route map, a museum, a ferry timetable…)
      for (const [i, zc] of [[0, 4.0], [1, 8.55], [2, 11.75], [3, 16.2], [4, 18.45]].map(([k, z]) => [k + (s > 0 ? 0 : 5), z])) {
        const tex = this._poster(i);
        add(new THREE.PlaneGeometry(1.5, 0.3), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, name: 'poster' }), s * (W - 0.03), 2.03, zc, 0, -s * Math.PI / 2, 0);
      }
      // benches: a shell, cushions (one per seat), a sloped back
      for (const [a, b] of C.benches) {
        const len = b - a, n = Math.round(len / 0.48), sw = len / n;
        box(C.seatD, 0.42, len, s * (W - C.seatD / 2), 0.21, (a + b) / 2, m.seatShell);
        for (let k = 0; k < n; k++) {
          const zc = a + (k + 0.5) * sw;
          const cu = add(new THREE.BoxGeometry(C.seatD - 0.04, 0.09, sw - 0.03), m.seat, s * (W - C.seatD / 2 - 0.01), C.seatH - 0.03, zc); cu.geometry.translate(0, 0, 0);
          const bk = add(new THREE.BoxGeometry(0.08, 0.5, sw - 0.03), m.seat, s * (W - 0.07), C.seatH + 0.3, zc, 0, 0, s * 0.12);
          void bk;
        }
        // end screens (glass-topped panels) at the door ends, with a pole
        for (const ze of [a, b]) {
          const near = C.doors.some((d) => Math.abs(d - ze) < 1.2);
          if (!near) continue;
          box(C.seatD + 0.08, 0.9, 0.03, s * (W - (C.seatD + 0.08) / 2), 0.55, ze, m.wall);
          box(0.035, 0.035, C.seatD + 0.08, s * (W - (C.seatD + 0.08) / 2), 1.02, ze, m.steel);
          add(new THREE.CylinderGeometry(0.019, 0.019, C.H, 10), m.steel, s * (W - C.seatD - 0.05), C.H / 2, ze);
        }
      }
      // the longitudinal grab rail above each side, with brackets and straps (the straps are animated: this.straps)
      add(new THREE.CylinderGeometry(0.017, 0.017, z1 - z0 - 0.4, 10), m.steel, s * 0.72, 1.93, (z0 + z1) / 2, Math.PI / 2, 0, 0);
      for (let z = z0 + 0.4; z < z1; z += 2.2) box(0.03, C.H - 1.93, 0.03, s * 0.72, (C.H + 1.93) / 2, z, m.steel);
    }
    // centre poles in the door bays
    for (const zc of C.doors) add(new THREE.CylinderGeometry(0.019, 0.019, C.H, 12), m.steel, 0, C.H / 2, zc);
    this.poles = C.doors.map((zc) => [0, zc]);
    // straps: a loop on a strap, pivoting on the rail
    this.straps = [];
    const strapG = new THREE.BoxGeometry(0.03, 0.22, 0.012); strapG.translate(0, -0.11, 0);
    const loopG = new THREE.TorusGeometry(0.06, 0.012, 6, 14); loopG.translate(0, -0.27, 0);
    let i = 0;
    for (const s of [-1, 1]) for (const [a, b] of C.benches) for (let z = a + 0.35; z < b - 0.2; z += 0.6) {
      const p = new THREE.Group(); p.position.set(s * 0.72, 1.92, z); g.add(p);
      p.add(new THREE.Mesh(strapG, m.strap)); p.add(new THREE.Mesh(loopG, m.grip));
      this.straps.push({ p, i: i++, s, z });
    }
    // the destination line above the cab door (an LED strip: it keeps scrolling)
    {
      const W = 1536, H = 64, c = Tex.canvas(W, H), x = c.getContext('2d');
      x.fillStyle = '#050505'; x.fillRect(0, 0, W, H);
      x.fillStyle = '#ffad2a'; x.font = `700 40px ${Tex.fontCond}`; x.textBaseline = 'middle';
      x.fillText('NEXT STOP: HARBOUR SOUTH  ·  CITY LINE TO OLD TOWN  ·  MIND THE GAP  ·', 20, H / 2 + 2);
      x.fillStyle = 'rgba(0,0,0,0.55)';
      for (let i = 0; i < W; i += 4) x.fillRect(i, 0, 1.4, H);
      for (let j = 0; j < H; j += 4) x.fillRect(0, j, W, 1.4);
      this.led = Tex.tex(c, { repeat: true }); this.led.repeat.set(0.3, 1);
    }
    const ledM = new THREE.MeshBasicMaterial({ map: this.led, color: new THREE.Color(1.5, 1.5, 1.5), name: 'led' });
    box(1.3, 0.16, 0.04, 0, 2.08, MD_G.cab + 0.04, m.dark);
    this.ledMesh = add(new THREE.PlaneGeometry(1.2, 0.11), ledM, 0, 2.08, MD_G.cab + 0.065);
    // the cab bulkhead with its door (a window in it)
    const bz = MD_G.cab;
    for (const s of [-1, 1]) box(1.0, C.H, 0.06, s * 0.95, C.H / 2, bz, m.wall);
    box(0.9, C.H - 1.86, 0.05, 0, (C.H + 1.86) / 2, bz, m.wall);
    // the door itself slides into the wall on the right (you open it near the end)
    const dGrp = new THREE.Group(); g.add(dGrp); this.cabDoor = dGrp;
    const dbox = (w, h, d, x, y, z, mat) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); o.position.set(x, y, z); dGrp.add(o); return o; };
    dbox(0.9, 0.98, 0.05, 0, 0.49, bz - 0.07, m.door);
    for (const s of [-1, 1]) dbox(0.12, 0.88, 0.05, s * 0.39, 1.42, bz - 0.07, m.door);
    dbox(0.66, 0.04, 0.05, 0, 0.99, bz - 0.07, m.door); dbox(0.66, 0.04, 0.05, 0, 1.85, bz - 0.07, m.door);
    const dg = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.84), m.glass); dg.position.set(0, 1.42, bz - 0.07); dGrp.add(dg);
    dbox(0.03, 0.18, 0.04, -0.33, 1.0, bz - 0.11, m.steel);                                          // the handle
    this.doorFrame = { z: bz + 0.05, x: [-0.4, 0.4], y: [0.99, 1.86] };
  }

  _poster(i) {
    const c = Tex.canvas(512, 102), x = c.getContext('2d');
    const P = [
      ['#1f3b4d', '#e9e1cf', 'CITY LINE', 'HARBOUR SOUTH · OLD TOWN · CENTRAL'],
      ['#7a3b2a', '#f2e6d0', 'MARITIME MUSEUM', 'OPEN DAILY · FREE ON SUNDAYS'],
      ['#2f4a3a', '#efe7d4', 'FERRY TIMETABLE', 'EVERY 20 MINUTES FROM PIER 3'],
      ['#d9cfb8', '#2a2a2a', 'PLEASE OFFER YOUR SEAT', 'TO THOSE WHO NEED IT MORE'],
      ['#3a3f4a', '#e8e0cc', 'CITY LIBRARY', 'LATE OPENING THURSDAYS'],
      ['#5a4a6a', '#efe7d8', 'HARBOUR FESTIVAL', '12–14 OCTOBER'],
      ['#c4b89c', '#23282e', 'MIND THE GAP', 'BETWEEN THE TRAIN AND THE PLATFORM'],
      ['#244a5a', '#e9e1cf', 'NIGHT BUS N4', 'ALL STOPS TO THE HARBOUR'],
      ['#6b5a3a', '#f1e8d6', 'FRESH COFFEE', 'STATION KIOSKS · 6AM–10PM'],
      ['#2e3b4a', '#e8e2d2', 'CITY LINE', 'NEXT TRAIN EVERY 6 MINUTES'],
    ][i % 10];
    x.fillStyle = P[0]; x.fillRect(0, 0, 512, 102);
    x.fillStyle = 'rgba(255,255,255,0.08)'; x.beginPath(); x.arc(450, 51, 60, 0, Math.PI * 2); x.fill();
    x.fillStyle = P[1]; x.font = '600 34px "Lora"'; x.fillText(P[2], 22, 46);
    x.font = '500 17px "Inter"'; x.globalAlpha = 0.85; x.fillText(P[3], 22, 78);
    return Tex.tex(c, { repeat: false });
  }

  // the cab: console, screens, the empty seat, the dead man's handle, the emergency brake lamp
  _cab(g) {
    const m = this.m, add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); g.add(o); return o; };
    const box = (w, h, d, x, y, z, mat) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
    box(MD_CAR.W - 0.12, 0.05, 2.3, 0, -0.025, 1.25, m.floor);
    box(2.0, 0.04, 2.3, 0, MD_CAR.H, 1.25, m.ceiling);
    const desk = box(2.3, 0.85, 0.75, 0, 0.6, 0.62, m.console);
    const top = box(2.3, 0.05, 0.75, 0, 1.05, 0.66, m.console); top.rotation.x = 0.28; void desk;
    {
      const c = Tex.canvas(256, 128), x = c.getContext('2d');
      x.fillStyle = '#0c1218'; x.fillRect(0, 0, 256, 128);
      x.strokeStyle = '#3f6f86'; x.lineWidth = 4; x.beginPath(); x.arc(64, 70, 40, Math.PI * 0.8, Math.PI * 2.2); x.stroke();
      x.strokeStyle = '#d65a3a'; x.beginPath(); x.moveTo(64, 70); x.lineTo(40, 42); x.stroke();
      x.fillStyle = '#7fb0c8'; x.font = '600 18px "JetBrains Mono"'; x.fillText('0 km/h', 34, 112);
      x.strokeStyle = '#4f7f96'; x.lineWidth = 3; x.beginPath(); x.moveTo(130, 64); x.lineTo(246, 64); x.stroke();
      const scm = new THREE.MeshBasicMaterial({ map: Tex.tex(c, { repeat: false }), color: new THREE.Color(0.75, 0.75, 0.75), name: 'cab screen' });
      for (const [x2, w] of [[-0.55, 0.36], [0.05, 0.42]]) add(new THREE.PlaneGeometry(w, 0.2), scm, x2, 1.13, 0.5, -1.1, 0, 0);
    }
    // the driver's seat (empty) on the left of the cab, the second seat on the right
    for (const sx of [-0.55, 0.6]) {
      box(0.5, 0.1, 0.5, sx, 0.52, 1.55, m.seatShell);
      box(0.5, 0.65, 0.08, sx, 0.9, 1.82, m.seatShell);
      add(new THREE.CylinderGeometry(0.04, 0.05, 0.47, 8), m.steel, sx, 0.24, 1.55);
    }
    // the dead man's handle: a T-grip on a stalk on the right of the desk (sprung up once nobody holds it down)
    this.dmh = new THREE.Group(); this.dmh.position.set(-0.22, 1.12, 0.85); g.add(this.dmh);
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 8), m.steel); st.position.y = 0.1; this.dmh.add(st);
    const tg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 10), m.grip); tg.rotation.z = Math.PI / 2; tg.position.y = 0.2; this.dmh.add(tg);
    // the emergency brake lamp and its label
    this.brakeLamp = add(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12), m.lamp, 0.82, 1.13, 0.6, 0.28, 0, 0);
    const lab = Tex.label(['EMERGENCY', 'BRAKE'], { w: 256, h: 128, bg: '#1c1f22', fg: '#e8e2d2', font: 40 });
    add(new THREE.PlaneGeometry(0.16, 0.08), new THREE.MeshBasicMaterial({ map: lab, color: new THREE.Color(0.7, 0.7, 0.7), name: 'cab label' }), 0.98, 1.13, 0.6, -1.3, 0, 0);
    // a cab light
    const cl = new THREE.PointLight('#e8f0ff', 1.6, 4, 1.8); cl.position.set(0, 2.0, 1.4); g.add(cl);
  }

  update(t) {
    this.g.position.set(MD_G.trackX, MD_G.floorY, mdNoseZ(t));
    // the car rocks gently while it runs, dips at the brake, rocks at the stop and at the impact
    const run = MD_TRAIN.v(t) / 16;
    const roll = run * 0.004 * Math.sin(t * 1.7) + MathX.impulse(t, MD.hit + 0.05, 0.9) * Math.sin(Math.max(0, t - MD.hit) * 7) * 0.012 + MathX.impulse(t, MD.hit + 1.9, 1.2) * Math.sin(Math.max(0, t - MD.hit - 1.9) * 5) * 0.01;
    const pitch = 0.004 * mdSurge(t) - 0.003 * MathX.impulse(t, MD.stop, 0.4) * Math.sin(Math.max(0, t - MD.stop) * 9);
    this.g.rotation.set(-pitch, 0, roll);
    for (const S of this.straps) S.p.rotation.x = -mdStrapAngle(t, S.i) + (S.held && t < MD.vanish ? 0.0 : 0);
    this.led.offset.x = (t * 0.07) % 1;
    this.cabDoor.position.x = 0.86 * Ease.inOutSine(MathX.clamp((t - 35.5) / 0.7, 0, 1));
    // the dead man's handle springs up when the driver vanishes; the lamp lights when the brake applies, and blinks
    this.dmh.rotation.x = -0.5 * (1 - MathX.smooth(t, MD.vanish, MD.vanish + 0.12));
    const on = t > MD.brake ? (Math.floor((t - MD.brake) * 2.5) % 2 === 0 ? 1 : 0.15) : 0.08;
    this.m.lamp.color.setRGB(1.8 * on, 0.3 * on, 0.2 * on);
  }
}
