/* =====================================================================
   DROP — the falling experiment (scenes 4–5): the same coffee cup dropped from exactly 1.00 m in two lanes,
   1 g on the left, 2 g on the right, released at the same instant by two clamps.
   Physics (idealised free fall, no air): the cup's bottom height y(τ) = 1.00 − ½·g·τ². The landing time is NOT
   typed in: it is found by stepping each lane's own trajectory until the bottom reaches the floor (landT), and
   the lane timers, the impacts, the shards and the sound all read that value. Expected: 1 g 0.452 s, 2 g 0.319 s;
   impact speed √(2gh): 4.43 vs 6.26 m/s.
   τ = gbExpT(t): real time after the release, then a slow-motion replay of the same fall (script.js).
   The set exists only for these shots (a staged demonstration on the café floor).
   ===================================================================== */

const GB_DROP = {
  z: -1.0, h: 1.0,
  lanes: [{ id: 'g1', x: 0.3, g: 9.81, tint: '#cfd8ff', side: -1 }, { id: 'g2', x: 1.0, g: 19.62, tint: '#ffd9b0', side: 1 }],
  rulerX: 0.65, boardW: 0.58,
};

class GbDrop {
  constructor(scene, cupFactory) {
    this.root = new THREE.Group(); this.root.name = 'gbDrop'; scene.add(this.root);
    const R = this.root, Z = GB_DROP.z;
    const metal = gbMat('#1d1b22', { rough: 0.4, metal: 0.6, rim: 0.35, name: 'gbStand' });
    const brass = gbMat('#c49a52', { rough: 0.3, metal: 0.85, rim: 0.4 });
    const china = gbMat('#cbc1b2', { rough: 0.62, name: 'gbChinaX', env: 0.3 });
    // lane boards: a pale measuring board behind each lane with a 10 cm grid (and a bolder 50 cm / 1 m line)
    const boardTex = gbCanvasTex(256, 512, (x, w, h) => {
      // a dark slate board with light lines, so the cream cups read clearly against it
      x.fillStyle = '#4a4450'; x.fillRect(0, 0, w, h);
      for (let k = 0; k <= 12; k++) { x.fillStyle = k % 5 ? 'rgba(255,240,222,0.2)' : 'rgba(255,240,222,0.5)'; x.fillRect(0, h - k * (h / 13) - 1, w, k % 5 ? 2 : 4); }
      for (let k = 1; k < 5; k++) { x.fillStyle = 'rgba(255,240,222,0.1)'; x.fillRect(k * w / 5, 0, 2, h); }
    }, false);
    this.boards = GB_DROP.lanes.map((L) => {
      const m = new THREE.MeshStandardMaterial({ map: boardTex, color: L.tint, roughness: 0.85, name: 'gbBoard' });
      // 1.30 m tall board, bottom on the floor; 13 grid rows → one every 10 cm
      const b = gbAdd(R, new THREE.PlaneGeometry(GB_DROP.boardW, 1.3), m, L.x, 0.65, Z - 0.2, { cast: false });
      gbAdd(R, gbRoundBox(GB_DROP.boardW + 0.04, 0.03, 0.04, 0.008, 2), brass, L.x, 1.31, Z - 0.19);
      return b;
    });
    // the metre stick between the lanes (wood, black ticks every cm, numbers every 10 cm)
    const stickTex = gbCanvasTex(64, 1024, (x, w, h) => {
      x.fillStyle = '#e3b864'; x.fillRect(0, 0, w, h);
      for (let k = 0; k <= 100; k++) { const y = h - (k / 100) * h; const L = k % 10 ? (k % 5 ? 14 : 24) : 40; x.fillStyle = '#2a1a12'; x.fillRect(0, Math.min(h - 3, Math.max(0, y - 1.5)), L, 3); }
      x.font = 'bold 20px Inter, sans-serif'; x.fillStyle = '#2a1a12'; x.textAlign = 'right';
      for (let k = 10; k <= 90; k += 10) x.fillText(String(k), w - 4, h - (k / 100) * h + 7);
    }, false);
    this.stick = gbAdd(R, new THREE.BoxGeometry(0.045, 1.0, 0.012), [gbMat('#c8994c'), gbMat('#c8994c'), gbMat('#c8994c'), gbMat('#c8994c'),
      new THREE.MeshStandardMaterial({ map: stickTex, roughness: 0.7 }), gbMat('#c8994c')], GB_DROP.rulerX, 0.5, Z);
    gbAdd(R, gbRoundBox(0.16, 0.02, 0.1, 0.006, 2), metal, GB_DROP.rulerX, 0.01, Z);
    // the 1 m mark: a thin bright bar across both lanes at the cups' bottoms (shown during "from one meter")
    this.markM = new THREE.MeshBasicMaterial({ color: '#ffe2b0', transparent: true, opacity: 0, depthWrite: false, fog: false });
    this.mark = gbAdd(R, new THREE.BoxGeometry(1.5, 0.004, 0.004), this.markM, (GB_DROP.lanes[0].x + GB_DROP.lanes[1].x) / 2, GB_DROP.h, Z, { cast: false });
    // per lane: a stand + arm + a two-jaw release clamp, the cup, a floor target ring, a contact shadow, shards, a strobe trail
    const sc = document.createElement('canvas'); sc.width = sc.height = 64; const sx = sc.getContext('2d');
    const gr = sx.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,0.9)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, 64, 64);
    const blobTex = new THREE.CanvasTexture(sc);
    this.lanes = GB_DROP.lanes.map((L, li) => {
      const o = { L, li };
      // the stand's pole stands at the board's OUTER edge (never behind the fall path); an L-arm reaches over to the clamp
      const ax = -L.side * 0.24;
      const st = new THREE.Group(); st.position.set(L.x - ax, 0, Z - 0.13); R.add(st);
      gbAdd(st, gbRoundBox(0.16, 0.02, 0.2, 0.006, 2), metal, 0, 0.01, 0.03);
      gbAdd(st, new THREE.CylinderGeometry(0.009, 0.009, 1.24, 10), metal, 0, 0.63, 0);
      gbAdd(st, new THREE.CylinderGeometry(0.006, 0.006, 0.24, 8), metal, ax / 2, 1.2, 0, { rz: Math.PI / 2 });
      gbAdd(st, gbRoundBox(0.026, 0.026, 0.026, 0.005, 2), brass, 0, 1.2, 0);
      gbAdd(st, new THREE.CylinderGeometry(0.006, 0.006, 0.13, 8), metal, ax, 1.2, 0.065, { rx: Math.PI / 2 });
      gbAdd(st, gbRoundBox(0.03, 0.03, 0.03, 0.005, 2), brass, ax, 1.2, 0.0);
      // jaws: two curved pads that grip the rim from the sides; they swing open at the release
      o.jaws = [-1, 1].map((s) => {
        const p = new THREE.Group(); p.position.set(ax + s * 0.012, 1.2, 0.13); st.add(p);
        gbAdd(p, new THREE.BoxGeometry(0.044, 0.008, 0.008), metal, s * 0.022, 0, 0);
        gbAdd(p, new THREE.BoxGeometry(0.006, 0.07, 0.016), metal, s * 0.044, -0.03, 0);
        gbAdd(p, new THREE.BoxGeometry(0.004, 0.022, 0.02), gbMat('#5a2a2a', { rough: 0.9 }), s * 0.041, -0.06, 0);
        return { p, s };
      });
      o.cup = cupFactory(china); R.add(o.cup);
      o.cup.userData.surf.visible = false;   // an empty cup
      // floor: a brass target ring under the lane
      gbAdd(R, new THREE.RingGeometry(0.075, 0.085, 40), gbMat('#c49a52', { rough: 0.35, metal: 0.7 }), L.x, 0.002, Z, { rx: -Math.PI / 2, cast: false });
      o.blobM = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity: 0 });
      o.blob = gbAdd(R, new THREE.PlaneGeometry(1, 1), o.blobM, L.x, 0.003, Z, { rx: -Math.PI / 2, cast: false, receive: false });
      o.shards = [];
      for (let i = 0; i < 14; i++) {
        const r = 0.01 + 0.016 * hash1(i * 3 + li * 50), geo = new THREE.TetrahedronGeometry(r); geo.scale(1, 0.35 + 0.3 * hash1(i * 13 + li), 1.3);
        o.shards.push(gbAdd(R, geo, china, 0, -5, 0));
      }
      o.handle = gbAdd(R, new THREE.TorusGeometry(0.022, 0.0065, 8, 18, Math.PI * 1.25), china, 0, -5, 0);
      o.base = gbAdd(R, gbLathe([[0.025, 0.0], [0.034, 0.0], [0.04, 0.006], [0.043, 0.03], [0.038, 0.012], [0.025, 0.012]], 24), china, 0, -5, 0);
      o.trailM = gbMat(L.tint, { rough: 0.6, transparent: true, opacity: 0, depthWrite: false, name: 'gbTrailX' + li });
      o.trail = []; for (let i = 0; i < 9; i++) { const c = cupFactory(o.trailM); c.userData.surf.visible = false; c.traverse((m) => { m.castShadow = false; m.renderOrder = 5; }); c.visible = false; R.add(c); o.trail.push(c); }
      // the landing time, found from the lane's own trajectory (1 ms steps; the cup's bottom reaches the floor)
      let tau = 0; while (this.bottomY(L, tau) > 0 && tau < 2) tau += 0.0005;
      o.landT = tau; o.vImpact = L.g * tau;
      return o;
    });
    this.root.visible = false;
  }

  // the cup bottom's height τ seconds after the release (free fall, no drag)
  bottomY(L, tau) { return tau <= 0 ? GB_DROP.h : GB_DROP.h - 0.5 * L.g * tau * tau; }

  update(t, show) {
    this.root.visible = show;
    if (!show) return;
    const te = gbExpT(t), replay = gbInReplay(t), Z = GB_DROP.z;
    // the 1 m bar during "From one meter"
    this.markM.opacity = 0.85 * MathX.window(t, GB.oneM[0] - 0.1, GB.oneM[1] + 1.2, 0.25, 0.5);
    for (const o of this.lanes) {
      const L = o.L, tau = Math.max(0, te);
      // clamps: pads squeeze the rim, then snap open at τ = 0 (in the replay too)
      const open = MathX.smooth(te, -0.005, 0.05);
      for (const J of o.jaws) J.p.rotation.z = J.s * (0.55 * open);
      const landed = tau >= o.landT;
      const y = landed ? 0 : this.bottomY(L, tau);
      o.cup.visible = !landed;
      o.cup.position.set(L.x, y, Z); o.cup.rotation.set(0, -Math.PI / 2 + 0.15, 0);
      // a hair of tumble from the jaws letting go unevenly (the same in both lanes, scaled to the fall)
      o.cup.rotateZ(0.12 * (tau / o.landT) * (tau / o.landT));
      // contact shadow: darker and tighter as it nears the floor
      const k = MathX.clamp(1 - y / 1.05, 0, 1);
      o.blob.visible = !landed;
      o.blob.scale.setScalar(0.24 - 0.12 * k); o.blobM.opacity = 0.12 + 0.62 * k * k;
      // strobe trail in the replay: where the cup was every 0.04 s (the gaps grow: it accelerates)
      const tf = replay ? 1 - MathX.smooth(t, GB.replayEnd - 0.6, GB.replayEnd) : 0;
      o.trailM.opacity = 0.38 * tf;
      for (let i = 0; i < o.trail.length; i++) {
        const ti = (i + 1) * 0.04, c = o.trail[i];
        c.visible = tf > 0.01 && tau > ti && ti < o.landT;
        if (!c.visible) continue;
        c.position.set(L.x, this.bottomY(L, ti), Z); c.rotation.copy(o.cup.rotation); c.rotation.set(0, -Math.PI / 2 + 0.15, 0); c.rotateZ(0.12 * (ti / o.landT) ** 2);
      }
      // the impact: shards in the lane's own gravity; launch speeds scale with the impact speed (√2 more in 2 g)
      const ua = tau - o.landT, dt = 1 / 240, G = L.g, vs = o.vImpact / 4.43;
      const all = [...o.shards, o.handle, o.base];
      for (let i = 0; i < all.length; i++) {
        const sh = all[i];
        if (ua < 0) { sh.visible = false; continue; }
        sh.visible = true;
        const big = i >= o.shards.length;
        const a = hash1(i * 5 + 1 + o.li * 31) * Math.PI * 2, sp = (big ? 0.18 + 0.15 * hash1(i * 7) : 0.35 + 0.8 * hash1(i * 9 + o.li)) * vs;
        let px = 0, py = 0.02, pz = 0, vx = Math.cos(a) * sp * 0.55, vy = (big ? 0.35 + 0.25 * hash1(i) : 0.5 + 1.0 * hash1(i * 4 + o.li)) * vs, vz = Math.sin(a) * sp;
        const n = Math.min(Math.round(ua / dt), 600);
        for (let s = 0; s < n; s++) {
          vy -= G * dt; px += vx * dt; py += vy * dt; pz += vz * dt;
          if (py < 0.006) { py = 0.006; if (vy < -0.25) { vy = -vy * 0.3; vx *= 0.55; vz *= 0.55; } else { vy = 0; vx *= 0.9; vz *= 0.9; } }
        }
        // shards stay in their own lane (they skid toward the camera / the back, not into the other lane)
        sh.position.set(L.x + MathX.clamp(px, -0.26, 0.26), py, Z + pz);
        const spin = Math.min(ua, 0.4) * 14 * hash1(i * 3);
        if (i === o.shards.length) sh.rotation.set(Math.PI / 2 * Math.min(1, ua * 4), a, spin * 0.3);
        else if (big) sh.rotation.set(0.25 * Math.max(0, 1 - ua * 3) * Math.sin(ua * 30), a, 0.6 * Math.max(0, 1 - ua * 2));
        else sh.rotation.set(hash1(i) * 6 + spin, hash1(i * 2) * 6, spin * 0.5);
      }
    }
  }

  // lane timer value (s) at film time t: the measured fall time, frozen at the landing
  timer(t, li) { const o = this.lanes[li]; const te = gbExpT(t); return MathX.clamp(te, 0, o.landT); }
}
