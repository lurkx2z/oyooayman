/* =====================================================================
   STADIUM SET — a Saturday-night match across the bay: an oval bowl of 46 rows with ~40,000 fans (one instanced mesh,
   posed in its vertex shader: sitting → standing, the right arm up with a phone, the head turning), the 22 players, the
   referee and the ball, four floodlight towers on the stadium's own feed (it trips last: LF_STAD_D), the LED boards and
   the big screen. Then the dark, and the phones (their LEDs fade with LFP.led, like every LED in the film).
     stadA   the floodlights go (9:00:14.4 PM, ten times slower)
     stadB   in the crowd: the phones light up
     stadC   ×3 (9:01:53 PM): the phones going dark under the stars
   Stadium-local: x along the pitch (east), y up from the pitch, z south (the same axes as the world, so the sky fits).
   No two surfaces share a plane: boards and posts sit 5 cm into the grass, the pitch's lines are in its texture.
   ===================================================================== */

Object.assign(LOOKS, {
  lfPl1: { skin: 2, build: 'slim', shirt: '#c8322a', sleeves: 'short', pants: '#16161a', shoes: '#f2f0ea', sole: '#f2f0ea', hair: '#141010' },
  lfPl1b: { skin: 4, build: 'avg', shirt: '#c8322a', sleeves: 'short', pants: '#16161a', shoes: '#1a1a1c', sole: '#f2f0ea', hair: '#0e0b09' },
  lfPl2: { skin: 0, build: 'slim', shirt: '#e8e8ea', sleeves: 'short', pants: '#24346a', shoes: '#1a1a1c', sole: '#f2f0ea', hair: '#c8a46a' },
  lfPl2b: { skin: 3, build: 'avg', shirt: '#e8e8ea', sleeves: 'short', pants: '#24346a', shoes: '#f2f0ea', sole: '#f2f0ea', hair: '#141010' },
  lfGk1: { skin: 1, build: 'broad', shirt: '#d8e04a', sleeves: 'long', pants: '#16161a', shoes: '#1a1a1c', sole: '#f2f0ea', hair: '#2a1a12' },
  lfGk2: { skin: 5, build: 'broad', shirt: '#36b06a', sleeves: 'long', pants: '#16161a', shoes: '#1a1a1c', sole: '#f2f0ea', hair: '#141010' },
  lfRef: { skin: 2, build: 'avg', shirt: '#1a1a1e', sleeves: 'short', pants: '#1a1a1e', shoes: '#1a1a1c', sole: '#f2f0ea', hair: '#6a5a48' },
  lfFan3: { skin: 4, build: 'broad', shirt: '#c8322a', sleeves: 'long', pants: '#2f3a4a', shoes: '#2a2018', sole: '#1a1612', hair: '#141010', jacket: true },
  lfFan4: { skin: 1, build: 'slim', shirt: '#c8322a', sleeves: 'short', pants: '#3a4a6a', shoes: '#e8e4dc', sole: '#f2f0ea', hair: '#6a3a1a', hairStyle: 'pony' },
  lfFan5: { skin: 3, build: 'avg', shirt: '#1f2328', sleeves: 'long', pants: '#22262c', shoes: '#111', sole: '#2a2a2a', hair: '#0e0b09', hat: { type: 'beanie', color: '#c8322a' } },
  lfFan6: { skin: 0, build: 'avg', shirt: '#8a1f1a', sleeves: 'long', pants: '#2a2d33', shoes: '#2a2018', sole: '#1a1612', hair: '#d8b06a', hairStyle: 'long', jacket: true },
});

const LF_SDK = { d: 1.0, y0: 2.0, rise: (LF_SD.top - 2.0) / LF_SD.rows, aisles: 32, seatW: 0.5, aisleW: 1.3, back: 49 };
const lfSdY = (r) => LF_SDK.y0 + r * LF_SDK.rise;                                  // the tread of row r
const lfSdP = (d, th) => [(LF_SD.inA + d) * Math.cos(th), (LF_SD.inB + d) * Math.sin(th)];
// the floodlight towers (as city.js puts them), their heads 58 m up
const LF_SD_TOW = [[-92, -74], [92, -74], [-92, 74], [92, 74]].map(([x, z]) => ({ x, z, y: 58 }));
// the cameras' seats (for the fans drawn as full people around them): [row, x]
const LF_SD_CAM = { B: [20, -4.2], C: [45, -110] };

// every seat: row r, its angle, where it is (x, z, tread y), facing the pitch; seats are spread evenly along each row
// between the aisles (at fixed angles, so they line up row to row)
function lfSdSeats() {
  const out = [], K = LF_SDK;
  for (let r = 0; r < LF_SD.rows; r++) {
    const A = LF_SD.inA + r + 0.55, B = LF_SD.inB + r + 0.55, N = 4096, L = new Float32Array(N + 1);
    let px = A, pz = 0;
    for (let i = 1; i <= N; i++) { const th = i / N * Math.PI * 2, x = A * Math.cos(th), z = B * Math.sin(th); L[i] = L[i - 1] + Math.hypot(x - px, z - pz); px = x; pz = z; }
    const thAt = (len) => { let a = 0, b = N; while (b - a > 1) { const m = (a + b) >> 1; if (L[m] < len) a = m; else b = m; } const f = (len - L[a]) / Math.max(1e-6, L[b] - L[a]); return (a + f) / N * Math.PI * 2; };
    const lenAt = (th) => { const f = th / (Math.PI * 2) * N, i = Math.min(N - 1, Math.floor(f)); return L[i] + (L[i + 1] - L[i]) * (f - i); };
    for (let a = 0; a < K.aisles; a++) {
      const l0 = lenAt((a + 0.5) / K.aisles * Math.PI * 2) + K.aisleW / 2, l1 = lenAt(((a + 1.5) % K.aisles) / K.aisles * Math.PI * 2) + (a === K.aisles - 1 ? L[N] : 0) - K.aisleW / 2;
      const n = Math.floor((l1 - l0) / K.seatW);
      for (let j = 0; j < n; j++) {
        const th = thAt(((l0 + (j + 0.5) * (l1 - l0) / n) % L[N] + L[N]) % L[N]), x = A * Math.cos(th), z = B * Math.sin(th);
        const nx = -x / (A * A), nz = -z / (B * B), nl = Math.hypot(nx, nz);
        out.push({ r, th, x, z, y: lfSdY(r), fx: nx / nl, fz: nz / nl, sec: a, j, n });
      }
    }
  }
  return out;
}

// the pitch: mown stripes, the lines, the grass beyond them (one texture over the whole floor of the bowl)
function lfPitchCanvas() {
  const W = 2048, H = Math.round(2048 * 96.4 / 132.4), sx = W / 132.4, X = (x) => (x + 66.2) * sx, Z = (z) => (z + 48.2) * sx;
  return lfCanvas(W, H, (g) => {
    g.fillStyle = '#2f6a2c'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 16; i++) { const x0 = -70 + i * 8.75; g.fillStyle = i % 2 ? 'rgba(255,255,255,0.045)' : 'rgba(0,0,0,0.06)'; g.fillRect(X(x0), 0, 8.75 * sx + 1, H); }
    const r = new RNG(91); for (let i = 0; i < 60000; i++) { const v = r.next(); g.fillStyle = v < 0.5 ? 'rgba(20,50,18,0.12)' : 'rgba(120,170,90,0.07)'; g.fillRect(r.next() * W, r.next() * H, 1 + r.next() * 2, 1 + r.next() * 2); }
    g.strokeStyle = 'rgba(240,244,236,0.92)'; g.lineWidth = Math.max(2, 0.12 * sx);
    const rect = (x0, z0, x1, z1) => g.strokeRect(X(x0), Z(z0), (x1 - x0) * sx, (z1 - z0) * sx);
    rect(-52.5, -34, 52.5, 34); g.beginPath(); g.moveTo(X(0), Z(-34)); g.lineTo(X(0), Z(34)); g.stroke();
    g.beginPath(); g.arc(X(0), Z(0), 9.15 * sx, 0, 6.29); g.stroke();
    for (const sgn of [-1, 1]) {
      const gx = 52.5 * sgn; rect(Math.min(gx, gx - 16.5 * sgn), -20.16, Math.max(gx, gx - 16.5 * sgn), 20.16); rect(Math.min(gx, gx - 5.5 * sgn), -9.16, Math.max(gx, gx - 5.5 * sgn), 9.16);
      g.fillStyle = 'rgba(240,244,236,0.92)'; g.beginPath(); g.arc(X(gx - 11 * sgn), Z(0), 0.2 * sx, 0, 6.29); g.fill();
      const a0 = Math.acos(5.5 / 9.15); g.beginPath(); if (sgn > 0) g.arc(X(gx - 11), Z(0), 9.15 * sx, Math.PI - a0, Math.PI + a0); else g.arc(X(gx + 11), Z(0), 9.15 * sx, -a0, a0); g.stroke();
      for (const zs of [-1, 1]) { g.beginPath(); g.arc(X(gx), Z(34 * zs), 1 * sx, 0, 6.29); g.stroke(); }
    }
    g.fillStyle = 'rgba(240,244,236,0.92)'; g.beginPath(); g.arc(X(0), Z(0), 0.2 * sx, 0, 6.29); g.fill();
  });
}
// the LED boards round the pitch, the big screen (invented names only)
function lfBoardCanvas() {
  return lfCanvas(2048, 64, (g, w, h) => {
    const ads = [['COASTAL RAIL', '#0e4a8a', '#ffffff'], ['HARBOUR FC', '#c8322a', '#ffffff'], ['NORTHWIND ENERGY', '#101418', '#7fe0ff'], ['KESTREL MOBILE', '#f2c230', '#141414'], ['BAYVIEW HOSPITAL FOUNDATION', '#e8e8ea', '#c8322a'], ['SALT & PINE', '#1d5a3a', '#f2f0ea']];
    let x = 0, i = 0;
    while (x < w) { const [t, bg, fg] = ads[i % ads.length]; const tw = 360; g.fillStyle = bg; g.fillRect(x, 0, tw, h); g.fillStyle = fg; g.font = '800 34px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x + tw / 2, h / 2 + 2, tw - 24); x += tw; i++; }
  });
}
function lfScreenDraw(g, w, h, st) {
  g.fillStyle = '#05070a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#0e1a2e'; g.fillRect(8, 8, w - 16, h - 16);
  g.fillStyle = '#c8322a'; g.fillRect(40, 70, 300, 120); g.fillStyle = '#e8e8ea'; g.fillRect(w - 340, 70, 300, 120);
  g.font = '800 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#ffffff'; g.fillText('HARBOUR', 190, 132); g.fillStyle = '#24346a'; g.fillText('NORTHSIDE', w - 190, 132);
  g.fillStyle = '#ffffff'; g.font = '800 110px sans-serif'; g.fillText('1  –  0', w / 2, 132);
  g.font = '700 54px sans-serif'; g.fillStyle = '#ffd36a'; g.fillText(st.clock, w / 2, 248);
}

// a fan in the crowd, sitting (position) and standing (aPos2), with its parts: 0 shirt, 1 skin, 2 hair, 3 legs; rig 1 =
// the head (turns), rig 2 = the right arm (raises, holding the phone); local +z faces the pitch, y 0 is the tread
function lfFanGeo() {
  const parts = [];
  const P = (geo, sit, stand, part, rig) => parts.push({ geo, sit, stand, part, rig });
  const M = (x, y, z, rx = 0) => new THREE.Matrix4().makeRotationX(rx).setPosition(x, y, z), ZS = LF_FAN_ZS;
  const Ms = (x, y, z, rx = 0) => M(x, y, z + ZS, rx);
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d), cap = (r, l, sz = 1, seg = 6) => { const g = new THREE.CapsuleGeometry(r, l, 2, seg); g.scale(1, 1, sz); return g; };
  P(cap(0.2, 0.2, 0.6, 7), M(0, 0.74, -0.06), Ms(0, 1.19, -0.02), 0, 0);                            // torso (rounded shoulders)
  P(new THREE.IcosahedronGeometry(0.105, 1), M(0, 1.16, -0.04), Ms(0, 1.61, 0.0), 1, 1);              // head
  P(new THREE.SphereGeometry(0.112, 7, 3, 0, Math.PI * 2, 0, Math.PI * 0.5), M(0, 1.172, -0.052, -0.35), Ms(0, 1.622, -0.012, -0.35), 2, 1);   // hair
  P(cap(0.048, 0.2, 1, 5), M(-0.235, 0.84, -0.04), Ms(-0.235, 1.29, 0.0), 0, 0);                      // left upper arm
  P(cap(0.042, 0.22, 1, 5), M(-0.21, 0.62, 0.1, 1.45), Ms(-0.235, 1.0, 0.02), 0, 0);                  // left forearm
  P(new THREE.OctahedronGeometry(0.045, 0), M(-0.2, 0.6, 0.27), Ms(-0.235, 0.82, 0.03), 1, 0);        // left hand
  P(cap(0.046, 0.48, 1, 5), M(0.235, 0.73, -0.04), Ms(0.235, 1.18, 0.0), 0, 2);                       // right arm (straight, from the shoulder)
  P(new THREE.OctahedronGeometry(0.047, 0), M(0.235, 0.41, -0.04), Ms(0.235, 0.86, 0.0), 1, 2);       // right hand
  for (const x of [-0.1, 0.1]) {
    P(cap(0.08, 0.3, 1, 5), M(x, 0.5, 0.16, Math.PI / 2), Ms(x, 0.72, -0.02), 3, 0);                  // thighs
    P(cap(0.065, 0.32, 1, 5), M(x, 0.23, 0.38), Ms(x, 0.25, 0.0), 3, 0);                             // shins
  }
  void box;
  const pos = [], pos2 = [], nor = [], nor2 = [], part = [], rig = [];
  for (const q of parts) {
    const g = q.geo.index ? q.geo.toNonIndexed() : q.geo, a = g.clone().applyMatrix4(q.sit), b = g.clone().applyMatrix4(q.stand);
    pos.push(...a.attributes.position.array); nor.push(...a.attributes.normal.array); pos2.push(...b.attributes.position.array); nor2.push(...b.attributes.normal.array);
    for (let i = 0; i < a.attributes.position.count; i++) { part.push(q.part); rig.push(q.rig); }
  }
  const G = new THREE.InstancedBufferGeometry();
  G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  G.setAttribute('aPos2', new THREE.Float32BufferAttribute(pos2, 3)); G.setAttribute('aNor2', new THREE.Float32BufferAttribute(nor2, 3));
  G.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1)); G.setAttribute('aRig', new THREE.Float32BufferAttribute(rig, 1));
  return G;
}
// the GLSL for a fan's pose: shared by the crowd and its phones (the hand's position)
const LF_FAN_ZS = 0.25;                                   // a standing fan stands in front of the seat
const LF_FAN_GLSL = `
  vec3 lfShoulder(float st){ return vec3(0.25, mix(1.02, 1.47, st), mix(-0.04, ${LF_FAN_ZS.toFixed(2)}, st)); }
  vec3 lfRotX(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c); }
  vec3 lfRotY(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c); }
  vec3 lfFanPose(vec3 p, float rig, vec4 dyn){
    if (rig > 1.5) { vec3 sh = lfShoulder(dyn.x); return sh + lfRotX(p - sh, -2.5 * dyn.y); }
    if (rig > 0.5) { vec3 nk = vec3(0.0, mix(1.04, 1.49, dyn.x), mix(-0.04, ${(LF_FAN_ZS - 0.02).toFixed(2)}, dyn.x)); return nk + lfRotY(p - nk, dyn.z); }
    return p; }
  vec3 lfFanNorm(vec3 n, float rig, vec4 dyn){ if (rig > 1.5) return lfRotX(n, -2.5 * dyn.y); if (rig > 0.5) return lfRotY(n, dyn.z); return n; }
`;

LF_SETS.stadium = (app) => {
  const S = lfSet(app, { sky: '#02040a', fov: 54, near: 0.1, far: 12000, hemi: ['#5a6a8a', '#18160f', 0.0], env: ['#1a2234', '#0c0f16', '#050506'] });
  const scene = S.scene, cam = S.camera, SD = LF_SD, K = LF_SDK;
  const sky = lfBuildSky(scene, {});
  // ---------------------------------------------------------------------------------------------------- the bowl
  { const P = [], N = [], C = [], NS = 720;
    const col = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
    const quad = (a, b, c, d, want, cl) => {           // a b c d around the quad; want: the side the normal should face
      const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      let n = lfN3([u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]);
      let q = [a, b, c, a, c, d];
      if (n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0) { n = [-n[0], -n[1], -n[2]]; q = [a, c, b, a, d, c]; }
      for (const p of q) { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(cl[0], cl[1], cl[2]); }
    };
    const cTread = col('#5c5e62'), cAisle = col('#7a7c7e'), cRiser = col('#3e4044'), cWall = col('#141c2a'), cConc = col('#4a4c50'), cNose = col('#a89a3a');
    const aisleAt = (th, r) => { const k = th / (Math.PI * 2) * K.aisles - 0.5, f = Math.abs(k - Math.round(k)) * (Math.PI * 2) / K.aisles;
      const A = SD.inA + r, B = SD.inB + r, rl = Math.hypot(A * Math.sin(th), B * Math.cos(th)); return f * rl < K.aisleW / 2; };
    for (let i = 0; i < NS; i++) {
      const t0 = i / NS * Math.PI * 2, t1 = (i + 1) / NS * Math.PI * 2, tc = (t0 + t1) / 2;
      const p = (d, y, th) => { const q = lfSdP(d, th); return [q[0], y, q[1]]; }, inw = (d) => { const q = lfSdP(d, tc); return lfN3([-q[0] / (SD.inA + d) ** 2, 0, -q[1] / (SD.inB + d) ** 2]); };
      // the front wall (padded, dark), from under the grass
      quad(p(0, -0.1, t0), p(0, -0.1, t1), p(0, K.y0, t1), p(0, K.y0, t0), inw(0), cWall);
      for (let r = 0; r < SD.rows; r++) {
        const y = lfSdY(r), y1 = lfSdY(r + 1), ai = aisleAt(tc, r + 0.5);
        quad(p(r, y, t0), p(r, y, t1), p(r + 1, y, t1), p(r + 1, y, t0), [0, 1, 0], ai ? cAisle : cTread);
        quad(p(r + 1, y, t0), p(r + 1, y, t1), p(r + 1, y1, t1), p(r + 1, y1, t0), inw(r + 1), ai ? cNose : cRiser);
      }
      // the top concourse, its back wall and cap
      const yt = lfSdY(SD.rows);
      quad(p(SD.rows, yt, t0), p(SD.rows, yt, t1), p(K.back, yt, t1), p(K.back, yt, t0), [0, 1, 0], cConc);
      quad(p(K.back, yt, t0), p(K.back, yt, t1), p(K.back, yt + 3.2, t1), p(K.back, yt + 3.2, t0), inw(K.back), cRiser);
      quad(p(K.back, yt + 3.2, t0), p(K.back, yt + 3.2, t1), p(K.back + 0.4, yt + 3.2, t1), p(K.back + 0.4, yt + 3.2, t0), [0, 1, 0], cConc);
      const out = inw(K.back + 0.4); quad(p(K.back + 0.4, yt + 3.2, t0), p(K.back + 0.4, yt + 3.2, t1), p(K.back + 0.4, -0.5, t1), p(K.back + 0.4, -0.5, t0), [-out[0], 0, -out[2]], cRiser);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    const bowl = new THREE.Mesh(g, lfStd('#ffffff', 0.92, 0, { vertexColors: true })); bowl.castShadow = true; bowl.receiveShadow = true; scene.add(bowl); }
  // the ground outside the bowl (seen past the rim from the top rows), dark
  { const g = new THREE.RingGeometry(140, 4000, 64, 1); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, lfStd('#0a0c0e', 1)); m.position.y = -0.6; scene.add(m); }
  // ---------------------------------------------------------------------------------------------------- the pitch
  { const sh = new THREE.Shape(); sh.absellipse(0, 0, SD.inA + 0.2, SD.inB + 0.2, 0, Math.PI * 2, false, 0);
    const g = new THREE.ShapeGeometry(sh, 96); const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); uv.setXY(i, (x + 66.2) / 132.4, (y + 48.2) / 96.4); }
    g.rotateX(-Math.PI / 2);   // shape y → −z: v = 1 (the canvas's top row) is z = −48.2, as drawn
    const tex = lfTex(lfPitchCanvas(), { repeat: false, aniso: 8 });
    const pitch = new THREE.Mesh(g, lfStd('#ffffff', 0.92, 0, { map: tex })); pitch.receiveShadow = true; scene.add(pitch); }
  // the goals (posts and bar 12 cm; their feet 5 cm into the grass), their nets
  const netTex = lfTex(lfCanvas(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = '#ffffff'; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 16); g.lineTo(w, i * 16); g.stroke(); } }));
  const postM = lfStd('#f4f4f2', 0.4), netM = lfStd('#e8e8e8', 0.8, 0, { alphaMap: netTex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, depthWrite: false });
  for (const sg of [-1, 1]) {
    const gx = 52.5 * sg;
    for (const z of [-3.66, 3.66]) lfCyl(0.06, 0.06, 2.49, postM, gx, 1.195, z, null, 12);
    const bar = lfCyl(0.06, 0.06, 7.44, postM, gx, 2.44, 0, null, 12); bar.rotation.x = Math.PI / 2;
    const D = 2.0, back = gx + sg * D;
    const net = (w, h, x, y, z, f) => { const g = new THREE.PlaneGeometry(w, h); f(g); const t = netTex.clone(); t.repeat.set(w / 1.0, h / 1.0); t.needsUpdate = true;
      const mm = netM.clone(); mm.alphaMap = t; const m = new THREE.Mesh(g, mm); m.position.set(x, y, z); m.renderOrder = 2; scene.add(m); };
    net(7.32, 2.44, back, 1.22, 0, (g) => g.rotateY(Math.PI / 2));
    for (const z of [-3.66, 3.66]) net(D, 2.44, gx + sg * D / 2, 1.22, z, () => {});
    net(D, 7.32, gx + sg * D / 2, 2.4, 0, (g) => g.rotateX(-Math.PI / 2));   // (the roof net just under the posts' tops)
    for (const z of [-3.66, 3.66]) lfCyl(0.03, 0.03, 2.44, postM, back, 1.2, z, null, 8);
  }
  for (const [x, z] of [[-52.5, -34], [52.5, -34], [-52.5, 34], [52.5, 34]]) { lfCyl(0.02, 0.02, 1.55, lfStd('#e8e030', 0.5), x, 0.73, z, null, 6);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.3), lfStd('#e83a2a', 0.7, 0, { side: THREE.DoubleSide })); f.position.set(x + 0.2, 1.36, z); scene.add(f); }
  // the LED boards: 4 runs round the pitch, 0.9 m high (5 cm into the grass), their faces a band of ads
  const bTex = lfTex(lfBoardCanvas(), { aniso: 8 }); bTex.wrapS = THREE.RepeatWrapping;
  const boardM = new THREE.MeshBasicMaterial({ map: bTex, color: '#ffffff' }), boardBack = lfStd('#15171a', 0.8);
  for (const [w, x, z, ry] of [[104, 0, -38.5, 0], [104, 0, 38.5, Math.PI], [64, -57.5, 0, Math.PI / 2], [64, 57.5, 0, -Math.PI / 2]]) {
    const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry; scene.add(b);
    lfBox(w, 0.95, 0.16, boardBack, 0, 0.425, -0.01, b).castShadow = true;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.86), boardM); face.position.set(0, 0.45, 0.075); b.add(face);
    const t = bTex.clone(); t.repeat.set(w / 36, 1); t.needsUpdate = true; face.material = boardM.clone(); face.material.map = t; b.userData.face = face;
  }
  const boardFaces = []; scene.traverse((o) => { if (o.userData && o.userData.face) boardFaces.push(o.userData.face.material); });
  // the big screen above the north stand
  const SCR = lfCanvasTex(1024, 320, lfScreenDraw);
  const scrM = new THREE.MeshBasicMaterial({ map: SCR.tex, color: '#ffffff' });
  { const g = new THREE.Group(); g.position.set(38, lfSdY(SD.rows) + 9.5, -(SD.inB + K.back) * Math.sqrt(1 - (38 / (SD.inA + K.back)) ** 2) + 1.2); scene.add(g);
    lfBox(30, 11.2, 0.8, lfStd('#16181c', 0.7), 0, 0, -0.45, g);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(29, 9.4), scrM); f.position.z = 0.02; g.add(f);
    for (const x of [-11, 11]) lfBox(0.6, 9.2, 0.6, lfStd('#2a2c30', 0.7, 0.4), x, -9.6, -0.9, g); }
  // ---------------------------------------------------------------------------------------------------- the floodlights
  const dot = lfDotTex(0.3), towers = [];
  const steel = lfStd('#2c3036', 0.7, 0.5);
  for (const T of LF_SD_TOW) {
    lfCyl(0.9, 1.6, T.y - 2, steel, T.x, (T.y - 2) / 2 - 0.5, T.z, null, 10);
    const head = new THREE.Group(); head.position.set(T.x, T.y + 2, T.z); head.lookAt(0, 0, 0); scene.add(head);
    lfBox(13, 7, 0.9, steel, 0, 0, -0.5, head);
    const lampM = new THREE.MeshBasicMaterial({ color: '#f4f7ff' });
    const sprites = [];
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(0.72, 18), lampM); m.position.set(-5.2 + i * 2.08, -2.4 + j * 1.6, 0.0); head.add(m);
      if ((i + j) % 2 === 0) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: dot, color: '#eef4ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.set(9, 9, 1); sp.position.set(-5.2 + i * 2.08, -2.4 + j * 1.6, 0.4); head.add(sp); sprites.push(sp); }
    }
    const L = new THREE.SpotLight('#f2f5ff', 0, 0, 0.62, 0.55, 2); L.position.set(T.x, T.y + 2, T.z);
    L.target.position.set(T.x * 0.12, 0, T.z * 0.08); L.castShadow = true; L.shadow.mapSize.set(2048, 2048); L.shadow.camera.near = 40; L.shadow.camera.far = 260; L.shadow.bias = -0.0002; L.shadow.normalBias = 0.04;
    scene.add(L); scene.add(L.target);
    towers.push({ head, lampM, sprites, L });
  }
  const spill = new THREE.HemisphereLight('#dfe6f2', '#2a3a26', 0); scene.add(spill);            // the floodlights' spill on the stands
  const phAmb = new THREE.HemisphereLight('#9fb4e8', '#141820', 0); scene.add(phAmb);              // 40,000 phones' light
  // the exit signs (battery LEDs): over the aisles on the front wall, on the concourse wall
  const exitM = new THREE.MeshBasicMaterial({ color: '#2aff6a' }), exits = [];
  for (let a = 0; a < K.aisles; a += 2) { const th = (a + 0.5) / K.aisles * Math.PI * 2;
    for (const [d, y] of [[-0.12, 1.55], [K.back - 0.1, lfSdY(SD.rows) + 2.5]]) { const q = lfSdP(d, th), m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.26, 0.06), exitM); m.position.set(q[0], y, q[1]); m.lookAt(0, y, 0); scene.add(m); exits.push(m); } }
  // ---------------------------------------------------------------------------------------------------- the seats
  const seats = lfSdSeats();
  { const g = THREE.mergeGeometries([new THREE.BoxGeometry(0.44, 0.06, 0.36).translate(0, 0.42, 0.04), new THREE.BoxGeometry(0.44, 0.4, 0.05).translate(0, 0.64, -0.15), new THREE.BoxGeometry(0.07, 0.42, 0.07).translate(0, 0.19, -0.05)].map((x) => x.toNonIndexed()));
    const m = new THREE.InstancedMesh(g, lfStd('#ffffff', 0.5), seats.length), M4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1), c = new THREE.Color();
    seats.forEach((s, i) => { q.setFromEuler(e.set(0, Math.atan2(s.fx, s.fz), 0)); M4.compose(new THREE.Vector3(s.x, s.y, s.z), q, one); m.setMatrixAt(i, M4);
      const band = Math.floor(s.r / 6) % 2, blk = (s.sec % 4 === 1 && s.r > 8 && s.r < 30); m.setColorAt(i, c.set(blk ? '#c8322a' : band ? '#1e4a8e' : '#2456a6')); });
    m.receiveShadow = true; scene.add(m); }
  // ---------------------------------------------------------------------------------------------------- the crowd
  // who sits where (a few empty seats; the seats round the cameras are left to the full people below)
  const nearB = (s) => s.r >= 17 && s.r <= 20 && s.z > 0 && Math.abs(s.x - LF_SD_CAM.B[1]) < (s.r === 20 ? 1.7 : 1.35);
  const nearC = (s) => s.r >= 43 && s.x < 0 && Math.abs(s.z) < (s.r === 45 ? 2.6 : 1.4) && s.x < -100;
  const fans = seats.filter((s, i) => !nearB(s) && !nearC(s) && lfR(i, 7) > 0.055);
  const NF = fans.length;
  const G = lfFanGeo();
  const iShirt = new Float32Array(NF * 3), iSkin = new Float32Array(NF * 3), iHair = new Float32Array(NF * 3), iPants = new Float32Array(NF * 3), iDyn = new Float32Array(NF * 4), iBase = new Float32Array(NF * 4), iPh = new Float32Array(NF * 4);
  const SKINC = SKIN.map((h) => new THREE.Color(h)), tmp = new THREE.Color();
  const SH_HOME = ['#c8322a', '#c8322a', '#b02a24', '#d8402e', '#1f2328'], SH_AWAY = ['#e8e8ea', '#24346a', '#e8e8ea', '#2f4a8a'], SH_ANY = ['#1f2328', '#3a3f48', '#5a6270', '#2f4a6a', '#6a5a48', '#2f5a3a', '#d9b84a', '#8a8f98', '#c8322a', '#e8e8ea'];
  // each fan's story: a phone already up filming (10%), or when they get it out, when the torch goes on; when they stand
  const F = fans.map((s, i) => {
    const r1 = lfR(i, 11), r2 = lfR(i, 12), r3 = lfR(i, 13), r4 = lfR(i, 14), r5 = lfR(i, 15);
    const film = r1 < 0.1, never = !film && r1 > 0.93, t0 = film ? -10 : 14.75 + 0.7 * -Math.log(1 - 0.995 * r2), torch = r3 < 0.62, t1 = torch ? t0 + 0.25 + 1.6 * r4 : 1e9;
    const sNow = r5 < 0.04, stand = r5 < 0.78, ts = 14.8 + 0.9 * -Math.log(1 - 0.99 * lfR(i, 16));
    return { film, never, t0, t1, torch, sNow, stand, ts, arm: film ? 0.52 + 0.06 * r4 : torch ? 0.84 + 0.14 * r4 : 0.32 + 0.12 * r4, look: (lfR(i, 17) - 0.5) * 0.7 };
  });
  fans.forEach((s, i) => {
    const away = s.x > 70 || (s.x > 40 && s.sec % 7 === 3), home = s.x < -70;
    const pal = away ? (lfR(i, 21) < 0.75 ? SH_AWAY : SH_ANY) : home ? (lfR(i, 21) < 0.85 ? SH_HOME : SH_ANY) : (lfR(i, 21) < 0.55 ? SH_HOME : SH_ANY);
    tmp.set(pal[Math.floor(lfR(i, 22) * pal.length)]).multiplyScalar(0.8 + 0.3 * lfR(i, 23)); iShirt.set([tmp.r, tmp.g, tmp.b], i * 3);
    const sk = SKINC[Math.floor(lfR(i, 24) * SKINC.length)]; iSkin.set([sk.r, sk.g, sk.b], i * 3);
    const hv = lfR(i, 25); tmp.set(hv < 0.5 ? '#141010' : hv < 0.75 ? '#3a2a1a' : hv < 0.9 ? '#8a6a40' : '#bab4aa'); if (lfR(i, 26) < 0.18) tmp.set(lfR(i, 27) < 0.5 ? '#c8322a' : '#1f2328'); iHair.set([tmp.r, tmp.g, tmp.b], i * 3);
    tmp.set(lfR(i, 28) < 0.5 ? '#2f3a4a' : lfR(i, 28) < 0.8 ? '#22262c' : '#4a5a7a'); iPants.set([tmp.r, tmp.g, tmp.b], i * 3);
    iBase.set([s.x, s.y, s.z, Math.atan2(s.fx, s.fz)], i * 4);
    const f = F[i]; iPh.set([f.never ? 1e9 : f.t0, f.never ? 1e9 : f.t1, lfR(i, 29), f.film ? 1 : 0], i * 4);
  });
  const IA = (a, n) => new THREE.InstancedBufferAttribute(a, n);
  const aDyn = IA(iDyn, 4); aDyn.setUsage(THREE.DynamicDrawUsage);
  G.setAttribute('iShirt', IA(iShirt, 3)); G.setAttribute('iSkin', IA(iSkin, 3)); G.setAttribute('iHair', IA(iHair, 3)); G.setAttribute('iPants', IA(iPants, 3));
  G.setAttribute('iBase', IA(iBase, 4)); G.setAttribute('iPh', IA(iPh, 4)); G.setAttribute('iDyn', aDyn);
  G.instanceCount = NF;
  const CU = { uS: { value: 0 }, uLed: { value: 1 }, uPhoneE: { value: 0 } };
  const crowdM = lfStd('#ffffff', 0.85);
  crowdM.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, CU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
      attribute vec3 aPos2, aNor2, iShirt, iSkin, iHair, iPants; attribute float aPart, aRig; attribute vec4 iDyn, iBase, iPh;
      uniform float uS, uLed, uPhoneE; varying vec3 vFanCol; varying float vGlow;
      ${LF_FAN_GLSL}`)
      .replace('#include <beginnormal_vertex>', `vec3 objectNormal = lfRotY(lfFanNorm(normalize(mix(normal, aNor2, iDyn.x)), aRig, iDyn), iBase.w);`)
      .replace('#include <begin_vertex>', `vec3 transformed = lfRotY(lfFanPose(mix(position, aPos2, iDyn.x), aRig, iDyn), iBase.w) + iBase.xyz;
        vFanCol = aPart < 0.5 ? iShirt : aPart < 1.5 ? iSkin : aPart < 2.5 ? iHair : iPants;
        float on = smoothstep(iPh.x, iPh.x + 0.05, uS);
        vec3 ln = lfFanNorm(normal, aRig, iDyn);
        vGlow = on * uLed * (aPart > 0.5 && aPart < 1.5 ? 1.0 : 0.3) * (0.3 + 0.7 * max(ln.z, 0.0)) * uPhoneE;`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vFanCol; varying float vGlow;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = vFanCol;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.55, 0.66, 0.92) * vGlow;');
  };
  crowdM.customProgramCacheKey = () => 'lfCrowd';
  const crowd = new THREE.Mesh(G, crowdM); crowd.frustumCulled = false; crowd.receiveShadow = true; scene.add(crowd);
  // the phones: one point each, at the fan's right hand (the same pose maths), a screen (faces its owner) and a torch
  // (faces the pitch), their LEDs fading with LFP.led
  const PG = new THREE.InstancedBufferGeometry();
  const PP = new THREE.PlaneGeometry(1, 1); PG.index = PP.index; PG.setAttribute('position', PP.attributes.position);
  const aDyn2 = IA(iDyn, 4); aDyn2.setUsage(THREE.DynamicDrawUsage);
  PG.setAttribute('iBase', IA(iBase, 4)); PG.setAttribute('iPh', IA(iPh, 4)); PG.setAttribute('iDyn', aDyn2); PG.instanceCount = NF;
  const PU = { uS: { value: 0 }, uLed: { value: 1 }, uK: { value: 1 }, uPx: { value: 1 }, uRes: { value: new THREE.Vector2(1920, 1080) } };
  const phoneM = new THREE.ShaderMaterial({ uniforms: PU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec4 iBase, iPh, iDyn; uniform float uS, uLed, uK, uPx; uniform vec2 uRes; varying float vA; varying vec3 vC; varying vec2 vQ;
      ${LF_FAN_GLSL}
      void main(){
        vec3 sh = lfShoulder(iDyn.x), hand = sh + lfRotX(vec3(0.0, -0.66, 0.02), -2.5 * iDyn.y), fwdL = vec3(0.0, -0.25 + 0.2 * iDyn.y, 1.0);
        vec3 w = lfRotY(hand, iBase.w) + iBase.xyz, fwd = normalize(lfRotY(fwdL, iBase.w));
        vec3 toC = normalize(cameraPosition - w); float fc = dot(fwd, toC), d = length(cameraPosition - w);
        float on = smoothstep(iPh.x, iPh.x + 0.05, uS), tor = smoothstep(iPh.y, iPh.y + 0.04, uS);
        float scr = on * (0.16 + 0.34 * max(-fc, 0.0)), torch = tor * (0.12 + 1.5 * pow(max(fc, 0.0), 3.0));
        vA = (scr + torch) * uLed * uK;
        vC = mix(vec3(0.62, 0.74, 1.0), vec3(1.0, 0.98, 0.94), tor);
        float px = uPx * clamp((70.0 + 90.0 * tor) / d, 1.1, 12.0);
        vQ = position.xy * 2.0;
        vec4 mv = viewMatrix * vec4(w, 1.0); vec4 cl = projectionMatrix * mv;
        cl.xy += position.xy * px * 2.0 / uRes * cl.w;
        gl_Position = cl; if (vA < 0.002) gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }`,
    fragmentShader: `varying float vA; varying vec3 vC; varying vec2 vQ;
      void main(){ float r = dot(vQ, vQ); if (r > 1.0) discard; float a = vA * (exp(-r * 7.0) + 0.25 * exp(-r * 2.0)); gl_FragColor = vec4(vC * a, a); }` });
  const phones = new THREE.Mesh(PG, phoneM); phones.frustumCulled = false; phones.renderOrder = 6; scene.add(phones);
  // ---------------------------------------------------------------------------------------------------- the people up close
  // round the stadB camera (rows 17–19 in front of it) and the stadC camera (the top rows): full people, their phones
  const NEAR = [];
  const seatOf = (r, x, side) => { let best = null, bd = 1e9; for (const s of seats) if (s.r === r && (side > 0 ? s.z > 0 : s.x < 0) && Math.abs((side > 0 ? s.x : s.z) - x) < bd) { bd = Math.abs((side > 0 ? s.x : s.z) - x); best = s; } return best; };
  const nearSpec = [
    ['lfFan3', 19, -4.7, 1, 14.78, 1], ['lfFan4', 19, -3.7, 1, 14.95, 0], ['lfFan5', 19, -3.2, 1, 15.1, 1], ['lfFan6', 18, -4.45, 1, 14.86, 1], ['lfP1', 18, -3.45, 1, 15.25, 0],
    ['lfB3', 17, -4.95, 1, 15.0, 1], ['lfB1', 17, -3.95, 1, 14.9, 1], ['lfFan1', 18, -5.2, 1, 14.7, 0],
    ['lfFan3', 45, -1.0, -1, 14.9, 1], ['lfB4', 45, 0.6, -1, 15.0, 1], ['lfFan6', 44, -0.2, -1, 14.8, 1], ['lfP5', 44, 1.0, -1, 15.2, 0],
  ];
  const phoneGeo = new THREE.BoxGeometry(0.072, 0.15, 0.009), phoneBody = lfStd('#1c1e22', 0.4, 0.4);
  nearSpec.forEach(([look, r, x, side, t0, torch], i) => {
    const s = seatOf(r, x, side), P = lfPerson(look, scene, { id: 'sd' + i });
    const ph = new THREE.Group(); ph.add(new THREE.Mesh(phoneGeo, phoneBody));
    const scrM2 = new THREE.MeshBasicMaterial({ color: '#000000' }); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.064, 0.138), scrM2); sc.position.z = 0.0085; ph.add(sc);   // (4 mm off the body: these are seen from metres away)
    const tm = new THREE.SpriteMaterial({ map: dot, color: '#ffffff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }); const tsp = new THREE.Sprite(tm); tsp.scale.set(0.07, 0.07, 1); tsp.position.set(0.02, 0.06, -0.012); ph.add(tsp);
    scene.add(ph);
    NEAR.push({ s, P, ph, scrM: scrM2, tm, t0, t1: torch ? t0 + 0.4 + 0.5 * lfR(i, 31) : 1e9, ts: (side > 0 ? 14.72 : 14.9) + (side > 0 ? 0.35 : 0.8) * lfR(i, 32), i, cam: side > 0 ? 'B' : 'C' });
  });
  const nearL = [0, 3, 6].map(() => { const L = new THREE.PointLight('#b8c8ff', 0, 2.2, 2); scene.add(L); return L; });
  // ---------------------------------------------------------------------------------------------------- the players, the referee, the ball
  // [look, x, z, vx, vz] at 14.4 s: Harbour (red) attacking east, the ball at the feet of their number 9
  const PL = [
    ['lfGk1', -47, 0.5, 0.4, 0], ['lfPl1', -20, -22, 3, 0.2], ['lfPl1b', -24, -7, 3.5, 0], ['lfPl1', -23, 8, 3.4, 0], ['lfPl1b', -18, 24, 4, -0.4],
    ['lfPl1', 2, -18, 5, 0.6], ['lfPl1b', -2, 0, 4.5, 0], ['lfPl1', 5, 14, 5.4, -0.5], ['lfPl1b', 22, -8, 6.6, 0.4], ['lfPl1', 18, 10, 6.1, -0.8], ['lfPl1b', 26, 22, 5.2, -1.3],
    ['lfGk2', 49, -1, -0.3, 0.6], ['lfPl2', 34, -14, 2.0, 0.8], ['lfPl2b', 37, -4, 1.4, -0.4], ['lfPl2', 36, 6, 1.5, -0.6], ['lfPl2b', 33, 18, 1.8, -1.0],
    ['lfPl2', 24, -20, 3.2, 1.2], ['lfPl2b', 28, 2, 2.6, -1.4], ['lfPl2', 20, 12, 3.6, -0.9], ['lfPl2b', 8, -4, 2.2, 0], ['lfPl2', 4, 10, 1.6, 0.3], ['lfPl2b', 12, 24, 2.1, -0.5],
    ['lfRef', 13, 6, 4.0, 0.1],
  ].map(([look, x, z, vx, vz], i) => { const P = lfPerson(look, scene, { id: 'pl' + i }); P.root.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return { P, x, z, vx, vz, i }; });
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 2), lfStd('#f4f4f2', 0.45)); ball.castShadow = true; scene.add(ball);
  { const g = ball.geometry, p = g.attributes.position, c = []; for (let i = 0; i < p.count; i++) { const v = (Math.floor(Math.atan2(p.getZ(i), p.getX(i)) * 2.5 + 10) + Math.floor(p.getY(i) * 22 + 10)) % 3 === 0 ? 0.12 : 1; c.push(v, v, v); } g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); ball.material.vertexColors = true; }
  // how far a player has gone since 14.4 s: full speed until they react to the dark (14.7 s), then slowing to a stop
  const goneF = (s) => { const a = 14.7, b = 15.5, U = MathX.clamp((s - a) / (b - a), 0, 1); return (s - 14.4) - ((b - a) * (U * U * U - U * U * U * U / 2) + Math.max(0, s - b)); };

  const set = {
    scene, camera: cam, sky, crowd, fans: F,
    cuts() { return []; },
    frame(t, shot) {
      const m = shot.mode, s = lfStoryAt(t), k = LFP.k(s), kk = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      this._s = s; this._k = k;
      const px = (app.renderH || 1080) / 1080, st = lfGrid(s, LF_STAD_D), led = LFP.led(k), adapt = lfAdapt(s);
      const dark = 1 - st;
      // ---- the floodlights, the boards, the screen, the exit signs
      const sOff = LFP.sGrid + LF_STAD_D + 0.12, ag = s > sOff - 0.12 ? 0.05 * Math.exp(-Math.max(0, s - sOff) / 0.35) * LFP.glow(k) : 0;
      for (const T of towers) { T.L.intensity = 52000 * st; T.L.visible = st > 0.001; T.lampM.color.setRGB(st + ag, st + 0.45 * ag, st + 0.15 * ag); for (const sp of T.sprites) sp.material.opacity = 0.9 * st; }
      spill.intensity = 1.1 * st;
      const bl = st * led; for (const mm of boardFaces) mm.color.setScalar(0.02 + 0.98 * bl); scrM.color.setScalar(0.01 + 0.99 * bl);
      const mn = 63 + Math.floor((41 + s) / 60), sc = Math.floor(41 + s) % 60; SCR.update({ clock: `${mn}:${String(sc).padStart(2, '0')}` });
      const em = Math.max(st, lfEmerg(s, LF_STAD_D)); exitM.color.setRGB(0.06 + 0.1 * em, 0.2 + 0.8 * em, 0.1 + 0.3 * em);
      // ---- the crowd: standing, arms up, heads turning (one pass over 40,000 fans, all pure in s)
      let lit = 0;
      for (let i = 0; i < NF; i++) {
        const f = F[i], o = i * 4;
        const stand = f.sNow ? 1 : f.stand ? lfSm(s, f.ts, f.ts + 0.6) : 0;
        const up = f.film ? f.arm : s > f.t0 ? f.arm * lfSm(s, f.t0 + 0.02, f.t0 + 0.32) : 0;
        const look = f.look * (1 - 0.6 * dark) + dark * 0.8 * noise1(s * 0.6 + i * 0.13, 3);
        iDyn[o] = stand; iDyn[o + 1] = up; iDyn[o + 2] = look; iDyn[o + 3] = 0;
        if (s > f.t0 && !f.never) lit++;
      }
      aDyn.needsUpdate = true; aDyn2.needsUpdate = true;
      const frac = lit / NF;
      CU.uS.value = s; CU.uLed.value = led; CU.uPhoneE.value = 0.022 * dark;
      PU.uS.value = s; PU.uLed.value = led; PU.uPx.value = px; PU.uRes.value.set((app.renderH || 1080) * 16 / 9, app.renderH || 1080);
      // ---- the people up close, their phones
      const hw = new THREE.Vector3(), hd = new THREE.Vector3();
      let li = 0;
      for (const n of NEAR) {
        const stand = lfSm(s, n.ts, n.ts + 0.6), on = s > n.t0 ? lfSm(s, n.t0, n.t0 + 0.05) : 0, up = lfSm(s, n.t0 + 0.02, n.t0 + 0.34);
        const base = lerpPose(LF_POSES.sit(), LF_POSES.stand(), stand);
        const hold = lerpPose(LF_POSES.sitPhone(), LF_POSES.torch(), stand);
        const p = lfFidget(lerpPose(base, n.t1 < 1e8 ? lerpPose(hold, LF_POSES.sitTorch(), 0.6) : hold, up), s, n.i, 0.6 + dark);
        lfPose(n.P, p, n.s.x, n.s.y + (stand > 0.5 ? 0 : 0), n.s.z, Math.atan2(n.s.fx, n.s.fz));
        n.P.root.updateMatrixWorld(true); n.P.handWorld(-1, hw); n.P.worldOf('head', hd);
        n.ph.visible = up > 0.05; n.ph.position.copy(hw); n.ph.lookAt(hd);
        const lv = on * led; n.scrM.color.setRGB(0.55 * lv, 0.62 * lv, 0.75 * lv);
        n.tm.opacity = n.t1 < 1e8 ? lfSm(s, n.t1, n.t1 + 0.04) * led * 0.9 : 0;
        if (li < nearL.length && n.cam === (m === 'stadC' ? 'C' : 'B') && lv > 0.01) { nearL[li].position.copy(hw).lerp(hd, 0.35); nearL[li].intensity = 0.35 * lv; li++; }
      }
      for (; li < nearL.length; li++) nearL[li].intensity = 0;
      // ---- the players and the ball
      const g = goneF(s), react = lfSm(s, 14.62, 14.95), stopped = lfSm(s, 15.0, 15.6);
      for (const q of PL) {
        const x = q.x + q.vx * g, z = q.z + q.vz * g, v = Math.hypot(q.vx, q.vz) * (1 - lfSm(s, 14.7, 15.5)), late = s > 60;
        const run = lfRunPose(((q.x * 0.37 + (Math.hypot(q.vx, q.vz) * g) / 2.9) * Math.PI * 2) % (Math.PI * 2));
        const still = late ? (q.i % 5 === 0 ? LF_POSES.lookAround() : LF_POSES.lookUpStand()) : lerpPose(LF_POSES.player(), LF_POSES.lookAround(), react);
        const w = late ? 0 : MathX.clamp(v / 4, 0, 1);
        const p = lfFidget(lerpPose(still, run, w), s, q.i + 40, late ? 0.5 : 0.2 + stopped);
        const yaw = late ? lfR(q.i, 5) * 6.283 + 0.3 * noise1(s * 0.05, q.i) : Math.atan2(q.vx, q.vz) + react * 0.6 * noise1(q.i * 1.3 + s * 0.5, 4);
        lfPose(q.P, p, late ? q.x + q.vx * 0.7 : x, 0, late ? q.z + q.vz * 0.7 : z, yaw);
      }
      { const c = PL[8], s1 = 14.7, xs = (u) => c.x + c.vx * goneF(u) + 0.9, zs = (u) => c.z + c.vz * goneF(u);
        const roll = s < s1 ? 0 : 6.6 * 1.5 * (1 - Math.exp(-(Math.min(s, 40) - s1) / 1.5)), dirx = c.vx / Math.hypot(c.vx, c.vz), dirz = c.vz / Math.hypot(c.vx, c.vz);
        const bx = (s < s1 ? xs(s) : xs(s1)) + dirx * roll, bz = (s < s1 ? zs(s) : zs(s1)) + dirz * roll;
        ball.position.set(bx, 0.11, bz); const dist = (s < s1 ? Math.hypot(c.vx, c.vz) * goneF(s) : Math.hypot(c.vx, c.vz) * goneF(s1)) + roll; ball.rotation.set(0, Math.atan2(dirx, dirz), 0); ball.rotateX(dist / 0.11); }
      // ---- the light the phones give the bowl, the starlight
      phAmb.intensity = 0.03 * frac * led;
      const expo = this.expoOf(m, s);
      this._expo = expo; this._adapt = adapt;
      const old = k / (adapt * expo);
      PU.uK.value = 0.85 / expo;
      S.hemi.intensity = 0.1 * old;
      sky.update(s, { glow: 0, mw: 0.25 + 0.75 * dark, k: old * (0.3 + 0.7 * dark), starK: old * (0.15 + 0.85 * dark), px, lim: 6.9 - 4.2 * st, at: cam.position });
      // ---- the camera
      const v = { p: [0, 20, 60], at: [0, 2, 0], fov: 54, near: 0.1, drift: 0.01 };
      lfStadCam(this, m, s, t, kk, v);
      const dr = lfDrift(t, v.drift, 0.3, 17);
      if (cam.near !== v.near) cam.near = v.near; cam.far = 12000;
      lfCam(cam, [v.p[0] + dr[0], v.p[1] + dr[1], v.p[2] + dr[2]], [v.at[0] + dr[0], v.at[1] + dr[1], v.at[2] + dr[2]], v.fov);
    },
    // the exposure: the floodlit bowl, then the camera opening up in the dark (an auto-exposure, a partial one)
    expoOf(m, s) { const dark = 1 - lfGrid(s, LF_STAD_D); return 1 + 4 * lfSm(s, 14.5, 15.1) * dark; },
    labels(t) {
      const shot = lfShotAt(t), out = [], W = StoryHUD.win;
      if (shot.mode === 'stadA') out.push({ p: [LF_SD_TOW[1].x, LF_SD_TOW[1].y + 7, LF_SD_TOW[1].z], text: 'FLOODLIGHTS', sub: 'the stadium’s own feed', a: W(t, shot.t0 + 0.4, lfFilmAt(LFP.sGrid + LF_STAD_D) + 0.6, 0.3, 0.3) });
      return out;
    },
    grade(t, p) {
      const s = this._s, k = this._k;
      p.exposure = LFP.eye(k) * this._adapt * this._expo;
      p.saturation = lfSat(s) + 0.02; p.contrast = 1.08; p.warmth = -0.03; p.blackLift = 0.004;
      p.vignette = 0.56; p.bloom = 0.5; p.bloomThreshold = 0.8; p.grain = 0.034;
    },
  };
  return set;
};

function lfStadCam(set, m, s, t, k, v) {
  const E = Ease.inOutSine, into = (a, b, u) => lfV(a, b, E(u));
  switch (m) {
    // the south stand, row 27: the match, the towers, the big screen; then the dark
    case 'stadA': { const th = 1.9, q = lfSdP(27.3, th); v.p = into([q[0], lfSdY(27) + 1.15, q[1]], [q[0] + 0.3, lfSdY(27) + 1.12, q[1] - 0.2], k); v.at = [6, 1.0, -14]; v.fov = 56; v.drift = 0.03; break; }
    // in the crowd (row 20): the rows in front lift their phones; the far stand fills with points of light
    case 'stadB': { const q = lfSdP(20.3, Math.PI / 2 + 0.0492); v.p = into([LF_SD_CAM.B[1], lfSdY(20) + 1.12, q[1]], [LF_SD_CAM.B[1] + 0.05, lfSdY(20) + 1.16, q[1] - 0.06], k); v.at = [-7, 2.0, -6]; v.fov = 54; v.near = 0.05; v.drift = 0.012; break; }
    // ×3: from the top of the west stand, 40,000 phones going dark under the Milky Way
    case 'stadC': { const yt = lfSdY(LF_SD.rows); v.p = into([-(LF_SD.inA + 46.8), yt + 1.65, 0.3], [-(LF_SD.inA + 46.6), yt + 1.7, -0.4], k); v.at = lfV([20, 2, 18], [24, 6, -10], E(k)); v.fov = 66; v.near = 0.1; v.drift = 0.01; break; }
  }
  void set; void s; void t;
}
