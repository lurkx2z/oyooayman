/* =====================================================================
   CAST — the passengers in the front car (train-local positions; they ride inside the train's group) and the
   things the men were holding when they vanished: a coffee cup, a phone, a newspaper, a strap someone was
   hanging on. People use the shared rig (js/world/people.js) with this film's looks and actions.
   Seated passengers face the aisle (right bench faces −x, θ 90; left bench faces +x, θ −90).
   ===================================================================== */

Object.assign(LOOKS, {
  mdW1: { skin: 1, build: 'slim', shirt: '#3b3530', sleeves: 'long', pants: '#22252a', shoes: '#1a1716', sole: '#2a2622', hair: '#2b1d14', hairStyle: 'long', coat: true, collar: true, scarf: '#8a6a4a' },
  mdW2: { skin: 4, build: 'slim', shirt: '#6b4a52', sleeves: 'long', pants: '#2a2a30', shoes: '#151515', sole: '#2a2a2a', hair: '#0f0b09', hairStyle: 'bun', jacket: true, shoulderBag: '#4a3426' },
  mdW3: { skin: 2, build: 'slim', shirt: '#41566a', sleeves: 'long', pants: '#33302c', shoes: '#c8c2b6', sole: '#e6e2da', hair: '#6a4a2c', hairStyle: 'pony', jacket: true, collar: true },
  mdW4: { skin: 0, build: 'avg', shirt: '#7a6a58', sleeves: 'long', pants: '#2f343c', shoes: '#2a221c', sole: '#16120e', hair: '#5a3a24', hairStyle: 'long', coat: true },
  mdW5: { skin: 3, build: 'slim', shirt: '#2f4a44', sleeves: 'long', pants: '#454048', shoes: '#111', sole: '#2a2a2a', hair: '#120d0a', hairStyle: 'pony', backpack: '#3a3a3e' },
  mdW6: { skin: 0, build: 'avg', shirt: '#6c6a74', sleeves: 'long', pants: '#3a3a40', shoes: '#2a2420', sole: '#1a1612', hair: '#b8b4ac', hairStyle: 'bun', coat: true, collar: true },
  mdW7: { skin: 5, build: 'slim', shirt: '#8a4a3a', sleeves: 'long', pants: '#1f2228', shoes: '#d0cac0', sole: '#eeeae2', hair: '#1a120c', hairStyle: 'long', jacket: true },
  mdW8: { skin: 2, build: 'avg', shirt: '#4a5260', sleeves: 'long', pants: '#2b2b2f', shoes: '#151515', sole: '#2a2a2a', hair: '#3a2416', hairStyle: 'bun', coat: true, scarf: '#5a6a7a' },
  mdW9: { skin: 1, build: 'slim', shirt: '#5a6650', sleeves: 'long', pants: '#3a3630', shoes: '#2a221a', sole: '#16120e', hair: '#8a6440', hairStyle: 'pony', jacket: true, collar: true },
  mdBoy: { skin: 1, build: 'slim', shirt: '#3a5a7a', sleeves: 'long', pants: '#2a3038', shoes: '#c8c2b6', sole: '#e6e2da', hair: '#3a2818', jacket: true, hood: true, backpack: '#a8452c' },
  mdM1: { skin: 0, build: 'avg', shirt: '#2f3a46', sleeves: 'long', pants: '#2a2c30', shoes: '#2a1f18', sole: '#1a1612', hair: '#3a2a1e', jacket: true, collar: true },
  mdM2: { skin: 3, build: 'broad', shirt: '#5a5246', sleeves: 'long', pants: '#3a3a34', shoes: '#1a1612', sole: '#2a2622', hair: '#111', hat: { type: 'cap', color: '#2c3138' } },
  mdM3: { skin: 2, build: 'avg', shirt: '#46523e', sleeves: 'long', pants: '#25282d', shoes: '#cfcac0', sole: '#e8e4dc', hair: '#1a120c', jacket: true, hood: true },
  mdM4: { skin: 0, build: 'broad', shirt: '#8a8478', sleeves: 'long', pants: '#3f3a34', shoes: '#2a1f18', sole: '#1a1612', hair: '#8a8a84', coat: true, collar: true, scarf: '#3a3f4a' },
  mdM5: { skin: 4, build: 'avg', shirt: '#24303c', sleeves: 'long', pants: '#1f2226', shoes: '#111', sole: '#2a2a2a', hair: '#0e0b09', jacket: true, shoulderBag: '#2a2622' },
  mdM6: { skin: 1, build: 'avg', shirt: '#6a3a32', sleeves: 'long', pants: '#30343c', shoes: '#3a3633', sole: '#c9c4b8', hair: '#5b3f28', jacket: true, backpack: '#2b2e30' },
  mdM7: { skin: 2, build: 'slim', shirt: '#c8c2b4', sleeves: 'long', pants: '#2a2f38', shoes: '#2a1f18', sole: '#1a1612', hair: '#2a1a12', coat: true, collar: true },
  mdM8: { skin: 5, build: 'broad', shirt: '#3f5243', sleeves: 'long', pants: '#857c68', shoes: '#4a3424', sole: '#2a1e14', hair: '#141010', hat: { type: 'beanie', color: '#3b3f44' }, jacket: true },
  mdM9: { skin: 1, build: 'broad', shirt: '#3b4a58', sleeves: 'long', pants: '#3a3f46', shoes: '#4a3a2c', sole: '#22201c', hair: '#3a2a1e', vest: '#b8662e', hat: { type: 'hard', color: '#c4a03c' } },
  mdM10: { skin: 3, build: 'avg', shirt: '#2a2c30', sleeves: 'long', pants: '#454d58', shoes: '#c8c3b8', sole: '#e6e2da', hair: '#0e0b09', jacket: true, collar: true },
  mdM11: { skin: 0, build: 'avg', shirt: '#4a3a30', sleeves: 'long', pants: '#2b2b30', shoes: '#1a1a1a', sole: '#3a3a3a', hair: '#7a5c40', hat: { type: 'cap', color: '#5a2a24' } },
});

// film actions (pure functions of τ = seconds since the state began)
Object.assign(ACTIONS, {
  mdPhone(τ, c) { const p = ACTIONS.sit(τ, c); p.lSh = [0.62, 0.12]; p.lEl = 1.45; p.rSh = [0.6, 0.12]; p.rEl = 1.5; p.neck = 0.5; p.spine = 0.1; p.headYaw = 0.05 * Math.sin(τ * 0.7 + c.seed * 3); return p; },
  mdCup(τ, c) { const p = ACTIONS.sit(τ, c); p.rSh = [0.62, 0.14]; p.rEl = 2.0; p.lSh = [0.4, 0.1]; p.lEl = 1.1; p.neck = 0.12; p.headYaw = 0.25 * Math.sin(τ * 0.4 + 1); return p; },
  mdRead(τ, c) { const p = ACTIONS.sit(τ, c); p.lSh = [0.95, 0.42]; p.lEl = 1.05; p.rSh = [0.95, 0.42]; p.rEl = 1.05; p.neck = 0.32; p.spine = 0.04; p.headYaw = 0.08 * Math.sin(τ * 0.5); return p; },
  mdDoze(τ, c) { const p = ACTIONS.sit(τ, c); p.neck = 0.35 + 0.03 * Math.sin(τ * 0.8); p.headRoll = 0.18; p.lSh = [0.3, 0.1]; p.lEl = 0.9; p.rSh = [0.3, 0.1]; p.rEl = 0.9; p.spine = -0.08; return p; },
  mdSitLook(τ, c) { const p = ACTIONS.sit(τ, c); p.headYaw = 0.6 * Math.sin(τ * 0.9 + c.seed * 6); p.neck = 0.05; p.spine = 0.02; return p; },
  // after the vanish: upright, hands up a little, head snapping between the empty seats
  mdAlarm(τ, c) {
    const p = ACTIONS.sit(τ, c), k = Math.min(1, τ / 0.25);
    p.spine = -0.12 * k; p.neck = -0.05;
    p.headYaw = (0.55 * Math.sin(τ * 1.6 + c.seed * 5) + 0.25 * Math.sin(τ * 3.1 + c.seed)) * k;
    p.lSh = [0.5 + 0.3 * k, 0.2]; p.lEl = 1.2 + 0.4 * k; p.rSh = [0.45 + 0.25 * k, 0.15]; p.rEl = 1.1 + 0.4 * k;
    return p;
  },
  mdLookOut(τ, c) { const p = ACTIONS.sit(τ, c); p.spineYaw = 0.45; p.headYaw = 1.2; p.neck = 0.1; p.spine = 0.15; p.lSh = [0.5, 0.2]; p.lEl = 1.0; return p; },
  mdHug(τ, c) { const p = ACTIONS.sit(τ, c); p.lSh = [0.65, 0.95]; p.lEl = 1.25; p.rSh = [0.5, 0.1]; p.rEl = 1.0; p.headYaw = 0.35; p.neck = 0.1; return p; },
  mdStrap(τ, c) { const p = ACTIONS.idle(τ, c); p.rSh = [2.75, 0.18]; p.rEl = 0.35; p.lSh = [0.15, 0.1]; p.lEl = 0.3; p.headYaw = 0.2 * Math.sin(τ * 0.5 + 2); return p; },
  mdPole(τ, c) { const p = ACTIONS.idle(τ, c); p.rSh = [1.05, 0.05]; p.rEl = 0.75; p.lSh = [0.2, 0.1]; p.lEl = 0.4; p.headYaw = 0.3 * Math.sin(τ * 0.6); return p; },
  mdPoleAlarm(τ, c) { const p = ACTIONS.mdPole(τ, c); p.lSh = [0.9, 0.2]; p.lEl = 1.4; p.headYaw = 0.7 * Math.sin(τ * 1.4 + 1.3); p.spine = 0.1; return p; },
  mdStandLook(τ, c) { const p = ACTIONS.idle(τ, c); p.headYaw = 0.55 * Math.sin(τ * 0.7 + c.seed * 4); p.lSh = [0.35, 0.15]; p.lEl = 1.3; p.rSh = [0.3, 0.12]; p.rEl = 1.2; return p; },
  mdHandMouth(τ, c) { const p = ACTIONS.idle(τ, c); p.rSh = [1.25, 0.15]; p.rEl = 2.25; p.neck = 0.15; p.lSh = [0.5, 0.25]; p.lEl = 1.5; return p; },
  mdSitHandMouth(τ, c) { const p = ACTIONS.sit(τ, c); p.rSh = [1.25, 0.15]; p.rEl = 2.25; p.neck = 0.15; p.spine = 0.08; return p; },
});
Object.assign(BLEND, { mdAlarm: 0.18, mdLookOut: 0.8, mdHug: 0.6, mdPoleAlarm: 0.3, mdStandLook: 0.5, mdHandMouth: 0.35, mdSitHandMouth: 0.35 });

// seat centres along the benches (train-local z)
const MD_SEATS = MD_CAR.benches.map(([a, b]) => { const n = Math.round((b - a) / 0.48), w = (b - a) / n; return Array.from({ length: n }, (_, k) => a + (k + 0.5) * w); });
const MD_SX = MD_CAR.wall - MD_CAR.seatD / 2 - 0.06;          // seated hip x (|x|)
const MD_V = MD.vanish;
// [id, look, man?, side (+1 right bench / −1 left / 0 standing), seat index [bench, k] or standing [x, z, θ], states, extra]
const MD_PEOPLE = [
  // front section (z 2.6–5.3): in view when you look forward
  ['W1', 'mdW1', 0, 1, [0, 1], [[0, 'mdPhone'], [MD_V + 0.25, 'mdAlarm'], [MD.brake + 2.0, 'mdSitLook'], [MD.harbour + 1.4, 'mdLookOut'], [MD.retreat + 0.6, 'idle']]],
  ['M1', 'mdM1', 1, 1, [0, 3], [[0, 'mdCup']]],
  ['M2', 'mdM2', 1, 1, [0, 4], [[0, 'mdDoze']]],
  ['M3', 'mdM3', 1, -1, [0, 1], [[0, 'mdPhone']]],
  ['W2', 'mdW2', 0, -1, [0, 2], [[0, 'mdSitLook'], [MD_V + 0.35, 'mdAlarm'], [MD.brake + 2.4, 'mdSitHandMouth'], [MD.road[0] + 1.5, 'mdSitLook'], [MD.retreat + 0.3, 'idle']]],
  ['M4', 'mdM4', 1, -1, [0, 4], [[0, 'mdRead']]],
  // the door bay
  ['M5', 'mdM5', 1, 0, [-0.5, 5.75, -90], [[0, 'mdStrap']]],
  ['W3', 'mdW3', 0, 0, [0.62, 6.35, 70], [[0, 'mdPole'], [MD_V + 0.2, 'mdPoleAlarm'], [MD.brake + 2.6, 'mdStandLook'], [MD.harbour + 1.0, 'mdHandMouth'], [MD.retreat, 'mdStandLook']]],
  // middle section (behind you at first): the empty seat you lean over is M6's
  ['M6', 'mdM6', 1, -1, [1, 1], [[0, 'mdSitLook']]],
  ['W6', 'mdW6', 0, -1, [1, 3], [[0, 'mdDoze'], [MD_V + 0.5, 'mdAlarm'], [MD.brake + 2.0, 'mdSitLook']]],
  ['M9', 'mdM9', 1, -1, [1, 6], [[0, 'mdSitLook']]],
  ['W7', 'mdW7', 0, -1, [1, 9], [[0, 'mdPhone'], [MD_V + 0.3, 'mdAlarm']]],
  ['M7', 'mdM7', 1, 1, [1, 0], [[0, 'mdRead']]],
  ['B1', 'mdBoy', 0, 1, [1, 3], [[0, 'mdSitLook'], [MD_V + 0.4, 'mdAlarm'], [MD.brake + 1.6, 'mdLookOut']], { child: true }],
  ['W4', 'mdW4', 0, 1, [1, 4], [[0, 'mdPhone'], [MD_V + 0.3, 'mdAlarm'], [MD.brake + 1.4, 'mdHug']]],
  ['M8', 'mdM8', 1, 1, [1, 7], [[0, 'mdDoze']]],
  ['W5', 'mdW5', 0, 1, [1, 10], [[0, 'mdSitLook'], [MD_V + 0.45, 'mdAlarm']]],
  // back section
  ['M10', 'mdM10', 1, 1, [2, 2], [[0, 'mdPhone']]],
  ['W8', 'mdW8', 0, 1, [2, 4], [[0, 'mdSitLook'], [MD_V + 0.5, 'mdAlarm']]],
  ['M11', 'mdM11', 1, 0, [-0.4, 17.2, -80], [[0, 'mdStrap']]],
  ['W9', 'mdW9', 0, -1, [2, 3], [[0, 'mdPhone'], [MD_V + 0.4, 'mdAlarm']]],
];
// who walks to the back when the bow gets close (start time offsets, target z, aisle x)
const MD_RETREAT = { W3: [-5.0, 13.5, -0.55], W1: [0.4, 16.4, -0.35], W2: [0.0, 17.6, -0.25], W6: [1.2, 18.6, 0.3], B1: [-1.4, 19.0, -0.3], W4: [-4.2, 18.8, 0.2], W7: [1.6, 19.2, 0.35], W5: [1.9, 17.8, -0.4] };

class MdCast {
  constructor(app, train) {
    this.parent = train.front;
    this.people = []; this.byId = {};
    for (const [id, look, man, side, at, states, extra = {}] of MD_PEOPLE) {
      let x, z, face, seat = null;
      if (side !== 0) { x = side * MD_SX; z = MD_SEATS[at[0]][at[1]]; face = side > 0 ? 90 : -90; seat = MD_CAR.seatH - 0.03; }
      else { x = at[0]; z = at[1]; face = at[2]; }
      const path = [[0, x, z]];
      let st = states.slice();
      const R = MD_RETREAT[id];
      if (R) {
        const t0 = MD.retreat + R[0];
        // stand (a beat), step into the aisle, walk to the back
        const ax = R[2];
        path.push([t0 + 0.6, x, z], [t0 + 1.4, ax, z + 0.3], [t0 + 1.4 + (R[1] - z) / 1.1, ax, R[1]]);
        st = st.filter((s) => s[0] < t0).concat([[t0, 'idle'], [t0 + 0.6, 'walk'], [t0 + 1.4 + (R[1] - z) / 1.1, 'mdStandLook']]);
      }
      const spec = { id, look, path, states: st, face, faceUntil: R ? MD.retreat + R[0] + 0.6 : undefined, seat: seat ?? undefined, y: 0 };
      const p = new Person(spec, this.parent);
      p.man = !!man; p.side = side; p.child = !!extra.child; p.face0 = face;
      if (p.child) { p.root.scale.setScalar(0.74); p.spec.seat = (MD_CAR.seatH + 0.02) / 0.74 - 0.05; }
      this.people.push(p); this.byId[id] = p;
    }
    this.shadows = new BlobShadows(this.parent, 40);
    this.props = new MdDropped(train);
    this._v = new THREE.Vector3();
  }

  update(t) {
    const surge = mdSurge(t);
    this.shadows.begin();
    for (const p of this.people) {
      if (p.man && t >= MD.vanish) { p.root.visible = false; continue; }
      p.root.visible = true;
      p.update(t);
      // the brake's surge: everyone leans toward the nose (seated people sideways, standing people forward), more
      // when it bites, a spring back when it stops; standing people take a half step
      const th = MathX.deg(p.face0), k = (p.side === 0 ? 0.32 : 0.22) * surge;
      if (Math.abs(k) > 1e-4) {
        const walking = p.states.some((s) => s[1] === 'walk' && t > s[0]);
        if (!walking) { p.j.spine.rotation.x += k * Math.cos(th); p.j.spine.rotation.z += k * Math.sin(th); p.j.head.rotation.z += 0.4 * k * Math.sin(th); }
      }
      const q = p.root.position;
      this.shadows.push(q.x, 0.012, q.z, p.side === 0 ? 0.55 : 0.5, 0.42);
    }
    this.shadows.end();
    this.props.update(t);
  }
}

/* ---------------- what they were holding ---------------- */
class MdDropped {
  constructor(train) {
    const g = train.front, M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.6 }, o));
    // the coffee: a paper cup with a lid and a sleeve; a puddle where it lands
    this.cup = new THREE.Group(); g.add(this.cup);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.034, 0.13, 14), M('#ece6da', { roughness: 0.7 })); this.cup.add(body);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.039, 0.055, 14), M('#7a4a2c', { roughness: 0.9 })); sleeve.position.y = -0.005; this.cup.add(sleeve);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.047, 0.016, 14), M('#e8e4dc', { roughness: 0.5 })); lid.position.y = 0.072; this.cup.add(lid);
    const pc = Tex.canvas(128, 128), px = pc.getContext('2d'), pr = new RNG(9);
    px.fillStyle = 'rgba(0,0,0,0)'; px.fillRect(0, 0, 128, 128);
    px.fillStyle = 'rgba(58,32,18,0.9)'; px.beginPath(); px.arc(64, 64, 40, 0, 7); px.fill();
    for (let i = 0; i < 9; i++) { px.beginPath(); px.arc(64 + pr.range(-40, 40), 64 + pr.range(-40, 40), pr.range(6, 18), 0, 7); px.fill(); }
    this.puddle = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshStandardMaterial({ map: Tex.tex(pc, { repeat: false }), transparent: true, roughness: 0.15, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, name: 'coffee' }));
    this.puddle.rotation.x = -Math.PI / 2; g.add(this.puddle);
    // the phone: lands face-up on the seat, its screen lit (it starts ringing)
    this.phone = new THREE.Group(); g.add(this.phone);
    this.phone.add(new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.009, 0.155), M('#16181b', { roughness: 0.3, metalness: 0.4 })));
    this.screenM = new THREE.MeshBasicMaterial({ color: new THREE.Color('#bcd8f0'), name: 'phone screen' });
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.142), this.screenM); sc.rotation.x = -Math.PI / 2; sc.position.y = 0.0052; this.phone.add(sc);
    // the newspaper: two sheets
    const nc = Tex.canvas(256, 192), nx = nc.getContext('2d');
    nx.fillStyle = '#e4dfd2'; nx.fillRect(0, 0, 256, 192); nx.fillStyle = '#3a3a3a';
    nx.font = '700 20px "Lora"'; nx.fillText('THE HARBOUR POST', 18, 28);
    for (let r = 0; r < 14; r++) for (let col = 0; col < 3; col++) nx.fillRect(14 + col * 82, 44 + r * 10, 70 * (0.6 + 0.4 * hash1(r * 3 + col)), 3);
    const nm = new THREE.MeshStandardMaterial({ map: Tex.tex(nc, { repeat: false }), roughness: 0.95, side: THREE.DoubleSide, name: 'newspaper' });
    this.sheets = [0, 1].map(() => { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.56, 4, 4), nm); g.add(s); return s; });
    this.train = train;
    // the strap M5 was holding (the nearest strap to him on the left rail)
    this.held = train.straps.reduce((best, S) => (S.s < 0 && Math.abs(S.z - 5.75) < Math.abs(best.z - 5.75) ? S : best), train.straps.find((S) => S.s < 0));
  }

  update(t) {
    const d = t - MD.vanish, g = 9.81;
    // cup: from M1's hand (right bench seat [0,3]) → the floor; a bounce; then it rolls toward the nose under braking
    {
      const x0 = MD_SX - 0.42, z0 = MD_SEATS[0][3] - 0.16, y0 = 0.98, tl = Math.sqrt(2 * (y0 - 0.06) / g);
      let x = x0, y = y0, z = z0, rx = 0, rz = 0;
      if (d > 0) {
        if (d < tl) { y = y0 - 0.5 * g * d * d; rz = d * 2.5; }
        else {
          const b = d - tl, bh = 0.08, tb = 2 * Math.sqrt(2 * bh / g);
          y = 0.045 + (b < tb ? Math.max(0, Math.sqrt(2 * g * bh) * b - 0.5 * g * b * b) : 0);
          rz = Math.PI / 2; x = x0 - 0.25 * Math.min(1, b / 0.6);
          // rolling: a slow drift, then the brake throws it forward; it stops against the bench end panel
          const roll = 0.04 * b + (t > MD.brake ? 0.5 * 1.0 * Math.pow(t - MD.brake, 2) : 0);
          z = Math.max(z0 - roll, 2.62);
          rx = (z0 - z) / 0.045;
        }
      }
      this.cup.position.set(x, y, z); this.cup.rotation.set(rx, 0, rz, 'ZXY');
      const ps = d > tl ? 0.06 + 0.32 * MathX.smooth(d, tl, tl + 0.9) : 0;
      this.puddle.visible = ps > 0; this.puddle.scale.setScalar(Math.max(ps, 0.001)); this.puddle.position.set(x0 - 0.12, 0.008, z0 - 0.05);
    }
    // phone: from M3's hands (left bench seat [0,1]) onto the seat cushion; it lights with a call
    {
      const x0 = -(MD_SX - 0.3), z0 = MD_SEATS[0][1], y0 = 0.72, ys = MD_CAR.seatH + 0.065, tl = Math.sqrt(2 * (y0 - ys) / g);
      let x = x0, y = y0, z = z0, rz = -0.9, rx = 0;
      if (d > 0) {
        if (d < tl) { y = y0 - 0.5 * g * d * d; rz = -0.9 + d * 4; x = x0 - d * 0.3; }
        else { y = ys; rz = 0; x = x0 - tl * 0.3 - 0.04; rx = 0; z = z0 - (t > MD.brake ? 0.06 * MathX.smooth(t, MD.brake, MD.brake + 0.8) : 0); }
      }
      this.phone.position.set(x, y, z); this.phone.rotation.set(rx, 0.4, rz);
      const ring = t > MD.vanish + 5 ? 0.6 + 0.4 * (Math.floor(t * 1.6) % 2) : 0.35;
      this.screenM.color.setRGB(0.74 * ring, 0.85 * ring, 0.94 * ring);
    }
    // newspaper: M4 held it open in front of him; two sheets flutter down (drag: ~1.2 s to fall a metre) and slide
    {
      const xs = -(MD_SX - 0.38), zc = MD_SEATS[0][4];
      this.sheets.forEach((s, i) => {
        const e = i ? 1 : -1, y0 = 1.02 + 0.03 * i, tf = 1.15 + 0.25 * i;
        let x = xs + 0.05 * i, y = y0, z = zc + e * 0.17, rx = 0, ry = e * 0.1, rz = Math.PI / 2 - 0.15;
        if (d > 0) {
          const u = MathX.clamp(d / tf, 0, 1), fl = Math.sin(d * 7 + i * 2) * (1 - u);
          y = MathX.lerp(y0, 0.012 + 0.004 * i, Ease.inQuad(u) * 0.6 + u * 0.4);
          x = xs + (0.35 + 0.25 * i) * Ease.outQuad(u) + 0.04 * fl;
          z = zc + e * 0.17 + e * 0.25 * u - (t > MD.brake ? 0.12 * MathX.smooth(t, MD.brake, MD.brake + 1) : 0);
          rz = MathX.lerp(Math.PI / 2 - 0.15, 0, Ease.inOutSine(u)) + 0.3 * fl; rx = MathX.lerp(0, -Math.PI / 2, Ease.inOutSine(u)) * 0 ; ry = e * (0.1 + 0.6 * u);
          if (u >= 1) { rz = 0; }
        }
        s.position.set(x, y, z);
        // lying flat when down: plane faces up
        if (d > 0 && d >= tf) s.rotation.set(-Math.PI / 2, 0, ry + i * 0.4);
        else s.rotation.set(-Math.PI / 2 * MathX.clamp(d / tf, 0, 1), ry, rz * (1 - MathX.clamp(d / tf, 0, 1)));
      });
    }
    // the strap M5 was hanging on: pulled down while he held it, it springs back and swings when he vanishes
    const H = this.held;
    if (H) {
      const base = -mdStrapAngle(t, H.i);
      H.p.rotation.x = t < MD.vanish ? base - 0.18 : base - 0.18 * Math.exp(-d / 0.9) * Math.cos(d * 5.2);
      H.p.rotation.z = t < MD.vanish ? 0.12 : 0.12 * Math.exp(-d / 0.9) * Math.cos(d * 5.2);
    }
  }
}
