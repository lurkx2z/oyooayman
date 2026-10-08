/* =====================================================================
   CAST — the people you see up close (full rigs): the 30 runners and the starter (shot 1), your friend and
   their neighbours (2), the referee, the free-kick taker, the wall and the keeper (4), the drummer (5),
   the players and your neighbours in the stand (6), and the ball. Each one is shown only in its shots.
   Everyone reacts to a sound when it reaches THEM (script.js: sndHeardAt / sndThunderAt), never when it
   reaches you; to the goal they react at once (they see it).
   ===================================================================== */

// --- film poses (added to the shared rig; names are this film's) --------------------------------------------
Object.assign(ACTIONS, {
  sndSet(τ, c) {          // a standing start: weight forward, one arm forward, waiting for the gun
    const p = basePose(), w = 0.012 * Math.sin(τ * 1.7 + c.seed * 9);
    p.hipY = 0.84; p.spine = 0.5 + w; p.neck = -0.32;
    p.lHip = [0.42, 0.04]; p.rHip = [-0.32, 0.04]; p.lKnee = 0.75; p.rKnee = 0.5; p.lFoot = -0.1; p.rFoot = 0.2;
    p.lSh = [-0.55, 0.1]; p.rSh = [0.85, 0.1]; p.lEl = 1.1; p.rEl = 1.3;
    return p;
  },
  sndSprint(τ, c) {
    const p = basePose(), φ = c.walkPhase, s = Math.sin(φ), co = Math.cos(φ), k = MathX.smooth(τ, 0, 1.2);
    p.lHip = [0.85 * s, 0.03]; p.rHip = [-0.85 * s, 0.03];
    p.lKnee = 0.35 + 1.25 * Math.max(0, co) ** 1.2; p.rKnee = 0.35 + 1.25 * Math.max(0, -co) ** 1.2;
    p.lFoot = 0.25 * Math.max(0, -co); p.rFoot = 0.25 * Math.max(0, co);
    p.lSh = [-0.85 * s, 0.1]; p.rSh = [0.85 * s, 0.1]; p.lEl = 1.45; p.rEl = 1.45;
    p.spine = 0.42 - 0.2 * k; p.neck = -0.25 + 0.15 * k; p.hipY = 0.88 + 0.04 * Math.abs(co);
    return p;
  },
  sndStarter(τ, c) {      // the gun held up overhead (fired at SND.gun.bang: a kick of the arm)
    const p = ACTIONS.idle(τ, c), r = MathX.impulse(τ, SND.gun.bang - SND.gun.set, 0.12);
    p.rSh = [2.85 - 0.25 * r, 0.25]; p.rEl = 0.15 + 0.4 * r; p.lSh = [0.2, 0.1]; p.lEl = 0.5; p.neck = 0.05; p.headYaw = 0.35;
    return p;
  },
  sndWave(τ, c) {
    const p = ACTIONS.idle(τ, c);
    p.rSh = [2.6, 0.45]; p.rEl = 0.5 + 0.45 * Math.sin(τ * 9); p.lSh = [0.12, 0.1]; p.headYaw = 0; p.neck = -0.06;
    return p;
  },
  sndShout(τ, c) {        // one hand cupped beside the mouth (the mouth stays in view, wide open), the other arm out
    const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.2);
    p.rSh = [1.2 * k, 0.65 * k]; p.rEl = 2.15 * k; p.lSh = [0.55 * k, 0.35 * k]; p.lEl = 0.35;
    p.spine = 0.14 * k; p.neck = -0.18 * k; p.mouth = 1; p.headYaw = 0;
    return p;
  },
  sndCheer(τ, c) {        // the goal: both arms up (the jumps are a lift of the root, in the cast list)
    const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.18), w = 0.12 * Math.sin(τ * 7 + c.seed * 5);
    p.lSh = [2.85 * k, 0.35 + w]; p.rSh = [2.85 * k, 0.35 - w]; p.lEl = 0.25; p.rEl = 0.25; p.spine = -0.08 * k; p.neck = 0.2 * k;
    return p;
  },
  sndWhistle(τ, c) {
    const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.2);
    p.rSh = [1.45 * k, 0.32 * k]; p.rEl = 2.35 * k; p.neck = -0.05; p.headYaw = 0;
    return p;
  },
  sndPoint(τ, c) {
    const p = ACTIONS.idle(τ, c), k = Math.min(1, τ / 0.3);
    p.rSh = [1.45 * k, 0.05]; p.rEl = 0.1; p.headYaw = 0.1;
    return p;
  },
  sndKick(τ, c) {         // the strike lands at τ = 0.1
    const p = basePose(), a = MathX.smooth(τ, 0, 0.1), b = MathX.smooth(τ, 0.1, 0.32), r = MathX.smooth(τ, 0.45, 1.0);
    p.rHip = [(-0.85 + 1.3 * a + 0.9 * b) * (1 - r), 0.05]; p.rKnee = (1.5 - 1.25 * a) * (1 - r) + 0.05;
    p.lHip = [0.25 * (1 - r), 0.05]; p.lKnee = 0.35 * (1 - r) + 0.05;
    p.spine = -0.12 * (1 - r); p.lSh = [0.55, 0.95 * (1 - r) + 0.1]; p.rSh = [-0.3, 0.7 * (1 - r) + 0.1]; p.lEl = 0.4; p.rEl = 0.4;
    p.hipY = 0.9;
    return p;
  },
  sndCelebrate(τ, c) {    // running off with the arms out
    const p = ACTIONS.jog(τ, c);
    p.lSh = [0.15, 1.35]; p.rSh = [0.15, 1.35]; p.lEl = 0.15; p.rEl = 0.15; p.spine = 0.05; p.neck = -0.15;
    return p;
  },
  sndWall(τ, c) {         // hands covering, a jump as the ball is struck (the root is lifted in update)
    const p = ACTIONS.idle(τ, c);
    p.lSh = [0.35, -0.12]; p.rSh = [0.35, -0.12]; p.lEl = 0.5; p.rEl = 0.5; p.spine = 0.08; p.headYaw = 0;
    return p;
  },
  sndKeeper(τ, c) {
    const p = basePose(), w = Math.sin(τ * 6) * 0.03;
    p.hipY = 0.84; p.spine = 0.28; p.neck = -0.2; p.lHip = [0.3, 0.25]; p.rHip = [0.3, 0.25]; p.lKnee = 0.6 + w; p.rKnee = 0.6 - w;
    p.lSh = [0.45, 0.55]; p.rSh = [0.45, 0.55]; p.lEl = 0.6; p.rEl = 0.6;
    return p;
  },
  sndDive(τ, c) {         // late, to his left (+x in the rig)
    const p = basePose(), k = MathX.smooth(τ, 0, 0.35);
    p.rootRoll = -1.15 * k; p.hipY = 0.84 - 0.32 * k; p.spine = 0.1;
    p.lSh = [2.7 * k, 0.3]; p.rSh = [2.6 * k, 0.2]; p.lEl = 0.2; p.rEl = 0.2;
    p.lHip = [0.2, 0.5 * k]; p.rHip = [0.1, 0.1]; p.lKnee = 0.3; p.rKnee = 0.6;
    return p;
  },
  // the drummer: the left hand steadies the drum, the right swings down on every beat (beats every SND.drum.period)
  sndDrum(τ, c) {
    const p = ACTIONS.idle(τ, c), D = SND.drum, T = D.period, u = τ - 0.5, k = Math.floor(u / T), ph = u - k * T;
    let a = 1.7;
    if (u >= -0.4 && k < D.n) a = u < 0 ? 1.7 : ph < 0.6 * T ? 0.75 + 0.95 * MathX.smooth(ph, 0.04 * T, 0.55 * T) : 1.7 - 0.95 * MathX.smooth(ph, 0.7 * T, T);
    else if (k >= D.n) a = 0.75 + 0.6 * MathX.smooth(u - D.n * T, 0, 0.6);
    p.rSh = [a, 0.35]; p.rEl = 0.9; p.lSh = [0.65, 0.2]; p.lEl = 1.3; p.spine = 0.08; p.neck = 0.1; p.headYaw = 0.2;
    return p;
  },
  // the thunder hits: a flinch with the hands to the ears and a crouch, then up again looking round
  sndDuck(τ, c) {
    const p = basePose(), k = Math.min(1, τ / 0.14), back = MathX.smooth(τ, 1.6, 3.2), cr = MathX.smooth(τ, 0.08, 0.5) * (1 - back), kk = k * (1 - back * 0.85);
    p.lSh = [1.9 * kk, 0.55]; p.rSh = [1.9 * kk, 0.55]; p.lEl = 2.45 * kk; p.rEl = 2.45 * kk;
    p.spine = 0.2 + 0.35 * cr; p.neck = 0.3 * (1 - back); p.hipY = 0.93 - 0.22 * cr;
    p.lHip = [0.45 * cr, 0.1]; p.rHip = [0.4 * cr, 0.1]; p.lKnee = 0.9 * cr; p.rKnee = 0.8 * cr; p.lFoot = 0.25 * cr; p.rFoot = 0.25 * cr;
    p.headYaw = back * Math.sin(τ * 1.3 + c.seed * 4) * 0.7;
    return p;
  },
  sndWatch(τ, c) {        // a fan watching the match: weight shifts, a hand to the mouth now and then
    const p = ACTIONS.idle(τ, c), h = Math.max(0, Math.sin(τ * 0.4 + c.seed * 9)) ** 6;
    p.rSh = [0.2 + 1.2 * h, 0.15]; p.rEl = 0.3 + 1.9 * h; p.headYaw = noise1(τ * 0.25, c.seedI) * 0.35;
    return p;
  },
});
Object.assign(BLEND, { sndSet: 0.6, sndSprint: 0.14, sndStarter: 0.5, sndWave: 0.3, sndShout: 0.16, sndWhistle: 0.15, sndPoint: 0.3, sndKick: 0.08, sndCelebrate: 0.4,
  sndWall: 0.4, sndKeeper: 0.4, sndDive: 0.08, sndDrum: 0.4, sndDuck: 0.06, sndWatch: 0.6, sndCheer: 0.12 });

// looks: runners in bright tops, two kits, the referee, the keeper, the friend, fans
(() => {
  const tops = ['#d8433a', '#2f78c4', '#f2f0e8', '#3fa35a', '#f0a531', '#7a4bb0', '#1f2a36', '#e86fa0', '#20a3a8', '#e4e0d8'];
  tops.forEach((c, i) => { LOOKS['sndRun' + i] = { skin: i % 6, build: ['slim', 'avg', 'slim', 'broad'][i % 4], shirt: c, sleeves: 'short', pants: ['#1d2026', '#2b3a55', '#3a3a3a'][i % 3], shoes: '#e8e6e0', sole: '#f4f2ee', hair: ['#1b1410', '#4a3220', '#9c7a4a', '#151515'][i % 4], hairStyle: ['short', 'pony', 'short', 'bun', 'short'][i % 5] }; });
  Object.assign(LOOKS, {
    sndHome: { skin: 2, build: 'avg', shirt: '#e2b82e', sleeves: 'short', pants: '#1f2f52', shoes: '#111', sole: '#222', hair: '#1b1410' },
    sndHome2: { skin: 4, build: 'avg', shirt: '#e2b82e', sleeves: 'short', pants: '#1f2f52', shoes: '#111', sole: '#222', hair: '#111' },
    sndAway: { skin: 0, build: 'avg', shirt: '#c23a30', sleeves: 'short', pants: '#efeee8', shoes: '#111', sole: '#222', hair: '#4a3220' },
    sndAway2: { skin: 3, build: 'broad', shirt: '#c23a30', sleeves: 'short', pants: '#efeee8', shoes: '#111', sole: '#222', hair: '#151515' },
    sndRef: { skin: 1, build: 'avg', shirt: '#151719', sleeves: 'short', pants: '#151719', shoes: '#111', sole: '#222', hair: '#3a2a1e' },
    sndKeeperL: { skin: 5, build: 'broad', shirt: '#3fae5a', sleeves: 'long', pants: '#1d2026', shoes: '#111', sole: '#222', hair: '#6b4a2c', gloves: '#f2f0e8' },
    sndFriend: { skin: 1, build: 'avg', shirt: '#f2621a', sleeves: 'long', pants: '#2c3440', shoes: '#d8d4ca', sole: '#f0ede6', hair: '#2a1a12', jacket: true, collar: true, inner: '#f4f1ea', scarf: '#f4f1ea' },
    sndStarterL: { skin: 3, build: 'broad', shirt: '#f2f0e8', sleeves: 'long', pants: '#1d2026', shoes: '#111', sole: '#222', hair: '#151515', hat: { type: 'cap', color: '#c4362e' } },
    sndFanA: { skin: 0, build: 'avg', shirt: '#e2b82e', sleeves: 'long', pants: '#2a2f38', shoes: '#3a3633', sole: '#c9c4b8', hair: '#4a3220', jacket: true, collar: true, scarf: '#1f2f52' },
    sndFanB: { skin: 2, build: 'slim', shirt: '#1f2f52', sleeves: 'long', pants: '#1f1f24', shoes: '#111', sole: '#2a2a2a', hair: '#2a1a12', hairStyle: 'long', scarf: '#e2b82e' },
    sndFanC: { skin: 4, build: 'broad', shirt: '#d9d6cc', sleeves: 'short', pants: '#39435a', shoes: '#cfcac0', sole: '#e8e4dc', hair: '#111', hat: { type: 'cap', color: '#1f2f52' } },
    sndFanD: { skin: 1, build: 'avg', shirt: '#3c5a46', sleeves: 'long', pants: '#454d58', shoes: '#c8c3b8', sole: '#e6e2da', hair: '#7a5c40', hood: true, jacket: true },
    sndFanE: { skin: 5, build: 'slim', shirt: '#e2b82e', sleeves: 'short', pants: '#22262c', shoes: '#d8d4ca', sole: '#f0ede6', hair: '#9c7a4a', hairStyle: 'pony' },
    sndSteward: { skin: 2, build: 'avg', shirt: '#cdef2e', sleeves: 'long', pants: '#23272e', shoes: '#111', sole: '#222', hair: '#1b1410', jacket: true, collar: true, inner: '#2a2f38' },
    sndSteward2: { skin: 4, build: 'broad', shirt: '#cdef2e', sleeves: 'long', pants: '#23272e', shoes: '#111', sole: '#222', hair: '#111', hat: { type: 'cap', color: '#1f2f52' } },
  });
})();

// facing (the rig's `face`, degrees) to look from (x0, z0) toward (x1, z1)
function sndFace(x0, z0, x1, z1) { return (Math.atan2(x1 - x0, z1 - z0) - Math.PI) * 180 / Math.PI; }

class SndCast {
  constructor(app) {
    const scene = app.scene;
    this.app = app;
    this.list = [];                         // { p: Person, shots: [...], lift: fn(t) }
    const add = (spec, shots, lift) => { const p = new Person(spec, scene); this.list.push({ p, shots, lift }); return p; };
    const E = SND_EYE;

    // 1. the runners (each goes when the bang reaches it) and the starter
    SND_RUNNERS.forEach((R) => {
      const path = [[0, SND.line.x, R.z], [R.go, SND.line.x, R.z]];
      for (let t = R.go + 0.1; t <= SND.cuts[0] + 0.2; t += 0.1) path.push([+t.toFixed(3), sndRunnerX(R, t), R.z]);
      // (standing at the line; "Set!" is heard on time, in normal air: they all crouch together)
      add({ id: 'run' + R.i, look: 'sndRun' + (R.i * 7 % 10), path, states: [[0, 'idle'], [SND.gun.set + 0.15 + hash1(R.i * 5 + 9) * 0.12, 'sndSet'], [R.go, 'sndSprint']], stride: 2.3, face: -90 }, [0]);
    });
    this.starter = add({ id: 'starter', look: 'sndStarterL', path: [[0, SND.gun.x + 0.35, SND.gun.z]], states: [[0, 'idle'], [SND.gun.set, 'sndStarter'], [SND.gun.bang + 1.4, 'idle']], face: sndFace(SND.gun.x, SND.gun.z, 0, 0) }, [0]);
    { const gun = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.12, 0.2), Mat.std('#16181a', { roughness: 0.4, metalness: 0.5 })); gun.position.set(0, -0.08, 0.06); this.starter.j.ra.hand.add(gun); }

    // 2. your friend (row 11), and the people round them
    const F = SND.friend, fy = F.y, faceF = sndFace(F.x, F.z, E[1].x, E[1].z);
    this.friend = add({ id: 'friend', look: 'sndFriend', y: fy, path: [[0, F.x, F.z - 0.1]], states: [[0, 'idle'], [F.wave[0], 'sndWave'], [F.shout, 'sndShout'], [F.shout + 0.95, 'sndWave'], [F.shout2, 'sndShout'], [F.shout2 + 0.75, 'sndWave'], [F.wave[1], 'sndWatch']], face: faceF }, [1]);
    const nb = [['nb1', 'sndFanB', 10, -23.4], ['nb2', 'sndFanC', 10, -20.3], ['nb3', 'sndFanD', 11, -25.2], ['nb4', 'sndFanC', 11, -19.6], ['nb5', 'sndFanB', 12, -22.6], ['nb6', 'sndFanD', 13, -18.4],
      ['nb7', 'sndFanA', 8, -26.4], ['nb8', 'sndFanE', 7, -21.0], ['nb9', 'sndFanA', 14, -24.8], ['nb10', 'sndFanE', 15, -20.2], ['nb11', 'sndFanC', 9, -17.5], ['nb12', 'sndFanD', 13, -27.1]];
    for (const [id, look, r, x] of nb) { const q = sndSideSeat(1, r, x); add({ id, look, y: q.y, path: [[0, x, q.z - 0.1]], states: [[0, 'sndWatch']], face: sndFace(x, q.z, x * 0.6, 0) + (hash1(x * 3) - 0.5) * 30 }, [1]); }

    // 4. the free kick: referee, taker, wall, keeper, two more players
    const K = SND.kick, W = SND.whistle;
    add({ id: 'ref', look: 'sndRef', path: [[0, W.x, W.z]], states: [[0, 'idle'], [W.t - 0.25, 'sndWhistle'], [W.t + 0.9, 'sndPoint'], [W.t + 2.2, 'look']], face: sndFace(W.x, W.z, K.x, K.z) }, [3]);
    const bx = K.x - 0.55, bz = K.z - 0.15;
    add({ id: 'taker', look: 'sndHome', path: [[0, bx - 4.6, bz - 2.2], [K.t - 1.0, bx - 4.6, bz - 2.2], [K.t, bx, bz], [K.t + 0.6, bx + 1.4, bz + 0.3], [SND_BALL.tGoal + 0.5, bx + 2.2, bz + 0.2], [SND.cuts[3], bx + 13, bz - 16]],
      states: [[0, 'idle'], [K.t - 1.0, 'jog'], [K.t - 0.1, 'sndKick'], [SND_BALL.tGoal + 0.5, 'sndCelebrate']], stride: 1.9 }, [3]);
    for (let i = 0; i < 4; i++) add({ id: 'wall' + i, look: i % 2 ? 'sndAway' : 'sndAway2', path: [[0, 39.3, -2.9 + i * 0.55]], states: [[0, 'sndWall'], [SND_BALL.tGoal + 0.3, 'look']], face: sndFace(39.3, -2.2, K.x, K.z) }, [3],
      (t) => { const u = t - K.t - 0.02 - i * 0.03; return u > 0 && u < 0.55 ? 0.42 * Math.sin(Math.PI * u / 0.55) : 0; });
    add({ id: 'keeper', look: 'sndKeeperL', path: [[0, 52.0, 0.3], [K.t + 0.12, 52.0, 0.4], [K.t + 0.5, 51.9, 2.1]], states: [[0, 'sndKeeper'], [K.t + 0.12, 'sndDive'], [K.t + 2.2, 'look']], face: sndFace(52, 0.3, K.x, K.z) }, [3]);
    add({ id: 'p1', look: 'sndHome2', path: [[0, 39.5, 7.5], [K.t, 39.5, 7.5], [K.t + 1.2, 42.2, 8.5]], states: [[0, 'idle'], [K.t, 'jog'], [K.t + 1.2, 'sndCelebrate']], face: sndFace(39.5, 7.5, K.x, K.z) }, [3]);
    add({ id: 'p2', look: 'sndAway', path: [[0, 41.2, -6.8]], states: [[0, 'idle'], [SND_BALL.tGoal + 0.3, 'look']], face: sndFace(41.2, -6.8, K.x, K.z) }, [3]);

    // (shot 4: the fans just below you in the main stand; they leap up the moment they SEE the goal)
    for (const [r, x, look] of [[12, 36.5, 'sndFanA'], [10, 37.6, 'sndFanE'], [8, 36.4, 'sndFanB'], [6, 39.0, 'sndFanC'], [4, 36.8, 'sndFanE'], [3, 38.4, 'sndFanD']]) {
      const q = sndSideSeat(1, r, x), tc = SND_BALL.tGoal + 0.2 + hash1(x * 3 + r) * 0.2;
      add({ id: 'k' + r, look, y: q.y, path: [[0, x, q.z - 0.1]], states: [[0, 'sndWatch'], [tc, 'sndCheer']], face: sndFace(x, q.z, 42, 0) + (hash1(r * 7) - 0.5) * 16 }, [3],
        (t) => { const u = t - tc; return u > 0 && u < 2.6 ? 0.22 * Math.pow(Math.abs(Math.sin(u * (6.2 + r * 0.1))), 1.5) * (1 - MathX.smooth(u, 1.8, 2.6)) : 0; });
    }

    // 5. the drummer (row 13 of the far stand), with the drum, and a flag waved beside them
    const Dq = sndSideSeat(-1, SND.drum.row, SND.drum.x);
    this.drummer = add({ id: 'drummer', look: 'sndFanA', y: Dq.y, path: [[0, SND.drum.x, Dq.z + 0.1]], states: [[0, 'sndWatch'], [SND.drum.t0 - 0.5, 'sndDrum']], face: 180 }, [4]);
    { const g = new THREE.Group(), shell = Mat.std('#1f2f52', { roughness: 0.5 }), skin = Mat.std('#efe9da', { roughness: 0.7 });
      g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.34, 20), shell));
      for (const y of [-0.175, 0.175]) { const k = new THREE.Mesh(new THREE.CircleGeometry(0.4, 20), skin); k.rotation.x = y > 0 ? -Math.PI / 2 : Math.PI / 2; k.position.y = y; g.add(k); }
      g.position.set(SND.drum.x + 0.12, Dq.y + 0.95, Dq.z + 0.48); g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); scene.add(g); this.drum = g; }
    { const q = sndSideSeat(-1, SND.drum.row + 1, SND.drum.x + 1.9);
      add({ id: 'flagger', look: 'sndFanE', y: q.y, path: [[0, SND.drum.x + 1.9, q.z + 0.1]], states: [[0, 'sndWatch']], face: 180 }, [4]);
      this.flag = this._flag(scene, SND.drum.x + 2.2, q.y + 1.5, q.z + 0.2); }

    // 6. your neighbours in the stand (rows 10–12), and the players on the pitch
    // (the view runs out over x ≈ 5.9 in rows 10–11: nobody stands right on it, the nearest heads frame its lower corners)
    for (const [r, x, look] of [[11, 4.55, 'sndFanA'], [11, 5.25, 'sndFanC'], [11, 6.6, 'sndFanE'], [11, 7.35, 'sndFanD'], [10, 4.4, 'sndFanD'], [10, 5.2, 'sndFanE'], [10, 6.6, 'sndFanA'], [10, 7.4, 'sndFanC'], [12, 4.9, 'sndFanD'], [12, 7.1, 'sndFanB']]) {
      const q = sndSideSeat(1, r, x), tT = sndThunderAt({ x, y: q.y + 1.6, z: q.z }) + 0.04 + hash1(x * 31) * 0.05;
      add({ id: 'me' + r + '_' + x, look, y: q.y, path: [[0, x, q.z - 0.1]], states: [[0, 'sndWatch'], [tT, 'sndDuck']], face: sndFace(x, q.z, x * 0.3, -10) + (hash1(x * 7) - 0.5) * 24 }, [5]);
    }
    // stewards along the near touchline, facing the crowd: the last people the front passes before it reaches you
    for (const [id, look, x] of [['s1', 'sndSteward', -15.5], ['s2', 'sndSteward2', -4.5], ['s3', 'sndSteward', 3.0], ['s4', 'sndSteward2', 12.5]]) {
      const z = 35.7, tT = sndThunderAt({ x, y: 1.6, z }) + 0.05 + hash1(x * 5) * 0.05;
      add({ id: 'st' + id, look, path: [[0, x, z]], states: [[0, 'idle'], [tT, 'sndDuck'], [tT + 3.4, 'look']], face: sndFace(x, z, x * 0.8, z + 12) }, [5]);
    }
    const pl = [['h1', 'sndHome', -12, 4], ['h2', 'sndHome2', 6, -14], ['h3', 'sndHome', 18, 9], ['h4', 'sndHome2', -24, -18], ['a1', 'sndAway', -6, -6], ['a2', 'sndAway2', 12, 2], ['a3', 'sndAway', -18, 12], ['a4', 'sndAway2', 26, -10], ['rf', 'sndRef', 2, 6]];
    for (const [id, look, x, z] of pl) {
      // they walk with the play (slowly toward the ball, at the centre) and duck when the thunder reaches them
      const t0 = SND.cuts[4], tT = sndThunderAt({ x, y: 1.6, z }) + 0.06 + hash1(x * 13 + z) * 0.06;
      add({ id: 'pl' + id, look, path: [[t0, x, z], [tT, x * 0.85, z * 0.85]], states: [[0, 'walk'], [tT, 'sndDuck'], [tT + 3.4, 'look']], stride: 1.3 }, [5]);
    }

    // the ball
    { const g = new THREE.IcosahedronGeometry(0.11, 1), n = g.attributes.position.count, col = new Float32Array(n * 3);
      for (let i = 0; i < n; i += 3) { const dark = hash1(i * 7 + 3) < 0.22; for (let k = 0; k < 3; k++) col.set(dark ? [0.05, 0.05, 0.06] : [0.92, 0.92, 0.9], (i + k) * 3); }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      this.ball = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45, flatShading: true }));
      this.ball.castShadow = true; scene.add(this.ball); }
    this.shadows = new BlobShadows(scene, 96);
  }

  _flag(scene, x, y, z) {
    const geo = new THREE.PlaneGeometry(2.4, 1.5, 12, 4); geo.translate(1.2, 0, 0);
    const c = Tex.canvas(256, 160), q = c.getContext('2d');
    q.fillStyle = '#e2b82e'; q.fillRect(0, 0, 256, 160); q.fillStyle = '#1f2f52'; q.fillRect(0, 54, 256, 52);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: Tex.tex(c, { repeat: false }), side: THREE.DoubleSide, roughness: 0.8 }));
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.6, 6), Mat.std('#8a8478', { roughness: 0.5 }));
    const g = new THREE.Group(); pole.position.set(0, 0.6, 0); m.position.set(0, 1.2, 0); g.add(pole, m); g.position.set(x, y, z);
    scene.add(g);
    return { g, m, base: Float32Array.from(geo.attributes.position.array) };
  }

  update(t) {
    const shot = sndShotAt(t), B = this.shadows;
    B.begin();
    for (const it of this.list) {
      const on = it.shots.includes(shot);
      it.p.root.visible = on;
      if (!on) continue;
      it.p.update(t);
      if (it.lift) { it.p.root.position.y += it.lift(t); it.p.root.updateMatrixWorld(true); }
      const q = it.p.root.position, gy = it.p.spec.y || 0, h = Math.max(0, q.y - gy);
      B.push(q.x, gy + 0.012, q.z, 0.55 * (1 + h), 0.45 * Math.max(0.2, 1 - h * 1.5));
    }
    // the ball (shot 4)
    this.ball.visible = shot === 3;
    if (this.ball.visible) {
      const b = sndBall(t), sp = sndBallV(t); this.ball.position.set(b.x, b.y, b.z);
      this.ball.rotation.set(t * 3.1, t * 17 * (sp > 0 ? 1 : 0), 0.4);
      B.push(b.x, 0.012, b.z, 0.32, 0.5 * MathX.clamp(1 - b.y / 3, 0, 1));
    }
    B.end();
    this.drum.visible = this.flag.g.visible = shot === 4;
    if (this.flag.g.visible) {
      const pos = this.flag.m.geometry.attributes.position, b = this.flag.base;
      for (let i = 0; i < pos.count; i++) { const x = b[i * 3], y = b[i * 3 + 1]; pos.setZ(i, x * (0.18 * Math.sin(x * 2.2 - t * 6.5) + 0.06 * Math.sin(y * 3 + t * 4))); }
      pos.needsUpdate = true;
      this.flag.g.rotation.z = 0.25 * Math.sin(t * 1.6) + 0.15;
    }
  }
}
