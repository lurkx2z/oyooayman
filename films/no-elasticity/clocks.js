/* =====================================================================
   CLOCKS — the payoff: keeping time depends on springing back. Pure functions of time.
     NeClock   the plaza's post clock (two quartz dials). Its seconds hand steps to :52 one second into the video and
               never moves again. At dusk its dials light up from inside.
     NeQuartz  inside your watch, built 100× life size in a dark set far from the plaza: the dial lifts away; the
               battery, the motor coil, the gears and the quartz crystal in its can, cut open: a tuning fork about
               4 mm long that should spring back 32,768 times a second. A yellow ghost shows what it normally does;
               the real prongs never move.
     NeLapse   the rest of the day over the plaza in time-lapse: lamps and their pools of light, a time-lapse crowd,
               the trampoline sinking further with each heavier jumper, dropped arrows piling up at the shooting
               line. (The light itself is NeCity._lapse; the trees bent further by each gust are NeCity's lean.)
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// the plaza clock (just inside the left edge of the opening frame)
// ---------------------------------------------------------------------------------------------------------------------
const NE_CLOCK = { x: 13.25, z: -9.76, h: 3.5, r: 0.36, ry: -0.281 };
// the seconds it shows: 3:41:51 at the first frame; one step to :52 one second in, then never again
const neClockSec = (t) => (t < NE.stop ? 51 : 52);
// hand angles (radians, clockwise from 12 when seen from the front) for 3:41:<sec>
function neHandAngles(sec) {
  const S = NE_STOPPED, T = Math.PI * 2;
  return { h: -((S.h % 12) + S.m / 60 + sec / 3600) / 12 * T, m: -(S.m + sec / 60) / 60 * T, s: -sec / 60 * T };
}
// dusk (0 → 1): lamps, the clock's lit dials, glowing shop windows
function neDusk(t) { return t < NE.lapse[0] ? 0 : MathX.smooth(neSunMinutes(t), 19 * 60 + 45, 20 * 60 + 35); }

function neClockDial() {
  const c = Tex.canvas(1024, 1024), x = c.getContext('2d');
  x.fillStyle = '#f6f3ea'; x.beginPath(); x.arc(512, 512, 512, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#16181a';
  for (let i = 0; i < 60; i++) { x.save(); x.translate(512, 512); x.rotate(i / 60 * Math.PI * 2); const big = i % 5 === 0; x.fillRect(-(big ? 13 : 4), -492, big ? 26 : 8, big ? 92 : 34); x.restore(); }
  x.font = '500 124px "Lora", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  for (let n = 1; n <= 12; n++) { const A = n / 12 * Math.PI * 2, r = 316; x.fillText(String(n), 512 + Math.sin(A) * r, 512 - Math.cos(A) * r + 8); }
  return c;
}

class NeClock {
  constructor(scene) {
    const C = NE_CLOCK, g = new THREE.Group(); g.position.set(C.x, 0.15, C.z); g.rotation.y = C.ry; scene.add(g); this.g = g;
    const iron = Mat.std('#1e2326', { roughness: 0.42, metalness: 0.6 }), brass = Mat.std('#b48c3c', { roughness: 0.32, metalness: 0.85 });
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, par = g) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; par.add(o); return o; };
    const H = C.h - 0.15, top = H - C.r - 0.1;
    // plinth, a fluted post, a collar under the drum, the drum, a finial
    add(new THREE.CylinderGeometry(0.2, 0.27, 0.6, 16), iron, 0, 0.3, 0);
    add(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 16), iron, 0, 0.63, 0);
    add(new THREE.CylinderGeometry(0.072, 0.092, top - 0.66, 16), iron, 0, (top + 0.66) / 2, 0);
    add(new THREE.CylinderGeometry(0.14, 0.09, 0.18, 16), iron, 0, top + 0.02, 0);
    add(new THREE.CylinderGeometry(C.r + 0.07, C.r + 0.07, 0.22, 40), iron, 0, H, 0, Math.PI / 2);
    add(new THREE.CylinderGeometry(0.03, 0.05, 0.14, 10), iron, 0, H + C.r + 0.12, 0);
    add(new THREE.SphereGeometry(0.055, 12, 8), brass, 0, H + C.r + 0.22, 0);
    this.tex = Tex.tex(neClockDial()); this.dialMats = [];
    this.faces = [1, -1].map((s) => {
      const f = new THREE.Group(); f.position.set(0, H, s * 0.112); f.rotation.y = s > 0 ? 0 : Math.PI; g.add(f);
      const dm = new THREE.MeshStandardMaterial({ map: this.tex, emissiveMap: this.tex, emissive: new THREE.Color('#ffe9c4'), emissiveIntensity: 0, roughness: 0.45, name: 'neClockDial' });
      this.dialMats.push(dm);
      add(new THREE.CircleGeometry(C.r, 48), dm, 0, 0, 0, 0, 0, 0, f).castShadow = false;
      add(new THREE.TorusGeometry(C.r + 0.026, 0.03, 8, 48), brass, 0, 0, 0.004, 0, 0, 0, f);
      const hand = (len, w, mat, z, tail = 0) => { const h = new THREE.Group(); h.position.z = z; f.add(h); add(new THREE.BoxGeometry(w, len + tail, 0.008), mat, 0, (len - tail) / 2, 0, 0, 0, 0, h); return h; };
      const black = Mat.std('#141618', { roughness: 0.5 }), red = Mat.std('#c8261b', { roughness: 0.45 });
      const o = { hr: hand(0.2, 0.032, black, 0.012), min: hand(0.3, 0.022, black, 0.024), sec: hand(0.33, 0.011, red, 0.036, 0.08) };
      add(new THREE.CylinderGeometry(0.018, 0.018, 0.014, 12), red, 0, 0, 0.044, Math.PI / 2, 0, 0, f);
      return o;
    });
    this._s = -1;
  }

  update(t) {
    const s = neClockSec(t);
    if (s !== this._s) { this._s = s; const a = neHandAngles(s); for (const f of this.faces) { f.hr.rotation.z = a.h; f.min.rotation.z = a.m; f.sec.rotation.z = a.s; } }
    const k = neDusk(t); for (const m of this.dialMats) m.emissiveIntensity = 0.85 * k;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// inside the watch (100× life size: built in real millimetres, the group scaled by 0.1 m per mm)
// ---------------------------------------------------------------------------------------------------------------------
const NE_Q = {
  o: [-300, 30, 300],                 // the set's origin in the world (far from everything; a dark sphere closes it)
  k: 0.1,                             // metres per real millimetre
  can: [-4.5, 1.5, 7.6],              // the crystal's can (mm): centre; it lies along +X (up the screen)
  dialUp: [31.3, 31.95],              // the dial lifts away
  ghost: [33.65, 35.85],              // the yellow ghost: what the prongs normally do
};
const neQ = (x, y, z) => [NE_Q.o[0] + x * NE_Q.k, NE_Q.o[1] + y * NE_Q.k, NE_Q.o[2] + z * NE_Q.k];

class NeQuartz {
  constructor(scene) {
    const g = new THREE.Group(); g.name = 'neQuartz'; g.position.set(...NE_Q.o); g.scale.setScalar(NE_Q.k); scene.add(g); this.g = g;
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, par = g) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; par.add(o); return o; };
    const rng = new RNG(3276);
    // the dark set
    { const m = new THREE.MeshBasicMaterial({ color: '#0c0f13', side: THREE.BackSide, fog: false }), s = new THREE.Mesh(new THREE.SphereGeometry(140, 32, 16), m);
      s.position.set(0, 10, 0); s.castShadow = false; s.receiveShadow = false; g.add(s); }
    // materials
    const grain = (() => { const c = Tex.canvas(512, 512), x = c.getContext('2d'); x.fillStyle = '#b4b8bc'; x.fillRect(0, 0, 512, 512);
      for (let r = 4; r < 362; r += 3) { x.strokeStyle = `rgba(${r % 2 ? 255 : 60},${r % 2 ? 255 : 64},${r % 2 ? 255 : 70},${0.05 + 0.05 * Math.sin(r * 0.7)})`; x.lineWidth = 1.6; x.beginPath(); x.arc(256, 256, r, 0, Math.PI * 2); x.stroke(); }
      return Tex.tex(c); })();
    const plate = new THREE.MeshStandardMaterial({ map: grain, color: '#c9ccd0', roughness: 0.36, metalness: 0.85, name: 'neQPlate' });
    const steel = Mat.std('#d2d6da', { roughness: 0.2, metalness: 0.92 }), dark = Mat.std('#2c3036', { roughness: 0.5, metalness: 0.4 });
    const brass = Mat.std('#cfa54e', { roughness: 0.28, metalness: 0.9, name: 'neQBrass' }), copper = (() => {
      const c = Tex.canvas(64, 256), x = c.getContext('2d'); x.fillStyle = '#b8682e'; x.fillRect(0, 0, 64, 256);
      for (let y = 0; y < 256; y += 4) { x.fillStyle = 'rgba(255,214,160,0.45)'; x.fillRect(0, y, 64, 1.5); x.fillStyle = 'rgba(60,20,0,0.35)'; x.fillRect(0, y + 2.5, 64, 1); }
      return new THREE.MeshStandardMaterial({ map: Tex.tex(c), roughness: 0.32, metalness: 0.75, name: 'neQCoil' }); })();
    const pcb = (() => { const c = Tex.canvas(512, 256), x = c.getContext('2d'); x.fillStyle = '#1f4535'; x.fillRect(0, 0, 512, 256);
      x.strokeStyle = 'rgba(214,176,92,0.85)'; x.lineWidth = 3;
      for (let i = 0; i < 26; i++) { x.beginPath(); let px = rng.range(0, 512), py = rng.range(0, 256); x.moveTo(px, py); for (let k = 0; k < 4; k++) { if (k % 2) px += rng.range(-140, 140); else py += rng.range(-90, 90); x.lineTo(px, py); } x.stroke(); }
      x.fillStyle = '#d8b25c'; for (let i = 0; i < 30; i++) { x.beginPath(); x.arc(rng.range(10, 502), rng.range(10, 246), rng.range(4, 8), 0, Math.PI * 2); x.fill(); }
      return new THREE.MeshStandardMaterial({ map: Tex.tex(c), roughness: 0.55, metalness: 0.2, name: 'neQPcb' }); })();
    // the case back, the case ring, the main plate (all in mm; the movement's top face is y = 0)
    add(new THREE.CylinderGeometry(16.4, 16.4, 2.4, 72), dark, 0, -2.4, 0);
    add(new THREE.TorusGeometry(15.6, 1.3, 12, 96), steel, 0, 0.2, 0, Math.PI / 2);
    add(new THREE.CylinderGeometry(14.2, 14.2, 1.2, 72), plate, 0, -0.6, 0);
    // the circuit board, its chip (the counter), the battery under its strap
    add(new THREE.BoxGeometry(16, 0.5, 7.5), pcb, -2.5, 0.25, 6.0, 0, 0.12, 0);
    add(new THREE.BoxGeometry(2.6, 0.55, 2.6), Mat.std('#141517', { roughness: 0.5 }), 2.6, 0.78, 6.3, 0, 0.12, 0);
    { const c = Tex.canvas(256, 256), x = c.getContext('2d'); x.fillStyle = '#c8ccd0'; x.fillRect(0, 0, 256, 256); x.fillStyle = 'rgba(70,74,80,0.85)'; x.font = '500 96px "Lora", Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('+', 128, 92); x.font = '500 54px "Lora", Georgia, serif'; x.fillText('3 V', 128, 170);
      const bm = new THREE.MeshStandardMaterial({ map: Tex.tex(c), roughness: 0.24, metalness: 0.9 });
      add(new THREE.CylinderGeometry(5.8, 5.8, 1.6, 48), steel, 5.4, 0.8, -5.2);
      add(new THREE.CircleGeometry(5.6, 48), bm, 5.4, 1.61, -5.2, -Math.PI / 2, 0, 0.8);
      add(new THREE.BoxGeometry(1.3, 0.3, 11), steel, 5.4, 1.78, -5.2, 0, 0.62, 0); }
    // the step motor: a copper coil on its core, the stator, the rotor (a small magnet)
    add(new THREE.CylinderGeometry(1.7, 1.7, 7.5, 24), copper, -7.4, 2.2, -3.4, 0, 0, Math.PI / 2);
    for (const dx of [-3.95, 3.95]) add(new THREE.CylinderGeometry(1.9, 1.9, 0.4, 24), dark, -7.4 + dx, 2.2, -3.4, 0, 0, Math.PI / 2);
    add(new THREE.BoxGeometry(12, 0.6, 1.6), steel, -5.6, 0.3, -3.4);
    add(new THREE.BoxGeometry(1.6, 0.6, 4.2), steel, 0.5, 0.3, -2.4);
    add(new THREE.CylinderGeometry(1.25, 1.25, 1.0, 20), Mat.std('#3b4655', { roughness: 0.35, metalness: 0.6 }), -0.6, 0.8, -1.4);
    // the gears (brass, toothed, on steel arbors) that turn the motor's steps into seconds, minutes and hours
    const gear = (r, n, thick) => { const s = new THREE.Shape(), ro = r, ri = r - Math.max(0.18, r * 0.07);
      for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2, a1 = (i + 0.25) / n * Math.PI * 2, a2 = (i + 0.5) / n * Math.PI * 2, a3 = (i + 0.75) / n * Math.PI * 2;
        const P = (rr, a) => [Math.cos(a) * rr, Math.sin(a) * rr]; if (i === 0) s.moveTo(...P(ri, a0)); s.lineTo(...P(ro, a1)); s.lineTo(...P(ro, a2)); s.lineTo(...P(ri, a3)); s.lineTo(...P(ri, (i + 1) / n * Math.PI * 2)); }
      const hole = new THREE.Path(); hole.absarc(0, 0, r * 0.62, 0, Math.PI * 2, true); if (r > 2) s.holes.push(hole);
      const geo = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: false, curveSegments: 4 }); geo.rotateX(-Math.PI / 2); return geo; };
    const gears = [[4.0, 60, 2.7, 0, 0], [3.1, 46, 1.9, 3.3, 2.0], [2.6, 38, 2.3, -2.0, 2.4], [2.1, 30, 1.6, 1.1, -1.0]];
    this.gears = gears.map(([r, n, y, x, z], i) => {
      const o = add(gear(r, n, 0.24), brass, x, y, z, 0, i * 0.4, 0);
      if (r > 2) for (let k = 0; k < 2; k++) add(new THREE.BoxGeometry(r * 1.3, 0.24, 0.34), brass, x, y + 0.12, z, 0, k * Math.PI / 2 + i, 0);
      add(new THREE.CylinderGeometry(0.28, 0.28, y + 0.8, 10), steel, x, (y + 0.8) / 2, z);
      add(new THREE.CylinderGeometry(0.7, 0.7, 0.6, 14), brass, x, y - 0.3, z);
      return o;
    });
    // the quartz crystal in its can (2 mm × 6 mm), cut open along the top
    const [cx, cy, cz] = NE_Q.can;
    add(new THREE.CylinderGeometry(1.0, 1.0, 6.0, 32, 1, true, Math.PI, Math.PI), Mat.std('#d9dde0', { roughness: 0.18, metalness: 0.92, side: THREE.DoubleSide }), cx, cy, cz, 0, 0, Math.PI / 2);
    add(new THREE.CircleGeometry(1.0, 24, Math.PI, Math.PI), Mat.std('#d9dde0', { roughness: 0.18, metalness: 0.92, side: THREE.DoubleSide }), cx + 3.0, cy, cz, 0, Math.PI / 2, 0);
    add(new THREE.CylinderGeometry(0.98, 0.98, 0.9, 24), Mat.std('#24262a', { roughness: 0.6 }), cx - 2.55, cy, cz, 0, 0, Math.PI / 2);
    for (const dz of [-0.45, 0.45]) { add(new THREE.CylinderGeometry(0.11, 0.11, 2.2, 8), steel, cx - 4.0, cy, cz + dz, 0, 0, Math.PI / 2); add(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), steel, cx - 1.9, cy, cz + dz * 0.6, 0, 0, Math.PI / 2); }
    // the fork: a base and two prongs (clear quartz with gold electrodes); prongs lie along +X, side by side in Z
    const quartz = new THREE.MeshStandardMaterial({ color: '#e6eef2', roughness: 0.05, metalness: 0.05, transparent: true, opacity: 0.86, envMapIntensity: 1.8, name: 'neQuartzCrystal' });
    const gold = Mat.std('#c3c7cc', { roughness: 0.22, metalness: 0.95 });     // (silver electrodes)
    const F = { x0: cx - 2.1, base: 1.2, len: 3.4, w: 0.44, gap: 0.38, th: 0.36 };
    this.F = F;
    add(new THREE.BoxGeometry(F.base, F.th, F.w * 2 + F.gap + 0.2), quartz, F.x0 + F.base / 2, cy, cz).castShadow = false;
    for (const s of [-1, 1]) {
      const zc = cz + s * (F.gap / 2 + F.w / 2);
      add(new THREE.BoxGeometry(F.len, F.th, F.w), quartz, F.x0 + F.base + F.len / 2, cy, zc).castShadow = false;
      add(new THREE.BoxGeometry(F.len - 0.3, 0.02, F.w * 0.5), gold, F.x0 + F.base + F.len / 2 - 0.1, cy + F.th / 2 + 0.012, zc);
    }
    add(new THREE.BoxGeometry(F.base * 0.8, 0.02, F.w * 2), gold, F.x0 + F.base / 2, cy + F.th / 2 + 0.012, cz);
    // the ghost: what the prongs normally do (bend out and in, 32,768 times a second), drawn yellow, see-through
    this.ghostMat = new THREE.MeshBasicMaterial({ color: '#ffd23e', transparent: true, opacity: 0, depthWrite: false, fog: false });
    this.ghosts = [];
    for (const s of [-1, 1]) for (const dir of [-1, 1]) {
      const geo = new THREE.BoxGeometry(F.len, F.th * 1.02, F.w, 14, 1, 1), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const u = (p.getX(i) + F.len / 2) / F.len; p.setZ(i, p.getZ(i) + s * dir * 0.3 * u * u); }
      geo.computeVertexNormals();
      const o = add(geo, this.ghostMat, F.x0 + F.base + F.len / 2, cy + 0.01, cz + s * (F.gap / 2 + F.w / 2)); o.castShadow = false; o.receiveShadow = false; o.renderOrder = 3;
      this.ghosts.push({ o, dir });
    }
    // the dial (the same dial as on your wrist) and its hands, over the movement; it lifts away
    const dial = new THREE.Group(); dial.position.set(0, 4.2, 0); g.add(dial); this.dial = dial;
    { const dm = new THREE.MeshStandardMaterial({ map: Tex.tex(neWatchDial()), roughness: 0.35, name: 'neQDial' }), disc = add(new THREE.CircleGeometry(13.7, 64), dm, 0, 0, 0, -Math.PI / 2, 0, 0, dial);
      disc.rotation.z = -Math.PI / 2;      // 12 o'clock toward −Z… turned so 12 is up the screen (+X)
      add(new THREE.CylinderGeometry(13.9, 13.9, 0.6, 64), Mat.std('#e9e6dc', { roughness: 0.5 }), 0, -0.32, 0, 0, 0, 0, dial);
      add(new THREE.TorusGeometry(14.4, 0.9, 10, 96), steel, 0, 0.2, 0, Math.PI / 2, 0, 0, dial);
      const S = NE_STOPPED, ang = neHandAngles(S.s), hands = new THREE.Group(); hands.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); dial.add(hands);
      const hand = (len, w, col, z, a, tail = 0) => { const h = new THREE.Group(); h.position.z = z; h.rotation.z = a; hands.add(h); add(new THREE.BoxGeometry(w, len + tail, 0.25), Mat.std(col, { roughness: 0.4 }), 0, (len - tail) / 2, 0, 0, 0, 0, h); };
      hand(7.2, 1.6, '#1b1c1e', 0.4, ang.h); hand(10.9, 1.1, '#1b1c1e', 0.9, ang.m); hand(11.8, 0.45, '#d22a1e', 1.4, ang.s, 3);
      add(new THREE.CylinderGeometry(0.9, 0.9, 0.5, 14), Mat.std('#d22a1e', { roughness: 0.4 }), 0, 1.7, 0, 0, 0, 0, dial); }
    g.visible = false;
  }

  // the camera for the whole insert (world): above the dial, then down past the gears to the crystal, then a slow push
  shot(t) {
    const [cx, cy, cz] = NE_Q.can, q0 = NE.quartz[0], d0 = Ease.inOutSine(MathX.clamp((t - 31.25) / (33.45 - 31.25), 0, 1)), d1 = MathX.clamp((t - 33.45) / (NE.quartz[1] - 33.45), 0, 1);
    // positions in mm (p) and look-at (a); the camera always leans a little toward −X so +X stays up the screen
    let p, a, fov;
    if (t < 33.45) {
      const P0 = [-1.2, 78, 0], A0 = [0, 3, 0], P1 = [cx - 3.2, cy + 19, cz], A1 = [cx + 0.1, cy, cz], u = d0;
      p = P0.map((v, i) => v + (P1[i] - v) * u); a = A0.map((v, i) => v + (A1[i] - v) * u); fov = 40 - 4 * u;
      p[1] -= 3 * MathX.smooth(t, q0, 31.3);           // a small settle on the dial before it lifts
    } else {
      const u = Ease.outSine(d1);
      p = [cx - 3.2 - 0.3 * u, cy + 19 - 5.5 * u, cz + 0.4 * u]; a = [cx + 0.1 + 0.2 * u, cy, cz]; fov = 36;
    }
    return { p: neQ(...p), at: neQ(...a), fov, focus: [NE_Q.o[0], NE_Q.o[2], 2.2] };
  }

  update(t) {
    const on = t >= NE.quartz[0] - 0.05 && t < NE.quartz[1] + 0.05; this.g.visible = on; if (!on) return;
    // the dial lifts off and slides up the screen, out of frame
    const u = Ease.inQuad(MathX.clamp((t - NE_Q.dialUp[0]) / (NE_Q.dialUp[1] - NE_Q.dialUp[0]), 0, 1));
    this.dial.position.set(26 * u, 4.2 + 22 * u, 0); this.dial.rotation.set(0, 0, -0.5 * u); this.dial.visible = u < 1;
    // the ghost: a see-through yellow blur of the prongs bending out and in, flickering at the frame rate
    const G = NE_Q.ghost, k = StoryHUD.win(t, G[0], G[1], 0.25, 0.08), f = Math.round(t * 30) % 2;
    this.ghostMat.opacity = 0.62 * k; for (const gh of this.ghosts) gh.o.visible = k > 0.01 && (gh.dir > 0) === (f === 0);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// the time-lapse dressing
// ---------------------------------------------------------------------------------------------------------------------
// the trampoline: each heavier jumper stretches the mat further, and it stays (until the middle rests on the ground)
// [time, the mat's new depth (m), who]: it only goes deeper when someone heavier than every jumper before lands (a lighter
// kid changes nothing); the last, heaviest landing takes the mat down to the paving
const NE_PIT = [[42.7, 0.45, 12], [44.2, 0.56, 13], [45.5, 0.56, 15], [46.55, 0.66, 2], [51.2, 0.72, 6], [53.9, 0.79, 9]];
function neTrampLapse(t) { let d = 0; for (const [ts, dd] of NE_PIT) { if (t < ts) break; d += (dd - d) * Ease.outCubic(MathX.clamp((t - ts) / 0.12, 0, 1)); } return d; }
// the trees: every gust bends them a little further and they stay bent (the running maximum of the gusts so far)
// the gusts [time, the lean they leave (0..1)]: each one only adds when it is stronger than every gust before it; the two
// strongest land while the tree insert watches (47.3–49.6)
const NE_GUSTS = [[42.3, 0.12], [43.6, 0.22], [45.0, 0.33], [46.4, 0.45], [47.75, 0.62], [48.75, 0.8], [50.6, 0.86], [52.4, 0.92], [54.2, 0.96], [56.0, 1.0]];
function neTreeLean(t) {
  let l = 0;
  for (const [tg, s] of NE_GUSTS) { if (t < tg) break; const k = MathX.smooth(t, tg, tg + 0.14), over = 0.12 * Math.sin(Math.PI * MathX.clamp((t - tg) / 0.3, 0, 1)); l = Math.max(l, (s + over) * k + l * (1 - k)); }
  return l;
}
// the plaza lamps (they come on at dusk)
// the tree the time-lapse insert watches lean (an index into NE_CITY.trees; the pavement side of it is open)
const NE_LEAN_TREE = 0;
const NE_LAMPS = [[14.0, -14.0], [23.0, -8.2], [21.2, -24.6], [14.3, -23.2]];
// facing toward a point (a person's face angle, degrees, for the cast's faceAt)
const neFaceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z) * 180 / Math.PI - 180;

class NeLapse {
  constructor(app) {
    const scene = app.scene; this.app = app;
    // lamps: an iron post with a lantern; a warm pool of light on the paving under each (added light, no extra lamps in
    // the renderer)
    this.lantern = new THREE.MeshStandardMaterial({ color: '#e8dfc6', emissive: new THREE.Color('#ffc27a'), emissiveIntensity: 0, roughness: 0.4, name: 'neLantern' });
    const iron = Mat.std('#1e2326', { roughness: 0.45, metalness: 0.55 });
    const pool = (() => { const c = Tex.canvas(256, 256), x = c.getContext('2d'), gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.15)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 256, 256); return Tex.tex(c); })();
    this.poolMat = new THREE.MeshBasicMaterial({ map: pool, color: '#ffb35c', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    for (const [x, z] of NE_LAMPS) {
      const g = new THREE.Group(); g.position.set(x, 0.15, z); scene.add(g);
      const add = (geo, mat, px, py, pz) => { const o = new THREE.Mesh(geo, mat); o.position.set(px, py, pz); o.castShadow = true; g.add(o); return o; };
      add(new THREE.CylinderGeometry(0.13, 0.17, 0.5, 10), iron, 0, 0.25, 0);
      add(new THREE.CylinderGeometry(0.05, 0.07, 3.5, 10), iron, 0, 2.0, 0);
      add(new THREE.CylinderGeometry(0.16, 0.12, 0.42, 6), this.lantern, 0, 3.95, 0).castShadow = false;
      add(new THREE.ConeGeometry(0.24, 0.2, 6), iron, 0, 4.26, 0);
      add(new THREE.SphereGeometry(0.04, 8, 6), iron, 0, 4.4, 0);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), this.poolMat); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.162, z); p.renderOrder = 2; scene.add(p);
    }
    // dropped arrows at the shooting line (each archery visitor leaves two or three)
    { const shaft = Mat.std('#2a2d31', { roughness: 0.45, metalness: 0.3 }), vane = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55 });
      const sg = new THREE.CylinderGeometry(0.0034, 0.0034, NE_BOW.arrow, 5); sg.rotateX(Math.PI / 2); sg.translate(0, 0.0034, -NE_BOW.arrow / 2);
      const vg = new THREE.BoxGeometry(0.03, 0.002, 0.07); vg.translate(0, 0.004, -0.065);
      const r = new RNG(911), arrows = [];
      for (const v of neLapseV().list) if (v.kind === 'arch') { const n = 2 + (r.next() < 0.5 ? 1 : 0); for (let i = 0; i < n; i++) arrows.push({ t: v.t0 + (v.t1 - v.t0) * (0.3 + 0.6 * i / n), x: v.x + r.range(-0.5, 0.5), z: NE_ARCH.z - 0.5 - r.range(0, 0.9), yaw: r.range(-0.45, 0.45) + (r.next() < 0.15 ? Math.PI * 0.5 : 0), col: r.next() < 0.5 ? '#d8432c' : r.pick(['#f2efe6', '#2f7fd0', '#f0c22a']) }); }
      arrows.sort((a, b) => a.t - b.t); this.arrows = arrows;
      this.shafts = new THREE.InstancedMesh(sg, shaft, arrows.length); this.vanes = new THREE.InstancedMesh(vg, vane, arrows.length);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color();
      arrows.forEach((a, i) => { q.setFromEuler(e.set(0, a.yaw, 0)); m.compose(new THREE.Vector3(a.x, 0.152 + 0.004 * (i % 3), a.z), q, new THREE.Vector3(1, 1, 1)); this.shafts.setMatrixAt(i, m); this.vanes.setMatrixAt(i, m); this.vanes.setColorAt(i, c.set(a.col)); });
      for (const o of [this.shafts, this.vanes]) { o.count = 0; o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; scene.add(o); }
    }
    // the tree insert: a dashed line up the trunk where it stood (straight up from the planter)
    { const lm = new THREE.MeshBasicMaterial({ color: '#ffd23e', fog: false }), lg = new THREE.Group(), [tx, tz] = NE_CITY.trees[NE_LEAN_TREE];
      for (let y = 0.85; y < 5.6; y += 0.28) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.05), lm); d.position.set(tx, y, tz); lg.add(d); }
      lg.visible = false; scene.add(lg); this.trunkLine = lg; }
    this._t = -1;
  }

  update(t) {
    this.trunkLine.visible = t >= NE.ins.tree[0] && t < NE.ins.tree[1];
    const k = neDusk(t);
    this.lantern.emissiveIntensity = 2.6 * k; this.poolMat.opacity = 0.5 * k;
    let n = 0; while (n < this.arrows.length && this.arrows[n].t <= t) n++;
    this.shafts.count = n; this.vanes.count = n;
  }
}

// the time-lapse crowd: who comes, where they stand or sit, and for how long (film seconds; each visit is minutes of the
// afternoon). Afternoon: people try the bow, jump on the trampoline, stare at the clock; evening: benches and planters.
function neLapseVisits() {
  const r = new RNG(1508), out = [], L0 = NE.lapse[0] + 0.25, L1 = NE.note[1] - 0.3, T = NE_TRAMP, C = NE_CLOCK;
  const cn = [Math.sin(C.ry), Math.cos(C.ry)];                      // the clock's front face direction
  const spot = {
    // (people at the clock stand behind it, looking at its back face: the camera is in front)
    clock: () => { const s = -1, a = r.range(-0.7, 0.7), d = r.range(1.6, 3.0), x = C.x + s * (cn[0] * Math.cos(a) + cn[1] * Math.sin(a)) * d, z = C.z + s * (cn[1] * Math.cos(a) - cn[0] * Math.sin(a)) * d;
      return { x, z, face: neFaceTo(x, z, C.x, C.z), act: r.pick(['look', 'handHead', 'idle']) }; },
    // (never on the side the trampoline insert looks from)
    rim: () => { const a = 0.68 + 1.05 + r.range(0, 4.2), d = r.range(2.2, 2.6), x = T.x + Math.cos(a) * d, z = T.z + Math.sin(a) * d; return { x, z, face: neFaceTo(x, z, T.x, T.z), act: r.pick(['idle', 'look', 'handHead']) }; },
    arch: () => { const x = NE_ARCH.x + r.range(-1.3, 1.3), z = NE_ARCH.z + 0.1; return { x, z, face: r.range(-8, 8), act: 'idle', kind: 'arch' }; },
    bench: () => { const b = r.next() < 0.5, x = (b ? 20.8 : 24.0) + r.pick([-0.5, 0.5]) + r.range(-0.08, 0.08), z = b ? -6.0 + 0.05 : -27.8 - 0.05; return { x, z, face: b ? 0 : 180, act: 'sit', seat: 0.47 }; },
    planter: () => { const [px, pz] = r.pick(NE_CITY.trees), a = r.int(0, 3), ox = [1.28, 0, -1.28, 0][a], oz = [0, 1.28, 0, -1.28][a], x = px + ox + (oz ? r.range(-0.6, 0.6) : 0), z = pz + oz + (ox ? r.range(-0.6, 0.6) : 0);
      return { x, z, face: neFaceTo(x, z, x + ox, z + oz), act: 'sit', seat: 0.55 }; },
    court: () => { const x = r.range(23, 30), z = r.range(-27, -15); return { x, z, face: r.range(-180, 180), act: r.pick(['idle', 'look']) }; },
  };
  const ppl = 16, looks = ['casual1', 'casual2', 'casual3', 'casual4', 'casual5', 'casual6', 'casual7', 'casual8', 'neCafe', 'casual3', 'casual5', 'casual7', 'neKid', 'neTeen', 'casual1', 'neKid'];
  // the trampoline jumpers come first (they set the mat's new depths), then everyone else fills the gaps
  const busy = Array.from({ length: ppl }, () => []);
  const free = (i, a, b) => busy[i].every(([c, d]) => b <= c - 0.15 || a >= d + 0.15);
  NE_PIT.forEach(([ts, , i]) => { const v = { who: i, t0: ts - 0.12, t1: ts + 0.75, kind: 'pit', x: T.x + r.range(-0.25, 0.25), z: T.z + r.range(-0.25, 0.25), face: r.range(-180, 180), act: 'neKidLand' }; out.push(v); busy[i].push([v.t0, v.t1]); });
  for (let i = 0; i < ppl; i++) {
    let t = L0 + r.range(0, 1.6);
    while (t < L1) {
      const u = (t - L0) / (L1 - L0), dur = r.range(0.7, 2.6) * (u > 0.75 ? 1.8 : 1);
      const w = u < 0.55 ? [['clock', 3], ['rim', 2], ['arch', 3], ['bench', 1], ['planter', 1], ['court', 2], ['walk', 1]] : [['clock', 2], ['rim', 1], ['arch', 1], ['bench', 3], ['planter', 3], ['court', 1], ['walk', 1]];
      let kind = 'walk', sum = w.reduce((s, x) => s + x[1], 0), pick = r.range(0, sum); for (const [k, ww] of w) { if ((pick -= ww) <= 0) { kind = k; break; } }
      if (kind === 'walk') {
        const d = r.range(0.22, 0.5), a = [r.range(12.8, 31), r.pick([-2.4, -33.0])], b = [r.range(12.8, 31), a[1] < -10 ? -2.4 : -33.0];
        if (free(i, t, t + d)) { out.push({ who: i, t0: t, t1: t + d, kind, x: a[0], z: a[1], x1: b[0], z1: b[1], act: 'walk' }); busy[i].push([t, t + d]); }
        t += d + r.range(0.15, 0.9); continue;
      }
      const s = spot[kind](), t1 = Math.min(L1, t + dur);
      if (t1 - t > 0.3 && free(i, t, t1) && (i < 12 || kind !== 'arch')) { out.push(Object.assign({ who: i, t0: t, t1, kind }, s)); busy[i].push([t, t1]); }
      t = t1 + r.range(0.15, 0.9);
    }
  }
  // at dusk a few stay on: two kids sitting in the pit, a couple under the lamp by the clock
  out.push({ who: 12, t0: 55.2, t1: 61, kind: 'pit', x: T.x + 0.2, z: T.z - 0.1, face: 120, act: 'sitGround' });
  out.push({ who: 15, t0: 55.6, t1: 61, kind: 'pit', x: T.x - 0.25, z: T.z + 0.2, face: -60, act: 'sitGround' });
  for (const v of out) v.looks = looks[v.who];
  return { list: out, looks, n: ppl };
}

const neLapseV = () => neLapseV._v || (neLapseV._v = neLapseVisits());

// cast specs for the time-lapse crowd (one person per pool slot; a slot reappears at each of its visits)
function neLapseSpecs(V) {
  const specs = [];
  for (let i = 0; i < V.n; i++) {
    const vs = V.list.filter((v) => v.who === i).sort((a, b) => a.t0 - b.t0), path = [], states = [[0, 'idle']];
    const alias = { idle: 'neLIdle', look: 'neLLook', handHead: 'neLHand', sit: 'neLSit', sitGround: 'neLSitG', walk: 'neLWalk', neKidLand: 'neLLand' };
    for (const v of vs) { path.push([v.t0, v.x, v.z], [v.t1 - 0.001, v.x1 === undefined ? v.x : v.x1, v.z1 === undefined ? v.z : v.z1]); states.push([v.t0, alias[v.act] || v.act]); }
    if (!path.length) continue;
    const at = (t) => { for (const v of vs) if (t >= v.t0 && t < v.t1) return v; return null; };
    const kid = V.looks[i] === 'neKid';
    specs.push({ id: 'L' + i, look: V.looks[i], scale: kid ? 0.72 : 1, path, states, lapse: true,
      show: (t) => !!at(t),
      faceAt: (t) => { const v = at(t); return v && v.face !== undefined ? v.face : undefined; },
      seatAt: (t) => { const v = at(t); return v && v.seat !== undefined ? v.seat : undefined; },
      y: (t, p, app) => { const v = at(t); return v && v.kind === 'pit' ? app.tramp.surfaceY(p.x - NE_TRAMP.x, p.z - NE_TRAMP.z, t) : 0.15; } });
  }
  return specs;
}
