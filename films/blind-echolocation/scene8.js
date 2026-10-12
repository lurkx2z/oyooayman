/* =====================================================================
   SCENE 8 — "The room that swallows sound" (lab.js). Suspense through ABSENCE.
     H1  out of the white: a bright, bare test room; she walks in with her cane, the coach watches from the control
         room; one click (the bare room rings); the heavy door swings shut
     H2  "Imagine entering a room designed to absorb sound.": the foam wedges grow out of the walls and ceiling in a
         wave (the room is the same box: the floor stays hard)
     H3  "Your usual reflections grow weaker…": the acoustic view; three clicks; almost nothing comes back (scattered,
         faint, fading dots on the foam; only the floor answers). A trace card: one click, bare room vs foam room
     H4  "The walls haven't moved. The room hasn't changed size.": a high corner; dimension lines 6 × 5 × 3 m
     H5  "Yet the acoustic clues … are disappearing.": close on her face in the acoustic view; a click fades to nothing
     H6  "…Echolocation is useful. But it has limits.": reality; a slow push in; she lowers her head, steadies the cane
     H7  (no narration, 7.2 s) a click: almost nothing (wait); another; she sweeps the cane, then walks forward slowly;
         the cane's tip meets the foam
   ===================================================================== */

BE.s8 = BN_SC[8].start;
BE.h2 = bnE(8, 'imagine').start - 0.3;
BE.h3 = bnE(8, 'your').start - 0.25;
BE.h4 = bnE(8, 'walls').start - 0.4;
BE.h5 = bnE(8, 'yet').start - 0.25;
BE.h6 = bnE(8, 'suddenly').start - 0.5;
BE.h7 = BN_CLIP[8].speechEnd + 0.2;
BE.h7b = BE.h7 + 3.2;
BE.s9 = BN_SC[9].start;
BE.hGrow = [BE.h2 + 0.35, bnE(8, 'sound').start + 0.6];
BE.hDoor = [BE.s8 + 3.4, BE.s8 + 4.5];
BE.h1Click = bnE(8, 'to').start - 0.12;
BE.h3Clicks = [BE.h3 + 0.22, bnE(8, 'weaker').start + 0.75, bnE(8, 'use').start + 0.42];
BE.h5Clicks = [BE.h5 + 0.45, BE.h5 + 2.3];
BE.h7Clicks = [BE.h7 + 0.45, BE.h7 + 2.35];
BE.hLimits = bnE(8, 'limits').start;
BE.hWalk = [BE.h7b + 0.9, BE.s9 - 0.25];

const BE_LAB_SPOT = new THREE.Vector3(-0.4, 0, 0.2);

// ---- the set, the cast
BE_SET_BUILDERS.push((app, cast) => {
  const lb = app.sets.lab = new BeLab().build();
  lb.scene.environment = beEnvFor(app.renderer, '#e8eef4', '#d9d6cf', '#6a6460');
  lb.hero = cast.heroIn(lb.scene, 'noorC');
  lb.cane = beCane(lb.scene);
  lb.coach = new GbCharacter(lb.scene, 'coach', { name: 'coach' }); beAcousticScene(lb.coach.root, 'hero');
  lb.coach.J.hc.traverse((o) => { if (o.isMesh) o.receiveShadow = false; });
  lb.dust = new BeDust(lb.scene, lb.slots);
  lb.frame = beLabFrame; lb.fx = beLabFx;
  lb.update = function (t, L, cam, shot) {
    const u = this._u, lit = L.ac > 0.5 ? L.world : 1;
    this.hemi.intensity = MathX.lerp(0.75, 0.42, u) * lit; this.key.intensity = 1.6 * lit;
    for (const p of this.fill) p.intensity = MathX.lerp(3.0, 2.4, u) * lit;
    this.ceiling.visible = !shot.plan;
    this.dims.visible = shot.id === 'H4'; this.dimM.opacity = shot.id === 'H4' ? 0.85 * MathX.smooth(t, BE.h4 + 0.2, BE.h4 + 0.7) : 0;
  };
});

// her blocking: in through the door, to the middle of the room; then (after the words) forward toward the north wall
const BE_HERO_LAB = [
  { t0: BE.s8 - 0.3, t1: BE.s8 + 3.0, p0: new THREE.Vector3(-1.75, 0, 3.4), p1: BE_LAB_SPOT, cane: true, step: 0.46, face: 'focus' },
  { t0: BE.s8 + 3.0, p0: BE_LAB_SPOT, cane: true, face: 'focus', yaw: (t) => new Track([[BE.s8 + 3.0, Math.atan2(1.3, -3.1)], [BE.s8 + 3.8, Math.PI], [BE.h3, Math.PI]]).value(t),
    hdY: (t) => 10 * Math.sin((t - BE.h2) * 0.6) * MathX.smooth(t, BE.h2, BE.h3) },
  { t0: BE.h5 - 0.01, p0: BE_LAB_SPOT, yaw: Math.PI, cane: true, face: 'focus', hdY: (t) => -14 * MathX.smooth(t, BE.h5 + 1.0, BE.h5 + 2.2) + 14 * MathX.smooth(t, BE.h6, BE.h6 + 1.2) },
  { t0: BE.h6 - 0.01, p0: BE_LAB_SPOT, yaw: Math.PI, cane: true, face: 'calm',
    adjust: (P, t) => { const k = MathX.smooth(t, BE.hLimits - 0.4, BE.hLimits + 0.6); P.hdX = (P.hdX || 0) + 9 * k; P.nkX = (P.nkX || 0) + 4 * k; } },
  { t0: BE.h7 - 0.01, p0: BE_LAB_SPOT, yaw: Math.PI, cane: true, face: 'focus',
    hdY: (t) => 12 * MathX.window(t, BE.h7Clicks[0] + 0.2, BE.h7Clicks[1] - 0.2, 0.4, 0.4) - 10 * MathX.window(t, BE.h7Clicks[1] + 0.2, BE.h7b + 0.6, 0.3, 0.4),
    sweep: (t) => -0.7 * MathX.window(t, BE.h7b + 0.05, BE.h7b + 0.5, 0.2, 0.2) + 0.7 * MathX.window(t, BE.h7b + 0.45, BE.h7b + 0.95, 0.2, 0.2),
    lift: (t) => 0.04 * (MathX.window(t, BE.h7b + 0.0, BE.h7b + 0.2, 0.08, 0.08) + MathX.window(t, BE.h7b + 0.45, BE.h7b + 0.6, 0.06, 0.06)) },
  { t0: BE.hWalk[0], t1: BE.hWalk[1], p0: BE_LAB_SPOT, p1: new THREE.Vector3(-0.4, 0, -0.95), cane: true, step: 0.36, face: 'focus' },
];
const BE_COACH_LAB = [{ t0: -1, p0: new THREE.Vector3(3.95, 0, 0.25), yaw: -Math.PI / 2, pose: 'coachWatch', face: 'calm', hdY: (t) => 6 * Math.sin((t - BE.s8) * 0.4) }];
const BE_LAB_CLICKS = () => [BE.h1Click].concat(BE.h3Clicks, BE.h5Clicks, BE.h7Clicks);

function beLabGrowth(t) { return Ease.inOutSine(MathX.ramp(t, BE.hGrow[0], BE.hGrow[1])); }
function beLabFrame(app, t, shot) {
  const set = this;
  set.grow(beLabGrowth(t));
  set.doorPivot.rotation.y = -1.45 * (1 - Ease.inQuad(MathX.ramp(t, BE.hDoor[0], BE.hDoor[1])));
  set._act = beActor(set.hero, t, BE_HERO_LAB, { cane: set.cane, clicks: BE_LAB_CLICKS(), blinks: [BE.s8 + 1.6, BE.h3 + 2.0, BE.h6 + 1.4, BE.h7 + 1.5] });
  beActor(set.coach, t, BE_COACH_LAB, { blinks: [BE.s8 + 2.2, BE.h4 + 1.0] });
  if (shot.fp) set.hero.root.visible = false;
}
// the reflecting planes right now (the foam takes them away; the floor stays)
function beLabWalls(set) { const u = set._u; return set.walls.map((w) => Object.assign({}, w, { refl: w.floor ? w.refl : w.refl * (1 - 0.94 * u) })); }
function beLabFx(app, t, shot, L) {
  const set = this, R = set.rings, Wv = set.waves;
  for (const q of app.pulses.list) {
    if (q.set !== 'lab' || !q.click || (q.shot && q.shot !== shot.id)) continue;
    if (t > q.t && t < q.t + 0.45 && !shot.fp) R.source(q.p, [q.t], t, { r: 0.07, a: 0.8, dur: 0.45, col: '#9ff6ff' });
    if (L.ac > 0.5 && t > q.t && t < q.t + 1.8) Wv.click(q, t, beLabWalls(set), { speed: q.speed, life: 1.8, a: 0.1 });
  }
  set.dust.update(t, app, shot, L.ac);
}

// DUST: what little the foam returns: sparse, faint violet points scattered over the wedges, lit as a click's front
// passes them, fading fast (the "collapse" of the acoustic picture). Positions sampled on the wedge volume.
class BeDust {
  constructor(scene, slots, n = 5000, seed = 88) {
    const r = new RNG(seed), pos = new Float32Array(n * 3), rnd = new Float32Array(n), p = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const S = slots[Math.floor(r.next() * slots.length)], x = new THREE.Vector3(r.range(-0.3, 0.3), r.range(0.02, 0.4), r.range(-0.3, 0.3));
      p.copy(x).applyQuaternion(S.q).add(S.p); pos.set([p.x, p.y, p.z], i * 3); rnd[i] = r.next();
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.BufferAttribute(rnd, 1));
    this.u = { uO: { value: [new THREE.Vector4(0, 0, 0, -99), new THREE.Vector4(0, 0, 0, -99)] }, uT: { value: 0 }, uSp: { value: 4 }, uA: { value: 0 }, uH: { value: 1080 } };
    const m = new THREE.ShaderMaterial({
      uniforms: this.u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        uniform vec4 uO[2]; uniform float uT, uSp, uA, uH; attribute float aR; varying float vB;
        void main(){
          vB = 0.0;
          for (int k = 0; k < 2; k++) {
            float age = uT - uO[k].w; if (age <= 0.0 || age > 2.0) continue;
            float d = distance(position, uO[k].xyz), R = uSp * age;
            float front = exp(-pow((d - R) / 0.25, 2.0)), after = d < R ? exp(-(R - d) / 0.5) * 0.4 : 0.0;
            vB += (front + after) * step(aR, 0.3) * (1.0 - smoothstep(0.8, 2.0, age)) * (0.5 + aR * 1.6);
          }
          vB *= uA;
          vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = (0.016 + 0.02 * aR) * uH / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        varying float vB; void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q); if (d > 0.5 || vB < 0.003) discard;
          gl_FragColor = vec4(vec3(0.55, 0.42, 1.0) * vB * smoothstep(0.5, 0.0, d), 1.0); }`,
    });
    this.pts = new THREE.Points(g, m); this.pts.frustumCulled = false; this.pts.renderOrder = 5; this.pts.userData.beSkip = true; scene.add(this.pts);
  }
  update(t, app, shot, ac) {
    const u = this.u, cs = app.pulses.list.filter((q) => q.set === 'lab' && q.click && q.str > 0 && (!q.shot || q.shot === shot.id) && q.t <= t).slice(-2);
    for (let k = 0; k < 2; k++) { const q = cs[cs.length - 1 - k]; if (q) u.uO.value[k].set(q.p.x, q.p.y, q.p.z, q.t); else u.uO.value[k].w = -99; }
    u.uT.value = t; u.uSp.value = cs.length ? cs[cs.length - 1].speed : 4; u.uA.value = ac * (shot.dust ?? 0.9);
    u.uH.value = app.renderer.getDrawingBufferSize(new THREE.Vector2()).y;
    this.pts.visible = ac > 0.01;
  }
}

// the clicks (pulses at her mouth), the cane's taps
BE_SCHEDULERS.push((app) => {
  const P = app.pulses, B = BE, set = app.sets.lab, H = set.hero;
  const mouthAt = (t) => { FILM._shot = beShotAt(t); set.grow(beLabGrowth(t)); beActor(H, t, BE_HERO_LAB, { cane: set.cane }); return beMouth(H); };
  const add = (t, sh, o = {}) => P.add(Object.assign({ t, p: mouthAt(t + 0.01), kind: 0, speed: 4.0, w: 0.09, life: 2.2, str: 1.4, set: 'lab', shot: sh, click: true }, o));
  add(B.h1Click, 'H1', { str: 0 });
  for (const t of B.h3Clicks) add(t, 'H3');
  for (const t of B.h5Clicks) add(t, 'H5', { speed: 3.2 });
  for (const t of B.h7Clicks) add(t, 'H7a', { speed: 3.6 });
  for (const sg of BE_HERO_LAB) for (const t of beCaneTaps(sg)) { FILM._shot = beShotAt(t); const a = beActor(H, t, BE_HERO_LAB, { cane: set.cane }); if (a.tip) P.add({ t, p: a.tip.clone(), kind: 1, speed: 1.6, w: 0.03, life: 0.6, str: 0.5, set: 'lab', tap: true }); }
  FILM._shot = null; set.grow(0);
});

// ---- the shots
(function () {
  const V = (x, y, z) => new THREE.Vector3(x, y, z), B = BE;
  const lb = () => FILM._app.sets.lab;
  const head = () => lb().hero.worldOf('hd').add(V(0, 0.08, 0));
  const ac = (w = 0.012, h = 0.25) => ({ ac: 1, world: w, hero: h, glow: 0.03 });
  const lab = (p, html, a, cls, dx, dy) => ({ p, html, a, cls, dx, dy });
  const S = [
    // H1: out of the white; from the north-west corner: the door (she comes in) and the control window (the coach)
    { id: 'H1', t0: B.s8, t1: B.h2, set: 'lab', look: () => BE_REAL, flash: (t) => 0.95 * (1 - MathX.smooth(t, B.s8, B.s8 + 0.8)),
      cam: beMove(B.s8, B.h2, [V(-2.3, 1.75, -1.85), V(-0.6, 1.0, 2.0), 62], [V(-2.2, 1.65, -1.75), V(0.2, 1.1, 1.0), 58], { dof: 0.2 }) },
    // H2: the room changes: from the south-east, the wave of foam comes across the far walls and the ceiling toward us
    { id: 'H2', t0: B.h2, t1: B.h3, set: 'lab', look: () => BE_REAL,
      cam: beMove(B.h2, B.h3, [V(2.25, 1.15, 1.85), V(-1.6, 1.25, -1.6), 64], [V(2.1, 1.25, 1.7), V(-1.9, 1.9, -2.0), 66], { dof: 0.15 }) },
    // H3: the acoustic view from behind her; the trace card (bare room vs foam room)
    { id: 'H3', t0: B.h3, t1: B.h4, set: 'lab', tag: true, decay: 0.5, gain: 1.4, heroGain: 0.6, look: () => ac(0.012, 0.28), dust: 1,
      cam: beMove(B.h3, B.h4, [V(1.0, 1.95, 1.75), V(-1.1, 1.0, -2.0), 58], [V(0.8, 1.85, 1.55), V(-1.0, 1.0, -2.0), 56], { dof: 0 }),
      draw: (cv, t) => beDrawLabTrace(cv, t) },
    // H4: same walls, same size: a high corner, dimension lines through the foam to the hard walls behind it
    { id: 'H4', t0: B.h4, t1: B.h5, set: 'lab', look: () => BE_REAL,
      cam: beMove(B.h4, B.h5, [V(2.45, 2.3, 1.95), V(-0.9, 0.6, -1.1), 72], [V(2.3, 2.25, 1.8), V(-1.0, 0.7, -1.2), 70], { dof: 0 }),
      labels: (t) => { const a = MathX.smooth(t, B.h4 + 0.5, B.h4 + 0.9); return [
        lab(V(0, 0.25, -BE_LAB.D + 0.6), '<div class="k">6 m</div>', a), lab(V(-BE_LAB.W + 0.6, 0.25, 0.4), '<div class="k">5 m</div>', MathX.smooth(t, B.h4 + 0.8, B.h4 + 1.2)),
        lab(V(-BE_LAB.W + 0.6, 1.6, -BE_LAB.D + 0.6), '<div class="k">3 m</div>', MathX.smooth(t, B.h4 + 1.1, B.h4 + 1.5)),
        lab(null, '<div class="k">SAME WALLS · SAME SIZE</div><div class="s">ONLY THE SURFACES CHANGED</div>', MathX.smooth(t, bnE(8, "hasn't").start - 0.2, bnE(8, "hasn't").start + 0.2), 'small', 0, -36),
      ]; } },
    // H5: close on her face; the acoustic picture thins to nothing
    { id: 'H5', t0: B.h5, t1: B.h6, set: 'lab', tag: true, decay: 0.45, gain: 1.3, heroGain: 0.9, look: () => ac(0.01, 0.42), dust: 1.2,
      cam: (t) => { const h = head(), k = Ease.inOutSine(MathX.ramp(t, B.h5, B.h6)); return { pos: V(h.x + 0.85 - 0.15 * k, h.y + 0.02, h.z - 0.75 + 0.1 * k), at: V(h.x - 0.1, h.y - 0.08, h.z - 0.3), fov: 36, focus: 1.1, dof: 0.6 }; } },
    // H6: reality: a slow push from her front-left; she lowers her head on "limits"
    { id: 'H6', t0: B.h6, t1: B.h7, set: 'lab', look: () => BE_REAL,
      cam: (t) => { const h = head(), k = Ease.inOutSine(MathX.ramp(t, B.h6, B.h7)); return { pos: V(h.x - 1.35 + 0.45 * k, h.y - 0.25 + 0.05 * k, h.z - 1.75 + 0.6 * k), at: V(h.x + 0.05, h.y - 0.25, h.z), fov: 40, focus: 1.6, dof: 0.5 }; } },
    // H7a: (no narration) two clicks into the dead room, low behind her
    { id: 'H7a', t0: B.h7, t1: B.h7b, set: 'lab', tag: true, decay: 0.45, gain: 1.4, heroGain: 0.6, look: () => ac(0.01, 0.3), dust: 1.3,
      cam: beMove(B.h7, B.h7b, [V(0.25, 1.4, 1.5), V(-0.7, 1.15, -2.1), 54], [V(0.15, 1.35, 1.25), V(-0.65, 1.1, -2.1), 52], { dof: 0 }) },
    // H7b: reality from the side: the cane checks, she walks slowly forward; the tip meets the foam
    { id: 'H7b', t0: B.h7b, t1: B.s9, set: 'lab', look: () => BE_REAL,
      cam: (t) => { const h = head(); return { pos: V(1.55, 1.1, h.z + 0.35), at: V(-0.45, 0.75, h.z - 0.55), fov: 48, focus: 2.0, dof: 0.35 }; } },
  ];
  const i = BE_SHOTS.findIndex((s) => s.id === 'X');
  BE_SHOTS.splice(i, 0, ...S);
  BE_SHOTS[BE_SHOTS.length - 1].t0 = B.s9;
})();

// SCIENCE (H3): one click, what comes back: the bare room (ghost) and the foam room (now). Times are the real round trips
// from her mouth (1.55 m up, at x −0.4, z 0.2): ceiling 8.5 ms, floor 9.0, south wall 13.4, west 15.2, north 15.7,
// east 19.8, then the bare room's later, weaker multiple reflections. With foam only the hard floor still answers.
function beDrawLabTrace(cv, t) {
  const x = cv.getContext('2d'), B = BE;
  x.clearRect(0, 0, cv.width, cv.height);
  const X0 = 1170, Y0 = 110, PW = 660, PH = 360, gx0 = X0 + 50, gx1 = X0 + PW - 30, gy = Y0 + 250, amp = 150;
  const a0 = MathX.smooth(t, B.h3 + 0.05, B.h3 + 0.5);
  x.globalAlpha = a0; _bePanel(x, X0, Y0, PW, PH, 0.84);
  _beTxt(x, 'ONE CLICK · WHAT COMES BACK', X0 + 30, Y0 + 40, { font: '700 24px Inter, sans-serif', col: '#9ff6ff' });
  const ms = (m) => gx0 + (m / 25) * (gx1 - gx0);
  x.strokeStyle = 'rgba(200, 230, 255, 0.35)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(gx0, gy); x.lineTo(gx1, gy); x.stroke();
  for (let m = 0; m <= 25; m += 5) { x.beginPath(); x.moveTo(ms(m), gy); x.lineTo(ms(m), gy + 8); x.stroke(); _beTxt(x, m + '', ms(m), gy + 24, { font: '500 18px Inter, sans-serif', col: 'rgba(200, 230, 255, 0.6)', align: 'center' }); }
  _beTxt(x, 'milliseconds after the click', (gx0 + gx1) / 2, gy + 50, { font: '500 18px Inter, sans-serif', col: 'rgba(200, 230, 255, 0.6)', align: 'center' });
  const ech = [[8.5, 0.55, 'ceiling'], [9.0, 0.6, 'floor'], [13.4, 0.45], [15.2, 0.47], [15.7, 0.44], [19.8, 0.36]];
  const tail = []; { const r = new RNG(31); for (let m = 17; m < 25; m += r.range(0.35, 0.8)) tail.push([m, r.range(0.08, 0.26) * Math.exp(-(m - 17) / 9)]); }
  const spike = (m, a, col, w, dash) => { x.strokeStyle = col; x.lineWidth = w; x.setLineDash(dash || []); x.beginPath(); x.moveTo(ms(m), gy); x.lineTo(ms(m), gy - a * amp); x.stroke(); x.setLineDash([]); };
  // the click itself
  spike(0.2, 1.0, 'rgba(255, 255, 255, 0.9)', 4);
  // the bare room (ghost): appears first, on "your usual reflections"
  const ag = MathX.smooth(t, B.h3 + 0.2, B.h3 + 0.7);
  x.globalAlpha = a0 * ag;
  for (const [m, a] of ech) spike(m, a, 'rgba(190, 200, 215, 0.75)', 3, [6, 5]);
  for (const [m, a] of tail) spike(m, a, 'rgba(190, 200, 215, 0.5)', 2, [4, 4]);
  _beTxt(x, '┅ BARE ROOM', X0 + 30, Y0 + 80, { font: '700 19px Inter, sans-serif', col: 'rgba(200, 210, 225, 0.85)' });
  // the foam room: drawn left → right after each click (the trace "arrives")
  const last = B.h3Clicks.filter((c) => c <= t).pop();
  if (last !== undefined) {
    const sw = MathX.ramp(t, last, last + 0.5), lim = 25 * sw;
    x.globalAlpha = a0;
    for (const [m, a, nm] of ech) if (m <= lim) spike(m, nm === 'floor' ? a * 0.92 : a * 0.05, '#62f3ff', 4);
    _beTxt(x, '━ FOAM ROOM', X0 + 220, Y0 + 80, { font: '700 19px Inter, sans-serif', col: '#62f3ff' });
    if (lim > 9.0) {
      x.globalAlpha = a0 * MathX.smooth(t, last + 0.3, last + 0.6);
      _beTxt(x, 'the hard floor still answers', ms(9.0) + 14, gy - 0.6 * amp - 4, { font: '500 18px Inter, sans-serif', col: 'rgba(159, 246, 255, 0.85)' });
    }
  }
  x.globalAlpha = 1;
}
