/* =====================================================================
   CAST — the people of the earthquake film:
     you        the channel's reusable YouCharacter (js/world/youCharacter.js)
     the pilot  a second YouCharacter (her own look and face): she waves you over, starts the engine, flies
     the street San Franciscans and tourists on the Embarcadero: the café's tables, the promenade, the pier. They don't
                notice (minute 1), glance up (2), stagger, read their phones, pour out of the shops, drop and cover (3),
                run (4…)
   eqCrowd(scene, spec) → { people, frame(s, cam) }   spec: { look, u, v, yaw (a direction in the waterfront frame:
   [du, dv]), script: [[s0, pose, arg], …], run: [du, dv, seconds, m/s] }
   Every pose is a pure function of the seconds since it began (story time).
   ===================================================================== */

Object.assign(LOOKS, {
  eqA: { skin: 0, build: 'avg', shirt: '#2e5a8e', sleeves: 'short', pants: '#2a2c33', shoes: '#efefe9', sole: '#ddd', hair: '#5a3a22' },
  eqB: { skin: 3, build: 'broad', shirt: '#f0ece0', sleeves: 'short', pants: '#45403a', shoes: '#2a1f18', sole: '#1a1612', hair: '#141010', hat: { type: 'cap', color: '#c8352a' } },
  eqC: { skin: 5, build: 'slim', shirt: '#e8b33a', sleeves: 'short', pants: '#22262c', shoes: '#efefe9', sole: '#fff', hair: '#c49a60', hairStyle: 'long' },
  eqD: { skin: 1, build: 'avg', shirt: '#6a8a3c', sleeves: 'long', pants: '#30343c', shoes: '#4a3424', sole: '#2a1e14', hair: '#2a1a12', backpack: '#2b2e30' },
  eqE: { skin: 4, build: 'slim', shirt: '#d8484a', sleeves: 'short', pants: '#1f1f24', shoes: '#111', sole: '#eee', hair: '#0e0b09', hairStyle: 'bun', shoulderBag: '#5a3e2c' },
  eqF: { skin: 2, build: 'broad', shirt: '#4a4f58', sleeves: 'long', pants: '#3a3f46', shoes: '#222', sole: '#111', hair: '#3a2a1e', jacket: true, hat: { type: 'cap', color: '#1d2a3a' } },
  eqG: { skin: 0, build: 'slim', shirt: '#4ab0b8', sleeves: 'short', pants: '#5a5248', shoes: '#ddd', sole: '#fff', hair: '#9c7a4a', hairStyle: 'pony' },
  eqH: { skin: 3, build: 'avg', shirt: '#7a3a6a', sleeves: 'long', pants: '#2a2f38', shoes: '#111', sole: '#2a2a2a', hair: '#1a1410', jacket: true },
  eqI: { skin: 1, build: 'slim', shirt: '#f4f2ec', sleeves: 'short', pants: '#3a5a8a', shoes: '#c8352a', sole: '#fff', hair: '#e0c080', hairStyle: 'pony' },
  eqJ: { skin: 5, build: 'avg', shirt: '#1f6a5a', sleeves: 'long', pants: '#2b2b30', shoes: '#3a3a3a', sole: '#222', hair: '#0e0b09', apron: '#5a3a28' },
});
const EQ_LOOKS = ['eqA', 'eqB', 'eqC', 'eqD', 'eqE', 'eqF', 'eqG', 'eqH', 'eqI', 'casual1', 'casual2', 'casual3', 'casual5', 'casual6', 'casual8'];
let EQ_PHONE_G = null, EQ_PHONE_M = null;
function eqPerson(look, parent, id) {
  const P = new Person({ id: 'eq' + look + id, look }, null);
  YouCharacter._noZ(P);
  parent.add(P.root);
  const ph = new THREE.Mesh(EQ_PHONE_G || (EQ_PHONE_G = new THREE.BoxGeometry(0.072, 0.15, 0.009)), EQ_PHONE_M || (EQ_PHONE_M = new THREE.MeshStandardMaterial({ color: '#16181b', roughness: 0.3, metalness: 0.3, emissive: '#cfe6ff', emissiveIntensity: 0.0 })));
  ph.position.set(0, -0.075, 0.04); ph.rotation.x = -0.3; ph.visible = false; P.j.ra.hand.add(ph); P._phone = ph;
  return P;
}

// poses (u: seconds since the pose began, i: who, a: its argument)
const EQ_P = {
  idle: (u, i) => { const p = basePose(); p.spine += Math.sin(u * 1.5 + i) * 0.012; p.headYaw = 0.25 * noise1(u * 0.3, i + 2); return p; },
  talk: (u, i) => { const p = EQ_P.idle(u, i); p.rSh = [0.5 + 0.2 * Math.sin(u * 2.3 + i), 0.2]; p.rEl = 1.2 + 0.3 * Math.sin(u * 3.1); p.headYaw = 0.3 * Math.sin(u * 0.7 + i); return p; },
  phone: (u, i) => { const p = EQ_P.idle(u, i); p.rSh = [0.95, 0.18]; p.rEl = 1.5; p.neck = 0.45; p.headYaw = 0; return p; },
  film: (u, i) => { const p = basePose(); p.rSh = [1.45, 0.05]; p.rEl = 0.55; p.lSh = [1.3, -0.05]; p.lEl = 0.7; p.neck = -0.05; p.headYaw = 0.05 * Math.sin(u + i); return p; },
  stare: (u, i, a) => { const p = EQ_P.idle(u, i); p.headYaw = a || 0; p.neck = -0.1; p.spine = -0.04; p.lSh = [0.15, 0.2]; p.rSh = [0.15, 0.2]; return p; },
  glance: (u, i, a) => { const p = EQ_P.idle(u, i); const k = Math.sin(MathX.clamp(u / 2.4, 0, 1) * Math.PI); p.headYaw = (a || 0.6) * k; p.neck = -0.25 * k; return p; },
  point: (u, i) => { const p = EQ_P.idle(u, i); p.rSh = [1.55, 0.25]; p.rEl = 0.08; p.neck = -0.15; return p; },
  lookUp: (u, i, a) => { const p = EQ_P.idle(u, i); p.headYaw = a || 0; p.neck = -0.85; p.spine = -0.16; p.lSh = [0.12, 0.2]; p.rSh = [0.12, 0.2]; return p; },
  wave: (u, i) => { const p = basePose(); p.rSh = [2.6, 0.35 + 0.35 * Math.sin(u * 9)]; p.rEl = 0.5 + 0.3 * Math.sin(u * 9); p.lSh = [0.3, 0.2]; p.neck = -0.05; p.spine = 0.05; return p; },
  beckon: (u, i) => { const p = basePose(); const k = Math.sin(u * 7.5); p.rSh = [1.5 + 0.5 * k, 0.15]; p.rEl = 0.6 + 0.9 * Math.max(0, k); p.lSh = [0.8, 0.3]; p.lEl = 0.4; p.spine = 0.12; p.neck = -0.1; return p; },
  // staggering: knees soft, arms out, the body thrown about (the ground moving under them)
  stagger: (u, i) => { const p = basePose(); const a = noise1(u * 2.2, i * 3 + 1), b = noise1(u * 2.7, i * 3 + 2);
    p.lSh = [0.6 + 0.5 * a, 0.7 + 0.3 * b]; p.rSh = [0.6 - 0.5 * b, 0.7 + 0.3 * a]; p.lEl = 0.5; p.rEl = 0.5; p.lKnee = 0.45 + 0.2 * a; p.rKnee = 0.45 - 0.2 * a; p.hipY = 0.86;
    p.lHip = [0.35 + 0.2 * b, 0.12]; p.rHip = [0.35 - 0.2 * b, 0.12]; p.spine = 0.2 + 0.1 * a; p.spineRoll = 0.18 * b; p.headYaw = 0.4 * a; p.neck = -0.1; return p; },
  // drop, cover, hold on: crouched low, arms over the head (or hold the table leg)
  duck: (u, i) => { const p = basePose(); p.hipY = 0.62; p.lHip = [1.4, 0.15]; p.rHip = [1.3, 0.15]; p.lKnee = 2.1; p.rKnee = 2.0; p.lFoot = -0.5; p.rFoot = -0.5; p.spine = 0.75; p.neck = 0.4;
    p.lSh = [2.4, 0.5]; p.rSh = [2.4, 0.5]; p.lEl = 1.7; p.rEl = 1.7; p.spineRoll = 0.04 * Math.sin(u * 13 + i); return p; },
  cover: (u, i) => { const p = basePose(); p.hipY = 0.38; p.lHip = [1.6, 0.25]; p.rHip = [1.5, 0.25]; p.lKnee = 2.4; p.rKnee = 2.3; p.lFoot = -0.6; p.rFoot = -0.6; p.spine = 1.05; p.neck = 0.3;
    p.lSh = [2.2, 0.4]; p.rSh = [1.2, 0.2]; p.lEl = 1.8; p.rEl = 0.4; p.spineRoll = 0.05 * Math.sin(u * 11 + i); return p; },
  flinch: (u, i) => { const p = basePose(); p.spine = 0.25; p.neck = 0.3; p.lSh = [1.2, 0.4]; p.rSh = [1.2, 0.4]; p.lEl = 1.9; p.rEl = 1.9; p.lKnee = 0.35; p.rKnee = 0.35; p.hipY = 0.86; return p; },
  run: (u, i) => { const ph = u * 9 + i * 2, s = Math.sin(ph), co = Math.cos(ph), p = basePose();
    p.lHip = [0.6 * s, 0.03]; p.rHip = [-0.6 * s, 0.03]; p.lKnee = 0.25 + Math.max(0, co) ** 1.3; p.rKnee = 0.25 + Math.max(0, -co) ** 1.3;
    p.lSh = [-0.6 * s, 0.1]; p.rSh = [0.6 * s, 0.1]; p.lEl = 1.3; p.rEl = 1.3; p.spine = 0.18; p.hipY = 0.9 + 0.03 * Math.abs(co); p.spineRoll = 0.08 * noise1(u * 3, i); return p; },
  sit: (u, i) => { const p = basePose(); p.hipY = 0.5; p.lHip = [1.45, 0.08]; p.rHip = [1.45, 0.08]; p.lKnee = 1.5; p.rKnee = 1.5; p.lFoot = 0.05; p.rFoot = 0.05; p.spine = 0.05; p.lSh = [0.4, 0.12]; p.rSh = [0.4, 0.12]; p.lEl = 1.0; p.rEl = 1.0; p.headYaw = 0.2 * noise1(u * 0.3, i); return p; },
  sitTalk: (u, i) => { const p = EQ_P.sit(u, i); p.rSh = [0.7 + 0.15 * Math.sin(u * 2.1 + i), 0.15]; p.rEl = 1.3 + 0.3 * Math.sin(u * 2.9); p.headYaw = 0.35 * Math.sin(u * 0.6 + i); return p; },
  sitPhone: (u, i) => { const p = EQ_P.sit(u, i); p.rSh = [0.85, 0.15]; p.rEl = 1.6; p.neck = 0.45; p.headYaw = 0; return p; },
  sitStare: (u, i, a) => { const p = EQ_P.sit(u, i); p.headYaw = a || 0; p.spineYaw = (a || 0) * 0.3; p.neck = -0.12; return p; },
  sitGrip: (u, i) => { const p = EQ_P.sit(u, i); p.lSh = [0.9, 0.15]; p.rSh = [0.9, 0.15]; p.lEl = 0.6; p.rEl = 0.6; p.spine = 0.18 + 0.05 * Math.sin(u * 7 + i); p.neck = 0.1; p.headYaw = 0.5 * noise1(u * 1.4, i); return p; },
  walk: (u, i) => { const ph = u * 5.6 + i * 1.7, s = Math.sin(ph), co = Math.cos(ph), p = basePose();
    p.lHip = [0.42 * s, 0.03]; p.rHip = [-0.42 * s, 0.03]; p.lKnee = 0.08 + 0.65 * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * Math.max(0, -co) ** 1.5;
    p.lFoot = -0.2 * Math.max(0, co); p.rFoot = -0.2 * Math.max(0, -co); p.lSh = [-0.34 * s, 0.07]; p.rSh = [0.34 * s, 0.07]; p.lEl = 0.3; p.rEl = 0.3; p.hipY = 0.93 - 0.032 * s * s; p.spine = 0.05; return p; },
  fallen: () => { const p = basePose(); p.hipY = 0.25; p.lHip = [1.5, 0.2]; p.rHip = [1.4, 0.25]; p.lKnee = 1.9; p.rKnee = 1.6; p.spine = 0.3; p.lSh = [0.6, 0.6]; p.rSh = [1.4, 0.3]; p.lEl = 0.5; p.rEl = 0.4; return p; },
};
const EQ_SITTING = { sit: 1, sitTalk: 1, sitPhone: 1, sitStare: 1, sitGrip: 1 };
const EQ_PHONING = { phone: 1, film: 1, sitPhone: 1 };

function eqCrowd(scene, spec) {
  const people = spec.map((s, i) => ({ P: eqPerson(s.look, scene, i), s, i }));
  return {
    people,
    frame(t, cam, lvl = 0) {
      for (const { P, s, i } of people) {
        let [x, z] = eqWF(s.u, s.v);
        if (cam && Math.hypot(cam.position.x - x, cam.position.z - z) > (s.range || 260)) { P.root.visible = false; continue; }
        let k = 0; for (let j = 0; j < s.script.length; j++) if (s.script[j][0] <= t) k = j;
        const [t0, name, arg] = s.script[k], u = t - t0;
        const f = EQ_P[name] || EQ_P.idle;
        let p = f(u, i, arg), yaw = eqYawWF(s.yaw[0], s.yaw[1]), y = s.y ?? (EQ_GROUND_Y + 0.15);
        // blend from the previous pose over 0.3 s
        if (k > 0 && u < 0.3) { const [tp, pn, pa] = s.script[k - 1]; p = lerpPose((EQ_P[pn] || EQ_P.idle)(t - tp, i, pa), p, Ease.inOutSine(u / 0.3)); }
        if (name === 'run' && s.run) {
          const T = s.run[2] || 9, d = Math.min(u, T) * (s.run[3] || 4.2); const [du, dv] = s.run, L = Math.hypot(du, dv) || 1;
          [x, z] = eqWF(s.u + du / L * d, s.v + dv / L * d); yaw = eqYawWF(du, dv); if (u > T) p = EQ_P.stagger(u, i);
        }
        if (s.walk && name === 'walk') { const L = s.walk[2] || 30, d = (t * 1.3 + i * 7 + 400) % (2 * L), ff = d < L ? d : 2 * L - d, dir = d < L ? 1 : -1; [x, z] = eqWF(s.u + s.walk[0] * ff, s.v + s.walk[1] * ff); yaw = eqYawWF(s.walk[0] * dir, s.walk[1] * dir); }
        // the ground moves them all (a fraction of the motion: they ride it)
        if (lvl > 0) { const a = eqGround(t, 0.05 * (i % 7), 30 + (i % 9)); x += a[0] * 0.5; z += a[2] * 0.5; if (!EQ_SITTING[name]) p.spineRoll = (p.spineRoll || 0) + a[0] * 1.5; }
        P._phone.visible = !!EQ_PHONING[name] || (s.phoneFrom !== undefined && t > s.phoneFrom && t < s.phoneFrom + 9 && name !== 'run');
        if (P._phone.visible && s.phoneFrom !== undefined && !EQ_PHONING[name]) { p.rSh = [0.95, 0.18]; p.rEl = 1.5; p.neck = 0.45; }
        P.root.position.set(x, y, z); P.root.rotation.set(0, yaw, 0); P.apply(p); P.root.visible = (s.from === undefined || t >= s.from) && (s.until === undefined || t < s.until);
      }
      // the phones light up together (the alert)
      if (EQ_PHONE_M) EQ_PHONE_M.emissiveIntensity = t > eqW('alert') - EQ.tick0 - 0.2 ? 0.9 + 0.3 * Math.sin(t * 9) : 0.25;
    },
  };
}
