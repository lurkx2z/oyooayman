/* =====================================================================
   THE STAIRWELL — your block's stairs, 9:47: concrete flights doubling back, a landing at every half floor, painted
   walls, a handrail, your neighbours' doors, a bulkhead lamp on a timer at every landing and a green EXIT sign.
   You go down: every step is the loudest thing in the building. The timer runs out and the lights go off: the green
   sign is all there is. You turn round. A neighbour is standing on the stairs right behind you, lit by his phone.
   Metres; y up; you go down the flights towards −z, then back towards +z. Floor 5 is y 3.0 (your door), floor 4 y 0.
   ===================================================================== */

const SO_STAIR = { rise: 1.5 / 9, tread: 0.28, n: 9, w: 1.15, gap: 0.12, land: 1.5, floors: [3.0, 0.0, -3.0] };
// the walking line (centre of each flight) and the camera's path: [x, y(feet), z] keyframes (film time from the beat)
function soStairPath() {
  const S = SO_STAIR, L = (S.n - 1) * S.tread, xA = S.gap / 2 + S.w / 2, xB = -xA, P = [];
  // floor 5 landing (your door) → flight A down to the half landing → flight B down to floor 4 → flight A' down
  const flight = (x, y0, z00, dir) => { for (let i = 1; i < S.n; i++) P.push([x, y0 - i * S.rise, z00 + dir * (i - 0.5) * S.tread]); };
  P.push([xA, 3.0, 1.1], [xA, 3.0, 0.2]);
  flight(xA, 3.0, 0, -1);
  P.push([xA - 0.15, 1.5, -L - 0.45], [xB + 0.15, 1.5, -L - 0.45], [xB, 1.5, -L - 0.05]);
  flight(xB, 1.5, -L, 1);
  P.push([xB + 0.15, 0, 0.5], [xA - 0.15, 0, 0.5], [xA, 0, 0.05]);
  flight(xA, 0.0, 0, -1);
  P.push([xA - 0.1, -1.5, -L - 0.45]);
  return P;
}
const SO_STAIR_PATH = soStairPath();

function soBuildStairSet(app) {
  const S = soSet(app, { sky: '#020203', fov: 62, near: 0.02, far: 80, hemi: ['#3a3a36', '#151412', 0.06] });
  const scene = S.scene, cam = S.camera, ST = SO_STAIR, L = (ST.n - 1) * ST.tread, root = new THREE.Group(); scene.add(root);
  const tex = (c, rx, ry) => { const t = soTex(c); t.repeat.set(rx, ry); return t; };
  const paint = soStd('#ffffff', 0.9, 0, { map: tex(soCanvas(256, 256, (g, w, h) => { g.fillStyle = '#d9d4c6'; g.fillRect(0, 0, w, h); const r = new RNG(5); for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r.next() < 0.5 ? '90,84,70' : '255,255,250'},${0.05 * r.next()})`; g.fillRect(r.next() * w, r.next() * h, 2 + 6 * r.next(), 2 + 6 * r.next()); } }), 2, 2) });
  const dado = soStd('#4c5660', 0.6), conc = soStd('#8f8b84', 0.95), nosing = soStd('#2d2f30', 0.7), rail = soStd('#2a2c2e', 0.4, 0.6), door = soStd('#6a3a2a', 0.6), frame = soStd('#e8e4da', 0.6), metal = soStd('#b8b8b0', 0.3, 0.8);
  const B = new Batcher();
  const xA = ST.gap / 2 + ST.w / 2, xB = -xA, W = ST.gap / 2 + ST.w + 0.12, z1 = 1.9, z0 = -L - 1.35;
  // the flights (each step a block down to the soffit), the landings
  for (const [x, y0, dir, z00] of [[xA, 3.0, -1, 0], [xB, 1.5, 1, -L], [xA, 0.0, -1, 0], [xB, -1.5, 1, -L]])
    for (let i = 0; i < ST.n - 1; i++) { const y = y0 - (i + 1) * ST.rise, z = z00 + dir * (i + 0.5) * ST.tread; B.box(ST.w, 0.2, ST.tread, x, y - 0.1, z, conc); B.box(ST.w, 0.025, 0.04, x, y + 0.005, z - dir * (ST.tread / 2 - 0.02), nosing); }
  for (const [y, za, zb] of [[3.0, 0, z1], [1.5, z0, -L], [0.0, 0, z1], [-1.5, z0, -L], [-3.0, 0, z1]]) B.box(2 * W, 0.2, zb - za, 0, y - 0.1, (za + zb) / 2, conc);
  // the walls: both sides, the end walls, painted above a dado; the gap wall between the flights
  // (walls painted above a dado on every floor: the dado band follows each flight down)
  const wall = (w, x, z, f, n) => { soPlane(w, 10.6, paint, x, 0.7, z, f, root); for (const y of [3.0, 1.5, 0.0, -1.5, -3.0]) soPlane(w, 0.9, dado, x + n[0] * 0.003, y + 0.45, z + n[1] * 0.003, f, root); };
  wall(z1 - z0, W, (z0 + z1) / 2, '-x', [-1, 0]); wall(z1 - z0, -W, (z0 + z1) / 2, '+x', [1, 0]);
  wall(2 * W, 0, z0, '+z', [0, 1]); wall(2 * W, 0, z1, '-z', [0, -1]);
  B.box(ST.gap, 10.6, L, 0, 0.7, -L / 2, paint);
  B.box(2 * W, 0.25, z1 - z0, 0, 6.0, (z0 + z1) / 2, conc);                                        // the ceiling over the top floor
  // the handrail along the outer walls (round bar on brackets), and the flat doors (yours: 15; then 12, 11)
  for (const [x, y0, dir, z00] of [[xA, 3.0, -1, 0], [xB, 1.5, 1, -L], [xA, 0.0, -1, 0], [xB, -1.5, 1, -L]]) {
    const xs = x + Math.sign(x) * (ST.w / 2 + 0.05), a = [xs, y0 + 0.9, z00], b = [xs, y0 - 1.5 + 0.9, z00 + dir * L];
    const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 10).translate(0, 0.5, 0), rail); root.add(m); soStrut(m, a, b, 0.022);
  }
  const doorAt = (y, num) => { const g = new THREE.Group(); g.position.set(xA + 0.05, y, z1 - 0.01); g.rotation.y = Math.PI; root.add(g);
    soBox(0.92, 2.05, 0.05, door, 0, 1.025, 0, g); soBox(1.04, 0.06, 0.07, frame, 0, 2.08, 0, g); for (const sd of [-1, 1]) soBox(0.06, 2.1, 0.07, frame, sd * 0.49, 1.05, 0, g);
    soBox(0.13, 0.03, 0.05, metal, -0.34, 1.02, 0.04, g);
    const n = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.12), new THREE.MeshStandardMaterial({ map: soTex(soCanvas(128, 96, (c, w, h) => { c.fillStyle = '#c9a54a'; c.fillRect(0, 0, w, h); c.fillStyle = '#2a1e10'; c.font = '700 70px Georgia'; c.textAlign = 'center'; c.fillText(num, w / 2, 76); }), { repeat: false }), roughness: 0.4, metalness: 0.6 }));
    n.position.set(0, 1.6, 0.03); g.add(n); };
  doorAt(3.0, '15'); doorAt(0.0, '12'); doorAt(-3.0, '9');
  // the lamps (a bulkhead on the wall at each landing: lit until the timer runs out) and the timer button (amber)
  const lamps = [], bulkM = new THREE.MeshStandardMaterial({ color: '#f6f0e0', emissive: new THREE.Color('#fff2d0'), emissiveIntensity: 2.2, roughness: 0.4 });
  for (const [x, y, z] of [[0, 3.0 + 2.25, z1 - 0.02], [0, 1.5 + 2.2, z0 + 0.02], [0, 0.0 + 2.25, z1 - 0.02], [0, -1.5 + 2.2, z0 + 0.02]]) {
    const b = soMesh(new THREE.SphereGeometry(0.16, 16, 10).scale(1.4, 0.8, 0.45), bulkM, x, y, z, root); b.castShadow = false;
    const l = new THREE.PointLight('#ffe6bf', 0, 9, 1.6); l.position.set(x, y - 0.1, z + (z > 0 ? -0.35 : 0.35)); scene.add(l); lamps.push(l);
  }
  const btnM = new THREE.MeshBasicMaterial({ color: '#ff9a2a', toneMapped: false });
  for (const [y, z] of [[3.0, z1 - 0.01], [0.0, z1 - 0.01]]) { const b = soMesh(new THREE.BoxGeometry(0.07, 0.07, 0.02), btnM, xB - 0.2, y + 1.2, z, root); b.castShadow = false; }
  // the EXIT sign over the half landing below (green, always on), and its glow
  const exitC = soCanvas(256, 96, (c, w, h) => { c.fillStyle = '#0d8a3a'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8ffe8'; c.font = '700 54px Arial'; c.fillText('EXIT', 92, 66); c.beginPath(); c.arc(42, 26, 9, 0, 6.283); c.fill(); c.fillRect(34, 36, 14, 26); c.fillRect(24, 60, 10, 22); c.fillRect(48, 56, 10, 26); });
  const exit = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.19), new THREE.MeshBasicMaterial({ map: soTex(exitC, { repeat: false }), toneMapped: false }));
  exit.position.set(0, -1.5 + 2.35, z0 + 0.03); root.add(exit);
  const exitL = new THREE.PointLight('#2aff7a', 0.45, 6, 1.6); exitL.position.set(0, -1.5 + 2.1, z0 + 0.4); scene.add(exitL);
  const exitP = [0, -1.5 + 2.35, z0 + 0.03];
  // a warm bounce off the painted walls while the timer light is on (no black voids), gone with it
  const fillL = new THREE.PointLight('#ffe2b8', 0, 16, 1.0); fillL.position.set(0, 1.4, (z0 + z1) / 2); scene.add(fillL);
  const fillL2 = new THREE.PointLight('#ffe2b8', 0, 12, 1.0); fillL2.position.set(0, -0.6, (z0 + z1) / 2); scene.add(fillL2);
  B.build(root, 'stair');
  root.traverse((o) => { if (o.isMesh) { o.receiveShadow = true; } });
  // the neighbour: behind you on the stairs, his phone lighting his face from below
  const nb = new Person({ id: 'soNb', look: 'soNeigh' }, null); scene.add(nb.root); nb.root.visible = false;
  nb.root.traverse((o) => { if (o.isMesh && o.geometry === PersonGeo.mouth) nb.mouthM = o; });
  const NP = soBuildPhone(nb.j.ra.hand); NP.g.position.set(0, -0.08, 0.05); NP.g.rotation.set(-0.4, 0, 0);
  const nbL = new THREE.PointLight('#c8dcff', 0, 2.2, 2); scene.add(nbL);
  // the close-up of his phone (a bigger copy in front of the camera)
  const big = soBuildPhone(cam); big.g.visible = false;
  // your hands in the dark? (no: you hold the rail; not seen)
  const set = {
    scene, camera: cam, lamps, nb,
    cuts() { return []; },
    frame(t, shot) {
      const m = shot.mode, k = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      // the timer light: on until SO.tLightOut (a flicker as it goes)
      const lit = t < SO.tLightOut ? 1 : 0;
      lamps.forEach((l) => { l.intensity = 7.0 * lit; }); bulkM.emissiveIntensity = 2.2 * lit;
      S.hemi.intensity = lit ? 1.0 : 0.02; fillL.intensity = 2.2 * lit; fillL2.intensity = 1.6 * lit;
      // in the dark the green sign is the only light (a little brighter once your eyes adjust)
      exitL.intensity = lit ? 0.45 : (0.45 + 0.35 * soSm(t, SO.tLightOut + 0.5, SO.tLightOut + 2.5)) * (1 - 0.6 * soSm(t, SO.tTurn - 0.2, SO.tTurn + 0.4));   // (behind you once you turn)
      // you go down the stairs, a step every half second from the beat's first caption; you stop on the half landing below 4
      const P = SO_STAIR_PATH, t0 = soC('stairs', 0) - 0.4, per = (soC('behind', 0) - 0.4 - t0) / (P.length - 1), u = MathX.clamp((t - t0) / per, 0, P.length - 1), i = Math.floor(u), f = u - i;
      const a = P[i], b = P[Math.min(P.length - 1, i + 1)], e = Ease.inOutSine(f);
      const feet = [soLerp(a[0], b[0], e), soLerp(a[1], b[1], e), soLerp(a[2], b[2], e)];
      const bob = 0.025 * Math.sin(Math.PI * f) * (i < P.length - 1 ? 1 : 0);
      const head = [feet[0], feet[1] + 1.62 - bob, feet[2]];
      // where you look: down the flight ahead, and round the turns
      const ah = P[Math.min(P.length - 1, i + 3)], dir = [ah[0] - head[0], ah[1] + 0.35 - head[1], ah[2] - head[2]];
      let at = soAdd(head, dir, 1);
      let p = head, fov = 64;
      // the light goes out: you look up at the only light left, the green EXIT sign on the landing wall
      if (t > SO.tLightOut) at = soV(at, exitP, Ease.inOutSine(soSm(t, SO.tLightOut + 0.3, SO.tLightOut + 1.6)));
      if (m === 'behind') {
        // stopped on the landing in the dark, facing the sign; you feel for the light switch and turn round (a full
        // half turn, to your right): he is right there, three steps up, his phone lighting his face from below
        const turn = Ease.inOutCubic(soSm(t, SO.tTurn - 1.0, SO.tTurn + 0.2)), H = this.nbAt();
        const back = [H[0], H[1] + 1.5, H[2]];
        const yp = (q) => { const d = [q[0] - head[0], q[1] - head[1], q[2] - head[2]], h = Math.hypot(d[0], d[2]); return [Math.atan2(d[0], d[2]), Math.atan2(d[1], h)]; };
        const [ya, pa] = yp(exitP), [yb0, pb] = yp(back); let yb = yb0; while (yb > ya) yb -= 2 * Math.PI;     // (turning right)
        const yw = soLerp(ya, yb, turn), pt = soLerp(pa, pb, turn) - 0.12 * Math.sin(Math.PI * turn);
        at = soAdd(head, [Math.cos(pt) * Math.sin(yw), Math.sin(pt), Math.cos(pt) * Math.cos(yw)]); p = soAdd(head, [0, -0.03 * Math.sin(Math.PI * turn), 0.12 * turn]); fov = 62 - 6 * soSm(t, SO.tTurn + 0.2, SO.tTurn + 3.0);
        if (shot.cam === 'phone') { p = soAdd(head, [0, 0, 0.1]); at = back; fov = 30; }
      }
      const jolt = m === 'behind' ? 0.012 * soSm(t, SO.tTurn + 0.05, SO.tTurn + 0.15) * (1 - soSm(t, SO.tTurn + 0.3, SO.tTurn + 1.2)) : 0;
      const dr = soDrift(t, 0.003 + jolt, 0.5, 21);
      soCam(cam, soAdd(p, dr), soAdd(at, dr), fov);
      // the neighbour (only once you've turned round): his face lit from below by his phone; he types
      nb.root.visible = m === 'behind' && t > SO.tTurn - 0.6 && shot.cam !== 'phone';
      if (nb.root.visible) {
        const H = this.nbAt(), q = SO_POSES.phone(); q.neck = 0.3 - 0.35 * soSm(t, SO.tTurn + 0.3, SO.tTurn + 0.9) + 0.4 * soSm(t, soC('behind', 3) - 0.5, soC('behind', 3));
        // (alive: breathing, a slight sway, his head tilting as he looks at you)
        q.spine = 0.03 * Math.sin(t * 1.6); q.headYaw = 0.06 * Math.sin(t * 0.7 + 1) - 0.1 * soSm(t, SO.tTurn + 0.6, SO.tTurn + 1.4); q.headRoll = 0.08 * soSm(t, SO.tTurn + 0.8, SO.tTurn + 2.0);
        q.mouth = t > soC('behind', 2) && t < soC('behind', 3) ? 0.5 + 0.5 * Math.sin(t * 13) * Math.sin(t * 4.1) : 0;
        nb.apply(q); nb.root.position.set(H[0], H[1], H[2]); nb.root.rotation.y = soYaw(head[0] - H[0], head[2] - H[2]);
        if (nb.mouthM) nb.mouthM.scale.y = 1 + 6 * q.mouth;
        // (the screen's light under his chin, a little towards you)
        nb.root.updateMatrixWorld(true); const hp = nb.root.localToWorld(new THREE.Vector3(0, 1.3, 0.22)); nbL.position.copy(hp); nbL.intensity = 0.55;
        nbL.position.add(new THREE.Vector3(head[0] - H[0], 0, head[2] - H[2]).normalize().multiplyScalar(0.1));
        NP.scr.update(this.typed(t, false));
      } else nbL.intensity = 0;
      big.g.visible = shot.cam === 'phone';
      if (big.g.visible) { big.g.position.set(0.0, -0.004, -0.42); big.g.rotation.set(Math.PI / 2 - 0.05, 0, 0); big.g.scale.setScalar(1); big.scr.update(this.typed(t, true)); }
    },
    // where the neighbour stands: three steps up the flight you just came down
    nbAt() { const P = SO_STAIR_PATH, j = P.length - 1 - 3; return P[j]; },
    // his phone: what he types (DON'T SHOUT.) and, a beat later, why
    typed(t, big) { const t0 = soC('behind', 3) + 0.2, n = Math.max(0, Math.floor((t - t0) / 0.13)), A = "DON'T SHOUT.", B2 = 'everyone can hear you'; const a = A.slice(0, n), b = n > A.length + 6 ? B2.slice(0, n - A.length - 6) : '';
      return { mode: 'note', a, b, cur: Math.floor(t * 2.5) % 2, big }; },
    grade(t, p, shot) {
      const lit = t < SO.tLightOut;
      p.exposure = lit ? 1.2 : 1.45; p.saturation = lit ? 0.85 : 0.95; p.warmth = lit ? 0.02 : -0.04; p.vignette = 0.68; p.bloom = 0.6; p.bloomThreshold = 0.7; p.grain = lit ? 0.04 : 0.065; p.contrast = 1.1;
      // the timer clicks off: a flicker, then black but for the green sign
      const u = t - SO.tLightOut; if (u > -0.3 && u < 0) p.exposure *= 0.6 + 0.4 * (Math.sin(u * 90) > 0 ? 1 : 0);
      void shot;
    },
  };
  return set;
}
SO_SETS.stair = soBuildStairSet;
