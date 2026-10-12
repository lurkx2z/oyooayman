/* =====================================================================
   DROP — the falling experiment (scenes 4–5): two identical glazed CERAMIC BALLS (8 cm, ≈0.64 kg) released from
   exactly 1.00 m (ball bottom) in two lanes, 1 g on the left, 2 g on the right, by two clamps that open together.
   Physics (idealised: no air, the same restitution in both lanes):
     fall        y(τ) = 1.00 − ½·g·τ²  → landing found by stepping each lane's own trajectory (landT):
                 1 g 0.452 s, 2 g 0.319 s; impact speed √(2gh) 4.43 vs 6.26 m/s; impact energy m·g·h 6.3 vs 12.6 J
     bounces     rebound speed = e·v (e = 0.55, a ceramic ball on a rubber-topped pad), so every rebound reaches
                 the SAME height in both lanes (e²·h ≈ 30 cm) but the 2 g ball's rhythm is √2 faster
     the pad     a dark rubber landing pad under each ball dents on impact; peak dent ∝ impact speed (√2 deeper in
                 2 g: twice the energy into the same spring). No shattering: nothing in the physics says a ceramic
                 ball must break at 6 m/s on rubber, so it doesn't.
   τ = gbExpT(t): real time after the release, then a slow-motion replay of the same fall (script.js).
   The set exists only for these shots (a staged demonstration on the café floor).
   ===================================================================== */

const GB_DROP = {
  z: -1.0, h: 1.0, r: 0.04, e: 0.55, mass: 0.64,
  lanes: [{ id: 'g1', x: 0.3, g: 9.81, tint: '#cfd8ff', side: -1 }, { id: 'g2', x: 1.0, g: 19.62, tint: '#ffd9b0', side: 1 }],
  rulerX: 0.65, boardW: 0.58, padH: 0.03,
};

// one lane's ball: height of the ball's bottom above the pad top τ s after release, its velocity, and the impacts
function gbBallPath(g, tau) {
  const D = GB_DROP;
  if (tau <= 0) return { y: D.h, v: 0, hits: [] };
  const hits = [];
  // first fall
  const tf = Math.sqrt(2 * D.h / g);
  if (tau < tf) return { y: D.h - 0.5 * g * tau * tau, v: -g * tau, hits };
  let vin = g * tf, tc = tf;
  hits.push({ t: tc, v: vin });
  for (let k = 0; k < 12; k++) {
    const vo = D.e * vin, dur = 2 * vo / g;
    if (vo < 0.12) return { y: 0, v: 0, hits, rest: true };
    if (tau < tc + dur) { const u = tau - tc; return { y: vo * u - 0.5 * g * u * u, v: vo - g * u, hits }; }
    tc += dur; vin = vo; hits.push({ t: tc, v: vin });
  }
  return { y: 0, v: 0, hits, rest: true };
}

class GbDrop {
  constructor(scene) {
    this.root = new THREE.Group(); this.root.name = 'gbDrop'; scene.add(this.root);
    const R = this.root, Z = GB_DROP.z, D = GB_DROP;
    const metal = gbMat('#1d1b22', { rough: 0.4, metal: 0.6, rim: 0.35, name: 'gbStand' });
    const brass = gbMat('#c49a52', { rough: 0.3, metal: 0.85, rim: 0.4 });
    // the ball: a glossy glazed ceramic (cream with a terracotta band so its spin and squash-free bounce read)
    const glazeTex = gbCanvasTex(256, 128, (x, w, h) => {
      x.fillStyle = '#efe6d6'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#c0643a'; x.fillRect(0, h * 0.46, w, h * 0.08);
      for (let k = 0; k < 4; k++) { x.fillStyle = '#c0643a'; x.fillRect(k * w / 4, 0, 3, h); }
    }, false);
    const ballM = new THREE.MeshStandardMaterial({ map: glazeTex, roughness: 0.18, metalness: 0, envMapIntensity: 1.2, name: 'gbBall' });
    // lane boards: a dark slate board with a 10 cm grid behind each lane
    const boardTex = gbCanvasTex(256, 512, (x, w, h) => {
      x.fillStyle = '#4a4450'; x.fillRect(0, 0, w, h);
      for (let k = 0; k <= 12; k++) { x.fillStyle = k % 5 ? 'rgba(255,240,222,0.2)' : 'rgba(255,240,222,0.5)'; x.fillRect(0, h - k * (h / 13) - 1, w, k % 5 ? 2 : 4); }
      for (let k = 1; k < 5; k++) { x.fillStyle = 'rgba(255,240,222,0.1)'; x.fillRect(k * w / 5, 0, 2, h); }
    }, false);
    this.boards = D.lanes.map((L) => {
      const m = new THREE.MeshStandardMaterial({ map: boardTex, color: L.tint, roughness: 0.85, name: 'gbBoard' });
      // the grid's zero is the pad top (padH): rows every 10 cm
      const b = gbAdd(R, new THREE.PlaneGeometry(D.boardW, 1.3), m, L.x, D.padH + 0.65, Z - 0.2, { cast: false });
      gbAdd(R, gbRoundBox(D.boardW + 0.04, 0.03, 0.04, 0.008, 2), brass, L.x, D.padH + 1.31, Z - 0.19);
      return b;
    });
    // the metre stick between the lanes (from the pad top)
    const stickTex = gbCanvasTex(64, 1024, (x, w, h) => {
      x.fillStyle = '#e3b864'; x.fillRect(0, 0, w, h);
      for (let k = 0; k <= 100; k++) { const y = h - (k / 100) * h; const L = k % 10 ? (k % 5 ? 14 : 24) : 40; x.fillStyle = '#2a1a12'; x.fillRect(0, Math.min(h - 3, Math.max(0, y - 1.5)), L, 3); }
      x.font = 'bold 20px Inter, sans-serif'; x.fillStyle = '#2a1a12'; x.textAlign = 'right';
      for (let k = 10; k <= 90; k += 10) x.fillText(String(k), w - 4, h - (k / 100) * h + 7);
    }, false);
    this.stick = gbAdd(R, new THREE.BoxGeometry(0.045, 1.0, 0.012), [gbMat('#c8994c'), gbMat('#c8994c'), gbMat('#c8994c'), gbMat('#c8994c'),
      new THREE.MeshStandardMaterial({ map: stickTex, roughness: 0.7 }), gbMat('#c8994c')], D.rulerX, D.padH + 0.5, Z);
    gbAdd(R, gbRoundBox(0.16, D.padH, 0.1, 0.006, 2), metal, D.rulerX, D.padH / 2, Z);
    // the 1 m mark: a thin bright bar across both lanes at the balls' bottoms (shown during "from the same height")
    this.markM = new THREE.MeshBasicMaterial({ color: '#ffe2b0', transparent: true, opacity: 0, depthWrite: false, fog: false });
    this.mark = gbAdd(R, new THREE.BoxGeometry(1.5, 0.004, 0.004), this.markM, (D.lanes[0].x + D.lanes[1].x) / 2, D.padH + D.h, Z, { cast: false });
    // the rebound line: where both first bounces peak (e²·h), shown with the result
    this.bounceM = new THREE.MeshBasicMaterial({ color: '#bfe8ff', transparent: true, opacity: 0, depthWrite: false, fog: false });
    this.bounceLine = gbAdd(R, new THREE.BoxGeometry(1.5, 0.003, 0.003), this.bounceM, (D.lanes[0].x + D.lanes[1].x) / 2, D.padH + D.e * D.e * D.h, Z, { cast: false });
    const sc = document.createElement('canvas'); sc.width = sc.height = 64; const sx = sc.getContext('2d');
    const gr = sx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, 64, 64);
    const blobTex = new THREE.CanvasTexture(sc);
    const padM = gbMat('#26232a', { rough: 0.95, name: 'gbPad' }), padTopM = gbMat('#33303a', { rough: 0.9, name: 'gbPadTop' });
    this.lanes = D.lanes.map((L, li) => {
      const o = { L, li };
      // the stand's pole at the board's OUTER edge; an L-arm reaches over to the clamp
      const ax = -L.side * 0.24;
      const st = new THREE.Group(); st.position.set(L.x - ax, 0, Z - 0.13); R.add(st);
      gbAdd(st, gbRoundBox(0.16, 0.02, 0.2, 0.006, 2), metal, 0, 0.01, 0.03);
      const cy = D.padH + D.h + D.r;   // the clamp holds the ball at its equator
      gbAdd(st, new THREE.CylinderGeometry(0.009, 0.009, cy + 0.12, 10), metal, 0, (cy + 0.12) / 2, 0);
      gbAdd(st, new THREE.CylinderGeometry(0.006, 0.006, 0.24, 8), metal, ax / 2, cy + 0.1, 0, { rz: Math.PI / 2 });
      gbAdd(st, gbRoundBox(0.026, 0.026, 0.026, 0.005, 2), brass, 0, cy + 0.1, 0);
      gbAdd(st, new THREE.CylinderGeometry(0.006, 0.006, 0.13, 8), metal, ax, cy + 0.1, 0.065, { rx: Math.PI / 2 });
      gbAdd(st, gbRoundBox(0.03, 0.03, 0.03, 0.005, 2), brass, ax, cy + 0.1, 0.0);
      // jaws: two arms hinged above the ball, curved felt pads on the equator; they swing apart at the release
      o.jaws = [-1, 1].map((s) => {
        const p = new THREE.Group(); p.position.set(ax + s * 0.01, cy + 0.1, 0.13); st.add(p);
        gbAdd(p, new THREE.BoxGeometry(0.04, 0.008, 0.008), metal, s * 0.02, 0, 0);
        gbAdd(p, new THREE.BoxGeometry(0.006, 0.1, 0.016), metal, s * (D.r + 0.006), -0.05, 0);
        gbAdd(p, new THREE.SphereGeometry(0.012, 10, 8), gbMat('#5a2a2a', { rough: 0.95 }), s * (D.r - 0.002), -0.1, 0, { s: [0.5, 1, 1] });
        return { p, s };
      });
      o.ball = gbAdd(R, new THREE.SphereGeometry(D.r, 32, 20), ballM, L.x, cy, Z);
      // the landing pad (rubber on a steel plate): its top dents under the ball
      gbAdd(R, gbRoundBox(0.24, 0.012, 0.24, 0.004, 2), metal, L.x, 0.006, Z);
      gbAdd(R, gbRoundBox(0.2, D.padH - 0.012, 0.2, 0.01, 2), padM, L.x, 0.012 + (D.padH - 0.012) / 2, Z);
      const dg = new THREE.CircleGeometry(0.06, 32);
      o.dent = gbAdd(R, dg, padTopM, L.x, D.padH + 0.0005, Z, { rx: -Math.PI / 2, cast: false });
      // a target ring on the pad
      gbAdd(R, new THREE.RingGeometry(0.075, 0.082, 40), gbMat('#c49a52', { rough: 0.35, metal: 0.7 }), L.x, D.padH + 0.001, Z, { rx: -Math.PI / 2, cast: false });
      o.blobM = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0 });
      o.blob = gbAdd(R, new THREE.PlaneGeometry(1, 1), o.blobM, L.x, D.padH + 0.002, Z, { rx: -Math.PI / 2, cast: false, receive: false });
      // an impact ring (a pale ripple on the pad, a light dust puff) per hit
      o.ringM = new THREE.MeshBasicMaterial({ color: '#ffe8cc', transparent: true, opacity: 0, depthWrite: false, fog: false, side: THREE.DoubleSide });
      o.ring = gbAdd(R, new THREE.RingGeometry(0.9, 1.0, 40), o.ringM, L.x, D.padH + 0.003, Z, { rx: -Math.PI / 2, cast: false, receive: false });
      // the strobe trail (replay): ghost balls every 0.04 s of the first fall
      o.trailM = gbMat(L.tint, { rough: 0.5, transparent: true, opacity: 0, depthWrite: false, name: 'gbTrailB' + li });
      o.trail = []; for (let i = 0; i < 10; i++) { const b = gbAdd(R, new THREE.SphereGeometry(D.r, 20, 12), o.trailM, 0, -5, 0, { cast: false }); b.renderOrder = 5; o.trail.push(b); }
      // the landing time, found from the lane's own trajectory (0.5 ms steps)
      let tau = 0; while (D.h - 0.5 * L.g * tau * tau > 0 && tau < 2) tau += 0.0005;
      o.landT = tau; o.vImpact = L.g * tau; o.energy = D.mass * L.g * D.h;
      return o;
    });
    this.root.visible = false;
  }

  update(t, show) {
    this.root.visible = show;
    if (!show) return;
    const te = gbExpT(t), replay = gbInReplay(t), Z = GB_DROP.z, D = GB_DROP;
    this.markM.opacity = 0.85 * MathX.window(t, GB.oneM[0] - 0.1, GB.oneM[1] + 1.2, 0.25, 0.5);
    this.bounceM.opacity = 0.6 * MathX.smooth(t, GB.result + 0.6, GB.result + 1.4);
    for (const o of this.lanes) {
      const L = o.L, tau = Math.max(0, te), P = gbBallPath(L.g, tau);
      // clamps: the pads hold the ball, then swing open at τ = 0 (in the replay too)
      const open = MathX.smooth(te, -0.005, 0.05);
      for (const J of o.jaws) J.p.rotation.z = J.s * (0.5 * open);
      // the dent: the pad compresses during each contact (a ~12 ms half-sine), depth ∝ impact speed; it shows a
      // resting dent once the ball lies on it (twice as deep in 2 g: the static load doubles)
      let dent = 0;
      for (const h of P.hits) { const u = tau - h.t, dur = 0.012; if (u > -dur && u < dur) dent = Math.max(dent, 0.0016 * h.v * Math.cos((u / dur) * Math.PI / 2)); }
      if (P.rest) dent = Math.max(dent, 0.0006 * L.g / 9.81);
      // in the replay the 12 ms contact is shown stretched a little so it reads (the depth is unchanged)
      const y = Math.max(0, P.y) - dent;
      o.ball.position.set(L.x, D.padH + y + D.r, Z);
      // a slow spin picked up from the jaws, then bounces add a little (the same in both lanes)
      o.ball.rotation.set(0.6 * tau, 0.3, 0.25 * tau);
      o.dent.position.y = D.padH + 0.0005 - dent; o.dent.scale.setScalar(0.35 + 40 * dent);
      o.dent.visible = dent > 0.0001;
      // contact shadow: darker and tighter as it nears the pad
      const k = MathX.clamp(1 - y / 1.05, 0, 1);
      o.blob.scale.setScalar(0.2 - 0.1 * k); o.blobM.opacity = 0.12 + 0.6 * k * k;
      // impact ripple: the last hit spreads a ring (bigger and brighter for the faster impact)
      let ra = 0, rs = 0.05;
      for (const h of P.hits) { const u = tau - h.t; if (u >= 0 && u < 0.35) { const s = h.v / 4.43; ra = Math.max(ra, 0.55 * s * (1 - u / 0.35)); rs = 0.05 + 0.5 * u * Math.sqrt(s); } }
      o.ringM.opacity = Math.min(0.75, ra); o.ring.scale.setScalar(rs); o.ring.visible = ra > 0.01;
      // strobe trail in the replay: the gaps grow as it accelerates
      const tf = replay ? 1 - MathX.smooth(t, GB.replayEnd - 0.6, GB.replayEnd) : 0;
      o.trailM.opacity = 0.32 * tf;
      for (let i = 0; i < o.trail.length; i++) {
        const ti = (i + 1) * 0.04, b = o.trail[i];
        b.visible = tf > 0.01 && tau > ti && ti < o.landT;
        if (b.visible) b.position.set(L.x, D.padH + D.h - 0.5 * L.g * ti * ti + D.r, Z);
      }
    }
  }

  // lane timer value (s) at film time t: the measured fall time, frozen at the first impact
  timer(t, li) { const o = this.lanes[li]; return MathX.clamp(gbExpT(t), 0, o.landT); }
  // impacts in film time (for the sound): [{ lane, t, v }] in real time (the replay is re-timed by the audio)
  impacts(li) { const o = this.lanes[li]; return gbBallPath(o.L.g, 5).hits; }
}
