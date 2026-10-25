/* =====================================================================
   STAIR — stairway C of the North Tower, 8:50 to 9:42: from the 73rd floor to the mezzanine.
   One stairway, 44 in (1.12 m) wide, two flights a floor (10 risers each, 12 ft a floor) round a narrow gap, a
   landing at every floor (a door, a painted floor number) and half-way. Glowing paint on every step edge, along the
   handrails and the landings (added after the 1993 bombing). Fluorescent lights on the landings.
   The shaft is built five floors deep and re-placed as you go down, so it never ends; the floor numbers follow the
   floor you are on. Inside a shot you walk at the crowd's real pace (about 0.6 m/s, with stops); between shots the
   descent is sped up, and the floor number jumps with it (the tag says so).
   The crowd: two lanes going down; "stay to the right" puts everyone in the inner lane; firefighters come up the
   outer one. Also here: the transfer hallway on 48 (the stairway ends and starts again a short walk away), the
   water on the lower floors, and (at the end of the film) the same stairway, empty, its lights out, only the glow.
   ===================================================================== */

const NT_RISE = NT_FLOOR_H / 20, NT_TREAD = 0.28, NT_RUN = 9 * NT_TREAD;   // 0.183 m risers, a 2.52 m flight
const NT_FLEN = Math.hypot(NT_RUN, NT_FLOOR_H / 2);
// a point on a lane's path, `p` floors down from the floor-0 landing (p ≥ 0; any real). r = the lane's radius (0.36
// inner, 0.9 outer). → [x, y, z, heading]
function ntStairAt(p, r) {
  const m = Math.floor(p), u = p - m, Hf = NT_FLOOR_H, L = 2 * NT_FLEN + 2 * Math.PI * r, s = u * L, y0 = -m * Hf;
  const a = NT_FLEN, b = a + Math.PI * r, c = b + NT_FLEN;
  if (s < a) { const k = s / a; return [r, y0 - k * Hf / 2, k * NT_RUN, Math.PI]; }
  if (s < b) { const th = (s - a) / r; return [r * Math.cos(th), y0 - Hf / 2, NT_RUN + r * Math.sin(th), Math.PI - th]; }
  if (s < c) { const k = (s - b) / NT_FLEN; return [-r, y0 - Hf / 2 - k * Hf / 2, NT_RUN * (1 - k), 0]; }
  const th = Math.PI + (s - c) / r; return [r * Math.cos(th), y0 - Hf, r * Math.sin(th), Math.PI - th];
}
// how far you have come down in a stair shot (floors, from the shot's start): the crowd's pace with its stops
const NT_PACE = 0.062;
function ntStairLocal(t, s) {
  const a = Math.max(0, t - s.t0 - (s.mode === 'enter' ? 2.6 : 0)), stops = { pace: [[3.2, 2.4]], calm: [[1.5, 3.0], [7.0, 1.6]], ff: [[1.0, 9.5], [13.5, 8.0]], transfer: [] }[s.mode] || [];
  // integrate a speed that eases to zero in each stop
  let p = 0; const dt = 0.05;
  for (let x = 0; x < a; x += dt) {
    let v = 1; for (const [s0, d] of stops) v = Math.min(v, 1 - MathX.smooth(x, s0 - 0.6, s0) * (1 - MathX.smooth(x, s0 + d, s0 + d + 0.8)));
    p += v * dt * Math.min(1, (x + dt) / 0.6 + (s.mode === 'enter' ? 0 : 1));
  }
  const sp = { enter: 0.85, thin: 1.6, water: 1.05, empty: 0.2, right: 0.8 }[s.mode] || 1;
  return p * NT_PACE * sp;
}
// the shot's starting point, in floors down from 73
function ntStairBase(s) { if (s.mode === 'empty') return 0; return 73 - ntFloorF(s.t0); }
// the floor you are on now (the HUD reads this while you are on the stairs)
function ntFloorNowF(t) {
  const s = ntShotAt(t);
  if (s.set !== 'stair' || s.mode === 'transfer' || s.mode === 'empty') return ntFloorF(t);
  return 73 - (ntStairBase(s) + ntStairLocal(t, s));
}
const ntFloorNow = (t) => Math.max(1, Math.ceil(ntFloorNowF(t) - 0.02));

NT_SETS.stair = (app) => {
  const S = ntSet(app, { sky: '#0c0d0e', fov: 62, near: 0.03, far: 80, hemi: ['#d9dcd6', '#55524c', 0.32] });
  const scene = S.scene;
  scene.fog = new THREE.FogExp2('#3a3a38', 0.05);
  const Hf = NT_FLOOR_H, HW = 1.27;
  // ---- one floor of the shaft, as merged geometry per material, shared by five copies
  const A = { step: [], slab: [], wall: [], glow: [], rail: [], fix: [] };
  for (const k in A) A[k] = { pos: [], nor: [], uv: [], idx: [] };
  const box = (k, x0, x1, y0, y1, z0, z1) => ntBoxInto(A[k], Math.min(x0, x1), Math.max(x0, x1), Math.min(y0, y1), Math.max(y0, y1), Math.min(z0, z1), Math.max(z0, z1));
  // floor landing (y = 0) and the half landing
  box('slab', -HW, HW, -0.22, 0, -1.3, 0); box('slab', -HW, HW, -Hf / 2 - 0.22, -Hf / 2, NT_RUN, 3.9);
  // flight 1 (x > 0, going +z), flight 2 (x < 0, going −z): treads, and a glowing strip on every edge
  for (let k = 1; k <= 9; k++) {
    const y = -k * NT_RISE, z0 = (k - 1) * NT_TREAD, z1 = k * NT_TREAD;
    box('step', 0.07, 1.19, y - NT_RISE - 0.05, y, z0, z1);
    const y2 = -Hf / 2 - k * NT_RISE, w0 = NT_RUN - (k - 1) * NT_TREAD, w1 = NT_RUN - k * NT_TREAD;
    box('step', -1.19, -0.07, y2 - NT_RISE - 0.05, y2, w1, w0);
  }
  for (let k = 0; k <= 9; k++) {
    box('glow', 0.1, 1.16, -k * NT_RISE + 0.001, -k * NT_RISE + 0.012, k * NT_TREAD - 0.045, k * NT_TREAD - 0.005);
    box('glow', -1.16, -0.1, -Hf / 2 - k * NT_RISE + 0.001, -Hf / 2 - k * NT_RISE + 0.012, NT_RUN - k * NT_TREAD + 0.005, NT_RUN - k * NT_TREAD + 0.045);
  }
  // the landings' glowing edges and the line along the walls at the floor
  box('glow', -HW + 0.02, HW - 0.02, 0.001, 0.012, -1.28, -1.24); box('glow', -HW + 0.02, HW - 0.02, -Hf / 2 + 0.001, -Hf / 2 + 0.012, 3.86, 3.9);
  for (const sx of [-1, 1]) { box('glow', sx * (HW - 0.04), sx * (HW - 0.01), 0.04, 0.09, -1.3, 0); box('glow', sx * (HW - 0.04), sx * (HW - 0.01), -Hf / 2 + 0.04, -Hf / 2 + 0.09, NT_RUN, 3.9); }
  // the walls (one floor tall, a little overlap), with the door's opening on the floor landing's end wall
  box('wall', -HW - 0.12, -HW, -Hf - 0.05, 0.05, -1.45, 4.05); box('wall', HW, HW + 0.12, -Hf - 0.05, 0.05, -1.45, 4.05);
  box('wall', -HW, HW, -Hf - 0.05, 0.05, 3.92, 4.05);
  box('wall', -HW, 0.12, -Hf - 0.05, 0.05, -1.45, -1.32); box('wall', 1.08, HW, -Hf - 0.05, 0.05, -1.45, -1.32); box('wall', 0.12, 1.08, -Hf - 0.05, -Hf + 2.1, -1.45, -1.32);
  // the light fittings over the door and on the half landing
  box('fix', 0.3, 0.9, 2.45, 2.55, -1.3, -1.2); box('fix', -0.3, 0.3, -Hf / 2 + 2.45, -Hf / 2 + 2.55, 3.8, 3.9);
  const mats = {
    step: ntStd('#6d6e6c', 0.75, 0.15), slab: ntStd('#7a7a76', 0.8), wall: ntStd('#c9c6bc', 0.9),
    glow: new THREE.MeshBasicMaterial({ color: '#b6f29a' }), rail: ntStd('#3c3f42', 0.45, 0.5),
    fix: new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#f4f6ee', emissiveIntensity: 1.6 }),
  };
  const geos = Object.fromEntries(Object.entries(A).map(([k, a]) => [k, ntGeoFrom(a)]));
  // the handrails (inner, both flights, both sides of the gap; and on the walls), with a glowing stripe on top
  const railG = new THREE.CylinderGeometry(1, 1, 1, 8); railG.translate(0, 0.5, 0);
  const rails = [];
  for (const sx of [1, -1]) {
    const f = (sx > 0) ? [[0, 0], [NT_RUN, -Hf / 2]] : [[NT_RUN, -Hf / 2], [0, -Hf]];
    for (const rx of [sx * 0.1, sx * 1.21]) rails.push([[rx, f[0][1] + 0.9, f[0][0]], [rx, f[1][1] + 0.9, f[1][0]]]);
  }
  const posts = [];
  for (const sx of [1, -1]) for (let k = 0; k <= 9; k += 3) { const z = sx > 0 ? k * NT_TREAD : NT_RUN - k * NT_TREAD, y = sx > 0 ? -k * NT_RISE : -Hf / 2 - k * NT_RISE; posts.push([[sx * 0.1, y, z], [sx * 0.1, y + 0.9, z]]); }

  const copies = [];
  for (let c = 0; c < 5; c++) {
    const g = new THREE.Group(); scene.add(g);
    for (const k in geos) { const m = new THREE.Mesh(geos[k], mats[k]); m.castShadow = false; m.receiveShadow = k !== 'glow' && k !== 'fix'; g.add(m); }
    for (const [a, b] of rails) { const m = new THREE.Mesh(railG, mats.rail); ntStrut(m, a, b, 0.022); g.add(m); const gl = new THREE.Mesh(railG, mats.glow); ntStrut(gl, [a[0], a[1] + 0.02, a[2]], [b[0], b[1] + 0.02, b[2]], 0.009); g.add(gl); }
    for (const [a, b] of posts) { const m = new THREE.Mesh(railG, mats.rail); ntStrut(m, a, b, 0.012); g.add(m); }
    // the door (steel, painted) and the floor number painted on the wall beside it
    const door = ntBox(0.94, 2.06, 0.05, ntStd('#6b3a2c', 0.55, 0.3), 0.6, 1.03, -1.33, g);
    ntBox(0.04, 0.3, 0.06, ntStd('#b9a77a', 0.3, 0.8), 0.98, 1.0, -1.29, g);
    const sign = ntCanvasTex(256, 320, (cx, W, H, st) => {
      cx.fillStyle = '#efece4'; cx.fillRect(0, 0, W, H); cx.fillStyle = '#16181a'; cx.textAlign = 'center';
      cx.font = 'bold 40px sans-serif'; cx.fillText('STAIR C', W / 2, 52); cx.font = 'bold 150px sans-serif'; cx.fillText(String(st.n), W / 2, 200);
      cx.fillStyle = 'rgba(160,230,140,0.9)'; cx.fillRect(16, 280, W - 32, 14);
    });
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.62), new THREE.MeshStandardMaterial({ map: sign.tex, roughness: 0.7, emissive: '#ffffff', emissiveMap: sign.tex, emissiveIntensity: 0.12 }));
    sm.position.set(-0.55, 1.55, -1.31); g.add(sm);
    // the water on the steps (the lower floors): a moving sheet over both flights and the landings
    copies.push({ g, door, sign });
  }
  const waterTex = ntTex(ntCanvas(256, 256, (g2, W, H) => {
    g2.fillStyle = '#000'; g2.fillRect(0, 0, W, H); const r = new RNG(12);
    g2.fillStyle = 'rgb(105,105,105)'; g2.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { g2.strokeStyle = `rgba(255,255,255,${r.range(0.25, 0.8)})`; g2.lineWidth = r.range(1.5, 4); g2.beginPath(); const y = r.range(0, H), ph = r.range(0, 6), x0 = r.range(-40, W * 0.6), x1 = x0 + r.range(50, 200); for (let x = x0; x <= x1; x += 6) g2.lineTo(x, y + 4 * Math.sin(x * 0.06 + ph)); g2.stroke(); }
  }));
  waterTex.repeat.set(2, 5);
  const waterM = new THREE.MeshStandardMaterial({ color: '#86a3b5', transparent: true, opacity: 0.0, roughness: 0.06, metalness: 0.5, alphaMap: waterTex, emissive: '#b4d2e4', emissiveIntensity: 0.32, depthWrite: false });
  const wsheet = [];
  for (let c = 0; c < 5; c++) {
    const g = copies[c].g;
    for (const sx of [1, -1]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, NT_FLEN), waterM);
      const yA = sx > 0 ? -Hf / 4 : -3 * Hf / 4; m.position.set(sx * 0.63, yA + 0.03, NT_RUN / 2);
      m.rotation.set(-Math.PI / 2 + (sx > 0 ? 1 : -1) * Math.atan2(Hf / 2, NT_RUN), 0, 0); g.add(m); wsheet.push(m);
    }
    const l1 = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.3), waterM); l1.rotation.x = -Math.PI / 2; l1.position.set(0, 0.012, -0.65); g.add(l1); wsheet.push(l1);
  }
  // drips through the gap from the landings above
  const NDR = 90, drip = new THREE.InstancedMesh(new THREE.BoxGeometry(0.006, 0.18, 0.006), new THREE.MeshBasicMaterial({ color: '#cfe4f0', transparent: true, opacity: 0.55 }), NDR);
  drip.frustumCulled = false; scene.add(drip);

  // ---- the lights that move with you (the nearest landings)
  const L1 = new THREE.PointLight('#f2f2e8', 6, 9, 1.6), L2 = new THREE.PointLight('#f2f2e8', 4, 9, 1.6), L3 = new THREE.PointLight('#f2f2e8', 3, 9, 1.6);
  scene.add(L1); scene.add(L2); scene.add(L3);

  // ---- the crowd: two lanes going down, firefighters coming up the outer one, the injured man and his helpers
  const RI = 0.36, RO = 0.9, LI = 2 * NT_FLEN + 2 * Math.PI * RI, LO = 2 * NT_FLEN + 2 * Math.PI * RO;
  const inner = Array.from({ length: 18 }, (_, i) => ntPerson(scene, 'si' + i, NT_LOOKS[(i * 3) % NT_LOOKS.length]));
  const outer = Array.from({ length: 20 }, (_, i) => ntPerson(scene, 'so' + i, NT_LOOKS[(i * 7 + 2) % NT_LOOKS.length]));
  const ffs = Array.from({ length: 11 }, (_, i) => ntPerson(scene, 'ff' + i, i % 2 ? 'ntFF2' : 'ntFF'));
  ffs.forEach((p, i) => ntFireGear(p, i));
  const hurt = [ntPerson(scene, 'hurt', 'ntShirtB'), ntPerson(scene, 'help1', 'ntSuit'), ntPerson(scene, 'help2', 'ntPolo')];
  // a hose roll and a tool on some firefighters' shoulders
  const hoseM = ntStd('#c9b88a', 0.8);
  ffs.forEach((p, i) => { if (i % 3 !== 2) { const h = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.06, 6, 14), hoseM); h.position.set(0.2, 0.44, -0.02); h.rotation.y = Math.PI / 2; p.j.spine.add(h); } });
  // the water bottle passed along the line (calm)
  const bottle = new THREE.Group(); scene.add(bottle);
  ntBox(0.066, 0.2, 0.066, new THREE.MeshStandardMaterial({ color: '#cfe6f2', roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.75, emissive: '#7fa6bc', emissiveIntensity: 0.25 }), 0, 0, 0, bottle);
  ntBox(0.068, 0.05, 0.068, ntStd('#2e6fb4', 0.5), 0, 0.01, 0, bottle); ntBox(0.03, 0.03, 0.03, ntStd('#f2f2f2', 0.4), 0, 0.115, 0, bottle);
  const _h0 = new THREE.Vector3(), _h1 = new THREE.Vector3();

  // ---- the transfer hallway on 48 (built off to the side): gypsum walls, a strip of lights, the crowd walking
  const TR = new THREE.Group(); TR.position.set(60, 0, 0); scene.add(TR);
  ntBox(0.12, 2.6, 16, mats.wall, -0.8, 1.3, -6, TR); ntBox(0.12, 2.6, 16, mats.wall, 0.8, 1.3, -6, TR);
  ntBox(1.6, 0.05, 16, ntStd('#6e6a64', 0.85), 0, 0, -6, TR); ntBox(1.6, 0.05, 16, ntStd('#d6d3cb', 0.9), 0, 2.6, -6, TR);
  for (let z = 0; z > -14; z -= 2.6) ntBox(0.25, 0.04, 1.2, mats.fix, 0, 2.56, z, TR);
  for (const sx of [-1, 1]) ntBox(0.03, 0.05, 16, mats.glow, sx * 0.73, 0.05, -6, TR);
  const trLight = new THREE.PointLight('#f2f2e8', 5, 10, 1.5); TR.add(trLight);
  const trSign = ntTex(ntCanvas(512, 128, (g2, W, H) => { g2.fillStyle = '#efece4'; g2.fillRect(0, 0, W, H); g2.fillStyle = '#16181a'; g2.font = 'bold 54px sans-serif'; g2.textAlign = 'center'; g2.fillText('STAIR C  →  CONTINUES', W / 2, 84); }), { repeat: false });
  const trs = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), ntStd('#fff', 0.7, 0, { map: trSign })); trs.position.set(0.73, 1.8, -5); trs.rotation.y = -Math.PI / 2; TR.add(trs);
  const trPeople = Array.from({ length: 10 }, (_, i) => ntPerson(scene, 'tr' + i, NT_LOOKS[(i * 5 + 1) % NT_LOOKS.length]));

  const cam = S.camera, _m = new THREE.Matrix4(), _v = new THREE.Vector3();
  let curShot = null;
  const hurtAt = (t) => { const sh = ntShotAt(t); return sh.mode === 'right' ? ntStairBase(sh) + ntStairLocal(NT.hurt - 3.0, sh) - 0.16 + (t - (NT.hurt - 3.0)) * 0.085 : -9; };
  function hide(list) { for (const p of list) p.root.visible = false; }

  return {
    scene, camera: cam, _ffs: ffs,
    cuts() { return []; },
    frame(t, s) {
      curShot = s;
      const empty = s.mode === 'empty';
      if (s.mode === 'transfer') {
        // the hallway: you walk its length; at the end the stairs again (cut)
        for (const c of copies) c.g.visible = false;
        TR.visible = true; hide(inner); hide(outer); hide(ffs); hide(hurt); drip.visible = false;
        const a = t - s.t0, z = 1.2 - a * 0.62;
        ntCam(cam, [60 + 0.18, 1.6 + 0.02 * Math.sin(a * 7.5), z], [60 + 0.05, 1.45, z - 5], 62, 0.3 * Math.sin(a * 3.7));
        trLight.position.set(0, 2.3, z - 2);
        trPeople.forEach((p, i) => { const pz = z - 1.1 - i * 0.85 - (i % 2) * 0.2, px = 60 + (i % 2 ? 0.28 : -0.22); ntPlace(p, px, 0, pz, 0, 'walk', a, (a * 0.62 + i) / 1.32 * Math.PI * 2); });
        L1.intensity = L2.intensity = L3.intensity = 0;
        return;
      }
      TR.visible = false; hide(trPeople);
      // where you are on the stairs (floors down from the shot's landing), placed in the five copies
      const base = ntStairBase(s), P = base + ntStairLocal(t, s);
      const Pc = Math.max(0, P), m0 = Math.floor(Pc) - 2;
      copies.forEach((c, k) => {
        const m = m0 + k; c.g.visible = m >= -1; c.g.position.y = -m * Hf;
        c.sign.update({ n: Math.max(1, 73 - m) });
        c.door.rotation.y = 0; c.door.position.x = 0.6;
      });
      // the camera: your eye 1.6 m over your lane, looking a couple of metres down the flight (about 25° down; more
      // where the steps themselves are the point: the glow, the water); the steps in the bob
      const lane = s.mode === 'ff' ? RI - 0.12 : s.mode === 'right' ? RI - 0.06 : RI + 0.1;
      const look = s.mode === 'glow' ? [0.12, 0.95] : s.mode === 'water' ? [0.1, 0.45] : [0.21, 1.3];
      let E, ahead;
      {
        const p = ntStairAt(Pc, lane); E = [p[0], p[1] + 1.6, p[2]];
        const q = ntStairAt(Pc + look[0], lane); ahead = [q[0] * 0.8, q[1] + look[1], q[2]];
      }
      if (s.mode === 'enter' && t < s.t0 + 2.6) {
        // through the door onto the landing, into the line
        const k = Ease.inOutSine(MathX.smooth(t, s.t0, s.t0 + 2.6));
        E = ntV([0.6, 1.6, -2.0], E, k); ahead = ntV([0.3, 1.2, 0.6], ahead, k);
      }
      // the firefighters: look down the outer lane they come up; the injured man: turn to him as he passes
      if (s.mode === 'ff') { const q = ntStairAt(Pc + 0.22, RO); ahead = ntV(ahead, [q[0], q[1] + 1.75, q[2]], 0.4); }
      if (s.mode === 'right') {
        const rel = hurtAt(t) - Pc, w = MathX.smooth(rel, -0.02, 0.07) * (1 - MathX.smooth(rel, 0.3, 0.45));   // (only once they're past you: no swing round)
        if (w > 0) { const q = ntStairAt(Math.max(0, hurtAt(t)), RO + 0.05); ahead = ntV(ahead, [q[0], q[1] + 1.35, q[2]], 0.75 * w); }
      }
      const step = Math.sin(Pc * LI / NT_TREAD * Math.PI) * 0.018;
      const shk = ntJolt(t, NT.shake, s.mode === 'shake' ? 2.2 : 0, 1.6), sw = ntSway(t, NT.shake + 0.3, s.mode === 'shake' ? 0.7 : 0, 6.5, 8);
      const d = ntDrift(t, 0.01, 0.5, 9);
      ntCam(cam, [E[0] + d[0] + shk[0] + sw[0], E[1] + (empty ? 0 : step) + d[1] + shk[1], E[2] + d[2]], ahead, 58, shk[2] + sw[1] + (empty ? 0.15 : 0.8) * noise1(t * 0.3, 2));
      // the lights: the landing just below, the half landing, the one above
      const lvl = (k) => { const mm = Math.floor(Pc) + k; return [0.5, -mm * Hf + 2.3, -0.9]; }, half = (k) => { const mm = Math.floor(Pc) + k; return [0, -mm * Hf - Hf / 2 + 2.3, 3.6]; };
      L1.position.set(...lvl(1)); L2.position.set(...half(0)); L3.position.set(...lvl(0));
      // power: normal; it dips in the glow beat (only the paint lights the way), and shudders at 9:03; empty = out
      let pw = 1;
      if (s.mode === 'glow') pw = 1 - 0.7 * MathX.smooth(t, s.t0 + 1.2, s.t0 + 1.6) * (1 - MathX.smooth(t, ntE('glow') - 0.6, ntE('glow') + 1.2)) - 0.3 * Math.max(0, noise1(t * 14, 3)) * MathX.smooth(t, s.t0 + 0.6, s.t0 + 1.2);
      if (s.mode === 'shake' && t > NT.shake) pw = 1 - 0.7 * Math.exp(-(t - NT.shake) * 1.5) * (0.5 + 0.5 * Math.sin((t - NT.shake) * 40));
      if (empty) pw = 0.06;
      pw = MathX.clamp(pw, 0.04, 1);
      L1.intensity = 6 * pw; L2.intensity = 4 * pw; L3.intensity = 3 * pw; mats.fix.emissiveIntensity = 1.6 * pw; S.hemi.intensity = 0.32 * (0.25 + 0.75 * pw);
      mats.glow.color.setRGB(0.55 + 0.25 * (1 - pw), 0.85 + 0.1 * (1 - pw), 0.5 + 0.1 * (1 - pw));
      scene.fog.density = empty ? 0.07 : 0.05;
      // the water (from the 20s down): the sheets fade in, the texture runs down the flights
      const wet = s.mode === 'water' ? MathX.smooth(t, s.t0 - 0.2, s.t0 + 1.2) : s.mode === 'thin' ? 0.6 : 0;
      waterM.opacity = 0.55 * wet; waterTex.offset.set(0, -t * 0.9);
      mats.step.roughness = 0.75 - 0.55 * wet; mats.slab.roughness = 0.8 - 0.6 * wet;
      drip.visible = wet > 0;
      if (wet > 0) for (let i = 0; i < NDR; i++) {
        const h = hash1(i * 13 + 1), h2 = hash1(i * 7 + 2), per = 0.8 + h * 0.6, a = ((t + h2 * 10) % per) / per;
        const fy = -Math.floor(Pc) * Hf + Hf * 1.5 - a * Hf * 2.2;
        _m.makeTranslation((h - 0.5) * 0.12, fy, -0.4 + h2 * 3.6); drip.setMatrixAt(i, _m);
      }
      drip.instanceMatrix.needsUpdate = true;
      // ---- people
      if (empty) { hide(inner); hide(outer); hide(ffs); hide(hurt); bottle.visible = false; return; }
      const moving = (x) => { let v = 0; const dt = 0.25; v = (ntStairLocal(x + dt, s) - ntStairLocal(x - dt, s)) / (2 * dt); return MathX.clamp(v / NT_PACE, 0, 1.5); };
      const mv = moving(t);
      const single = s.mode === 'ff' || s.mode === 'right', thin = s.mode === 'thin' || s.mode === 'water';
      // the water bottle (calm): passed forward along the line, hand to hand, by the three people ahead of you
      const b0 = ntCap('calm', 1).show - 0.6, bK = s.mode === 'calm' ? (t - b0) / 1.1 : -1;
      // inner lane: ahead of you (and two behind); thin: a few, spaced out
      inner.forEach((p, i) => {
        const k = i - 2, gap = thin ? (s.mode === 'water' ? 0.17 : 0.24) : 0.105, pp = Pc + (k >= 0 ? (k + 1) * gap + 0.02 : (k) * 0.105) + 0.008 * noise1(t * 0.3, i);
        if (k === -1 || pp < -0.05 || (thin && (k < 0 || k > 4))) { p.root.visible = false; return; }
        const q = ntStairAt(Math.max(0, pp), RI + 0.06 * noise1(i, 3));
        const ph = (pp * LI) / 0.62 * Math.PI * 2 + i;
        let act = 'ntDown', b = 'ntWait', w = 1 - MathX.smooth(mv, 0.1, 0.5);
        if (bK > -0.3 && bK < 3.3 && k >= 0 && k <= 3) {
          // k gives (reaching forward) during [k, k+1]; k takes (reaching back) during [k−1, k]
          const give = MathX.smooth(bK, k - 0.3, k + 0.2) * (1 - MathX.smooth(bK, k + 0.8, k + 1.3)), take = MathX.smooth(bK, k - 1.3, k - 0.8) * (1 - MathX.smooth(bK, k - 0.1, k + 0.4));
          if (give > take) { b = 'ntGive'; w = give; } else if (take > 0) { b = 'ntTake'; w = take; }
        }
        ntPlace(p, q[0], q[1], q[2], q[3], act, t + i, ph, b, w);
      });
      bottle.visible = false;
      if (bK > -0.3 && bK < 3.0) {
        const k = Math.max(0, Math.floor(bK)), u = MathX.clamp(bK - k, 0, 1), A = inner[2 + Math.min(k, 3)], B = inner[2 + Math.min(k + 1, 3)];
        if (A.root.visible && B.root.visible) {
          A.handWorld(-1, _h0); B.handWorld(-1, _h1);
          const e = Ease.inOutSine(MathX.smooth(u, 0.35, 0.75));
          bottle.position.set(ntLerp(_h0.x, _h1.x, e), ntLerp(_h0.y, _h1.y, e) + 0.06 + 0.12 * Math.sin(Math.PI * e), ntLerp(_h0.z, _h1.z, e));
          bottle.rotation.set(0.3 * Math.sin(bK * 3), bK, 0.2); bottle.visible = true;
        }
      }
      // outer lane: also going down, except when firefighters come up or everyone moves right
      outer.forEach((p, i) => {
        const k = i - 3, pp = Pc + k * 0.084 + 0.04 + 0.006 * noise1(t * 0.25, i + 40);
        if (single || thin || pp < -0.05 || (s.mode === 'enter' && pp < 0.05)) { p.root.visible = false; return; }
        const q = ntStairAt(Math.max(0, pp), RO - 0.06 * noise1(i, 5));
        const ph = (pp * LO) / 0.62 * Math.PI * 2 + i * 1.7;
        ntPlace(p, q[0], q[1], q[2], q[3], 'ntDown', t + i, ph, 'ntWait', 1 - MathX.smooth(mv, 0.1, 0.5));
      });
      // the firefighters: a long column coming up the outer lane past you (from a floor below, at their own slow
      // pace, whether you stand or walk); one resting on the landing below, bent over, breathing
      if (s.mode === 'ff') {
        const a = t - s.t0;
        ffs.forEach((p, i) => {
          if (i === 10) { const q = [0.95, -(Math.floor(Pc) + 1) * Hf, -0.75]; ntPlace(p, q[0], q[1], q[2], -Math.PI / 2 - 0.4, 'ntRest', t); return; }
          const pp = ntStairBase(s) + 0.42 + i * 0.13 + (i > 5 ? 0.35 : 0) - a * 0.042;   // (floors down from 73, like Pc)
          if (pp < Pc - 0.3 || pp > Pc + 1.4) { p.root.visible = false; return; }
          const q = ntStairAt(Math.max(0, pp), RO + 0.1), ph = -(pp * LO) / 0.7 * Math.PI * 2 + i * 2;
          ntPlace(p, q[0], q[1], q[2], q[3] + Math.PI, 'ntClimb', t + i, ph);
        });
      } else hide(ffs);
      // the injured man, helped down past you on the outer (wall) side
      if (s.mode === 'right' && t > NT.hurt - 3.0) {
        const pp = hurtAt(t);
        const q = ntStairAt(Math.max(0, pp), RO + 0.06), q2 = ntStairAt(Math.max(0, pp - 0.07), RO + 0.04), q3 = ntStairAt(Math.max(0, pp + 0.07), RO + 0.02);
        const ph = pp * LO / 0.55 * Math.PI * 2;
        ntPlace(hurt[0], q[0], q[1], q[2], q[3], 'ntHelped', t, ph);
        ntPlace(hurt[1], q2[0], q2[1], q2[2], q2[3], 'ntHelper', t, ph + 1.6);
        ntPlace(hurt[2], q3[0], q3[1], q3[2], q3[3], 'ntHelper', t, ph + 3.1);
      } else hide(hurt);
      // nobody walks through the lens: anyone whose body is within half a metre of your eye is not drawn
      // (the firefighters' helmets: 1.1 m, or a brim fills the corner of the frame as they pass)
      for (const list of [inner, outer, ffs, hurt]) for (const p of list) {
        if (!p.root.visible) continue;
        const dx = p.root.position.x - cam.position.x, dz = p.root.position.z - cam.position.z, dy = cam.position.y - p.root.position.y, r = list === ffs ? 1.1 : 0.5;
        if (dx * dx + dz * dz < r * r && dy > -0.3 && dy < 2.0) p.root.visible = false;
        else if (list === ffs) { p.j.head.getWorldPosition(_v); if (_v.distanceTo(cam.position) < 1.25) p.root.visible = false; }   // (they lean into the climb: the head is well ahead of the feet)
      }
    },
    grade(t, p, s) {
      p.exposure = 1.04; p.saturation = 0.72; p.contrast = 1.1; p.warmth = 0.01; p.vignette = 0.62; p.bloom = 0.42; p.bloomThreshold = 0.75; p.grain = 0.038;
      if (s.mode === 'empty') { p.exposure = 1.25; p.bloom = 0.6; p.saturation = 0.8; p.vignette = 0.75; }
      if (s.mode === 'empty') p.fade = Math.max(p.fade, 1 - MathX.smooth(t, NT.out, NT.out + 1.8), MathX.smooth(t, NT.cost - 1.0, NT.cost));
    },
  };
};
