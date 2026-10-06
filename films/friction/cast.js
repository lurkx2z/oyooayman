/* =====================================================================
   CAST — the friction film's pedestrians: the shared adult rig and looks
   (js/world/people.js) with new actions for a world without friction —
   feet shooting out, sliding on your back / knees / side, the splits,
   arms flailing for balance, hugging a pole and sliding down it.
   Where each person is comes from the simulation; what they do comes
   from FR_STATES below (seconds → action).
   ===================================================================== */

const FR_STATES = {
  W1: [[0, 'walk'], [3.15, 'slipBack'], [3.85, 'slideBack']],
  W2: [[0, 'walk'], [3.4, 'windmill'], [3.95, 'dropKnees'], [4.45, 'crawlSlide']],
  W3: [[0, 'waitPhone'], [3.1, 'freeze'], [6.2, 'tryStep'], [6.75, 'splits'], [7.7, 'hugSlide'], [8.9, 'hugSit']],
  J: [[0, 'jog'], [3.3, 'jogFall'], [3.85, 'slideSide']],
  W5: [[0, 'look'], [3.2, 'freeze'], [9.0, 'tryStep'], [9.55, 'slipBack'], [10.25, 'slideBack']],
  W6: [[0, 'idle'], [3.25, 'freeze'], [3.4, 'hugPole']],
  W7: [[0, 'idle'], [3.3, 'freeze']],
};

(() => {
  const P0 = () => basePose();
  const arms = (p, l, r, le, re) => { p.lSh = l; p.rSh = r; p.lEl = le; p.rEl = re; };
  Object.assign(ACTIONS, {
    waitPhone(τ, c) { const p = ACTIONS.phone(τ, c); return p; },
    // standing very still, knees soft, arms a little out: afraid to move
    freeze(τ, c) {
      const p = P0(), w = Math.sin(τ * 1.7 + c.seed * 5);
      p.lKnee = p.rKnee = 0.22; p.hipY = 0.9; p.spine = 0.12; p.neck = 0.25 + 0.05 * Math.sin(τ * 0.9);
      arms(p, [0.35, 0.55 + 0.05 * w], [0.35, 0.55 - 0.05 * w], 0.55, 0.55);
      p.headYaw = noise1(τ * 0.8, c.seedI) * 0.6; p.spineRoll = w * 0.03;
      p.lHip = [0, 0.12]; p.rHip = [0, 0.12];
      return p;
    },
    // a foot goes out and skates away, both arms fly out; repeated small attempts
    tryStep(τ, c) {
      const p = ACTIONS.freeze(τ, c), k = Math.sin(Math.min(1, τ / 0.5) * Math.PI);
      p.rHip = [0.55 * k, 0.12 + 0.35 * k]; p.rKnee = 0.1; p.hipY = 0.9 - 0.08 * k;
      arms(p, [0.6, 1.1 * k + 0.5], [0.8, 1.3 * k + 0.5], 0.4, 0.3);
      p.spine = 0.12 - 0.2 * k; p.spineRoll = -0.15 * k;
      return p;
    },
    // feet shoot forward: falls flat on the back (0.7 s), arms up
    slipBack(τ, c) {
      const k = Math.min(1, τ / 0.62), e = k * k, p = P0();
      p.lHip = [0.2 + 1.2 * e + 0.5 * Math.sin(k * Math.PI), 0.08]; p.rHip = [0.2 + 1.0 * e, 0.12];
      p.lKnee = 0.25 * (1 - e) + 0.35 * e; p.rKnee = 0.45 * (1 - e) + 0.5 * e;
      p.hipY = MathX.lerp(0.93, 0.14, e); p.pelvisPitch = -1.45 * e;
      p.spine = 0.25 * Math.sin(k * Math.PI) + 0.35 * e; p.neck = 0.2 + 0.35 * e;
      arms(p, [0.45 + 0.35 * Math.sin(k * 5) * (1 - e) + 0.15 * e, 1.05 + 0.25 * e], [0.35 + 0.35 * Math.sin(k * 5 + 1) * (1 - e) + 0.15 * e, 1.1 + 0.25 * e], 0.35, 0.4);   // arms flung out to the sides, bracing
      if (τ > 0.62) { const b = Math.exp(-(τ - 0.62) / 0.12) * Math.sin((τ - 0.62) * 30); p.spine += 0.1 * b; p.neck += 0.15 * b; }
      return p;
    },
    // gliding on the back: head up, arms out paddling, legs bent; small wriggles
    slideBack(τ, c) {
      const p = P0(), a = Math.sin(τ * 2.1 + c.seed * 7), b = Math.sin(τ * 1.4 + c.seed * 3);
      p.hipY = 0.14; p.pelvisPitch = -1.45;
      p.spine = 0.42 + 0.08 * b; p.neck = 0.45 + 0.08 * a; p.headYaw = noise1(τ * 0.6, c.seedI) * 0.6;
      p.lHip = [1.35 + 0.15 * a, 0.18]; p.rHip = [1.15 - 0.12 * a, 0.2]; p.lKnee = 0.55 + 0.2 * a; p.rKnee = 0.8 - 0.15 * a;
      arms(p, [0.75 + 0.3 * a, 1.1 + 0.15 * b], [0.7 - 0.3 * a, 1.05 - 0.15 * b], 0.5, 0.45);
      return p;
    },
    // arms windmilling, knees pumping, then over
    windmill(τ, c) {
      const p = P0(), w = τ * 13;
      p.lSh = [1.5 + 1.3 * Math.sin(w), 0.6]; p.rSh = [1.5 + 1.3 * Math.sin(w + 2), 0.6]; p.lEl = 0.3; p.rEl = 0.3;
      p.lHip = [0.35 * Math.sin(w * 0.8), 0.15]; p.rHip = [-0.35 * Math.sin(w * 0.8), 0.15]; p.lKnee = p.rKnee = 0.3;
      p.spine = 0.15 + 0.25 * Math.min(1, τ / 0.5); p.spineRoll = 0.2 * Math.sin(w * 0.5); p.hipY = 0.88; p.neck = 0.2;
      return p;
    },
    dropKnees(τ, c) {
      const k = Ease.inQuad(Math.min(1, τ / 0.45)), p = P0();
      p.hipY = MathX.lerp(0.88, 0.5, k); p.lHip = [0.35 * (1 - k) + 0.05 * k, 0.1]; p.rHip = [0.15 * (1 - k), 0.1];
      p.lKnee = p.rKnee = MathX.lerp(0.3, 1.62, k); p.lFoot = p.rFoot = 0.5 * k;
      p.spine = MathX.lerp(0.4, 1.0, k); p.neck = MathX.lerp(0.2, -0.45, k);
      arms(p, [MathX.lerp(1.6, 1.15, k), 0.25], [MathX.lerp(1.4, 1.15, k), 0.25], 0.15, 0.15);
      return p;
    },
    // on hands and knees, sliding: hands splayed, looking ahead
    crawlSlide(τ, c) {
      const p = P0(), a = Math.sin(τ * 1.8 + c.seed * 4);
      p.hipY = 0.57; p.lHip = [0.12, 0.16]; p.rHip = [0.1, 0.16]; p.lKnee = p.rKnee = 1.5; p.lFoot = p.rFoot = 0.5;
      p.spine = 1.05 + 0.04 * a; p.neck = -0.5; p.headYaw = noise1(τ * 0.5, c.seedI) * 0.5;
      arms(p, [1.15 + 0.08 * a, 0.35], [1.15 - 0.08 * a, 0.35], 0.1, 0.12);
      return p;
    },
    jogFall(τ, c) {
      const k = Math.min(1, τ / 0.55), e = k * k, p = ACTIONS.jog(τ, c);
      const L = ACTIONS.slideSide(0, c);
      const q = lerpPose(p, L, e);
      q.lSh = [1.4 * Math.sin(k * Math.PI) + L.lSh[0] * e, 0.8 * Math.sin(k * Math.PI) + L.lSh[1] * e];
      return q;
    },
    // gliding on the side (the rig's 'lie' pose), one arm up shielding the head
    slideSide(τ, c) {
      const p = ACTIONS.lie(τ, c), a = Math.sin(τ * 1.6 + c.seed * 4);
      p.lSh = [1.9 + 0.1 * a, 0.25]; p.lEl = 1.6; p.rSh = [0.9, 0.2]; p.rEl = 0.5; p.neck = 0.35 + 0.05 * a;
      return p;
    },
    // legs skating apart, arms reaching for the mast in front
    splits(τ, c) {
      const k = Ease.inOutSine(Math.min(1, τ / 0.9)), p = P0();
      p.lHip = [0.1, 0.12 + 0.75 * k]; p.rHip = [-0.05, 0.12 + 0.7 * k]; p.lKnee = p.rKnee = 0.1;
      p.hipY = MathX.lerp(0.9, 0.52, k); p.spine = 0.35 * k; p.neck = 0.1;
      arms(p, [1.3 + 0.3 * k, 0.2 - 0.2 * k], [1.35 + 0.25 * k, 0.15 - 0.2 * k], 0.6, 0.65);
      return p;
    },
    // hugging the pole, sliding down it, then sitting at its foot still hugging
    hugSlide(τ, c) {
      const k = Ease.inOutSine(Math.min(1, τ / 1.1)), p = ACTIONS.splits(0.9, c);
      p.hipY = MathX.lerp(0.52, 0.16, k); p.lHip = [MathX.lerp(0.1, 1.5, k), MathX.lerp(0.87, 0.4, k)]; p.rHip = [MathX.lerp(-0.05, 1.4, k), MathX.lerp(0.82, 0.35, k)];
      p.lKnee = p.rKnee = MathX.lerp(0.1, 0.9, k); p.spine = MathX.lerp(0.35, 0.25, k);
      arms(p, [MathX.lerp(1.6, 1.25, k), -0.15], [MathX.lerp(1.6, 1.25, k), -0.15], 1.25, 1.25);
      return p;
    },
    hugSit(τ, c) {
      const p = ACTIONS.hugSlide(2, c), b = Math.sin(τ * 1.5 + c.seed * 3);
      p.neck = 0.2 + 0.1 * b; p.headYaw = noise1(τ * 0.5, c.seedI) * 0.7; p.spine += 0.03 * b;
      return p;
    },
    hugPole(τ, c) {
      const p = P0(), b = Math.sin(τ * 1.3 + c.seed * 3);
      p.lKnee = p.rKnee = 0.3; p.hipY = 0.88; p.spine = 0.25; p.neck = 0.1; p.headYaw = noise1(τ * 0.6, c.seedI) * 0.8;
      arms(p, [1.3, -0.2 + 0.03 * b], [1.3, -0.2 - 0.03 * b], 1.3, 1.3);
      p.lHip = [0.05, 0.14]; p.rHip = [-0.05, 0.14];
      return p;
    },
  });
  Object.assign(BLEND, { freeze: 0.5, tryStep: 0.15, slipBack: 0.08, slideBack: 0.2, windmill: 0.12, dropKnees: 0.1, crawlSlide: 0.15, jogFall: 0.1, slideSide: 0.15, splits: 0.25, hugSlide: 0.2, hugSit: 0.3, hugPole: 0.4, waitPhone: 0.5 });
})();

class FrictionCast {
  constructor(scene, world) {
    this.world = world;
    this.people = FR_PEOPLE.map(([id, look, , , , speed]) => {
      const p = new Person({ id, look, states: (FR_STATES[id] || [[0, 'idle']]).map(([t, a]) => [Math.max(0, t - FR.shift), a]) }, scene);   // (authored on the scenario clock)
      p.speed = speed;
      if (id === 'W3' || id === 'W7') { const ph = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.145, 0.009), Mat.std('#1a1c20', { roughness: 0.3 })); ph.position.set(0, -0.06, 0.04); ph.rotation.x = -0.4; p.j.ra.hand.add(ph); }
      return p;
    });
    this.byId = Object.fromEntries(this.people.map((p) => [p.spec.id, p]));
    this.blobs = new BlobShadows(scene, this.people.length * 3);
    this._v = new THREE.Vector3(); this._s = {};
  }

  update(t) {
    const W = this.world, s = this._s;
    this.blobs.begin();
    for (const p of this.people) {
      W.sample(p.spec.id, t, s);
      const y = FrGround.h(s.x, s.z);
      p.root.position.set(s.x, y, s.z);
      p.root.rotation.set(0, Math.PI + s.yaw, 0);
      // walking / jogging stride from the distance covered before the fall
      const ctx = { seed: p.seed, seedI: p.seedI, walkPhase: (p.speed * Math.min(t + FR.shift, 3.4) / (p.speed > 2 ? 2.4 : 1.32)) * Math.PI * 2 };
      p.apply(p.poseAt(t, ctx));
      // friction returns: still sliding, they catch on the ground and tumble over once the way they were going
      if (t > FR.tBack) {
        if (p.tumble === undefined) { const s0 = W.sample(p.spec.id, FR.tBack - 0.01); p.tumble = s0.speed > 0.8 ? { dir: Math.atan2(s0.vx, s0.vz), v: s0.speed } : null; }
        if (p.tumble) { const u = MathX.clamp((t - FR.tBack) / 0.7, 0, 1), a = (u < 1 ? 1 - (1 - u) * (1 - u) : 1) * Math.PI * 2 * Math.min(1, p.tumble.v / 2.2);
          this._ax = this._ax || new THREE.Vector3(); this._ax.set(Math.cos(p.tumble.dir), 0, -Math.sin(p.tumble.dir));
          p.root.position.y += 0.35 * Math.sin(Math.min(1, u) * Math.PI); p.root.rotateOnWorldAxis(this._ax, a); }
      }
      p.root.updateMatrixWorld(true);
      for (const [part, r] of [['hips', 0.42], ['neck', 0.34], ['head', 0.22]]) {
        const w = p.worldOf(part, this._v), k = MathX.clamp(1 - (w.y - y) / 1.4, 0, 1);
        if (k > 0.02) this.blobs.push(w.x, y + 0.012, w.z, r * (1.4 - k * 0.5), 0.5 * k);
      }
    }
    this.blobs.end();
  }
}
