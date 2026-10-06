/* =====================================================================
   SHOTS — the camera of every shot (film seconds). Each shot gives the
   lens position p, the look-at point l, the vertical fov and roll as a
   function of film time t, u (0..1 through the shot) and the action A
   (so a camera can track a tank or find Killua). Killua's shots are
   close, low, fast, they whip and lose him; the Titan's are low, wide,
   slow and heavy. shake: [film time, amount, decay] impulses; hand:
   handheld amount for the shot.
   ===================================================================== */

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const L3 = (a, b, k) => v3(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
const eio = Ease.inOutSine, eo = Ease.outCubic, ei = Ease.inCubic;

const XSHOTS = [
  // 0–5 arrival
  { t: [0, 2.6], hand: 0.2, focus: [0, -40, 60], cam: (t, u) => ({ p: L3([16, 30, 22], [11, 24, 8], eio(u)), l: L3([0, 0, -48], [0, 0, -52], u), fov: 48 }) },
  // behind the squad, low: helmets and rifles in the foreground, two small figures in the road ahead
  { t: [2.6, 5.0], hand: 0.5, focus: [0, -36], cam: (t, u) => ({ p: L3([0.1, 2.55, -48.6], [0.0, 2.45, -46.4], u), l: v3(0.0, 1.0, -22), fov: 30 }) },
  // 5–12 the reaction
  // the officer halts the squad (close, in front of him; the squad and the tank behind)
  { t: [5.0, 6.4], hand: 0.5, focus: [0, -34], cam: (t, u, A) => { const o = A.officer.j.head.getWorldPosition(v3()); return { p: v3(o.x + 0.55, o.y - 0.12, o.z + L3([1.7], [1.35], u).x), l: o.clone().add(v3(0.12, -0.08, 0)), fov: 34 }; } },
  // the standoff: between them, low; their shoulders frame the squad and the tank
  { t: [6.4, 7.6], hand: 0.2, focus: [0, -30], cam: (t, u) => ({ p: L3([0.0, 0.95, -17.4], [0.0, 1.0, -17.9], eio(u)), l: v3(0.0, 1.55, -40), fov: 52 }) },
  // Killua: hands in his pockets, a spark at his fingertips
  { t: [7.6, 8.6], hand: 0.2, focus: [0, -24], cam: (t, u) => ({ p: L3([0.55, 0.72, -24.3], [0.62, 0.78, -23.7], eio(u)), l: v3(0.88, 0.86, -22), fov: 42 }) },
  // Eren: eyes, the cloak moves
  { t: [8.6, 9.6], hand: 0.15, focus: [0, -24], cam: (t, u) => ({ p: L3([-0.82, 1.58, -23.45], [-0.84, 1.6, -23.2], u), l: v3(-0.9, 1.6, -22), fov: 30 }) },
  // the order: the line of rifles comes up (from the side, low)
  { t: [9.6, 10.6], hand: 0.4, focus: [0, -36], cam: (t, u) => ({ p: L3([4.2, 0.55, -34.2], [4.0, 0.6, -34.8], u), l: v3(-1.2, 1.45, -38.5), fov: 40 }) },
  // over the rifle: Killua in the sights (near-silence)
  { t: [10.6, 12.0], hand: 0.08, noHead: true, focus: [0, -30], cam: (t, u, A) => { const m = A.A[0].muzzle(v3()), tg = v3(0.9, 1.15, -22), d = tg.clone().sub(m).normalize(); return { p: m.clone().addScaledVector(d, -0.95 + 0.06 * u).add(v3(0.0, 0.085, 0)), l: tg.clone().add(v3(0, -0.15, 0)), fov: L3([30], [22], eio(u)).x }; } },
  // 12–19 the reveal
  // the trigger: MUZZLE FLASH — he is gone
  { t: [12.0, 12.12], hand: 0.0, noHead: true, focus: [0, -30], shake: [[12.0, 0.8, 0.1]], cam: (t, u, A) => { const m = A.A[0].muzzle(v3()), tg = v3(0.9, 1.2, -22), d = tg.clone().sub(m).normalize(); return { p: m.clone().addScaledVector(d, -0.9).add(v3(0.1, 0.12, 0)), l: tg, fov: 40 }; } },
  // slow motion: the bullet comes through the empty air where he stood; the electric trace
  { t: [12.12, 12.72], hand: 0.0, focus: [0, -24], cam: (t, u) => ({ p: L3([1.62, 1.22, -20.5], [1.58, 1.23, -20.6], u), l: v3(0.4, 1.3, -32), fov: 40 }) },
  // the whip: the soldier's eyes search — nothing
  { t: [12.72, 13.6], hand: 0.3, focus: [0, -34], whip: true, cam: (t, u, A) => { const h = A.A[0].j.head.getWorldPosition(v3()); const a = MathX.lerp(0.1, 2.84, eo(Math.min(1, u * 1.4))); return { p: h.clone().add(v3(0.05, 0.04, 0.32)), l: h.clone().add(v3(Math.sin(a) * 10, 0.2 * u, Math.cos(a) * 10)), fov: 44 }; } },
  // the tank commander turns — crack — Killua crouched on the deck behind him
  { t: [13.6, 15.0], hand: 0.25, focus: [0, -45], shake: [[13.95, 0.4, 0.15]], cam: (t, u, A) => { const T = A.tanks.T1, c = T.turretTop(v3()), k = T.deck(v3(), 0, -1.4); k.y += 0.9; const d = c.clone().sub(k).setY(0).normalize(), sd = v3(-d.z, 0, d.x);
      return { p: c.clone().addScaledVector(d, L3([3.6], [3.2], u).x).addScaledVector(sd, -0.55).add(v3(0, 0.35, 0)), l: c.clone().lerp(k, 0.55).add(v3(0, -0.1, 0)), fov: 36 }; } },
  { t: [15.0, 15.25], black: true, focus: [0, -45], cam: (t, u, A) => ({ p: v3(1.8, 0.7, -39.2), l: v3(0.4, 3.6, -45.6), fov: 40 }) },
  // the tank is dead; Killua on the turret, hands in pockets; he looks north
  { t: [15.25, 17.0], hand: 0.2, focus: [0, -45], cam: (t, u) => ({ p: L3([1.5, 1.2, -40.6], [1.3, 1.35, -41.3], eio(u)), l: v3(0.45, 3.55, -45.3), fov: 40 }) },
  { t: [17.0, 18.7], hand: 0.15, focus: [0, -45], cam: (t, u, A) => { const k = A.killua.j.head.getWorldPosition(v3()); return { p: v3(k.x + 1.2, k.y + 0.05, k.z + 1.3), l: k.clone().add(v3(0, -0.12, 0)), fov: 32 }; } },
  // 19–21 the bite
  { t: [18.7, 19.9], hand: 0.15, focus: [0, -22], cam: (t, u) => ({ p: L3([-0.9, 1.6, -23.35], [-0.9, 1.6, -23.1], u), l: v3(-0.9, 1.55, -22.0), fov: 28 }) },
  // 19–27 the transformation
  { t: [19.9, 20.7], hand: 0.3, focus: [0, -28], cam: (t, u, A) => { const o = A.officer.j.head.getWorldPosition(v3()); return { p: o.clone().add(v3(-0.38, 0.12, -0.75 - 0.15 * u)), l: v3(-0.9, 1.45, -22), fov: 30 }; } },
  { t: [20.7, 21.5], hand: 0.0, focus: [0, -28], shake: [[20.72, 1.4, 0.4]], cam: (t, u) => ({ p: v3(4.5, 1.6, -44), l: v3(-2, 9, -23), fov: 50 }) },
  { t: [21.5, 22.6], hand: 0.8, focus: [0, -30], shake: [[21.5, 0.9, 0.5]], cam: (t, u) => ({ p: L3([5, 0.7, -38], [5.5, 0.8, -39], u), l: v3(-2, 3.5, -23), fov: 52 }) },
  { t: [22.6, 24.3], hand: 0.9, focus: [0, -28], cam: (t, u) => ({ p: v3(2.5, 1.0, -33), l: L3([-2, 3, -23], [-2, 14, -23], eio(u)), fov: 54 }) },
  { t: [24.3, 27.0], hand: 0.3, focus: [0, -36, 50], shake: [[25.5, 0.9, 0.6]], cam: (t, u) => ({ p: L3([3.2, 0.5, -57], [3.0, 0.48, -56.2], u), l: L3([-2, 4.0, -23], [-2, 4.6, -23], eio(u)), fov: 46 }) },
  // 27–34 Eren vs armour
  { t: [27.0, 28.9], hand: 0.35, focus: [-4, -66], shake: [[27.4, 0.4, 0.2], [27.7, 0.3, 0.3]], cam: (t, u) => ({ p: L3([-8.5, 1.5, -91], [-8.0, 1.5, -89], u), l: v3(-3, 8.5, -48), fov: 38 }) },
  { t: [28.9, 30.0], hand: 0.4, focus: [0, -56], shake: [[29.2, 0.5, 0.3], [29.6, 0.5, 0.3]], cam: (t, u) => ({ p: L3([21, 1.0, -61], [20, 1.0, -60], u), l: v3(-3.5, 7, -52), fov: 46 }) },
  { t: [30.0, 31.0], hand: 0.4, focus: [-6, -58], cam: (t, u) => ({ p: L3([-19, 2.2, -70], [-19.5, 2.3, -70.5], u), l: L3([-4, 5, -57], [-5, 6.5, -57], eio(u)), fov: 50 }) },
  // the throw: the tank flies at the lens and lands just short of it
  { t: [31.0, 32.15], hand: 0.3, focus: [-22, -64], shake: [[31.9, 1.6, 0.4]], cam: (t, u, A) => { const p2 = A.tanks.T2.root.position; return { p: v3(-26, 1.7, -78), l: v3(p2.x, p2.y + 1.2, p2.z).lerp(v3(-8, 9, -56), 0.2), fov: 54 }; } },
  { t: [32.15, 33.0], hand: 0.3, focus: [5, -60], shake: [[32.62, 1.5, 0.45]], cam: (t, u) => ({ p: v3(12.5, 0.6, -67.5), l: v3(4.5, 3.2, -60.5), fov: 48 }) },
  { t: [33.0, 34.0], hand: 0.3, focus: [-8, -68], cam: (t, u, A) => { const c = A.tanks.T4.turretTop(v3()), h = A.titan.j.head.getWorldPosition(v3()), d = h.clone().sub(c).setY(0).normalize(); const sd = v3(-d.z, 0, d.x); return { p: c.clone().addScaledVector(d, -3.0).addScaledVector(sd, 0.9).add(v3(0, -0.9, 0)), l: c.clone().lerp(h, 0.5), fov: 54 }; } },
  // 34–41 Killua vs the column
  { t: [34.0, 35.7], hand: 0.6, focus: [0, -26], shake: [[34.9, 0.4, 0.15]], cam: (t, u, A) => { const z = A.tankS.T5.z; return { p: v3(-4.4, 0.85, z + 4.4), l: v3(-1.2, 1.15, z), fov: 44 }; } },
  { t: [35.7, 36.6], hand: 0.7, focus: [0, -28], whip: true, cam: (t, u, A) => { const z = A.tankS.T6.z, k = A.killua.p.root.position; return { p: v3(-4.6, 1.7, z + 5.5), l: v3(0.5, 2.0, z + 6).lerp(v3(k.x, k.y + 0.6, k.z), eo(Math.min(1, u * 2))), fov: 40 }; } },
  { t: [36.6, 37.8], hand: 0.4, focus: [0, -40], shake: [[36.8, 0.5, 0.2]], cam: (t, u, A) => { const z = A.tankS.T7.z; return { p: v3(-4.6, 1.15, z - 9.5), l: v3(0.7, 1.4, z - 4.0), fov: 44 }; } },
  { t: [37.8, 39.4], hand: 0.5, focus: [-14, -79], cam: (t, u) => { const m = XW.mg[0]; return { p: v3(m[0] + 3.6, 2.5, m[1] + 5.0), l: v3(m[0] + 0.3, 0.7, m[1] - 1.2), fov: 44 }; } },
  { t: [39.4, 41.0], hand: 0.3, focus: [0, -80, 50], shake: [[40.2, 0.4, 0.3]], cam: (t, u) => ({ p: L3([-24, 9, -62], [-22, 8.5, -63], u), l: v3(6, 0, -81), fov: 50 }) },
  // 41–49 parallel destruction, the aura walk
  { t: [41.0, 42.0], hand: 0.3, focus: [6, -66], shake: [[41.5, 1.0, 0.4]], cam: (t, u, A) => { const T = A.titan.root.position; return { p: v3(T.x + 9, 0.5, T.z + 14), l: v3(T.x, 6, T.z), fov: 50 }; } },
  { t: [42.0, 43.0], hand: 0.6, focus: [30, -81], cam: (t, u) => { const m = XW.mg[1]; return { p: v3(m[0] - 3.2, 1.0, m[1] + 3.5), l: v3(m[0] - 0.2, 1.1, m[1] - 1.4), fov: 38 }; } },
  { t: [43.0, 44.2], hand: 0.4, focus: [16, -84], shake: [[43.4, 1.0, 0.5]], cam: (t, u) => ({ p: L3([30, 1.0, -70], [29, 1.0, -71], u), l: v3(16, 6, -85), fov: 48 }) },
  { t: [44.2, 45.2], hand: 0.8, focus: [-8, 0], cam: (t, u) => ({ p: v3(-4.5, 2.2, 1), l: v3(-8.5, 3.0, 6 - 12 * u), fov: 46 }) },
  { t: [45.2, 46.4], hand: 0.3, focus: [10, -84], shake: [[45.4, 0.7, 0.8]], cam: (t, u, A) => { const H = A.titan.j.head, h = H.getWorldPosition(v3()), f = v3(0, 0, 1).applyQuaternion(A.titan.root.quaternion).setY(0).normalize(), sd = v3(-f.z, 0, f.x); return { p: h.clone().addScaledVector(f, 12).addScaledVector(sd, 4).add(v3(0, -7, 0)), l: h, fov: 40 }; } },
  { t: [46.4, 49.0], hand: 0.15, focus: [-1, -70, 45], shake: [[47.6, 0.35, 0.6]], cam: (t, u) => ({ p: L3([1.6, 0.5, -53.2], [1.5, 0.52, -52.4], u), l: v3(-0.4, 6.4, -76), fov: 42 }) },
  // 49–57 the army adapts
  { t: [49.0, 50.4], hand: 0.3, focus: [-8, -126], cam: (t, u) => ({ p: v3(-13.6, 1.5, -121.6), l: v3(-9.5, 1.35, -126), fov: 34 }) },
  { t: [50.4, 52.5], hand: 0.4, focus: [0, -120, 50], shake: [[51.0, 0.6, 0.3], [51.15, 0.4, 0.3], [51.3, 0.4, 0.3]], cam: (t, u) => ({ p: L3([-2, 1.4, -134], [-2, 1.6, -133], u), l: v3(-4, 9, -84), fov: 40 }) },
  { t: [52.5, 54.0], hand: 0.3, focus: [0, -90, 50], cam: (t, u) => ({ p: L3([16, 1.6, -79], [14.5, 1.6, -80], u), l: v3(-6, 2.5, -93), fov: 50 }) },
  { t: [54.0, 57.0], hand: 0.15, focus: [-2, -72, 50], cam: (t, u) => ({ p: L3([1.25, 0.35, -48.4], [1.2, 0.36, -49.2], u), l: v3(-1.0, 4.2, -68), fov: 33 }) },
  // 57–65 it fails
  { t: [57.0, 58.6], hand: 0.4, focus: [0, -126], cam: (t, u) => ({ p: v3(-34, 1.6, -121), l: v3(10, 1.2, -127), fov: 30 }) },
  { t: [58.6, 60.6], hand: 0.4, focus: [-2, -100], shake: [[58.6, 0.5, 0.2], [59.2, 0.5, 0.2], [60.0, 0.6, 0.4]], cam: (t, u) => ({ p: L3([-1, 1.2, -119], [-1, 1.2, -116], u), l: v3(-5, 8, -90), fov: 44 }) },
  { t: [60.6, 62.2], hand: 0.5, focus: [-6, -98], shake: [[60.6, 1.6, 0.5]], cam: (t, u) => ({ p: v3(10, 0.8, -106), l: v3(-7, 4, -98), fov: 50 }) },
  { t: [62.2, 63.0], hand: 0.2, focus: [0, -100], cam: (t, u) => ({ p: v3(7, 1.5, -124), l: v3(-3, 6.5, -96), fov: 50 }) },
  { t: [63.0, 65.0], hand: 0.5, focus: [0, -108], cam: (t, u) => ({ p: L3([0.9, 0.45, -119.5], [0.8, 0.5, -118.8], u), l: v3(0.6, 1.5, -104), fov: 46 }) },
  // 65–72 the final poster
  { t: [65.0, 72.0], hand: 0.12, focus: [0, -104, 40], shake: [[67.0, 0.3, 0.5], [67.6, 0.4, 0.8]], cam: (t, u, A) => { const k = eio(MathX.clamp((t - 65.2) / 2.6, 0, 1)), kp = A.killua.p.root.position; return { p: L3([7.0, 1.6, -117.0], [8.0, 1.05, -119.9], k), l: L3([kp.x, kp.y + 0.9, kp.z], [kp.x - 0.3, kp.y + 2.1, kp.z], k), fov: MathX.lerp(24, 30, k) }; } },
];
function xShotAt(t) { for (let i = XSHOTS.length - 1; i >= 0; i--) if (t >= XSHOTS[i].t[0]) return XSHOTS[i]; return XSHOTS[0]; }
