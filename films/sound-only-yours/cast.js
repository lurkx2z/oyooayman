/* =====================================================================
   CAST — the people (the shared adult rig, js/world/people.js), the dog, the bats. Each shot (mode) has its scene,
   posed from story time s (pure). Nobody can be heard: their mouths move, their dogs bark, nothing comes out. When you
   speak, every head within earshot turns to you.
     soBuildCast(S, T) → C ; C.update(s, o) (o.mode, o.t)
   ===================================================================== */

Object.assign(LOOKS, {
  soNeigh: { skin: 1, build: 'avg', shirt: '#5a5246', sleeves: 'long', pants: '#3a3833', shoes: '#2a2018', sole: '#1a1612', hair: '#5a544a', coat: false, collar: true },
  soUmb: { skin: 2, build: 'slim', shirt: '#2a3a4a', sleeves: 'long', pants: '#1f2228', shoes: '#1f1a16', sole: '#1a1612', hair: '#1a120c', hairStyle: 'long', coat: true, collar: true },
  soHood: { skin: 4, build: 'avg', shirt: '#3a3e44', sleeves: 'long', pants: '#2a2d33', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#141010', jacket: true, hood: true },
  soDogW: { skin: 1, build: 'broad', shirt: '#4a3a2e', sleeves: 'long', pants: '#33415a', shoes: '#3a2a20', sole: '#1a1612', hair: '#b8b0a4', coat: true, collar: true, scarf: '#7a2a24' },
  soMum: { skin: 3, build: 'slim', shirt: '#6a2f3a', sleeves: 'long', pants: '#2a2d33', shoes: '#2a2018', sole: '#1a1612', hair: '#1a120c', hairStyle: 'bun', coat: true, collar: true },
  soMed: { skin: 1, build: 'avg', shirt: '#2a5a3a', sleeves: 'long', pants: '#2a5a3a', shoes: '#1a1a1a', sole: '#111', hair: '#3a2a1a', jacket: true },
});
const SOPI = Math.PI;
const soEase = (s, a, b) => { const u = MathX.clamp((s - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
function soWalkPose(ph, big = 1) {
  const p = basePose(), s = Math.sin(ph), co = Math.cos(ph);
  p.lHip = [0.42 * big * s, 0.03]; p.rHip = [-0.42 * big * s, 0.03];
  p.lKnee = 0.08 + 0.65 * big * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * big * Math.max(0, -co) ** 1.5;
  p.lFoot = -0.2 * Math.max(0, co); p.rFoot = -0.2 * Math.max(0, -co);
  p.lSh = [-0.34 * big * s, 0.07]; p.rSh = [0.34 * big * s, 0.07]; p.lEl = 0.28 + 0.18 * Math.max(0, -s) + (big > 1 ? 0.9 : 0); p.rEl = 0.28 + 0.18 * Math.max(0, s) + (big > 1 ? 0.9 : 0);
  if (big > 1) { p.spine = 0.18; p.hipY = 0.9 + 0.04 * Math.abs(s); }
  return p;
}
const SO_POSES = {
  stand: () => basePose(),
  shield: () => { const p = basePose(); p.lSh = [2.5, 0.35]; p.rSh = [2.45, 0.38]; p.lEl = 1.7; p.rEl = 1.75; p.neck = 0.25; p.spine = 0.12; p.lKnee = 0.3; p.rKnee = 0.25; p.lHip = [0.2, 0.08]; p.rHip = [0.18, 0.08]; p.hipY = 0.86; return p; },
  lookUp: () => { const p = basePose(); p.neck = -0.55; p.spine = -0.1; p.lSh = [0.5, 0.25]; p.rSh = [0.3, 0.2]; p.lEl = 0.9; p.rEl = 0.4; return p; },
  point: () => { const p = basePose(); p.neck = -0.5; p.spine = -0.1; p.rSh = [2.3, 0.2]; p.rEl = 0.15; p.lSh = [0.3, 0.2]; p.lEl = 0.6; return p; },
  armsOut: () => { const p = basePose(); p.lSh = [0.6, 0.9]; p.rSh = [0.7, 0.85]; p.lEl = 0.3; p.rEl = 0.35; p.neck = 0.1; p.lKnee = 0.35; p.rKnee = 0.3; p.lHip = [0.25, 0.12]; p.rHip = [0.2, 0.12]; p.hipY = 0.85; return p; },
  crouch: () => { const p = basePose(); p.hipY = 0.6; p.lHip = [1.1, 0.12]; p.rHip = [1.1, 0.12]; p.lKnee = 1.6; p.rKnee = 1.6; p.lFoot = 0.35; p.rFoot = 0.35; p.spine = 0.35; p.lSh = [0.9, 0.3]; p.rSh = [0.8, 0.3]; p.lEl = 0.4; p.rEl = 0.4; return p; },
  // lying along the branch on its sky side, arms and legs locked round it (the branch runs along her, under her belly)
  sloth: () => { const p = basePose(); p.lSh = [2.6, 0.22]; p.rSh = [2.6, 0.22]; p.lEl = 0.25; p.rEl = 0.25; p.neck = 0.35; p.spine = 0.1; p.lHip = [0.95, 0.22]; p.rHip = [0.95, 0.22]; p.lKnee = 1.35; p.rKnee = 1.35; p.lFoot = 0.4; p.rFoot = 0.4; return p; },
  armsUp: () => { const p = basePose(); p.lSh = [2.85, 0.12]; p.rSh = [2.85, 0.12]; p.lEl = 0.1; p.rEl = 0.1; p.neck = -0.3; p.spine = -0.05; return p; },
  reachUp: () => { const p = basePose(); p.lSh = [2.6, 0.3]; p.rSh = [2.4, 0.35]; p.lEl = 0.25; p.rEl = 0.3; p.neck = -0.55; p.spine = -0.12; return p; },
  talk: () => { const p = basePose(); p.lSh = [0.9, 0.3]; p.rSh = [1.2, 0.25]; p.lEl = 1.3; p.rEl = 1.1; p.mouth = 1; p.neck = 0.05; return p; },
  cup: () => { const p = basePose(); p.rSh = [0.75, 0.12]; p.rEl = 1.75; p.lSh = [0.1, 0.1]; p.neck = 0.05; return p; },
  phone: () => { const p = basePose(); p.rSh = [0.55, 0.05]; p.rEl = 1.55; p.lSh = [0.5, 0.05]; p.lEl = 1.5; p.neck = 0.45; return p; },
  hold: () => { const p = basePose(); p.lSh = [1.5, 0.15]; p.rSh = [1.45, 0.2]; p.lEl = 0.5; p.rEl = 0.6; p.spine = 0.12; p.lKnee = 0.2; p.rKnee = 0.3; p.lHip = [0.15, 0.05]; p.rHip = [0.25, 0.05]; return p; },
  hug: () => { const p = basePose(); p.lSh = [1.1, -0.15]; p.rSh = [1.05, -0.12]; p.lEl = 2.1; p.rEl = 2.15; p.spine = 0.22; p.neck = 0.2; return p; },
  kick: () => { const p = basePose(); p.rHip = [1.0, 0.05]; p.rKnee = 0.2; p.lKnee = 0.25; p.lSh = [-0.4, 0.5]; p.rSh = [0.5, 0.4]; p.spine = -0.15; return p; },
  backswing: () => { const p = basePose(); p.rHip = [-0.6, 0.05]; p.rKnee = 1.1; p.lKnee = 0.2; p.lSh = [0.5, 0.4]; p.rSh = [-0.3, 0.3]; p.spine = 0.12; return p; },
  sit: () => { const p = basePose(); p.hipY = 0.5; p.lHip = [1.5, 0.08]; p.rHip = [1.5, 0.08]; p.lKnee = 1.5; p.rKnee = 1.5; p.spine = -0.05; p.neck = 0.1; p.lSh = [0.45, 0.1]; p.lEl = 1.05; p.rSh = [0.5, 0.1]; p.rEl = 1.1; return p; },
  sitGround: () => { const p = basePose(); p.hipY = 0.13; p.lHip = [1.45, 0.25]; p.rHip = [1.35, 0.2]; p.lKnee = 1.9; p.rKnee = 1.2; p.spine = 0.25; p.lSh = [0.6, 0.3]; p.rSh = [0.5, 0.3]; p.lEl = 0.9; p.rEl = 0.8; p.neck = -0.2; return p; },
  stretch: () => { const p = basePose(); p.lSh = [2.9, 0.15]; p.rSh = [2.9, 0.15]; p.lEl = 0.4; p.rEl = 0.4; p.spineRoll = 0.25; p.neck = 0.05; return p; },
  lunge: () => { const p = basePose(); p.hipY = 0.78; p.lHip = [0.9, 0.05]; p.lKnee = 1.0; p.rHip = [-0.5, 0.05]; p.rKnee = 0.15; p.spine = 0.15; p.lSh = [0.2, 0.2]; p.rSh = [0.2, 0.2]; p.lEl = 0.4; p.rEl = 0.4; return p; },
  throwBack: () => { const p = basePose(); p.rSh = [2.0, 0.4]; p.rEl = 1.6; p.lSh = [1.0, 0.2]; p.lEl = 0.4; p.spine = -0.1; p.neck = -0.3; p.lKnee = 0.3; p.hipY = 0.88; return p; },
  throwUp: () => { const p = basePose(); p.rSh = [2.9, 0.1]; p.rEl = 0.05; p.lSh = [0.6, 0.2]; p.lEl = 0.4; p.spine = -0.15; p.neck = -0.55; return p; },
  lead: () => { const p = basePose(); p.lSh = [1.1, 0.15]; p.lEl = 0.6; p.rSh = [0.8, 0.1]; p.rEl = 1.0; p.spine = 0.05; return p; },
  leadUp: () => { const p = basePose(); p.lSh = [2.2, 0.1]; p.lEl = 0.2; p.rSh = [2.1, 0.15]; p.rEl = 0.25; p.spine = -0.15; p.neck = -0.6; p.lKnee = 0.35; p.rKnee = 0.3; p.hipY = 0.86; p.lHip = [0.25, 0.1]; p.rHip = [0.1, 0.1]; return p; },
};
const soSt = (p, x, z, yaw, o = {}) => Object.assign({ p, pos: [x, o.y || 0, z], yaw }, o);
function soWalkSt(s, s0, x0, z0, yaw, v, o = {}) {
  const d = Math.max(0, s - s0) * v, ph = d / (o.stride || 0.72) * SOPI;
  return soSt(soWalkPose(ph, o.big || 1), x0 + Math.sin(yaw) * d, z0 + Math.cos(yaw) * d, yaw, o);
}
function soFidget(p, s, i, a = 1) { p.headYaw += 0.3 * a * noise1(s * 0.11, i + 2); p.spineYaw = 0.06 * a * noise1(s * 0.07, i + 4); p.neck += 0.06 * a * noise1(s * 0.09, i + 6); return p; }
const soYaw = (fx, fz) => Math.atan2(fx, fz);                         // facing a direction (x, z)

SO_POSES.umbrella = () => { const p = basePose(); p.rSh = [1.2, 0.15]; p.rEl = 1.5; p.lSh = [0.1, 0.1]; p.neck = 0.05; return p; };
SO_POSES.ears = () => { const p = basePose(); p.lSh = [2.2, 0.9]; p.rSh = [2.2, 0.9]; p.lEl = 2.2; p.rEl = 2.2; p.neck = 0.15; return p; };
SO_POSES.shout = () => { const p = basePose(); p.lSh = [0.5, 0.35]; p.rSh = [1.6, 0.2]; p.rEl = 1.9; p.lEl = 0.6; p.neck = -0.1; p.spine = -0.08; p.mouth = 1; return p; };

// ---------------------------------------------------------------------------------------------------------------------
// WHO IS WHERE. People are [look, x, z, yaw, pose|'walk', o] by scene. They all turn to you when you speak
// (soTurnTo: a head-and-body turn that starts when your voice reaches them, distance / 337 s after you start).
// ---------------------------------------------------------------------------------------------------------------------
// the street, 9:52, in the rain (you come out of your block's door at x −4, z −0.6)
// (most stand with their backs to you, so that when you call out you see every head come round, nearest first)
const SO_STREET = [
  ['soUmb', 3.0, -1.1, 1.75, 'umbrella'], ['casual2', 5.2, -1.4, 1.45, 'lookUp'], ['soHood', 9.6, -0.8, 1.9, 'phone'], ['casual6', 10.6, -1.2, -1.75, 'talk'],
  ['soMum', -9.0, -1.0, -1.4, 'hug'], ['casual1', -12.4, -1.3, 1.2, 'stand'], ['casual4', -18.5, -10.6, 0.4, 'lookUp'], ['casual8', -6.0, -10.8, 2.9, 'stand'],
  ['casual3', 7.5, -10.4, 2.8, 'phone'], ['casual5', 15.0, -10.9, -2.9, 'talk'], ['casual7', 21.0, -1.0, 1.6, 'stand'], ['soDogW', -2.0, -10.6, 0.5, 'lead'],
  ['casual2', 26.0, -10.5, 2.6, 'lookUp'], ['soUmb', -24.0, -1.1, -1.5, 'umbrella'], ['casual6', 30.0, -1.3, 1.5, 'stand'], ['soHood', -30.0, -10.7, 0.9, 'phone'],
  ['casual1', 11.0, -10.2, 3.0, 'stand'], ['soMum', 13.2, -9.8, 2.8, 'phone'], ['casual4', 18.8, -10.3, -2.9, 'lookUp'], ['soUmb', 22.0, -9.9, 3.1, 'umbrella'],
];
// the order their heads come round when you call out (nearest to the kerb first: a reaction each, not all at once)
const SO_STREET_RANK = (() => { const K = SO_ST.you.kerb, d = SO_STREET.map((e, i) => [Math.hypot(e[1] - K[0], e[2] - K[2]), i]).sort((a, b) => a[0] - b[0]), R = []; d.forEach(([, i], r) => { R[i] = r; }); return R; })();
// the crowd that comes to the only sound left (the park, 10:10): a loose ring round the plane tree where you hide
const SO_RING = (() => {
  const r = new RNG(907), H = SO_ST.you.hide, out = [], looks = ['casual1', 'casual2', 'casual3', 'casual4', 'casual5', 'casual6', 'casual7', 'casual8', 'soUmb', 'soHood', 'soDogW', 'soMum', 'soMed'];
  for (let i = 0; i < 46; i++) {
    const ring = i < 2 ? 0 : i < 14 ? 1 : i < 30 ? 2 : 3, a = i < 2 ? [-0.75, 2.9][i] : r.range(0, SOPI * 2), d = i === 0 ? 7.0 : [7.0, 7.5, 10.5, 14.5][ring] + r.range(-0.8, 1.2);
    out.push({ look: i === 1 ? 'soHood' : looks[i % looks.length], x: H[0] + Math.sin(a) * d, z: H[2] + Math.cos(a) * d, a, d, ring, ph: r.range(0, 6.28) });
  }
  return out;
})();
// how far away the one standing right behind you is at the end (m)
const SO_BEHIND = { a: SOPI * 0.92, d0: 2.6, d1: 0.95 };

const soAng = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function soBuildCast(S) {
  const scene = S.scene, C = {};
  const mk = (look, id) => { const g = new Person({ id, look }, null); scene.add(g.root); g.root.visible = false;
    g.root.traverse((o) => { if (o.isMesh && o.geometry === PersonGeo.mouth) g.mouthM = o; });
    return g; };
  C.street = SO_STREET.map((e, i) => mk(e[0], 'soS' + i));
  C.ring = SO_RING.map((e, i) => mk(e.look, 'soR' + i));
  // umbrellas (a canopy and a stick in the right hand)
  const um = soStd('#1c1f26', 0.6, 0, { side: THREE.DoubleSide });
  // (held upright in the world, at the hand: a rig's hand can point anywhere)
  SO_STREET.forEach((e, i) => { if (e[4] !== 'umbrella') return; const g = new THREE.Group(); scene.add(g); g.visible = false;
    soCyl(0.008, 0.008, 0.9, soStd('#2a2a2a', 0.5), 0, 0.42, 0, g, 6); const c = soMesh(new THREE.ConeGeometry(0.55, 0.22, 10, 1, true), um, 0, 0.92, 0, g); c.castShadow = true; C.street[i].umb = g; });
  // phones (their screens glow) in the hands of everyone in the ring and of the ones on their phones in the street
  const scr = new THREE.MeshBasicMaterial({ color: '#cfe0ff' }), torchTex = soDotTex(0.2);
  const phone = (P) => { const g = new THREE.Group(); g.position.set(0, -0.07, 0.03); g.rotation.x = 0.3; P.j.ra.hand.add(g); soBox(0.07, 0.14, 0.01, soStd('#111', 0.4), 0, 0, 0, g); const sc = soBox(0.062, 0.128, 0.002, scr, 0, 0, 0.006, g); sc.castShadow = false; P.phone = g;
    // (its torch: a glow you can see across the park)
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: torchTex, color: '#e6eeff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(0.9); sp.position.set(0, 0.05, -0.02); sp.visible = false; g.add(sp); P.torch = sp; return g; };
  C.street.forEach((P, i) => { if (SO_STREET[i][4] === 'phone') phone(P); });
  C.ring.forEach((P) => phone(P));
  // the dog on its lead (it barks at you: nothing comes out), and the one that comes out of the dark at you
  C.dog = soBuildQuad(SO_DOG); scene.add(C.dog.root); C.dog.root.visible = false;
  C.dog2 = soBuildQuad(Object.assign({}, SO_DOG, { col: '#1e1a18', col2: '#4a3a30', body: [0.15, 0.17], len: 0.7, hip: 0.56, leg: [0.27, 0.27], head: 0.115, snout: 0.085 })); scene.add(C.dog2.root); C.dog2.root.visible = false;
  for (const D of [C.dog, C.dog2]) { const jaw = new THREE.Group(); jaw.position.set(0, -D.sp.head * 0.38, D.sp.head * 0.45); D.head.add(jaw); soMesh(new THREE.BoxGeometry(D.sp.snout * 1.6, D.sp.snout * 0.35, D.sp.head * 1.0).translate(0, 0, D.sp.head * 0.45), soStd('#2a1a18', 0.7), 0, 0, 0, jaw); soMesh(new THREE.BoxGeometry(D.sp.snout * 1.3, D.sp.snout * 0.2, D.sp.head * 0.8).translate(0, D.sp.snout * 0.2, D.sp.head * 0.5), soStd('#8a3a3a', 0.6), 0, 0, 0, jaw); D.jaw = jaw; }
  // the big dog's eyes catch the light in the dark (eyeshine: it's all you see of it at first)
  { const em = new THREE.MeshBasicMaterial({ color: '#e4ff8a', toneMapped: false }); C.dog2.eyes = [-1, 1].map((sd) => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), em); e.position.set(sd * 0.05, 0.02, 0.1); C.dog2.head.add(e); return e; }); }
  C.lead = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 6).translate(0, 0.5, 0), soStd('#c8322a', 0.6)); scene.add(m); m.visible = false; return m; });
  C.update = (s, o) => soCastUpdate(C, s, o || {});
  return C;
}

// when your voice (started at film t0, from where you are) reaches a person: they turn to you over 0.5 s
function soTurn(t, tVoice, d) { return tVoice == null ? 0 : soEase(t, tVoice + d / SOP.c + 0.15, tVoice + d / SOP.c + 0.75); }

function soPlace(P, st) { P.root.visible = true; P.root.quaternion.setFromAxisAngle(_soCy, st.yaw); P.root.position.set(st.pos[0], st.pos[1], st.pos[2]); P.apply(st.p); if (P.mouthM) P.mouthM.scale.y = 1 + 6 * (st.p.mouth || 0); }
const _soCy = new THREE.Vector3(0, 1, 0), _soCx = new THREE.Vector3(1, 0, 0), _soCz = new THREE.Vector3(0, 0, 1);

function soCastUpdate(C, s, o) {
  const mode = o.mode, t = o.t, on = new Set(), you = o.you || [0, 0, 0];
  const talk = (p, k, i) => { p.mouth = 0.5 + 0.5 * Math.sin(k * 11 + i) * Math.sin(k * 3.7 + i * 2); return p; };
  // the street: everyone looks about, talks without a sound; when you call out they all turn to you
  if (mode === 'street' || mode === 'car' || mode === 'warn' || mode === 'heads') {
    const tv = mode === 'heads' ? soVoice('y_street').start : null;
    SO_STREET.forEach((e, i) => {
      const [look, x, z, yaw0, pose] = e, P = C.street[i]; on.add(P);
      let p = SO_POSES[pose === 'lead' ? 'lead' : pose] ? SO_POSES[pose === 'lead' ? 'lead' : pose]() : SO_POSES.stand();
      p = soFidget(p, s, i, 1.4);
      if (pose === 'talk' || pose === 'hug') talk(p, s, i);
      const d = Math.hypot(x - you[0], z - you[2]), lag = 0.25 + 0.3 * SO_STREET_RANK[i], k = tv == null ? 0 : soEase(t, tv + d / SOP.c + lag, tv + d / SOP.c + lag + 0.8), yTo = soYaw(you[0] - x, you[2] - z);
      const yaw = yaw0 + soAng(yTo - yaw0) * k;
      if (k > 0) { p.headYaw *= (1 - k); p.mouth = (p.mouth || 0) * (1 - k); p.neck = p.neck * (1 - k) + 0.02 * k; }
      soPlace(P, soSt(p, x, z, yaw));
      if (P.umb) { P.root.updateMatrixWorld(true); const hw = P.j.ra.hand.getWorldPosition(new THREE.Vector3()); P.umb.position.set(hw.x, hw.y - 0.2, hw.z); }
    });
  }
  // the crowd round the tree in the dark (echo pictures): standing still, facing you; at "Who's there?" a step closer
  if (mode === 'echo' || mode === 'who' || mode === 'question' || mode === 'hide' || mode === 'dog') {
    const H = SO_ST.you.hide, tw = soVoice('y_who').start;
    SO_RING.forEach((e, i) => {
      const P = C.ring[i]; on.add(P);
      if (mode === 'hide' || mode === 'dog') { P.root.visible = false; return; }        // (they're not there yet, as far as you know)
      const step = soEase(t, tw + e.d / SOP.c + 0.2 + 0.05 * (i % 5), tw + e.d / SOP.c + 1.0 + 0.05 * (i % 5));
      let d = e.d - 0.7 * step;
      if (i === 1) d = SO_BEHIND.d0 + (SO_BEHIND.d1 - SO_BEHIND.d0) * soEase(t, soC('who', 2), SO.tClicks[SO.tClicks.length - 1] - 0.15);
      const a = i === 1 ? SO_BEHIND.a : e.a, x = H[0] + Math.sin(a) * d, z = H[2] + Math.cos(a) * d;
      const p = SO_POSES.stand(); p.neck = 0.12; p.headYaw = 0.05 * Math.sin(e.ph); p.spine = 0.04;
      if (i === 1) { p.neck = 0.32; p.headRoll = 0.16; p.spine = 0.08; }               // (the one behind you: looking down at you, head on one side)
      const ph = Math.max(0, step - 0.0) * SOPI * 2;
      if (step > 0 && step < 1) { const w = soWalkPose(ph, 0.6); Object.assign(p, w); }
      soPlace(P, soSt(p, x, z, soYaw(H[0] - x, H[2] - z)));
      if (P.phone) P.phone.visible = false;
    });
  }
  // the crowd coming (from the middle of the park): the same people, walking in from the gates, phone torches on
  if (mode === 'coming') {
    const H = SO_ST.you.park;
    SO_RING.forEach((e, i) => {
      const P = C.ring[i]; on.add(P);
      const g = [[0, -12.4], [-60, -40], [60, -60], [-30, -95], [70, -20]][i % 5], s0 = soStoryAt(soS('coming')) + 0.5 + (i * 1.3) % 5;
      const dx = H[0] - g[0], dz = H[2] - g[1], L = Math.hypot(dx, dz), yaw = soYaw(dx, dz), w = soWalkSt(s, s0, g[0] + dx / L * (i % 3) * 2, g[1] + dz / L * (i % 3) * 2, yaw, 1.15);
      if (s < s0) { P.root.visible = false; return; }
      w.p.rSh = [0.7, 0.1]; w.p.rEl = 1.2;
      soPlace(P, w); if (P.phone) { P.phone.visible = true; P.torch.visible = true; }
    });
  }
  C.street.forEach((P) => { if (!on.has(P)) P.root.visible = false; if (P.umb) P.umb.visible = P.root.visible; });
  C.ring.forEach((P) => { if (!on.has(P)) P.root.visible = false; });
  // the dog on its lead in the street: barking at you (its jaw snaps; no sound)
  const dogOn = mode === 'street' || mode === 'heads';
  C.dog.root.visible = dogOn; C.lead.forEach((m) => { m.visible = dogOn; });
  if (dogOn) {
    const i = SO_STREET.findIndex((e) => e[4] === 'lead'), O = C.street[i]; O.root.updateMatrixWorld(true);
    const hw = O.j.la.hand.getWorldPosition(new THREE.Vector3()), pos = [O.root.position.x + 0.9, 0, O.root.position.z + 0.7], yaw = soYaw(you[0] - pos[0], you[2] - pos[2]);
    C.dog.root.position.set(...pos); C.dog.root.quaternion.setFromAxisAngle(_soCy, yaw);
    const bark = Math.max(0, Math.sin(s * 9.5)) * (0.5 + 0.5 * Math.sin(s * 1.3));
    soPoseQuad(C.dog, soQuadPose({ crouch: 0.25, head: [0.25 + 0.2 * bark, 0], tail: [0.2, 0.6 * Math.sin(s * 7)], stretch: 0.15 }));
    C.dog.jaw.rotation.x = 0.55 * bark;
    C.dog.root.updateMatrixWorld(true); const hp = C.dog.neck.getWorldPosition(new THREE.Vector3());
    let prev = hw.clone(); const n = C.lead.length;
    for (let k = 1; k <= n; k++) { const u = k / n, cur = new THREE.Vector3().lerpVectors(hw, hp, u); cur.y -= 0.12 * 4 * u * (1 - u); soStrut(C.lead[k - 1], prev.toArray(), cur.toArray(), 0.007); prev = cur; }
  }
  // the dog in the dark: it comes out from behind the bench at you, jaws going, and swerves off (you never heard it)
  const d2 = mode === 'dog';
  C.dog2.root.visible = d2;
  if (d2) {
    const u = t - SO.tDog, H = SO_ST.you.hide, from = [H[0] - 7.5, 0, H[2] - 5.0], k = soEase(u, -0.2, 0.75), swerve = soEase(u, 0.55, 1.4);
    const near = [H[0] - 1.1, 0, H[2] - 0.9], away = [H[0] + 3.5, 0, H[2] - 5.5];
    const p = [from[0] + (near[0] - from[0]) * k + (away[0] - near[0]) * swerve, 0, from[2] + (near[2] - from[2]) * k + (away[2] - near[2]) * swerve];
    const yaw = swerve > 0.02 ? soYaw(away[0] - near[0], away[2] - near[2]) : soYaw(near[0] - from[0], near[2] - from[2]);
    C.dog2.root.position.set(...p); C.dog2.root.quaternion.setFromAxisAngle(_soCy, yaw);
    soPoseQuad(C.dog2, soQuadPose({ gait: t * 14, stretch: 0.45, head: [0.1 + 0.15 * Math.sin(t * 13), 0.3 * swerve], tail: [0.1, 0.5 * Math.sin(t * 9)] }));
    C.dog2.jaw.rotation.x = 0.35 + 0.35 * Math.max(0, Math.sin(t * 13));
  }
}
// a person's head (world), for the camera and labels
function soHeadOf(P) { const v = new THREE.Vector3(0, 1.55 * P.scale, 0.06); P.root.updateMatrixWorld(true); return P.root.localToWorld(v); }
