/* =====================================================================
   CAST — your neighbours, the mother and her daughter from the second floor, the birds and the ducks. The shared adult
   rig (js/world/people.js) is posed from story time s and the shot's mode: people are only out in the shots that run at
   (or near) real speed; in a time-lapse the street is empty (a person would be a blur). Everyone stands along the new
   "down" (physics.js dsTilt: it leans south, so they lean north, into it), without thinking: from Friday you can see it.
     Wednesday 8:10 PM  the second quake: neighbours on the pavement, staggering
     Tuesday 12:35 AM   broad daylight at half past midnight: kids playing, a man with his coffee, the old man looking up
     Thursday 3:30 PM   the car without its handbrake: its owner runs after it
     Friday 7:30 PM     walking along the street: they all lean north (every street a hill)
     Friday 7:45 PM     the girl jumps (her hang time is longer: g is 17 % weaker), her mother watches
     Saturday           holding on: lamp posts, the railings; watching the spire; at the end lying back against the
                        street, feet on the park railings, which now stick out of the "cliff" like a shelf
   You are the camera. Pure.
     dsBuildCast(S) → C ; C.update(s, o)
   ===================================================================== */

Object.assign(LOOKS, {
  dsMum: { skin: 4, build: 'slim', shirt: '#2f5a6a', sleeves: 'long', pants: '#2a2d33', shoes: '#d9d4c8', sole: '#f0ede6', hair: '#1a120c', hairStyle: 'long', coat: true, collar: true },
  dsKid: { skin: 4, build: 'slim', shirt: '#e0b23a', sleeves: 'long', pants: '#c8463a', shoes: '#f2f0ea', sole: '#f2f0ea', hair: '#1a120c', hairStyle: 'pony' },
  dsKid2: { skin: 1, build: 'slim', shirt: '#3a7ac8', sleeves: 'short', pants: '#2a2d33', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#6a4a2a', hat: { type: 'cap', color: '#c8463a' } },
  dsOld: { skin: 0, build: 'avg', shirt: '#6a6052', sleeves: 'long', pants: '#4a4640', shoes: '#2a2018', sole: '#1a1612', hair: '#d8d4cc', coat: true, collar: true },
  dsDad: { skin: 2, build: 'broad', shirt: '#7a3b34', sleeves: 'long', pants: '#33415a', shoes: '#e8e4dc', sole: '#d8d4ca', hair: '#2a1c14' },
  dsRobe: { skin: 3, build: 'avg', shirt: '#8a9aa8', sleeves: 'long', pants: '#8a9aa8', shoes: '#3a3633', sole: '#2a2a2a', hair: '#141010', coat: true },
});
const DSPI = Math.PI;
const dsEase = (s, a, b) => { const u = MathX.clamp((s - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };

// the people: [look, kid?]. Indices are used by the scenes below
const DS_PEOPLE = [
  ['dsMum'], ['dsKid', 1], ['dsDad'], ['dsOld'], ['casual1'], ['casual2'], ['casual3'], ['casual4'], ['casual5'], ['casual6'], ['casual7'], ['casual8'], ['dsRobe'], ['dsKid2', 1],
];
const DS_P = { mum: 0, kid: 1, dad: 2, old: 3, robe: 12, kid2: 13 };

function dsWalkPose(ph, big = 1) {
  const p = basePose(), s = Math.sin(ph), co = Math.cos(ph);
  p.lHip = [0.42 * big * s, 0.03]; p.rHip = [-0.42 * big * s, 0.03];
  p.lKnee = 0.08 + 0.65 * big * Math.max(0, co) ** 1.5; p.rKnee = 0.08 + 0.65 * big * Math.max(0, -co) ** 1.5;
  p.lFoot = -0.2 * Math.max(0, co); p.rFoot = -0.2 * Math.max(0, -co);
  p.lSh = [-0.34 * big * s, 0.07]; p.rSh = [0.34 * big * s, 0.07]; p.lEl = 0.28 + 0.18 * Math.max(0, -s) + (big > 1 ? 0.9 : 0); p.rEl = 0.28 + 0.18 * Math.max(0, s) + (big > 1 ? 0.9 : 0);
  if (big > 1) { p.spine = 0.18; p.hipY = 0.9 + 0.04 * Math.abs(s); }
  return p;
}
const DS_POSES = {
  stand: () => basePose(),
  shield: () => { const p = basePose(); p.lSh = [2.5, 0.35]; p.rSh = [2.45, 0.38]; p.lEl = 1.7; p.rEl = 1.75; p.neck = 0.25; p.spine = 0.12; p.lKnee = 0.3; p.rKnee = 0.25; p.lHip = [0.2, 0.08]; p.rHip = [0.18, 0.08]; p.hipY = 0.86; return p; },
  lookUp: () => { const p = basePose(); p.neck = -0.45; p.spine = -0.08; p.lSh = [0.5, 0.25]; p.rSh = [0.3, 0.2]; p.lEl = 0.9; p.rEl = 0.4; return p; },
  armsOut: () => { const p = basePose(); p.lSh = [0.6, 0.9]; p.rSh = [0.7, 0.85]; p.lEl = 0.3; p.rEl = 0.35; p.neck = 0.1; p.lKnee = 0.35; p.rKnee = 0.3; p.lHip = [0.25, 0.12]; p.rHip = [0.2, 0.12]; p.hipY = 0.85; return p; },
  crouch: () => { const p = basePose(); p.hipY = 0.6; p.lHip = [1.1, 0.12]; p.rHip = [1.1, 0.12]; p.lKnee = 1.6; p.rKnee = 1.6; p.lFoot = 0.35; p.rFoot = 0.35; p.spine = 0.35; p.lSh = [0.9, 0.3]; p.rSh = [0.8, 0.3]; p.lEl = 0.4; p.rEl = 0.4; return p; },
  leap: () => { const p = basePose(); p.lHip = [0.3, 0.1]; p.rHip = [0.1, 0.1]; p.lKnee = 0.5; p.rKnee = 0.3; p.lSh = [2.6, 0.5]; p.rSh = [2.5, 0.55]; p.lEl = 0.2; p.rEl = 0.25; p.neck = -0.2; return p; },
  armsUp: () => { const p = basePose(); p.lSh = [2.6, 0.5]; p.rSh = [2.5, 0.55]; p.lEl = 0.3; p.rEl = 0.35; p.neck = -0.5; p.spine = -0.1; return p; },
  talk: () => { const p = basePose(); p.lSh = [0.9, 0.3]; p.rSh = [1.2, 0.25]; p.lEl = 1.3; p.rEl = 1.1; p.mouth = 1; p.neck = 0.05; return p; },
  cup: () => { const p = basePose(); p.rSh = [0.7, 0.15]; p.rEl = 1.9; p.lSh = [0.1, 0.1]; p.neck = -0.25; return p; },
  hold: () => { const p = basePose(); p.lSh = [1.9, 0.15]; p.rSh = [1.5, 0.2]; p.lEl = 0.5; p.rEl = 0.8; p.spine = 0.1; p.lKnee = 0.2; p.rKnee = 0.35; p.lHip = [0.15, 0.05]; p.rHip = [0.25, 0.05]; return p; },
  climb: () => { const p = basePose(); p.hipY = 0.62; p.spine = 0.75; p.neck = -0.5; p.lHip = [1.25, 0.1]; p.rHip = [0.8, 0.1]; p.lKnee = 1.7; p.rKnee = 1.1; p.lSh = [2.2, 0.25]; p.rSh = [1.6, 0.3]; p.lEl = 0.3; p.rEl = 0.5; return p; },
  brace: () => { const p = basePose(); p.hipY = 0.8; p.lHip = [0.55, 0.15]; p.rHip = [0.4, 0.15]; p.lKnee = 0.8; p.rKnee = 0.6; p.lSh = [0.35, 0.65]; p.rSh = [0.3, 0.6]; p.lEl = 0.5; p.rEl = 0.45; p.neck = 0.2; p.spine = -0.05; return p; },
  hug: () => { const p = basePose(); p.lSh = [1.1, -0.15]; p.rSh = [1.05, -0.12]; p.lEl = 2.1; p.rEl = 2.15; p.spine = 0.22; p.neck = 0.2; return p; },
  kick: () => { const p = basePose(); p.rHip = [0.9, 0.05]; p.rKnee = 0.3; p.lKnee = 0.25; p.lSh = [-0.4, 0.5]; p.rSh = [0.5, 0.4]; p.spine = -0.1; return p; },
};

// a state: { p, pos (feet), yaw, lean (rad, about x: + leans north; defaults to the tilt of down) }
const dsSt = (p, x, z, yaw, o = {}) => Object.assign({ p, pos: [x, o.y || 0, z], yaw }, o);
// walking from (x0, z0) along yaw at v m/s, from story s0
function dsWalkSt(s, s0, x0, z0, yaw, v, o = {}) {
  const d = Math.max(0, s - s0) * v, ph = d / (o.stride || 0.72) * DSPI;
  return dsSt(dsWalkPose(ph, o.big || 1), x0 + Math.sin(yaw) * d, z0 + Math.cos(yaw) * d, yaw, o);
}
// a little life on a standing pose
function dsFidget(p, s, i, a = 1) { p.headYaw += 0.3 * a * noise1(s * 0.11, i + 2); p.spineYaw = 0.06 * a * noise1(s * 0.07, i + 4); p.neck += 0.06 * a * noise1(s * 0.09, i + 6); return p; }

// the scene for a shot: [personIndex, state] pairs
function dsCastScene(mode, s, th, T) {
  const out = [], put = (i, st) => { if (st) out.push([i, st]); };
  const F = (i, pose, x, z, yaw, o) => put(i, dsSt(dsFidget(DS_POSES[pose](), s, i), x, z, yaw, o));
  switch (mode) {
    // Tuesday, 12:35 AM, broad daylight: kids kicking a ball in the road, a man with his coffee, the old man looking at
    // the sun, two neighbours talking on the pavement
    case 'awake': {
      const s0 = DS.sTueRise + 600;
      { const u = ((s - s0) % 2.6) / 2.6; put(DS_P.kid, dsSt(u < 0.25 ? DS_POSES.kick() : dsWalkPose((s - s0) * 7, 1.2), -3.2 + 0.6 * Math.sin((s - s0) * 0.9), -5.2, 1.2)); }
      put(DS_P.kid2, dsWalkSt(s, s0, 3.5, -5.8, -1.9, 0.6, { stride: 0.5 }));
      put(DS_P.robe, dsWalkSt(s, s0, -8.5, -1.0, DSPI / 2, 0.75));
      { const st = DS_P.robe, w = out.find((o) => o[0] === st)[1]; w.p.rSh = [0.7, 0.15]; w.p.rEl = 1.9; }
      F(DS_P.old, 'lookUp', 1.2, -1.2, -2.6);
      F(4, 'talk', -0.5, -0.9, 1.8); F(9, 'stand', 0.5, -1.15, -1.5);
      F(DS_P.mum, 'cup', -4.6, -0.7, 2.6);
      break;
    }
    // Wednesday, 8:10 PM: the second quake (10 s from 8:10:02): they stagger and crouch
    case 'quake2': {
      const q = dsQuake(s), k = dsEase(s, dsAt(3, 20, 10, 2.5), dsAt(3, 20, 10, 4.5));
      const P = [[4, -2.5, -1.2, 2.2], [5, -6.5, -1.5, 1.4], [6, -9.8, -1.0, 2.8], [3, -4.0, -0.5, 3.0], [11, -13.5, -1.3, 1.9], [8, 0.8, -4.2, 2.4]];
      P.forEach(([i, x, z, yaw], n) => { const p = lerpPose(DS_POSES.talk(), n % 2 ? DS_POSES.crouch() : DS_POSES.armsOut(), k); p.mouth = 0;
        p.headRoll = 0.12 * q * Math.sin(s * 23 + n); p.spineRoll = 0.08 * q * Math.sin(s * 19 + n); put(i, dsSt(dsFidget(p, s, i), x + 0.05 * q * Math.sin(s * 17 + n), z, yaw)); });
      break;
    }
    // Thursday, 3:30 PM: the car without its handbrake. Its owner is on his phone by the side street; he runs after it
    case 'car': case 'car2': {
      const c = T.rollCar, z = c.g.position.z, gone = s > c.f.s0 + 0.7;
      if (!gone) { const p = DS_POSES.talk(); p.lSh = [0.4, 0.1]; p.lEl = 2.3; put(DS_P.dad, dsSt(dsFidget(p, s, 2), 23.4, -0.6, 2.2)); }
      else { const d = s - c.f.s0 - 0.7, x = 23.4 + Math.min(1, d / 1.5) * 2.0, zz = Math.max(z + 3.4, -0.6 - d * 2.6); const p = dsWalkPose(d * 9, 1.6); if (d > 0.4) { p.rSh = [2.2, 0.2]; p.rEl = 0.3; }
        put(DS_P.dad, dsSt(p, x, Math.min(-0.6, zz), DSPI + 0.15 * Math.sin(d))); }
      F(10, 'stand', 31.6, -1.2, -2.3); F(7, 'stand', 33.0, -1.4, -2.0);
      break;
    }
    // Friday, 7:30 PM: walking along the street, leaning north into the slope; one climbing towards you, one coming down
    case 'lighter': {
      const s0 = dsAt(5, 19, 30);
      put(4, dsWalkSt(s, s0, -1.0, -1.1, -DSPI / 2, 1.25)); put(9, dsWalkSt(s, s0, -6.0, -0.9, -DSPI / 2, 1.1));
      put(5, dsWalkSt(s, s0, -16.0, -10.6, DSPI / 2, 1.2)); put(11, dsWalkSt(s, s0, -24.0, -10.4, DSPI / 2, 1.0));
      { const st = dsWalkSt(s, s0, -9.0, -11.0, 0, 0.7, { stride: 0.55 }); st.p.spine += 0.25; put(6, st); }        // uphill: bent forward
      { const st = dsWalkSt(s, s0, -13.5, -1.8, DSPI, 0.9, { stride: 0.6 }); st.p.spine -= 0.12; put(7, st); }       // downhill: leaning back
      F(DS_P.old, 'stand', -3.6, -0.5, 2.9);
      break;
    }
    // Friday, 7:45 PM: the girl jumps, again and again (straight up the new up: she lands where she took off)
    case 'jump': {
      const s0 = dsAt(5, 19, 45), v0 = 2.6, ge = dsGEff(s), air = 2 * v0 / ge, per = air + 0.42, u = ((s - s0 + 0.3) % per), x = -6.0, z = -1.2;
      let p, h = 0;
      if (u < 0.42) { const c = Math.sin(u / 0.42 * DSPI); p = lerpPose(DS_POSES.stand(), DS_POSES.crouch(), 0.55 * c); }
      else { const ta = u - 0.42; h = v0 * ta - 0.5 * ge * ta * ta; p = lerpPose(DS_POSES.leap(), DS_POSES.armsUp(), Math.min(1, ta / (air * 0.5))); }
      put(DS_P.kid, dsSt(p, x, z, 2.5, { up: h }));
      F(DS_P.mum, 'talk', x + 1.4, z + 0.5, -2.2); F(DS_P.kid2, 'lookUp', x - 1.2, z - 0.4, 2.0, {});
      break;
    }
    // Saturday, midnight, in daylight: 19°. Holding on to lamp posts, the railings; the mother keeps her daughter close
    case 'sat': {
      // (holding on to something uphill of them: north, facing it)
      F(DS_P.mum, 'hold', -8.0, -10.65, 0.05); F(DS_P.kid, 'hug', -7.55, -10.95, 0.5);
      F(4, 'hold', -21.0, -2.05, 0.15); F(DS_P.old, 'brace', -14.0, -11.75, 0.0); F(9, 'brace', -16.5, -11.8, 0.3);
      { const st = dsWalkSt(s, dsAt(6, 0, 0), -2.0, -6.0, 0.15, 0.32, { stride: 0.4 }); st.p = lerpPose(st.p, DS_POSES.climb(), 0.5); put(5, st); }
      F(12, 'crouch', -26.0, -0.6, 0.0);
      break;
    }
    // the spire: people at the park railings watch it go; they flinch as it falls
    case 'spire': {
      const a = dsSpireAngle(s), fl = dsEase(a, 0.3, 0.9);
      [[4, 64.5, -11.6, DSPI / 2 - 0.2], [6, 66.0, -11.75, DSPI / 2 - 0.35], [11, 70.2, -11.7, DSPI / 2 - 0.5], [2, 62.8, -1.3, DSPI / 2 - 0.9]].forEach(([i, x, z, yaw], n) => {
        const p = lerpPose(n === 3 ? DS_POSES.hold() : DS_POSES.lookUp(), n % 2 ? DS_POSES.shield() : DS_POSES.armsUp(), fl * 0.85); put(i, dsSt(dsFidget(p, s, i, 0.4), x, z, yaw)); });
      break;
    }
    // 1:44 AM, 30°: climbing your street like a roof; resting against the railings
    case 'lean': {
      const s0 = dsAt(6, 1, 44);
      { const st = dsWalkSt(s, s0, -3.5, -9.0, 0.1, 0.18, { stride: 0.35 }); st.p = lerpPose(st.p, DS_POSES.climb(), 0.85); put(5, st); }
      { const st = dsWalkSt(s, s0, -6.2, -7.8, -0.05, 0.15, { stride: 0.35 }); st.p = lerpPose(st.p, DS_POSES.climb(), 0.9); put(9, st); }
      F(DS_P.old, 'brace', -9.0, -11.85, 0.0); F(11, 'brace', -12.5, -11.8, 0.4); F(4, 'hold', -21.0, -2.05, 0.0);
      break;
    }
    // 2:15 AM, 35°: the parked cars go; a man clings to the lamp post on your side
    case 'cars': F(4, 'hold', -21.0, -2.05, 0.25); F(8, 'hold', -47.0, -2.05, 0.1); break;
    // the last sunrise, 76°: lying back against the street, feet on the park railings (a shelf now), facing out (south)
    case 'dawn': case 'question': {
      const k = (n) => 0.2 * noise1(s * 0.2, n), Y = { y: 0.12 }, z = -12.16;
      F(DS_P.mum, 'brace', 9.2, z, DSPI + 0.15 + k(1), Y); F(DS_P.kid, 'brace', 8.5, z, DSPI + 0.1 + k(2), Y);
      F(DS_P.old, 'brace', 4.0, z, DSPI - 0.1 + k(3), Y); F(4, 'brace', 1.2, z, DSPI + 0.2 + k(4), Y); F(6, 'brace', -2.6, z, DSPI + k(5), Y);
      F(12, 'brace', -7.8, z, DSPI - 0.15 + k(6), Y); F(5, 'brace', -12.0, z, DSPI + 0.3 + k(7), Y);
      break;
    }
  }
  return out;
}

// birds: starlings over the park at sunrise (the birds beat), sparrows on the path; ducks on the pond
function dsBirdState(i, s, kind) {
  if (kind === 'duck') {
    const pd = DS_ST.pond, a0 = i * 1.3, R = 3 + 2.2 * i, ang = a0 + s * 0.0015 * (1 + 0.3 * (i % 3)), drift = -2.5 * dsSm(s, dsAt(4, 14, 25), dsAt(4, 14, 50));
    const x = pd.x - 4 + R * Math.cos(ang), z = pd.z + 0.55 * R * Math.sin(ang) + drift;
    return { pos: [x, -0.04 - (z - pd.z) * Math.sin(Math.min(dsTilt(s), 0.25)), z], up: [0, 1, 0], fwd: [-Math.sin(ang), 0, 0.55 * Math.cos(ang)], flap: 0 };
  }
  if (kind === 'sparrow') {
    const per = 0.55 + 0.1 * (i % 3), u = ((s + i * 0.37) % per) / per, hop = Math.max(0, Math.sin(u * DSPI * 2)) * 0.06, k = Math.floor((s + i * 0.37) / per);
    return { pos: [-8.4 + 1.2 * dsR(i, 3) + 0.08 * Math.sin(k * 1.7 + i), hop, -16.4 + 0.9 * dsR(i, 4) + 0.06 * Math.cos(k * 2.3 + i)], up: [0, 1, 0], fwd: [Math.cos(k * 1.3 + i), 0, Math.sin(k * 1.3 + i)], flap: hop > 0.01 ? 1 : 0 };
  }
  // starlings: a loose flock wheeling over the trees
  const c = [-24 + 7 * Math.sin(s * 0.13), 9.5 + 2.2 * Math.sin(s * 0.21), -36 + 6 * Math.cos(s * 0.11)];
  const a = s * (0.9 + 0.2 * dsR(i, 7)) + i * 0.7, r = 2.0 + 2.5 * dsR(i, 8), y = 1.2 * Math.sin(s * 1.3 + i);
  const pos = [c[0] + r * Math.cos(a) + 1.5 * noise1(s * 0.5, i), c[1] + y, c[2] + r * Math.sin(a) * 0.7 + 1.5 * noise1(s * 0.5, i + 50)];
  return { pos, up: [0, 1, 0], fwd: [-Math.sin(a), 0.2 * Math.cos(s * 1.3 + i), Math.cos(a) * 0.7], flap: 1 };
}

function dsBuildCast(S) {
  const scene = S.scene, C = {};
  C.people = DS_PEOPLE.map(([look, kid], i) => { const g = new Person({ id: 'dsP' + i, look }, null); if (kid) g.root.scale.setScalar(0.66); scene.add(g.root); g.root.visible = false; return g; });
  C.kid = C.people[DS_P.kid];
  C.ducks = Array.from({ length: 5 }, (_, i) => { const b = dsBuildBird(i % 2 ? '#6a5a42' : '#3f5a3a', 1.3); scene.add(b); return b; });
  C.starlings = Array.from({ length: 34 }, (_, i) => { const b = dsBuildBird(i % 3 ? '#2a2c30' : '#3a3528', 0.7); scene.add(b); return b; });
  C.sparrows = Array.from({ length: 6 }, (_, i) => { const b = dsBuildBird(i % 2 ? '#7a6248' : '#5f5040', 0.55); scene.add(b); return b; });
  C.update = (s, o) => dsCastUpdate(C, s, o || {});
  return C;
}
const _dsCy = new THREE.Vector3(0, 1, 0), _dsCx = new THREE.Vector3(1, 0, 0), _dsQa = new THREE.Quaternion(), _dsBm = new THREE.Matrix4(), _dsBx = new THREE.Vector3(), _dsBy = new THREE.Vector3(), _dsBz = new THREE.Vector3();
function dsCastUpdate(C, s, o) {
  const th = dsTilt(s), scene = dsCastScene(o.mode, s, th, o.T || C.T), on = new Set();
  for (const [i, st] of scene) {
    const P = C.people[i]; on.add(i); P.root.visible = true;
    // stand along the new down: lean north by the tilt (about x), then face their way (about the body's own up)
    const lean = st.lean ?? th, up = st.up || 0;
    P.root.quaternion.setFromAxisAngle(_dsCx, lean); _dsQa.setFromAxisAngle(_dsCy, st.yaw); P.root.quaternion.multiply(_dsQa);
    P.root.position.set(st.pos[0], st.pos[1] + up * Math.cos(lean), st.pos[2] + up * Math.sin(lean));
    P.apply(st.p);
  }
  C.people.forEach((P, i) => { if (!on.has(i)) P.root.visible = false; });
  const show = { duck: o.mode === 'pond' || o.mode === 'birds', starling: o.mode === 'birds', sparrow: o.mode === 'birds' };
  const birds = (arr, kind) => arr.forEach((b, i) => {
    b.visible = show[kind]; if (!b.visible) return;
    const st = dsBirdState(i, s, kind); b.position.set(...st.pos);
    _dsBy.set(...st.up).normalize(); _dsBx.set(...st.fwd); _dsBx.addScaledVector(_dsBy, -_dsBx.dot(_dsBy)).normalize(); _dsBz.crossVectors(_dsBx, _dsBy);
    _dsBm.makeBasis(_dsBx, _dsBy, _dsBz); b.quaternion.setFromRotationMatrix(_dsBm);
    const f = st.flap ? Math.sin(s * (kind === 'starling' ? 26 : 30) + i) * 0.9 : 0; b.userData.wings[0].rotation.x = f; b.userData.wings[1].rotation.x = -f;
  });
  birds(C.ducks, 'duck'); birds(C.starlings, 'starling'); birds(C.sparrows, 'sparrow');
}
// a person's head (world), for the camera and labels
function dsHeadOf(P) { const v = new THREE.Vector3(0, 1.55 * P.scale, 0.06); P.root.updateMatrixWorld(true); return P.root.localToWorld(v); }
