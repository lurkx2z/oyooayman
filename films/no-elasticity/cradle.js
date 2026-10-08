/* =====================================================================
   CRADLE — the opening, on the café table. Pure functions of time.
     NeCradle     a Newton's cradle (five steel balls on V-strings). It clacks as usual under the title: each hit is
                  passed down the row by the balls springing back, and the end ball flies out. Then the rule bites and
                  the next hit just shoves the whole row along together (momentum shared, e = 0): no ball flies out,
                  the five swing a little as one lump. A dashed ghost shows where the end ball should have gone.
     NeDeskClock  a small quartz desk clock beside it: its seconds hand takes one step to :52 one second into the
                  video and never moves again (planted for the watch beat; it is still stopped at the fork beat).
   Cradle space: origin at the middle of the base on the table top; the row runs along +Z (your right), +X away from you.
   ===================================================================== */

const NE_CRADLE = {
  x: 11.45, z: 5.40, y0: 0.91,                     // middle of its base on the café table (the table top is 0.91 m)
  L: 0.2196, r: 0.0175, n: 5,                      // pendulum length (m) → half period 0.47 s; ball radius
  bar: 0.27, half: 0.05, span: 0.125,              // top bars' height above the base, their half spacing, half length
  amp: MathX.deg(35),                              // the end balls' swing
  hits: [0.15, 0.62, 1.09], dead: 1.56,            // the clacks while things still spring back; the first hit after the rule
  tau: 3.5,                                        // the lump's slow die-away (s)
};
const NE_DESK = { x: 11.1, z: 5.47, ry: -1.687 };  // the desk clock, in front of the cradle and turned to face your seat

// each ball's swing angle (radians, + toward +Z) at time t
function neCradleAngles(t) {
  const C = NE_CRADLE, w = Math.PI / (C.hits[1] - C.hits[0]), a = [0, 0, 0, 0, 0];
  if (t < C.hits[0]) a[0] = -C.amp * Math.sin(w * (C.hits[0] - t));
  else if (t < C.hits[1]) a[4] = C.amp * Math.sin(w * (t - C.hits[0]));
  else if (t < C.hits[2]) a[0] = -C.amp * Math.sin(w * (t - C.hits[1]));
  else if (t < C.dead) a[4] = C.amp * Math.sin(w * (t - C.hits[2]));
  else {
    // ball 5 comes back and hits the row with nothing to pass the hit along: all five move off together at a fifth of its
    // speed (perfectly inelastic) and swing as one, about 7°
    const th = 2 * Math.asin(Math.sin(C.amp / 2) / C.n), u = t - C.dead, s = -th * Math.sin(w * u) * Math.exp(-u / C.tau);
    a.fill(s);
  }
  return a;
}

class NeCradle {
  constructor(scene) {
    const C = NE_CRADLE, g = new THREE.Group(); g.position.set(C.x, C.y0, C.z); scene.add(g); this.g = g;
    const chrome = Mat.std('#cfd4d9', { roughness: 0.16, metalness: 0.95, name: 'neCradle' }), wood = Mat.std('#2b2522', { roughness: 0.55 });
    const add = (geo, mat, x, y, z, par = g) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; par.add(o); return o; };
    // base, four uprights, two top bars along the row
    add(new THREE.BoxGeometry(0.15, 0.016, 2 * C.span + 0.05), wood, 0, 0.008, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(new THREE.CylinderGeometry(0.0035, 0.0035, C.bar, 8), chrome, sx * C.half, C.bar / 2 + 0.01, sz * C.span);
    for (const sx of [-1, 1]) { const b = add(new THREE.CylinderGeometry(0.0035, 0.0035, 2 * C.span, 8), chrome, sx * C.half, C.bar + 0.01, 0); b.rotation.x = Math.PI / 2; }
    // the balls (each in a pivot group at the top bars' height, so a swing is one rotation) and their V-strings
    const sm = new THREE.MeshBasicMaterial({ color: '#e7e3da' }), Lv = C.L;
    this.piv = [];
    for (let i = 0; i < C.n; i++) {
      const p = new THREE.Group(); p.position.set(0, C.bar + 0.01, (i - (C.n - 1) / 2) * 2 * C.r); g.add(p);
      add(new THREE.SphereGeometry(C.r, 24, 16), chrome, 0, -Lv, 0, p);
      // two strings from the bars down to the top of the ball
      for (const sx of [-1, 1]) {
        const a = new THREE.Vector3(sx * C.half, 0, 0), b = new THREE.Vector3(0, -Lv + C.r * 0.9, 0), d = b.clone().sub(a), s = new THREE.Mesh(new THREE.CylinderGeometry(0.0006, 0.0006, d.length(), 4), sm);
        s.position.copy(a).add(b).multiplyScalar(0.5); s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); p.add(s);
      }
      this.piv.push(p);
    }
    // the ghost: where the first ball would normally fly out to when the last one comes back in (a dashed ring and string)
    { const gm = new THREE.MeshBasicMaterial({ color: '#ffd23e', fog: false }), gh = new THREE.Group(); gh.position.copy(this.piv[0].position); g.add(gh);
      const ring = new THREE.Group(); ring.rotation.x = C.amp; gh.add(ring);
      for (let k = 0; k < 16; k++) { const A = k / 16 * Math.PI * 2, d = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.003, 0.0062), gm); d.position.set(0, -Lv + Math.cos(A) * (C.r + 0.002), Math.sin(A) * (C.r + 0.002)); d.rotation.x = A; ring.add(d); }
      const gb = new THREE.Mesh(new THREE.SphereGeometry(C.r, 20, 14), new THREE.MeshBasicMaterial({ color: '#ffd23e', transparent: true, opacity: 0.22, depthWrite: false, fog: false }));
      gb.position.set(0, -Lv, 0); ring.add(gb);
      for (let y = 0.012; y < Lv - C.r - 0.004; y += 0.016) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.0024, 0.008, 0.0024), gm); d.position.set(0, -y, 0); ring.add(d); }
      gh.visible = false; this.ghost = gh; }
    this.desk = new NeDeskClock(scene);
    // the café's lamp over the table, for the last shot (night by then)
    const lamp = new THREE.PointLight('#ffcf9a', 0, 3, 2); lamp.position.set(10.85, 1.4, 5.25); scene.add(lamp); this.lamp = lamp;
  }
  // where the ghost ball sits (for its label)
  ghostWorld() { const C = NE_CRADLE, a = C.amp; return [C.x, C.y0 + C.bar + 0.01 - C.L * Math.cos(a), C.z - 2 * C.r * 2 - C.L * Math.sin(a)]; }
  update(t) {
    const a = neCradleAngles(t);
    this.piv.forEach((p, i) => { p.rotation.x = -a[i]; });
    this.ghost.visible = t >= 3.3 && t < NE.cradleIns[1];                   // with the second line, after the title
    // only in the opening and the last shot (later beats at this table are framed for other things); the desk clock sits
    // between you and the cradle, so it stays out of the low insert
    this.g.visible = t < NE.cradleIns[1] || t >= NE.loop;
    this.desk.g.visible = t < NE.cradleIns[0] || t >= NE.loop;
    this.lamp.intensity = t >= NE.loop ? 0.8 : 0;
    this.desk.update(t);
  }
}

class NeDeskClock {
  constructor(scene) {
    const D = NE_DESK, g = new THREE.Group(); g.position.set(D.x, NE_CRADLE.y0, D.z); g.rotation.y = D.ry; scene.add(g); this.g = g;
    const body = Mat.std('#b4442f', { roughness: 0.4 }), dark = Mat.std('#151719', { roughness: 0.5 }), red = Mat.std('#c8261b', { roughness: 0.45 });
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, par = g) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; par.add(o); return o; };
    const R = 0.052, cy = R + 0.022;
    add(new THREE.CylinderGeometry(R + 0.008, R + 0.008, 0.034, 32), body, 0, cy, 0, Math.PI / 2);
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.012, 0.03, 0.03), dark, sx * 0.03, 0.015, 0);
    const f = new THREE.Group(); f.position.set(0, cy, 0.0175); g.add(f); this.f = f;
    const dt = Tex.tex(neClockDial()); this.dialMat = new THREE.MeshStandardMaterial({ map: dt, emissiveMap: dt, emissive: new THREE.Color('#fff1d8'), emissiveIntensity: 0, roughness: 0.4, name: 'neDeskDial' });
    add(new THREE.CircleGeometry(R, 40), this.dialMat, 0, 0, 0.0005, 0, 0, 0, f).castShadow = false;
    const hand = (len, w, mat, z, tail = 0) => { const h = new THREE.Group(); h.position.z = z; f.add(h); add(new THREE.BoxGeometry(w, len + tail, 0.0012), mat, 0, (len - tail) / 2, 0, 0, 0, 0, h); return h; };
    this.hr = hand(0.028, 0.0045, dark, 0.002); this.min = hand(0.042, 0.003, dark, 0.0033); this.sec = hand(0.046, 0.0015, red, 0.0046, 0.011);
    add(new THREE.CylinderGeometry(0.0025, 0.0025, 0.002, 10), red, 0, 0, 0.0055, Math.PI / 2, 0, 0, f);
    this._s = -1;
  }
  update(t) {
    this.dialMat.emissiveIntensity = t >= NE.loop ? 0.12 : 0;
    const s = neClockSec(t);
    if (s !== this._s) { this._s = s; const a = neHandAngles(s); this.hr.rotation.z = a.h; this.min.rotation.z = a.m; this.sec.rotation.z = a.s; }
  }
}
