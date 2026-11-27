/* =====================================================================
   CAST — the people of "What If Every Step You Took Was Twice as Long?":
     you              the channel's reusable YouCharacter (js/world/youCharacter.js), one per set
     the street       New Yorkers at the bus stop, on the pavements, at the café and on the Promenade: they wait,
                      stare, film you on their phones, duck from the glass, and run
   twCrowd(scene, spec) → { people, frame(t) }    spec: [[look, x, z, yaw, role, delay], …]
   Roles are pure functions of film time (when you pass, when the boom hits): idle · wait · stare · phone · duck ·
   flinch · run · point.
   ===================================================================== */

Object.assign(LOOKS, {
  twA: { skin: 0, build: 'avg', shirt: '#2e4a6e', sleeves: 'long', pants: '#2a2c33', shoes: '#1e1e22', sole: '#ddd', hair: '#5a3a22', coat: true, collar: true, scarf: '#b8452f' },
  twB: { skin: 3, build: 'broad', shirt: '#3d3f45', sleeves: 'long', pants: '#45403a', shoes: '#2a1f18', sole: '#1a1612', hair: '#141010', jacket: true, hat: { type: 'beanie', color: '#c9a23a' } },
  twC: { skin: 5, build: 'slim', shirt: '#b54a5a', sleeves: 'long', pants: '#22262c', shoes: '#efefe9', sole: '#fff', hair: '#c49a60', hairStyle: 'long', coat: true },
  twD: { skin: 1, build: 'avg', shirt: '#6a7a3c', sleeves: 'long', pants: '#30343c', shoes: '#4a3424', sole: '#2a1e14', hair: '#2a1a12', jacket: true, backpack: '#2b2e30' },
  twE: { skin: 4, build: 'slim', shirt: '#e0c040', sleeves: 'long', pants: '#1f1f24', shoes: '#111', sole: '#eee', hair: '#0e0b09', hairStyle: 'bun', jacket: true, shoulderBag: '#5a3e2c' },
  twF: { skin: 2, build: 'broad', shirt: '#8a8478', sleeves: 'long', pants: '#3a3f46', shoes: '#222', sole: '#111', hair: '#3a2a1e', coat: true, collar: true, hat: { type: 'cap', color: '#1d2a3a' } },
  twG: { skin: 0, build: 'slim', shirt: '#4a8a9a', sleeves: 'long', pants: '#5a5248', shoes: '#ddd', sole: '#fff', hair: '#9c7a4a', hairStyle: 'pony', jacket: true },
  twH: { skin: 3, build: 'avg', shirt: '#7a3a6a', sleeves: 'long', pants: '#2a2f38', shoes: '#111', sole: '#2a2a2a', hair: '#1a1410', coat: true, scarf: '#d8d2c4' },
});
const TW_LOOKS = ['twA', 'twB', 'twC', 'twD', 'twE', 'twF', 'twG', 'twH', 'casual1', 'casual2', 'casual3', 'casual5', 'casual6', 'casual8'];

function twPerson(look, parent, id) {
  const P = new Person({ id: 'tw' + look + id, look }, null);
  YouCharacter._noZ(P);
  parent.add(P.root);
  return P;
}

// poses (u: seconds)
const TW_P = {
  idle: (u, i) => { const p = basePose(); p.spine += Math.sin(u * 1.5 + i) * 0.012; p.headYaw = 0.25 * noise1(u * 0.3, i + 2); return p; },
  phone: (u, i) => { const p = TW_P.idle(u, i); p.rSh = [0.95, 0.18]; p.rEl = 1.5; p.neck = 0.45; return p; },
  // holding a phone up, filming
  film: (u, i) => { const p = basePose(); p.rSh = [1.45, 0.05]; p.rEl = 0.55; p.lSh = [1.3, -0.05]; p.lEl = 0.7; p.neck = -0.05; p.headYaw = 0.05 * Math.sin(u + i); return p; },
  stare: (u, i, yaw) => { const p = TW_P.idle(u, i); p.headYaw = yaw || 0; p.neck = -0.1; p.spine = -0.04; p.lSh = [0.15, 0.2]; p.rSh = [0.15, 0.2]; return p; },
  point: (u, i) => { const p = TW_P.idle(u, i); p.rSh = [1.55, 0.25]; p.rEl = 0.08; p.neck = -0.15; return p; },
  // arms over the head, crouched (the glass)
  duck: (u, i) => { const p = basePose(); p.hipY = 0.62; p.lHip = [1.4, 0.15]; p.rHip = [1.3, 0.15]; p.lKnee = 2.1; p.rKnee = 2.0; p.lFoot = -0.5; p.rFoot = -0.5; p.spine = 0.75; p.neck = 0.4;
    p.lSh = [2.4, 0.5]; p.rSh = [2.4, 0.5]; p.lEl = 1.7; p.rEl = 1.7; p.spineRoll = 0.04 * Math.sin(u * 13 + i); return p; },
  flinch: (u, i) => { const p = basePose(); p.spine = 0.25; p.neck = 0.3; p.lSh = [1.2, 0.4]; p.rSh = [1.2, 0.4]; p.lEl = 1.9; p.rEl = 1.9; p.lKnee = 0.35; p.rKnee = 0.35; p.hipY = 0.86; return p; },
  run: (u, i) => { const ph = u * 9 + i * 2, s = Math.sin(ph), co = Math.cos(ph), p = basePose();
    p.lHip = [0.6 * s, 0.03]; p.rHip = [-0.6 * s, 0.03]; p.lKnee = 0.25 + Math.max(0, co) ** 1.3; p.rKnee = 0.25 + Math.max(0, -co) ** 1.3;
    p.lSh = [-0.6 * s, 0.1]; p.rSh = [0.6 * s, 0.1]; p.lEl = 1.3; p.rEl = 1.3; p.spine = 0.18; p.hipY = 0.9 + 0.03 * Math.abs(co); return p; },
  fallen: () => { const p = basePose(); p.hipY = 0.25; p.lHip = [1.5, 0.2]; p.rHip = [1.4, 0.25]; p.lKnee = 1.9; p.rKnee = 1.6; p.spine = 0.3; p.lSh = [0.6, 0.6]; p.rSh = [1.4, 0.3]; p.lEl = 0.5; p.rEl = 0.4; return p; },
};

// a crowd: spec [look, x, z, yaw, script] where script is [[t0, pose], …] (film times) and an optional run direction
function twCrowd(scene, spec) {
  const people = spec.map((s, i) => ({ P: twPerson(s.look, scene, i), s, i }));
  return {
    people,
    frame(t) {
      for (const { P, s, i } of people) {
        let k = 0; for (let j = 0; j < s.script.length; j++) if (s.script[j][0] <= t) k = j;
        const [t0, name, arg] = s.script[k], u = t - t0;
        const f = TW_P[name] || TW_P.idle;
        let p = f(u, i, arg), x = s.x, z = s.z, yaw = s.yaw;
        // blend from the previous pose over 0.25 s (people react fast)
        if (k > 0 && u < 0.3) { const [tp, pn, pa] = s.script[k - 1]; p = lerpPose((TW_P[pn] || TW_P.idle)(t - tp, i, pa), p, Ease.inOutSine(u / 0.3)); }
        if (name === 'run' && s.run) { const d = Math.min(u, s.run[2] || 9) * (s.run[3] || 4.2); x += s.run[0] * d; z += s.run[1] * d; yaw = Math.atan2(s.run[0], s.run[1]); }
        P.root.position.set(x, s.y || 0, z); P.root.rotation.set(0, yaw, 0); P.apply(p); P.root.visible = true;
      }
    },
  };
}
