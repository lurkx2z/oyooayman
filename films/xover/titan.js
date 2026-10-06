/* =====================================================================
   THE ATTACK TITAN — 15 m. A sculpted low-poly giant built from
   overlapping faceted muscle forms on the same joint layout as the
   people rig (hips, spine, neck, head, arms, legs), so the shared
   ACTIONS and the titan's own (stomp, punch, grab, throw, roar) pose it.
   Head: long skull, heavy brow over glowing green eyes, angular cheeks,
   no lips — teeth bared across the jaw, a jaw that opens to roar —
   pointed ears, a long dark mane. Steam vents from the skin.
   ===================================================================== */

const XT = { hipY: 7.0, scale: 1 };

// faceted ellipsoid (radius 1 scaled), optionally subdivided for big close-up forms
function xBall(rx, ry, rz, detail = 1) { const g = new THREE.IcosahedronGeometry(1, detail); g.scale(rx, ry, rz); return g; }
// a tapered capsule-like loft along −Y from 0 to −len: rings [t (0..1), rx, rz, xoff, zoff]
function xLimb(len, rings, sides = 9) {
  return loftGeo(rings.map(([t, rx, rz, xo = 0, zo = 0]) => [-t * len, rx, rz, zo]).reverse(), sides);   // (rings must rise for the faces to point out)
}

class XTitan {
  constructor(scene, opts = {}) {
    this.scene = scene;
    const skinC = opts.skin || '#a8745a';
    this.mSkin = new THREE.MeshStandardMaterial({ color: skinC, roughness: 0.72, flatShading: true, name: 'titanSkin' });
    this.mSkinDk = new THREE.MeshStandardMaterial({ color: new THREE.Color(skinC).multiplyScalar(0.72), roughness: 0.8, flatShading: true, name: 'titanSkinDk' });
    this.mHair = new THREE.MeshStandardMaterial({ color: '#1f1712', roughness: 0.85, flatShading: true, name: 'titanHair' });
    this.mTeeth = new THREE.MeshStandardMaterial({ color: '#e6dcc4', roughness: 0.45, name: 'titanTeeth' });
    this.mGum = new THREE.MeshStandardMaterial({ color: '#4a1a16', roughness: 0.7, name: 'titanGum' });
    this.mEye = new THREE.MeshStandardMaterial({ color: '#0b1a10', emissive: '#7dffa8', emissiveIntensity: 2.2, roughness: 0.2, name: 'titanEye' });
    this.mNail = new THREE.MeshStandardMaterial({ color: '#c9a48c', roughness: 0.5, flatShading: true });
    // the heat of the transformation: a warm glow in the skin that fades
    this.heat = 0;
    for (const m of [this.mSkin, this.mSkinDk]) { m.emissive = new THREE.Color('#ff7a2a'); m.emissiveIntensity = 0; }
    this._build();
    scene.add(this.root);
  }

  _m(g, m, parent, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
    const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o;
  }

  _build() {
    const S = this.mSkin, D = this.mSkinDk, add = this._m.bind(this);
    const root = new THREE.Group(); root.name = 'titan';
    const body = new THREE.Group(); root.add(body);
    const hips = new THREE.Group(); hips.position.y = XT.hipY; body.add(hips);
    // pelvis
    add(loftGeo([[-0.95, 1.2, 0.85], [-0.2, 1.32, 0.9], [0.5, 1.08, 0.8]], 12), S, hips);
    for (const s of [-1, 1]) add(xBall(0.62, 0.7, 0.55), D, hips, s * 0.5, -0.4, -0.42);              // glutes
    // torso (spine): waist → ribcage → chest → shoulder line → traps
    const spine = new THREE.Group(); spine.position.y = 0.45; hips.add(spine);
    add(loftGeo([[0, 1.02, 0.74], [1.2, 1.12, 0.8], [2.4, 1.48, 0.95], [3.35, 1.72, 1.0, 0.05], [3.95, 1.85, 0.86], [4.45, 0.75, 0.55]], 14), S, spine);
    for (const s of [-1, 1]) {
      add(xBall(0.86, 0.6, 0.38, 1), S, spine, s * 0.74, 3.25, 0.72, 0.15, s * 0.18, s * -0.12);      // pecs
      add(xBall(0.7, 0.95, 0.45), D, spine, s * 1.25, 2.35, -0.25, 0, 0, s * 0.18);                  // lats
      add(xBall(0.38, 0.55, 0.3), S, spine, s * 1.12, 1.55, 0.35, 0, 0, s * -0.25);                  // obliques / serratus
      add(xBall(0.62, 0.42, 0.42), S, spine, s * 0.62, 4.28, -0.22, 0.3, 0, s * 0.35);               // traps
      for (let r = 0; r < 3; r++) add(xBall(0.25, 0.24, 0.12), S, spine, s * 0.27, 0.72 + r * 0.52, 0.68 + r * 0.02);   // abs
    }
    add(xBall(0.95, 1.6, 0.35), D, spine, 0, 2.4, -0.75);                                             // the back's spine groove
    // neck and head
    const neck = new THREE.Group(); neck.position.y = 4.35; spine.add(neck);
    add(loftGeo([[0, 0.62, 0.58], [0.45, 0.52, 0.5], [0.75, 0.48, 0.46]], 10), S, neck);
    for (const s of [-1, 1]) add(xBall(0.18, 0.62, 0.18), D, neck, s * 0.3, 0.42, 0.25, -0.35, 0, s * 0.35);   // sternocleidomastoids
    const head = new THREE.Group(); head.position.y = 0.85; neck.add(head);
    this._head(head);
    // arms: deltoid, biceps, triceps on the upper arm; a heavy forearm; a huge hand
    const arm = (side) => {
      const sh = new THREE.Group(); sh.position.set(side * 1.95, 3.85, -0.05); spine.add(sh);
      add(xBall(0.78, 0.72, 0.72, 1), S, sh, side * 0.12, 0.05, 0);                                 // deltoid
      add(xLimb(3.1, [[0, 0.55, 0.58], [0.45, 0.6, 0.62], [1, 0.42, 0.44]]), S, sh);
      add(xBall(0.42, 0.95, 0.4), S, sh, 0, -1.4, 0.32);                                             // biceps
      add(xBall(0.42, 1.0, 0.42), D, sh, 0, -1.25, -0.3);                                            // triceps
      const el = new THREE.Group(); el.position.y = -3.1; sh.add(el);
      add(xBall(0.45, 0.45, 0.45), D, el);
      add(xLimb(2.9, [[0, 0.5, 0.5], [0.3, 0.55, 0.5], [1, 0.3, 0.26]]), S, el);
      add(xBall(0.38, 0.85, 0.36), S, el, side * 0.12, -0.75, 0.12);                                 // forearm flexors
      const hand = new THREE.Group(); hand.position.y = -2.9; el.add(hand);
      const hg = new THREE.Group(); hg.scale.setScalar(10.5); hand.add(hg);
      const H = new HeroHand(hg, side, S);
      return { sh, el, hand, H };
    };
    // legs: quads and hamstrings; knee; calves; bare feet with toes
    const leg = (side) => {
      const hp = new THREE.Group(); hp.position.set(side * 0.78, -0.3, 0); hips.add(hp);
      add(xLimb(3.5, [[0, 0.98, 1.0], [0.35, 0.95, 0.98], [1, 0.55, 0.58]]), S, hp);
      add(xBall(0.68, 1.5, 0.52), S, hp, side * 0.1, -1.45, 0.42);                                   // quads
      add(xBall(0.42, 1.2, 0.45), D, hp, side * 0.36, -1.6, 0.1);                                    // vastus lateralis
      add(xBall(0.5, 1.3, 0.45), D, hp, 0, -1.5, -0.42);                                             // hamstrings
      const kn = new THREE.Group(); kn.position.y = -3.5; hp.add(kn);
      add(xBall(0.48, 0.48, 0.5), D, kn, 0, 0, 0.08);
      add(xLimb(3.25, [[0, 0.58, 0.6], [0.25, 0.64, 0.72], [1, 0.34, 0.36]]), S, kn);
      add(xBall(0.5, 1.05, 0.5), S, kn, 0, -0.95, -0.36);                                            // calves
      const ft = new THREE.Group(); ft.position.y = -3.22; kn.add(ft);
      add(loftZ([[-0.45, 0.32, 0.25, 0.1], [0.0, 0.42, 0.24, 0.12], [0.55, 0.48, 0.14, 0.18], [0.85, 0.45, 0.1, 0.2]], 9), S, ft);
      for (let i = 0; i < 5; i++) { const x = (i - 2) * 0.18 + side * 0.04; const t = add(new THREE.CapsuleGeometry(0.075 + (i === 2 - side * 2 ? 0.03 : 0), 0.16, 3, 6), S, ft, x, -0.18, 0.98 - Math.abs(i - 2) * 0.06); t.rotation.x = Math.PI / 2; }
      return { hp, kn, ft };
    };
    const la = arm(1), ra = arm(-1), ll = leg(1), rl = leg(-1);
    this.root = root;
    this.j = { body, hips, spine, neck, head, la, ra, ll, rl };
  }

  _head(head) {
    const S = this.mSkin, D = this.mSkinDk, add = this._m.bind(this);
    // skull: long, narrow at the jaw; a heavy brow; hollow cheeks; angular cheekbones
    add(xBall(0.58, 0.85, 0.66, 2), S, head, 0, 0.25, -0.05);
    add(xBall(0.6, 0.16, 0.28), D, head, 0, 0.43, 0.48, -0.25);                                       // brow ridge
    for (const s of [-1, 1]) {
      add(xBall(0.2, 0.12, 0.12), D, head, s * 0.24, 0.2, 0.55);                                       // eye socket shadow
      const eye = add(new THREE.SphereGeometry(0.075, 14, 10), this.mEye, head, s * 0.24, 0.21, 0.6); eye.castShadow = false;
      add(xBall(0.13, 0.1, 0.14), S, head, s * 0.38, -0.02, 0.42, 0, s * 0.3);                        // cheekbones (gaunt)
      add(xBall(0.1, 0.24, 0.16), D, head, s * 0.34, -0.3, 0.28, 0, s * 0.25);                        // hollow cheeks
      add(new THREE.ConeGeometry(0.12, 0.42, 4), S, head, s * 0.6, 0.22, -0.05, 0, 0, -s * 1.15);    // pointed ears
    }
    add(new THREE.ConeGeometry(0.11, 0.36, 4), S, head, 0, 0.06, 0.66, -1.35, Math.PI / 4);           // nose
    // the mouth: no lips — two rows of teeth that run back along the jaw; the lower jaw opens
    const upper = new THREE.Group(); upper.position.set(0, -0.22, 0.32); head.add(upper);
    add(xBall(0.42, 0.12, 0.32), this.mGum, upper, 0, 0.0, -0.02);
    const jaw = new THREE.Group(); jaw.position.set(0, -0.12, -0.15); head.add(jaw); this.jaw = jaw;
    add(xBall(0.36, 0.22, 0.48), S, jaw, 0, -0.22, 0.25);                                             // the jaw itself
    add(xBall(0.38, 0.1, 0.3), this.mGum, jaw, 0, -0.14, 0.42);
    const teeth = (parent, y, down, z0) => {
      for (let i = -7; i <= 7; i++) {
        const a = i / 7 * 1.25, r = 0.36, x = Math.sin(a) * r, z = z0 + Math.cos(a) * 0.3 - 0.3;
        const tw = 0.06 - Math.abs(i) * 0.002, th = 0.13 - Math.abs(i) * 0.004;
        const t = add(new THREE.BoxGeometry(tw, th, 0.05), this.mTeeth, parent, x, y + (down ? -th / 2 : th / 2), z); t.rotation.y = a;
      }
    };
    teeth(upper, -0.08, true, 0.3); teeth(jaw, -0.06, false, 0.72);
    // cheek ridges: the Attack Titan's mouth runs back along the cheeks
    for (const s of [-1, 1]) add(xBall(0.04, 0.03, 0.24), this.mGum, head, s * 0.4, -0.24, 0.15, 0, s * 0.7);
    // hair: a dark cap and a long ragged mane to the shoulders, strands in front of the ears
    const cap = add(xBall(0.62, 0.52, 0.66, 1), this.mHair, head, 0, 0.66, -0.2); cap.rotation.x = -0.35;
    const rng = new RNG(1717);
    for (let i = 0; i < 64; i++) {
      // ragged strands from the crown round the back and sides, falling past the jaw to the shoulders; none over the face
      const a = Math.PI * (0.42 + 1.16 * rng.next()) * (rng.chance(0.5) ? 1 : -1), len = rng.range(1.1, 2.0), w = rng.range(0.07, 0.13);
      const g = new THREE.ConeGeometry(w, len, 4); g.translate(0, -len / 2, 0);
      const st = add(g, this.mHair, head, Math.sin(a) * rng.range(0.5, 0.62), rng.range(0.55, 0.85), Math.cos(a) * rng.range(0.5, 0.62) - 0.18);
      st.rotation.set(Math.cos(a) * rng.range(0.1, 0.35) + 0.1, a, -Math.sin(a) * rng.range(0.1, 0.3));
      st.scale.set(1, 1, 0.5);
    }
    this.headG = head;
  }

  // a pose from ACTIONS (human-scale angles; hip height scaled to the titan)
  apply(P, jawOpen = 0) {
    const j = this.j;
    j.hips.position.set(P.rootX * 7.5, XT.hipY * (P.hipY / 0.93), P.rootZ * 7.5);
    j.hips.rotation.set(P.pelvisPitch, P.pelvisYaw, P.rootRoll);
    j.spine.rotation.set(P.spine, P.spineYaw, P.spineRoll);
    j.neck.rotation.set(P.neck * 0.4, P.headYaw * 0.4, 0);
    j.head.rotation.set(P.neck * 0.6, P.headYaw * 0.6, P.headRoll);
    j.la.sh.rotation.set(-P.lSh[0], 0, P.lSh[1]); j.ra.sh.rotation.set(-P.rSh[0], 0, -P.rSh[1]);
    j.la.el.rotation.x = -P.lEl; j.ra.el.rotation.x = -P.rEl;
    j.ll.hp.rotation.set(-P.lHip[0], 0, P.lHip[1]); j.rl.hp.rotation.set(-P.rHip[0], 0, -P.rHip[1]);
    j.ll.kn.rotation.x = P.lKnee; j.rl.kn.rotation.x = P.rKnee;
    j.ll.ft.rotation.x = P.lFoot; j.rl.ft.rotation.x = P.rFoot;
    this.jaw.rotation.x = 0.55 * jawOpen;
  }
  setHeat(k) { this.heat = k; for (const m of [this.mSkin, this.mSkinDk]) m.emissiveIntensity = 0.9 * k; this.mEye.emissiveIntensity = 2.2 + 3 * k; }
  worldOf(part, out) { return (this.j[part] || part).getWorldPosition(out); }
}

// the titan's own movements (human-scale pose angles; the rig scales them)
(() => {
  const P = basePose;
  Object.assign(ACTIONS, {
    tStand(τ, c) { const p = ACTIONS.idle(τ, c); p.spine = 0.08 + 0.02 * Math.sin(τ * 1.1); p.lSh = [0.1, 0.2]; p.rSh = [0.1, 0.2]; p.lEl = 0.35; p.rEl = 0.35; p.lKnee = 0.12; p.rKnee = 0.12; p.hipY = 0.9; p.headYaw *= 0.3; return p; },
    tWalk(τ, c) { const p = ACTIONS.walk(τ, c); p.spine = 0.14; p.lSh[1] = 0.22; p.rSh[1] = 0.22; p.lEl = 0.6; p.rEl = 0.6; p.hipY -= 0.02; return p; },
    tRoar(τ, c) { const p = ACTIONS.tStand(τ, c), k = Math.min(1, τ / 0.35); p.spine = 0.08 - 0.25 * k; p.neck = 0.04 - 0.45 * k; p.lSh = [0.35 * k, 0.6 * k]; p.rSh = [0.35 * k, 0.6 * k]; p.lEl = 0.9 * k; p.rEl = 0.9 * k; p.lKnee = 0.25; p.rKnee = 0.25; p.hipY = 0.86; return p; },
    tPunch(τ, c) { const p = ACTIONS.tStand(τ, c), w = MathX.smooth(τ, 0, 0.45), h = MathX.smooth(τ, 0.45, 0.62); p.spine = 0.1 + 0.25 * h - 0.1 * w * (1 - h); p.spineYaw = 0.35 * w - 0.75 * h;
      p.rSh = [MathX.lerp(0.2 + 0.5 * w, 1.45, h), 0.25]; p.rEl = MathX.lerp(1.9 * w, 0.1, h); p.lSh = [0.4, 0.3]; p.lEl = 1.2; p.lHip = [0.4 * h, 0.1]; p.lKnee = 0.4 * h; p.rKnee = 0.2; p.hipY = 0.88; return p; },
    tStomp(τ, c) { const p = ACTIONS.tStand(τ, c), up = MathX.smooth(τ, 0, 0.5) * (1 - MathX.smooth(τ, 0.55, 0.68)); p.rHip = [1.1 * up, 0.12]; p.rKnee = 1.2 * up; p.spine = 0.12 + 0.12 * up; p.lKnee = 0.18; p.hipY = 0.9; return p; },
    tGrab(τ, c) { const p = ACTIONS.tStand(τ, c), k = MathX.smooth(τ, 0, 0.5); p.spine = 0.1 + 0.75 * k; p.lHip = [0.55 * k, 0.15]; p.rHip = [0.2 * k, 0.15]; p.lKnee = 0.9 * k; p.rKnee = 0.5 * k; p.hipY = 0.93 - 0.2 * k;
      p.rSh = [1.1 * k, 0.25]; p.rEl = 0.35; p.lSh = [0.9 * k, 0.35]; p.lEl = 0.5; return p; },
    tThrow(τ, c) { const p = ACTIONS.tGrab(1, c), k = MathX.smooth(τ, 0, 0.3), r = MathX.smooth(τ, 0.3, 0.55); p.spine = MathX.lerp(0.85, -0.1, k); p.hipY = MathX.lerp(0.75, 0.9, k); p.spineYaw = -0.5 * r;
      p.rSh = [MathX.lerp(1.1, 2.6, k) - 1.2 * r, 0.3 + 0.4 * r]; p.lSh = [MathX.lerp(0.9, 2.4, k) - 1.0 * r, 0.4]; p.rEl = 0.25; p.lEl = 0.3; return p; },
  });
  Object.assign(BLEND, { tStand: 0.6, tWalk: 0.5, tRoar: 0.25, tPunch: 0.2, tStomp: 0.25, tGrab: 0.35, tThrow: 0.15 });
})();
