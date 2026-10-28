/* =====================================================================
   WORLD — the film's one set: your house (home.js), the street outside it (street.js), the people and the animals
   (cast.js), your first-person hands; a summer morning, 8:14 AM, the sun low in the east (down the hill). Every
   shot (shots.js) is a mode: it sets story time s from the shot's clock, poses everything with it (pure), and places
   the camera. The shot list, with what each one shows:
     open      through your eyes: the phone, the cat on the island, the coffee, your feet go, down, the oven handle
     floor     on the floor, holding on (the clock all but stopped)      teaser   the street from your doorstep
     flash     FLASH-FORWARD: s = 10, the bus going over                  atoms    the cat's paws on the boards
     apart     you on the floor, holding the handle                       push     the phone, sliding for the door
     fault     the street from above                                      replay   through your eyes again, 10× slower
     cat       low along the island: the cat lands, skids, takes the mug  mug      the floor: the mug lands, the pieces go
     reach     your eyes: the reach                                       feet     in front of you: your feet go
     slap      your eyes: the slap on the island, the skid               hook     your eyes: fingers over the handle
     catrun    low, side on: the cat running on the spot                  house    the front room to the kitchen (master)
     screws    inside a wall cabinet: a screw turning out                 cabinets the cabinets come down
     tv        the TV comes off the wall                                   curtains the front window's curtains come apart
     clothes   your eyes: lint drifting down; "let's not look down"       sugar    the sugar bowl
     street    the street from up the hill (master)                       brakes   alongside the braking car
     bike      ahead of the cyclist                                        laces    the man tying his laces at the bus stop
     walk      the walker and her dog                                      ladder   the window cleaner's ladder
     scaffold  the scaffold opposite                                       sand     the builders' sand
     slide     the street from up the hill                                 floor2   your house towards the front
     hill      across the street: the parked cars on the slope             same     moving with the hill: nothing moves
     realspeed the street from up the hill, at real speed                  faster   low at the kerb: the cars coming
     sofa      the front room: the sofa reaches the window                 bus      the bus, still turning; the crash
     phone2    your front step: the phone comes out of the door            warn / warn2   the street from high; the house
     count     the last 2.4 s: quick cuts                                  back     s = 10: the street from high
     stop      the walker tumbles                                          bus2     low: the bus goes over
     cat2      the cat onto the sofa                                       after / phone3 / question
   Layout: metres; the street runs along x, downhill to +x (east); your front wall is z = −8; north is −z.
   ===================================================================== */

// the sun: 8:14 AM in June, low in the east-south-east (down the hill), ~30° up (a unit vector towards it)
const FZ_SUN = fzN3([0.72, 0.55, 0.42]);

// ---------------------------------------------------------------------------------------------------------------------
// YOUR EYES: where they are and where they look (story time). [s, x, z, yaw, pitch, roll]; y comes from fzEyeY
// (yaw 0 looks down the room (−z), + turns left; the island is on your right, the oven on your left)
// ---------------------------------------------------------------------------------------------------------------------
const FZ_POV = [
  [-3.0, -1.12, -1.2, -0.3, -0.56, 0],
  [-0.75, -1.12, -1.2, -0.32, -0.55, 0],
  [-0.38, -1.12, -1.2, -0.52, -0.36, 0],            // a glance up: the cat landing on the island
  [0.06, -1.12, -1.2, -0.42, -0.54, 0],             // the phone squeezes out: down at it
  [0.3, -1.11, -1.21, -0.74, -0.42, 0],             // the mug, going: reach
  [0.52, -1.06, -1.26, -0.8, -0.46, 0.02],
  [0.68, -1.1, -1.34, -0.58, 0.1, 0.2],             // feet out: the view flips up
  [0.86, -1.12, -1.45, -0.88, -0.3, 0.1],           // the slap on the island's edge
  [1.2, -1.12, -1.62, -0.66, -0.22, 0.02],          // down
  [1.42, -1.12, -1.62, 0.25, -0.16, -0.02],
  [1.7, -1.12, -1.62, 0.78, -0.16, -0.03],          // the oven door handle
  [2.4, -1.12, -1.62, 0.62, -0.15, 0],
  [4.0, -1.12, -1.62, 0.15, -0.16, 0],
];
function fzPov(s) { const k = fzSpline(FZ_POV, s); return { p: [k[0], fzEyeY(s), k[1]], yaw: k[2], pitch: k[3], roll: k[4] }; }

// your hands (story time): the phone (left), the reach, the flail, the slap and skid (right), the hook (left)
const FZ_HAND_POSES = {
  phone: { p: [0.075, -0.215, -0.36], F: [-0.22, 0.88, -0.45], N: [0.12, 0.45, 0.88], curl: [0.95, 1.0, 1.05, 1.1], thumb: [0.25, 0.75] },
  open: { p: [0.12, -0.34, -0.36], F: [0.15, 0.45, -0.88], N: [0.2, 0.85, 0.45], curl: [0.25, 0.22, 0.26, 0.32], thumb: [0.75, 0.15] },
  reachM: { p: [0.1, -0.17, -0.47], F: [-0.25, 0.05, -1], N: [-0.3, -0.95, 0.1], curl: [0.38, 0.42, 0.48, 0.55], thumb: [0.55, 0.3] },
  flail: { p: [0.26, -0.04, -0.33], F: [0.3, 1, -0.3], N: [-1, 0, 0.25], curl: [0.1, 0.12, 0.15, 0.2], thumb: [0.75, 0.1] },
  flailL: { p: [0.27, -0.1, -0.31], F: [0.4, 1, -0.25], N: [-1, 0, 0.2], curl: [0.12, 0.12, 0.16, 0.22], thumb: [0.75, 0.1] },
  slap: { p: [0.14, -0.3, -0.44], F: [-0.3, -0.05, -1], N: [0.05, -1, -0.1], curl: [0.05, 0.06, 0.08, 0.1], thumb: [0.55, 0.1] },
  skid: { p: [0.16, -0.36, -0.42], F: [-0.15, -0.3, -1], N: [0.2, -0.95, 0.1], curl: [0.25, 0.3, 0.32, 0.38], thumb: [0.6, 0.2] },
  reachL: { p: [0.05, -0.24, -0.5], F: [0.5, 0.05, -0.85], N: [0.1, -0.95, 0.2], curl: [0.3, 0.3, 0.35, 0.4], thumb: [0.6, 0.2] },
  hook: { p: [0.02, -0.2, -0.55], F: [0.79, -0.05, -0.61], N: [0.0, -1, 0.05], curl: [0.95, 1.0, 1.0, 0.95], thumb: [0.3, 0.55] },
};
const FZ_HAND_BLENDS = { phone: 0.3, open: 0.12, reachM: 0.22, flail: 0.1, flailL: 0.12, slap: 0.06, skid: 0.1, reachL: 0.18, hook: 0.2, hidden: 0.2 };
const FZ_HANDS = {
  right: [[-9, 'hidden'], [0.2, 'reachM'], [0.56, 'flail'], [0.69, 'slap'], [0.98, 'skid'], [1.16, 'hidden']],
  left: [[-9, 'phone'], [0.0, 'open'], [0.52, 'flailL'], [1.28, 'reachL'], [1.46, 'hook']],
};
// where the hands go in the world (blended in over the posed position): the slap on the island's edge, skidding
// along it; the hook over the oven handle
const FZ_SLAP = { a: [-0.57, 0.942, -1.56], b: [-0.57, 0.942, -2.06], t: [0.7, 0.74, 0.98, 1.08] };
const FZ_HOOK = { at: [-1.655, 0.825, -2.12], F: [-0.72, 0.25, -0.65], t: [1.42, 1.6] };
// put a first-person hand in the world: its wrist at p, fingers along F, palm facing N (world vectors), blended in by w
function fzHandTo(h, cam, p, F, N, w) {
  const Q = fzHandTo, v = Q.v || (Q.v = new THREE.Vector3()), y = Q.y || (Q.y = new THREE.Vector3()), z = Q.z || (Q.z = new THREE.Vector3()), x = Q.x || (Q.x = new THREE.Vector3());
  const m = Q.m || (Q.m = new THREE.Matrix4()), q = Q.q || (Q.q = new THREE.Quaternion()), qc = Q.qc || (Q.qc = new THREE.Quaternion());
  cam.worldToLocal(v.set(p[0], p[1], p[2])); h.g.position.lerp(v, w);
  y.set(F[0], F[1], F[2]).normalize(); z.set(N[0], N[1], N[2]); z.addScaledVector(y, -z.dot(y)).normalize(); x.crossVectors(y, z);
  q.setFromRotationMatrix(m.makeBasis(x, y, z)); cam.getWorldQuaternion(qc); q.premultiply(qc.invert());
  h.g.quaternion.slerp(q, w);
}

FZ_SETS.world = (app) => {
  const S = fzSet(app, { sky: '#b9cfe2', fov: 50, near: 0.02, far: 1500, hemi: ['#dbe8f5', '#7a6a58', 0.55], sun: [FZ_SUN[0] * 60, FZ_SUN[1] * 60, FZ_SUN[2] * 60], sunI: 4.4, sunColor: '#ffe9cc', shadow: 2048, shadowR: 10, shadowFar: 160, env: ['#9cc0e6', '#e2ddd2', '#6c6256'] });
  const scene = S.scene, cam = S.camera, sun = S.sun;
  scene.fog = new THREE.FogExp2('#cddcea', 0.0013);
  const sky = fzSky(scene, '#3f86d8', '#cfe1f0', '#8c8a84', { sunDir: FZ_SUN, sunGlow: '#ffe6bc', hw: 0.3 });
  const H = fzBuildHome(S), T = fzBuildStreet(S), C = fzBuildCast(S, H, T);
  // ---- your hands (bare forearms: a T-shirt), the phone in your left hand
  const HO = { script: FZ_HANDS, poses: FZ_HAND_POSES, blends: FZ_HAND_BLENDS, skin: SKIN[LOOKS.fzYou.skin], nail: '#e0b9a8', sleeve: LOOKS.fzYou.shirt, cuff: '#46566a', watch: true, sleeveLen: 0.85 };
  const hands = new ViewerHands(cam, HO);
  // (the same hands, in the third person: the close-up of your fingers over the oven handle; posed from your head)
  const youEye = new THREE.Object3D(); scene.add(youEye);
  const handsTP = new ViewerHands(youEye, HO); handsTP.root.visible = false;
  // the man at the bus stop's shoelace bow (it unties itself)
  const bow = fzLaceBow(C.lace.j.ll.ft);
  const phoneCopy = H.phone.clone(true); phoneCopy.position.set(0, 0.078, 0.03); phoneCopy.rotation.set(Math.PI / 2, 0, 0); hands.left.g.add(phoneCopy);
  // where the phone was at s = 0 (in your hand, seen through your eyes; and in the third-person shots, in your rig's
  // hand): the world phone starts there and blends onto its physics path as it drops (fzPhone)
  const anchor = { pov: null, tp: null };
  {
    const v = fzPov(0); fzCam(cam, v.p, fzAdd(v.p, fzDir(v.yaw, v.pitch)), 50, 0); hands.update(0); cam.updateMatrixWorld(true);
    const p = new THREE.Vector3(), q = new THREE.Quaternion(); phoneCopy.getWorldPosition(p); phoneCopy.getWorldQuaternion(q); anchor.pov = { p: p.toArray(), q };
    C.update(0, {}); const h = new THREE.Vector3(); C.you.handWorld(1, h); anchor.tp = { p: [h.x, h.y - 0.02, h.z], q: null };
  }
  // the lint from your clothes and the curtains' cotton (soft specks); dust
  const fluff = fzPuffs(scene, 900, { soft: 1.2 });
  // a light inside the wall cabinet (the cutaway)
  const cabLight = new THREE.PointLight('#fff2e0', 0, 1.2, 1.5); scene.add(cabLight);
  const look = (p, at, fov, t, drift = 0.0, roll = 0) => { const d = drift ? fzDrift(t, drift, 0.3, 11) : [0, 0, 0]; fzCam(cam, [p[0] + d[0], p[1] + d[1], p[2] + d[2]], at, fov, roll); };
  const _v = new THREE.Vector3(), _w = new THREE.Vector3();

  const set = {
    scene, camera: cam, H, T, C, hands,
    cuts() { return [...FZ.countCuts]; },
    frame(t, shot) {
      const m = shot.mode, s = fzClock(shot, t);
      this._s = s;
      // ------------------------------------------------------------------ pose the world
      const pov = !!shot.pov;
      H.update(s, { phoneInHand: pov });
      T.update(s, {});
      C.update(s, { pov });
      // the phone: from where it really was in your hand at s = 0, onto its path as it drops
      { const P = FZ_PHONE, A = pov ? anchor.pov : anchor.tp, w = 1 - fzSm(s, 0, P.land * 0.9);
        if (w > 0 && A) { H.phone.position.x += (A.p[0] - P.hand[0]) * w; H.phone.position.y += (A.p[1] - P.hand[1]) * w; H.phone.position.z += (A.p[2] - P.hand[2]) * w;
          if (A.q) H.phone.quaternion.slerp(A.q, w); } }
      phoneCopy.visible = pov && s <= 0;
      // ------------------------------------------------------------------ the camera
      let pos = [0, 1.6, -4], at = [0, 1, -2], fov = 50, drift = 0, roll = 0;
      let sh = { f: null, R: 8 };                               // the sun's shadow: its focus and radius
      const P0 = (x, h, z) => [x, fzGroundY(x, z) + h, z];     // a point h above the ground outside
      const povCam = (yawAdd = 0, pitchAdd = 0, fv = 50) => { const v = fzPov(s); pos = v.p; at = fzAdd(v.p, fzDir(v.yaw + yawAdd, v.pitch + pitchAdd)); roll = v.roll * 57.3; fov = fv; drift = 0.0015; };
      const u = (a, b) => MathX.clamp((t - a) / (b - a), 0, 1);
      const k = u(shot.t0, shot.t1);
      const cat = fzCat(s), bus = fzBusAt(s), car = fzCarAt(s), bike = fzBike(s);
      switch (m) {
        // ---- 1
        case 'open': povCam(); break;
        case 'floor': povCam(fzLerp(0.0, -0.45, k), fzLerp(0.02, -0.05, k)); break;
        case 'teaser': pos = [-0.1, 1.5, -9.0]; at = fzV([16, -0.3, -21.5], [18, -0.6, -21.8], k); fov = 60; drift = 0.006; sh = { f: [12, 0, -17], R: 30 }; break;
        case 'flash': { const b = fzBusAt(10.2); pos = P0(b.x + 13, 0.5, -14.4); at = [b.x + 1.5, fzRoadY(b.x, b.z) + 1.9, b.z]; fov = 44; drift = 0.004; sh = { f: [b.x + 3, 0, b.z], R: 16 }; break; }
        case 'atoms': pos = [-1.42, 0.12, cat.z - 0.6]; at = [cat.x, 0.1, cat.z]; fov = 30; drift = 0.002; sh = { f: [cat.x, 0, cat.z], R: 3 }; break;
        case 'apart': pos = fzV([-1.05, 0.92, -3.55], [-1.05, 0.88, -3.35], k); at = [-1.3, 0.62, -1.75]; fov = 42; drift = 0.003; sh = { f: [-1, 0, -2], R: 5 }; break;
        case 'push': { const p = fzPhone(s); pos = [p.x + 0.55, 0.16, p.z - 0.6]; at = [p.x, 0.02, p.z]; fov = 34; drift = 0.002; sh = { f: [p.x, 0, p.z], R: 3 }; break; }
        case 'fault': pos = fzV([-6, 16, -4], [-4, 17, -5], k); at = [10, -1, -17]; fov = 55; drift = 0.006; sh = { f: [8, 0, -16], R: 40 }; break;
        // ---- 2
        case 'replay': case 'reach': case 'slap': povCam(); break;
        case 'hook': pos = fzV([-1.32, 0.98, -2.78], [-1.36, 0.95, -2.7], k); at = [-1.68, 0.8, -2.2]; fov = 30; drift = 0.0012; sh = { f: [-1.7, 0.8, -2.2], R: 2 }; break;
        case 'cat': pos = [-0.98, 1.04, -2.32]; at = fzV([0.45, 0.97, -1.86], [0.0, 0.95, -1.9], k); fov = 40; drift = 0.002; sh = { f: [0, 1, -1.9], R: 3 }; break;
        case 'mug': pos = [-1.68, 0.22, -2.75]; at = fzV([-0.75, 0.75, -1.95], [-1.0, 0.2, -2.05], u(shot.t0, shot.t0 + 3.2)); fov = 46; drift = 0.002; sh = { f: [-1, 0, -2], R: 3 }; break;
        case 'feet': pos = [-1.0, 0.48, -3.35]; at = [-1.12, fzLerp(0.95, 0.6, k), -1.5]; fov = 44; drift = 0.003; sh = { f: [-1.1, 0.5, -1.8], R: 3.5 }; break;
        case 'catrun': pos = [-0.82, 0.2, cat.z - 0.1]; at = [cat.x, 0.16, cat.z + 0.05]; fov = 36; drift = 0.002; sh = { f: [cat.x, 0, cat.z], R: 3 }; break;
        // ---- 3
        case 'house': pos = fzV([0.35, 2.05, -7.72], [0.3, 2.0, -7.6], k); at = [-0.25, 0.95, -1.6]; fov = 70; drift = 0.003; sh = { f: [0, 1, -4], R: 6 }; break;
        case 'screws': { const cb = H.cabs[0], sc = cb.screws[1]; sc.g.getWorldPosition(_v); cb.g.localToWorld(_w.set(0.075, cb.h - 0.075, sc.u * cb.L + 0.085));
          pos = _w.toArray(); at = [_v.x - 0.005, _v.y - 0.002, _v.z]; fov = 36; drift = 0.0005; cabLight.position.set(_w.x - 0.02, _w.y + 0.04, _w.z - 0.05); sh = { f: _v.toArray(), R: 2 }; break; }
        case 'cabinets': pos = [-0.9, 1.5, -3.6]; at = [-2.1, 1.5, -1.6]; fov = 50; drift = 0.003; sh = { f: [-1.8, 1, -1.9], R: 3.5 }; break;
        case 'tv': pos = [0.4, 1.15, -4.35]; at = [2.25, 0.95, -5.05]; fov = 42; drift = 0.003; sh = { f: [2, 1, -5], R: 3 }; break;
        case 'curtains': pos = [-0.45, 1.42, -5.4]; at = [-1.3, 1.45, -8.0]; fov = 46; drift = 0.003; sh = { f: [-1.3, 1.4, -7.6], R: 3 }; break;
        case 'clothes': { const dn = fzSm(t, fzCap('clothes', 1).show - 0.35, fzCap('clothes', 1).show + 0.05) * (1 - fzSm(t, fzCap('clothes', 1).show + 0.25, fzCap('clothes', 1).show + 0.4));
          povCam(fzLerp(0.0, -0.35, k), -0.75 * dn); break; }
        case 'sugar': pos = [0.6, 1.16, -2.0]; at = [0.17, 0.93, -2.3]; fov = 32; drift = 0.0015; sh = { f: [0.2, 0.9, -2.3], R: 2 }; break;
        // ---- 4
        case 'street': case 'slide': case 'realspeed': pos = fzV(P0(-46, 8.5, -14.6), P0(-44, 8.6, -14.8), k); at = P0(18, 0, -17.5); fov = 50; drift = 0.008; sh = { f: [0, 0, -16], R: 45 }; break;
        case 'brakes': { const cy = fzRoadY(car.x, car.z); pos = [car.x + 5.2, cy + 1.0, -14.6]; at = [car.x + 0.4, cy + 0.75, car.z]; fov = 46; drift = 0.004; sh = { f: [car.x, 0, car.z], R: 8 }; break; }
        case 'bike': { const by = fzRoadY(bike.x, bike.z); pos = [bike.x + 6.5, by + 0.55, -17.2]; at = [bike.x, by + 0.75, bike.z]; fov = 42; drift = 0.004; sh = { f: [bike.x, 0, bike.z], R: 7 }; break; }
        case 'laces': { C.lace.j.ll.ft.getWorldPosition(_v); pos = [_v.x + 0.3, _v.y + 0.2, _v.z + 0.36]; at = [_v.x, _v.y + 0.0, _v.z + 0.06]; fov = 30; drift = 0.0015; sh = { f: _v.toArray(), R: 2.5 }; break; }
        case 'walk': { const w = fzPerson(FZ_WALKER.x0, FZ_WALKER.v0, s); pos = P0(fzLerp(-3.4, -2.9, k), 1.0, -10.1); at = P0(w.x - 0.2, 0.75, -10.4); fov = 46; drift = 0.004; sh = { f: [w.x, 0, -10.4], R: 7 }; break; }
        case 'ladder': pos = P0(-14.5, 1.6, -22.6); at = P0(-8.6, 2.0, -24.7); fov = 46; drift = 0.004; sh = { f: [-8.8, 1, -24], R: 7 }; break;
        case 'scaffold': pos = P0(3.2, 1.65, -11.2); at = P0(7.5, 2.8, -24.3); fov = 52; drift = 0.004; sh = { f: [7.5, 2, -23], R: 12 }; break;
        case 'sand': pos = P0(9.3, 0.7, -22.45); at = P0(fzLerp(13.6, 16.5, k), 0.1, -22.9); fov = 44; drift = 0.003; sh = { f: [15, 0, -22.5], R: 7 }; break;
        // ---- 5
        case 'floor2': pos = [1.0, 1.78, -0.85]; at = [-0.35, 0.55, -7.4]; fov = 62; drift = 0.003; sh = { f: [0, 0.5, -4.5], R: 6 }; break;
        case 'hill': pos = P0(-4, 1.5, -23.4); at = P0(4, 0.6, -12.7); fov = 52; drift = 0.004; sh = { f: [2, 0, -14], R: 14 }; break;
        case 'same': { const x = fzHalf(FZP.aHill, Math.max(0, s)); pos = P0(x - 2.0, 1.65, -10.7); at = P0(x + 12, 0.4, -16.5); fov = 56; sh = { f: [x + 8, 0, -16], R: 16 }; break; }
        case 'faster': pos = P0(30, 0.5, -11.3); at = P0(10, 0.9, -13.0); fov = 46; drift = 0.004; sh = { f: [18, 0, -14], R: 16 }; break;
        case 'sofa': pos = [0.75, 1.25, -7.55]; at = [-1.55, 0.55, -6.2]; fov = 50; drift = 0.003; sh = { f: [-1.2, 0.5, -6.8], R: 4 }; break;
        case 'bus': { const b = fzBusAt(6.2); pos = P0(b.x + 16, 4.2, -10.4); at = [b.x - 1, fzRoadY(b.x, b.z) + 1.4, b.z]; fov = 46; drift = 0.005; sh = { f: [b.x, 0, b.z], R: 16 }; break; }
        case 'phone2': pos = [0.75, -0.18, -9.45]; at = [0.25, -0.02, -8.2]; fov = 40; drift = 0.002; sh = { f: [0.25, 0, -8.6], R: 3 }; break;
        case 'warn': pos = fzV(P0(8, 15, -4.5), P0(10, 15.5, -5), k); at = P0(26, -1, -17); fov = 52; drift = 0.006; sh = { f: [24, 0, -16], R: 40 }; break;
        case 'warn2': pos = [1.3, 2.05, -0.7]; at = [-0.5, 0.45, -6.2]; fov = 64; drift = 0.003; sh = { f: [0, 0.5, -4], R: 6 }; break;
        case 'count': {
          const n = FZ.countCuts.filter((c) => t >= c).length; this._sub = n;
          if (n === 0) { pos = P0(22, 0.45, -11.2); at = P0(4, 0.8, -15); fov = 48; sh = { f: [14, 0, -15], R: 14 }; }
          else if (n === 1) { pos = [cat.x + 0.6, 0.22, cat.z - 0.9]; at = [cat.x, 0.18, cat.z]; fov = 40; sh = { f: [cat.x, 0, cat.z], R: 3 }; }
          else if (n === 2) { const w = fzPerson(FZ_WALKER.x0, FZ_WALKER.v0, s); pos = P0(w.x + 5, 0.7, -11.0); at = P0(w.x, 0.5, -10.4); fov = 40; sh = { f: [w.x, 0, -10.4], R: 6 }; }
          else if (n === 3) { pos = P0(bus.x + 14, 1.2, -12.2); at = [bus.x, fzRoadY(bus.x, bus.z) + 1.6, bus.z]; fov = 44; sh = { f: [bus.x, 0, bus.z], R: 14 }; }
          else if (n === 4) { const p = fzPhone(s); pos = [p.x + 0.6, p.y + 0.3, p.z + 0.35]; at = [p.x, p.y, p.z]; fov = 38; sh = { f: [p.x, p.y, p.z], R: 3 }; }
          else if (n === 5) { pos = [-0.4, 1.0, -2.75]; at = [-1.3, 0.65, -1.85]; fov = 44; sh = { f: [-1, 0.5, -2], R: 4 }; }
          else if (n === 6) { pos = P0(36, 0.25, -12.0); at = P0(26, 1.2, -13); fov = 40; sh = { f: [30, 0, -14], R: 12 }; }
          else { pos = P0(40, 11, -6); at = P0(70, -1, -18); fov = 52; sh = { f: [60, 0, -16], R: 40 }; }
          drift = 0.004; break; }
        case 'back': pos = fzV(P0(40, 10.5, -6), P0(41, 10.4, -6.3), k); at = P0(68, -0.5, -18); fov = 52; drift = 0.006; sh = { f: [62, 0, -16], R: 42 }; break;
        case 'stop': { const w = fzPerson(FZ_WALKER.x0, FZ_WALKER.v0, 10); pos = P0(w.x + 7, 0.6, -11.1); at = P0(w.x - 0.5, 0.6, -10.9); fov = 46; drift = 0.004; sh = { f: [w.x, 0, -11], R: 10 }; break; }
        case 'bus2': { const b = fzBusAt(10.6); pos = P0(b.x + 13, 0.45, -12.0); at = [b.x - 1.5, fzRoadY(b.x, b.z) + 1.8, b.z]; fov = 42; drift = 0.004; sh = { f: [b.x, 0, b.z], R: 14 }; break; }
        case 'cat2': pos = [-0.55, 0.42, -7.45]; at = [-1.62, 0.45, -5.8]; fov = 44; drift = 0.002; sh = { f: [-1.6, 0.4, -6.2], R: 3 }; break;
        case 'after': pos = fzV([0.4, 1.45, -8.95], [0.6, 1.45, -9.2], k); at = P0(26, -0.3, -17.5); fov = 56; drift = 0.004; sh = { f: [20, 0, -16], R: 40 }; break;
        case 'phone3': { const p = fzPhone(s); pos = [p.x + 0.04, p.y + fzLerp(0.62, 0.48, k), p.z + 0.12]; at = [p.x, p.y, p.z]; fov = 40; drift = 0.0012; sh = { f: [p.x, p.y, p.z], R: 2 }; break; }
        case 'question': pos = fzV(P0(4, 3.5, -12.5), P0(2, 26, -4), Ease.inOutSine(k)); at = P0(22, 0, -17); fov = 55; drift = 0.004; sh = { f: [20, 0, -16], R: 45 }; break;
      }
      look(pos, at, fov, t, drift, roll);
      // ------------------------------------------------------------------ your hands (through your eyes only)
      if (pov) {
        hands.root.visible = true;
        hands.update(s);
        // the slap: your right hand onto the island's edge and along it; the hook: your left over the oven handle
        { const A = FZ_SLAP, w = fzSm(s, A.t[0], A.t[1]) * (1 - fzSm(s, A.t[2], A.t[3]));
          if (w > 0) { const q = MathX.clamp((s - A.t[1]) / (A.t[2] - A.t[1]), 0, 1), p = fzV(A.a, A.b, q * q), S = cam.localToWorld(_w.set(0.19, -0.27, 0.06)).toArray();
            fzHandTo(hands.right, cam, p, [p[0] - S[0], 0.15 * (p[1] - S[1]), p[2] - S[2]], [0, -1, 0], w); } }
        { const w = fzSm(s, FZ_HOOK.t[0], FZ_HOOK.t[1]);
          if (w > 0) fzHandTo(hands.left, cam, FZ_HOOK.at, FZ_HOOK.F, [0, -1, 0], w); }
      } else hands.root.visible = false;
      // the close-up of the hook: your left hand (the first-person hand, posed from your head), the rig's own arm hidden
      { const on = m === 'hook'; handsTP.root.visible = on; C.you.j.la.sh.visible = !on;
        if (on) { C.you.worldOf('head', _v); youEye.position.copy(_v); youEye.rotation.set(0, Math.PI, 0); youEye.updateMatrixWorld(true);
          handsTP.update(s); handsTP.right.g.visible = false; fzHandTo(handsTP.left, youEye, FZ_HOOK.at, FZ_HOOK.F, [0, -1, 0], fzSm(s, FZ_HOOK.t[0], FZ_HOOK.t[1])); } }
      bow.set(m === 'laces' ? fzLin(s, 0.15, 1.15) : s > 0.5 ? 1 : 0, m === 'laces' || m === 'walk' || m === 'stop');
      // ------------------------------------------------------------------ light: the sun's shadow round what we look at
      const f = sh.f || at, D = 70;
      sun.position.set(f[0] + FZ_SUN[0] * D, f[1] + FZ_SUN[1] * D, f[2] + FZ_SUN[2] * D); sun.target.position.set(f[0], f[1], f[2]); sun.target.updateMatrixWorld();
      { const c = sun.shadow.camera; if (c.right !== sh.R) { c.left = -sh.R; c.right = sh.R; c.top = sh.R; c.bottom = -sh.R; c.updateProjectionMatrix(); } }
      sun.shadow.bias = sh.R > 20 ? -0.0006 : -0.0003; sun.shadow.normalBias = sh.R > 20 ? 0.06 : 0.02;
      const inside = fzInside(m, this._sub);
      this._inside = inside;
      S.hemi.intensity = inside ? 0.22 : 0.62; scene.environmentIntensity = inside ? 0.35 : 0.8;
      H.fillK.intensity = inside ? 2.4 : 0; H.fillL.intensity = inside ? 1.8 : 0; H.fillW.intensity = inside ? 3.5 : 0;
      cabLight.intensity = m === 'screws' ? 0.18 : 0;
      // ------------------------------------------------------------------ lint and cotton
      fluff.begin();
      if (m === 'curtains' || m === 'clothes' || m === 'house' || m === 'floor2' || m === 'sofa' || m === 'cat2' || m === 'warn2') fzFluff(fluff, s, m, cam);
      fluff.end();
      // the phone's screen: dark in the gutter until it lights up (a notification)
      fzPhoneScreen(H, m === 'phone3' ? (t >= fzCap('phone3', 1).show - 0.2 ? 1 : 0) : 1);
    },
    labels(t) { return fzLabels(this, t); },
    grade(t, p, shot) {
      const m = shot.mode;
      if (this._inside) { p.exposure = 1.32; p.warmth = 0.03; p.bloom = 0.3; p.bloomThreshold = 0.9; }
      else { p.exposure = 1.0; p.warmth = 0.02; p.bloom = 0.26; }
      p.saturation = 1.06; p.contrast = 1.07; p.vignette = 0.42;
      if (m === 'screws') { p.exposure = 1.15; p.vignette = 0.6; }
      if (shot.flash) { p.saturation = 0.78; p.contrast = 1.12; p.vignette = 0.6; }
      // the return: a hard kick on the cut to s = 10
      if (m === 'back') { const u0 = t - shot.t0; p.flash = Math.max(p.flash || 0, 0.25 * Math.exp(-u0 / 0.05)); p.chroma = 0.35 * Math.exp(-u0 / 0.25); }
    },
  };
  return set;
};

// is this shot inside the house? (the grade and the lights)
function fzInside(m, sub) {
  if (m === 'count') return sub === 1 || sub === 5;
  return ['open', 'floor', 'atoms', 'apart', 'push', 'replay', 'cat', 'mug', 'reach', 'feet', 'slap', 'hook', 'catrun', 'house', 'screws', 'cabinets', 'tv', 'curtains', 'clothes', 'sugar', 'floor2', 'sofa', 'warn2', 'cat2'].includes(m);
}
const fzAdd = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

// the curtains' cotton and your clothes' lint: specks that drift down and settle (pure: each speck's path from s)
function fzFluff(P, s, m, cam) {
  const FW = FZ_H.fWin;
  if (m !== 'clothes') {
    // the curtains: 500 specks from the two panels, released as the cotton comes apart (0.05 → 1.1), falling slowly
    for (let i = 0; i < 500; i++) {
      const side = i % 2, x0 = side ? fzLerp(FW[1] - 0.55, FW[1] + 0.15, fzR(i, 1)) : fzLerp(FW[0] - 0.15, FW[0] + 0.55, fzR(i, 1));
      const y0 = 0.4 + 2.0 * fzR(i, 2), rel = 0.05 + 1.05 * (1 - (y0 - 0.4) / 2.0) * 0.4 + 0.6 * fzR(i, 3), tt = s - rel;
      if (tt <= 0) continue;
      const vy = 0.25 + 0.4 * fzR(i, 4), y = Math.max(0.01, y0 - vy * tt - 0.5 * 0.3 * tt * tt * 0.2);
      const x = x0 + 0.08 * Math.sin(tt * 1.3 + i) * Math.min(1, tt), z = FZ_W.front + 0.15 + 0.25 * fzR(i, 5) * Math.min(1, tt * 0.8);
      P.add(x, y, z, 0.006 + 0.01 * fzR(i, 6), 0.75 * Math.min(1, tt * 5), 0.93, 0.9, 0.84);
    }
    return;
  }
  // your T-shirt: lint drifting down past your eyes (in front of the camera, a little below)
  const e = new THREE.Vector3(), d = new THREE.Vector3(); cam.getWorldPosition(e); cam.getWorldDirection(d);
  for (let i = 0; i < 160; i++) {
    const ph = ((s * (0.35 + 0.3 * fzR(i, 7)) + fzR(i, 8)) % 1), r = 0.25 + 0.5 * fzR(i, 9), a = (fzR(i, 10) - 0.5) * 1.6;
    const x = e.x + d.x * r + Math.cos(a) * 0.25 * (fzR(i, 11) - 0.5), z = e.z + d.z * r + Math.sin(a) * 0.25 * (fzR(i, 12) - 0.5), y = e.y + 0.15 - ph * 0.9;
    const c = fzR(i, 13) < 0.7 ? [0.36, 0.42, 0.5] : [0.85, 0.86, 0.88];
    P.add(x, y, z, 0.002 + 0.0035 * fzR(i, 14), 0.8 * Math.sin(Math.PI * ph), ...c);
  }
}
// the phone's screen: lit (1) or dark (0)
function fzPhoneScreen(H, on) {
  const m = H.phoneScreen.material;
  if (m._on === on) return; m._on = on;
  m.color.setScalar(on ? 1 : 0.035);
}

// labels pinned in the scene: [{ p, text, sub, a, side }]
function fzLabels(set, t) {
  const shot = fzShotAt(t), m = shot.mode, out = [], W = StoryHUD.win, s = set._s;
  if (m === 'hook') out.push({ p: [-1.74, 0.8, -2.5], text: 'THE OVEN DOOR HANDLE', a: W(t, fzCap('grip', 3).show + 0.1, shot.t1 - 0.2, 0.3, 0.2), side: 'r' });
  if (m === 'floor2') out.push({ p: [-0.3, 0.05, -6.8], text: 'THE FLOOR', sub: 'SLOPES 0.5° TOWARDS THE STREET', a: W(t, fzCap('floor', 0).show + 0.6, fzCap('floor', 2).show - 0.2, 0.3, 0.3) });
  if (m === 'hill') { const c = FZ_PARKED.find((q) => q.id === 'S3'), r = fzParked(c, s); out.push({ p: [r.x - 1.3, fzRoadY(r.x - 1.3, c.z) + 0.3, c.z + 0.9], text: 'HELD BY ITS TYRES', sub: 'UNTIL NOW', a: W(t, fzCap('hill', 1).show + 0.2, shot.t1 - 0.2, 0.3, 0.2) }); }
  if (m === 'bus') { const b = fzBusAt(s); out.push({ p: [b.x, fzRoadY(b.x, b.z) + 4.6, b.z], text: 'THE BUS', sub: 'TURNED ' + Math.round((b.yaw - FZ_BUS.yaw0) * 57.3) + '° SINCE 8:14:07', a: W(t, fzCap('bus', 1).show + 0.2, shot.t1 - 0.2, 0.3, 0.2) }); }
  if (m === 'phone2') { const p = fzPhone(s); out.push({ p: [p.x, p.y + 0.02, p.z], text: 'YOUR PHONE', a: W(t, shot.t0 + 0.5, shot.t1 - 0.2, 0.3, 0.2) }); }
  if (m === 'cabinets') out.push({ p: [-2.4, 2.1, -1.3], text: '3 SCREWS EACH', a: W(t, fzS('cabinets') + 0.3, fzS('cabinets') + 1.6, 0.25, 0.25), side: 'r' });
  return out;
}

// a shoelace bow on a foot (foot-local: toe +z, up +y): two loops and two tails from a knot on the instep. set(u):
// u 0 → 0.55 the loops are pulled through the knot (the tails grow); 0.55 → 1 the knot opens and the ends fall away
function fzLaceBow(foot) {
  const g = new THREE.Group(); foot.add(g);
  const mat = fzStd('#f2efe8', 0.8), K = [0, 0.017, 0.07], tubes = [];
  for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(new THREE.BufferGeometry(), mat); m.castShadow = true; g.add(m); tubes.push(m); }
  let last = -1;
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  return {
    g,
    set(u, vis) {
      g.visible = !!vis; if (!vis) return;
      const q = Math.round(u * 120) / 120; if (q === last) return; last = q;
      const L = 1 - fzSm(q, 0, 0.55), open = fzSm(q, 0.55, 1), drop = open;
      for (let i = 0; i < 4; i++) {
        const sd = i % 2 ? 1 : -1, loop = i < 2;
        let pts;
        if (loop) {
          const r = 0.032 * L + 0.002;
          pts = [K, [sd * r * 0.45, K[1] + 0.012 * L, K[2] + 0.012 * L], [sd * r, K[1] + 0.008 * L, K[2] + 0.004], [sd * r * 0.6, K[1] + 0.002, K[2] - 0.012 * L], [sd * 0.002, K[1], K[2] - 0.002]];
          if (L < 0.03) { tubes[i].visible = false; continue; }
        } else {
          const len = 0.045 + 0.06 * (1 - L) + 0.02 * open, kx = sd * (0.004 + 0.02 * open);
          const end = [sd * (0.02 + 0.5 * len * (1 - 0.4 * drop)), K[1] - 0.012 - (0.03 + 0.5 * len) * drop, K[2] + 0.02 + 0.45 * len * (1 - 0.6 * drop)];
          pts = [[kx, K[1], K[2] - 0.002], [kx + sd * 0.01, K[1] + 0.002 - 0.01 * drop, K[2] + 0.01], [(kx + end[0]) / 2 + sd * 0.006, (K[1] + end[1]) / 2 + 0.004 * (1 - drop), (K[2] + end[2]) / 2], end];
        }
        tubes[i].visible = true;
        const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(V)), 18, 0.0021, 6, false);
        tubes[i].geometry.dispose(); tubes[i].geometry = geo;
      }
    },
  };
}
