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
  { t: [2.6, 5.0], hand: 0.5, focus: [0, -36], cam: (t, u) => ({ p: L3([3.4, 0.55, -56], [2.6, 0.55, -51], u), l: v3(0.2, 1.3, -22), fov: 34 }) },
  // 5–12 the reaction
  { t: [5.0, 6.4], hand: 0.5, focus: [0, -34], cam: (t, u) => ({ p: L3([-7.5, 1.5, -36.5], [-7.0, 1.5, -36], u), l: v3(-1.5, 1.45, -34.5), fov: 30 }) },
  { t: [6.4, 8.6], hand: 0.25, focus: [0, -24], cam: (t, u) => ({ p: L3([0.1, 1.0, -26.6], [0.05, 1.05, -25.2], eio(u)), l: v3(0.0, 1.25, -22), fov: 30 }) },
  { t: [8.6, 10.6], hand: 0.4, focus: [0, -32], cam: (t, u, A) => { const s = A.A[0].p.root.position; return { p: v3(s.x + 0.55, 1.62, s.z - 0.9), l: v3(0.9, 1.2, -22), fov: 26 }; } },
  { t: [10.6, 12.0], hand: 0.12, focus: [0, -24], cam: (t, u) => ({ p: L3([0.95, 1.3, -26.0], [0.92, 1.3, -25.2], u), l: v3(0.9, 1.22, -22), fov: 16 }) },
  // 12–19 the reveal
  { t: [12.0, 12.6], hand: 0.0, focus: [0, -30], shake: [[12.0, 0.6, 0.12]], cam: (t, u, A) => { const s = A.A[0], m = s.muzzle(v3()); return { p: v3(m.x + 0.35, m.y + 0.05, m.z - 0.25), l: v3(0.9, 1.2, -22), fov: 34 }; } },
  { t: [12.6, 13.05], hand: 0.0, focus: [0, -22], cam: (t, u) => ({ p: v3(3.6, 1.15, -23.4), l: v3(0.9, 1.15, -22.0), fov: 40 }) },
  { t: [13.05, 13.6], hand: 0.3, focus: [0, -34], whip: true, cam: (t, u) => { const a = MathX.lerp(-0.1, 3.2, eo(Math.min(1, u * 1.6))); return { p: v3(-1.2, 1.6, -31.5), l: v3(-1.2 + Math.sin(a) * 10, 1.6, -31.5 + Math.cos(a) * 10), fov: 44 }; } },
  { t: [13.6, 15.0], hand: 0.25, focus: [0, -45], shake: [[13.95, 0.4, 0.15]], cam: (t, u) => ({ p: L3([-4.6, 2.4, -41.6], [-4.3, 2.5, -42.0], u), l: v3(0.2, 2.7, -45.6), fov: 32 }) },
  { t: [15.0, 15.25], black: true, focus: [0, -45], cam: () => ({ p: v3(-4.3, 2.5, -42), l: v3(0.2, 2.7, -45.6), fov: 32 }) },
  { t: [15.25, 17.0], hand: 0.2, focus: [0, -45], cam: (t, u) => ({ p: L3([1.8, 0.7, -39.2], [1.6, 0.8, -40.0], eio(u)), l: v3(0.4, 3.6, -45.6), fov: 40 }) },
  { t: [17.0, 18.7], hand: 0.15, focus: [0, -45], cam: (t, u, A) => { const k = A.killua.j.head.getWorldPosition(v3()); return { p: v3(k.x + 1.5, k.y + 0.1, k.z + 0.9), l: k.clone().add(v3(0, -0.05, 0)), fov: 30 }; } },
  // 19–27 the transformation
  { t: [18.7, 19.9], hand: 0.15, focus: [0, -22], cam: (t, u) => ({ p: L3([-0.9, 1.62, -23.35], [-0.9, 1.62, -23.1], u), l: v3(-0.9, 1.55, -22.0), fov: 28 }) },
  { t: [19.9, 20.7], hand: 0.3, focus: [0, -34], cam: (t, u, A) => { const o = A.officer.j.head.getWorldPosition(v3()); return { p: v3(o.x - 1.1, o.y + 0.05, o.z - 0.5), l: o.clone(), fov: 30 }; } },
  { t: [20.7, 21.5], hand: 0.0, focus: [0, -28], shake: [[20.72, 1.4, 0.4]], cam: (t, u) => ({ p: v3(4.5, 1.6, -44), l: v3(-2, 9, -23), fov: 50 }) },
  { t: [21.5, 22.6], hand: 0.8, focus: [0, -30], shake: [[21.5, 0.9, 0.5]], cam: (t, u) => ({ p: L3([5, 0.7, -38], [5.5, 0.8, -39], u), l: v3(-2, 3.5, -23), fov: 52 }) },
  { t: [22.6, 24.3], hand: 0.9, focus: [0, -28], cam: (t, u) => ({ p: v3(2.5, 1.0, -33), l: L3([-2, 3, -23], [-2, 14, -23], eio(u)), fov: 54 }) },
  { t: [24.3, 27.0], hand: 0.3, focus: [0, -36, 50], shake: [[25.5, 0.9, 0.6]], cam: (t, u) => ({ p: L3([3.2, 0.5, -57], [3.0, 0.48, -56.2], u), l: v3(-2, 9.5, -23), fov: 46 }) },
  // 27–34 Eren vs armour
  { t: [27.0, 28.9], hand: 0.35, focus: [-4, -66], shake: [[27.4, 0.4, 0.2], [27.7, 0.3, 0.3]], cam: (t, u) => ({ p: L3([-8.5, 1.5, -91], [-8.0, 1.5, -89], u), l: v3(-3, 8.5, -48), fov: 38 }) },
  { t: [28.9, 30.0], hand: 0.4, focus: [0, -56], shake: [[29.2, 0.5, 0.3], [29.6, 0.5, 0.3]], cam: (t, u) => ({ p: L3([21, 1.0, -61], [20, 1.0, -60], u), l: v3(-3.5, 7, -52), fov: 46 }) },
  { t: [30.0, 31.6], hand: 0.4, focus: [-12, -62], shake: [[31.0, 0.7, 0.4]], cam: (t, u) => ({ p: L3([-19, 2.2, -70], [-20, 2.4, -71], u), l: L3([-4, 5, -57], [-16, 7, -62], eio(u)), fov: 50 }) },
  { t: [31.6, 33.0], hand: 0.3, focus: [5, -60], shake: [[32.62, 1.5, 0.45]], cam: (t, u) => ({ p: v3(12.5, 0.6, -67.5), l: v3(4.5, 3.2, -60.5), fov: 48 }) },
  { t: [33.0, 34.0], hand: 0.3, focus: [-13, -74], cam: (t, u) => ({ p: v3(-17.5, 2.6, -81), l: L3([-13, 3.4, -74.6], [-11, 9, -66], eio(u)), fov: 40 }) },
  // 34–41 Killua vs the column
  { t: [34.0, 35.7], hand: 0.6, focus: [0, -26], shake: [[34.9, 0.4, 0.15]], cam: (t, u, A) => { const z = A.tankS.T5.z; return { p: v3(5.2, 0.9, z + 4.2), l: v3(1.8, 1.1, z), fov: 44 }; } },
  { t: [35.7, 36.6], hand: 0.7, focus: [0, -28], whip: true, cam: (t, u, A) => { const z = A.tankS.T6.z; return { p: v3(-4.5, 1.6, z + 6.5), l: v3(0.5, 2.0, MathX.lerp(z + 6, z, eo(Math.min(1, u * 2)))), fov: 44 }; } },
  { t: [36.6, 37.8], hand: 0.4, focus: [0, -40], shake: [[36.8, 0.5, 0.2]], cam: (t, u, A) => { const z = A.tankS.T7.z; return { p: v3(-1.6, 0.7, z - 9.5), l: v3(0.4, 1.6, z + 2), fov: 40 }; } },
  { t: [37.8, 39.4], hand: 0.5, focus: [-14, -79], cam: (t, u) => { const m = XW.mg[0]; return { p: v3(m[0] + 2.8, 1.1, m[1] + 4.2), l: v3(m[0] + 0.2, 1.1, m[1] - 1.2), fov: 38 }; } },
  { t: [39.4, 41.0], hand: 0.3, focus: [0, -80], shake: [[40.2, 0.4, 0.3]], cam: (t, u) => ({ p: v3(30, 0.4 + xGround(30, -80), -80), l: v3(-30, 0.6, -80), fov: 40 }) },
  // 41–49 parallel destruction, the aura walk
  { t: [41.0, 42.0], hand: 0.3, focus: [6, -66], shake: [[41.5, 1.0, 0.4]], cam: (t, u, A) => { const T = A.titan.root.position; return { p: v3(T.x + 9, 0.5, T.z + 14), l: v3(T.x, 6, T.z), fov: 50 }; } },
  { t: [42.0, 43.0], hand: 0.6, focus: [30, -81], cam: (t, u) => { const m = XW.mg[1]; return { p: v3(m[0] - 3.2, 1.0, m[1] + 3.5), l: v3(m[0] - 0.2, 1.1, m[1] - 1.4), fov: 38 }; } },
  { t: [43.0, 44.2], hand: 0.4, focus: [16, -84], shake: [[43.4, 1.0, 0.5]], cam: (t, u) => ({ p: L3([30, 1.0, -70], [29, 1.0, -71], u), l: v3(16, 6, -85), fov: 48 }) },
  { t: [44.2, 45.2], hand: 0.8, focus: [-8, 0], cam: (t, u) => ({ p: v3(-4.5, 2.2, 1), l: v3(-8.5, 3.0, 6 - 12 * u), fov: 46 }) },
  { t: [45.2, 46.4], hand: 0.3, focus: [10, -84], shake: [[45.4, 0.7, 0.8]], cam: (t, u, A) => { const h = A.titan.j.head.getWorldPosition(v3()); return { p: v3(h.x + 7, h.y - 7, h.z + 10), l: h, fov: 40 }; } },
  { t: [46.4, 49.0], hand: 0.15, focus: [-4, -66, 45], shake: [[47.6, 0.35, 0.6]], cam: (t, u) => ({ p: L3([0.9, 1.0, -57.6], [0.95, 1.0, -56.8], u), l: v3(0.4, 2.6, -70), fov: 30 }) },
  // 49–57 the army adapts
  { t: [49.0, 50.4], hand: 0.3, focus: [-8, -126], cam: (t, u) => ({ p: v3(-13.6, 1.5, -121.6), l: v3(-9.5, 1.35, -126), fov: 34 }) },
  { t: [50.4, 52.5], hand: 0.4, focus: [0, -120, 50], shake: [[51.0, 0.6, 0.3], [51.15, 0.4, 0.3], [51.3, 0.4, 0.3]], cam: (t, u) => ({ p: L3([-2, 1.4, -134], [-2, 1.6, -133], u), l: v3(-4, 9, -84), fov: 40 }) },
  { t: [52.5, 54.0], hand: 0.3, focus: [0, -90, 50], cam: (t, u) => ({ p: L3([28, 3.0, -64], [26, 3.0, -65], u), l: v3(-2, 6, -92), fov: 46 }) },
  { t: [54.0, 57.0], hand: 0.15, focus: [-2, -72, 50], cam: (t, u) => ({ p: L3([1.4, 0.32, -53.6], [1.3, 0.34, -54.6], u), l: v3(-2.5, 8.8, -80), fov: 50 }) },
  // 57–65 it fails
  { t: [57.0, 58.6], hand: 0.4, focus: [0, -126], cam: (t, u) => ({ p: v3(-34, 1.6, -121), l: v3(10, 1.2, -127), fov: 30 }) },
  { t: [58.6, 60.6], hand: 0.4, focus: [-2, -100], shake: [[58.6, 0.5, 0.2], [59.2, 0.5, 0.2], [60.0, 0.6, 0.4]], cam: (t, u) => ({ p: L3([-1, 1.2, -119], [-1, 1.2, -116], u), l: v3(-5, 8, -90), fov: 44 }) },
  { t: [60.6, 62.2], hand: 0.5, focus: [-6, -98], shake: [[60.6, 1.6, 0.5]], cam: (t, u) => ({ p: v3(10, 0.8, -106), l: v3(-7, 4, -98), fov: 50 }) },
  { t: [62.2, 63.0], hand: 0.2, focus: [0, -100], cam: (t, u) => ({ p: v3(2, 1.2, -110), l: v3(-2, 2, -96), fov: 50 }) },
  { t: [63.0, 65.0], hand: 0.5, focus: [0, -104], cam: (t, u) => ({ p: L3([2, 0.6, -112], [1.8, 0.65, -111], u), l: v3(-1, 1.6, -98), fov: 46 }) },
  // 65–72 the final poster
  { t: [65.0, 72.0], hand: 0.12, focus: [-2, -96, 45], shake: [[67.0, 0.3, 0.5], [67.6, 0.4, 0.8]], cam: (t, u) => ({ p: L3([5.2, 1.0, -108.5], [4.6, 0.9, -107.4], eio(Math.min(1, u * 1.2))), l: L3([2.8, 3.2, -97], [1.5, 6.5, -94], eio(Math.min(1, u * 1.1))), fov: MathX.lerp(36, 44, eio(Math.min(1, u * 1.1))) }) },
];
function xShotAt(t) { for (let i = XSHOTS.length - 1; i >= 0; i--) if (t >= XSHOTS[i].t[0]) return XSHOTS[i]; return XSHOTS[0]; }
