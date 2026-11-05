/* =====================================================================
   COAST SET — the train along the sea wall, the coast road, the cove with the bonfire, the bay with the city across it,
   the real southern sky (sky.js, city.js, train.js, coast-world.js). Your seat: the first car, the sea side; then the
   beach. Through your own eyes you see your hands (ViewerHands): your phone in the right, your ring on the left.
   Light, as the film shows it (lights.js, physics.js): everything that makes new light fades as light speeds up; the
   grade's exposure is your eyes opening (lfAdapt: never a full compensation) times the eye's own falling catch
   (LFP.eye); light that left before 9 PM (the stars, the Milky Way) is drawn so that on screen it holds at k × eye.
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// your hands: poses (camera space, right hand; the left is mirrored), and which pose each shot uses
// ---------------------------------------------------------------------------------------------------------------------
const LF_HAND_POSES = {
  phone: { p: [0.045, -0.125, -0.255], F: [-0.9, 0.22, -0.18], N: [0.02, 0.28, 1], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.95, 0.42] },
  phoneLow: { p: [0.07, -0.25, -0.3], F: [-0.86, 0.3, -0.25], N: [0.02, 0.5, 0.86], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.95, 0.42] },
  phoneSide: { p: [0.17, -0.24, -0.3], F: [-0.86, 0.3, -0.25], N: [0.1, 0.45, 0.88], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.95, 0.42] },
  touch: { p: [0.105, -0.215, -0.27], F: [-0.62, 0.72, -0.3], N: [0.25, -0.05, -1], curl: [0.15, 0.55, 0.85, 1.0], thumb: [0.3, 0.5] },
  ring: { p: [0.035, -0.115, -0.3], F: [-0.12, 1, -0.18], N: [0.1, 0.12, -1], curl: [0.12, 0.1, 0.16, 0.24], thumb: [0.45, 0.15] },
  warm: { p: [0.12, -0.2, -0.42], F: [0.12, 0.62, -0.78], N: [0.0, 0.4, -0.92], curl: [0.18, 0.15, 0.2, 0.26], thumb: [0.6, 0.12] },
  knee: { p: [0.13, -0.34, -0.36], F: [-0.2, -0.1, -1], N: [0.1, -1, 0.0], curl: [0.4, 0.45, 0.5, 0.55], thumb: [0.4, 0.3] },
};
const LF_HAND_BL = Object.fromEntries(Object.keys(LF_HAND_POSES).concat(['hidden']).map((k) => [k, 0.01]));
// mode → [right, left]
const LF_HANDS_OF = {
  win: ['phoneLow', 'hidden'], phone: ['phone', 'touch'], bay: ['hidden', 'hidden'], emerg: ['phoneSide', 'hidden'], ring: ['phoneSide', 'ring'],
  winBeach: ['hidden', 'hidden'], fireA: ['warm', 'warm'], colB: ['knee', 'hidden'],
};
const LF_EYE_MODES = new Set(Object.keys(LF_HANDS_OF));
const LF_TRAIN_EYE = new Set(['win', 'phone', 'bay', 'emerg', 'ring', 'winBeach']);

// gold's colour as its absorption edge moves out of the visible (physics.js: LFP.goldEdge): reflectance low below the
// edge's wavelength, high above, seen through rough red/green/blue sensitivities → a linear RGB (silver ≈ 0.9, 0.9, 0.9)
function lfGoldRGB(k) {
  const le = 1240 / LFP.goldEdge(k), R = (l) => 0.3 + 0.62 / (1 + Math.exp(-(l - le) / 13));
  const S = [[600, 38, 1.0], [548, 34, 1.0], [452, 24, 1.0]], out = [];
  for (const [c, w] of S) { let a = 0, n = 0; for (let l = 380; l <= 720; l += 4) { const g = Math.exp(-0.5 * ((l - c) / w) ** 2); a += g * R(l); n += g; } out.push(a / n); }
  return out;
}

// the phone's screen: a night map. GPS times light from space with the old speed (and the satellites' clocks drift):
// within moments the receiver loses lock: a grey dot where it last knew you, a searching ring; the clock; the battery
function lfDrawPhone(g, w, h, st) {
  const s = st.s, k = LFP.k(s), E = LFP.gpsKm(k);
  g.fillStyle = '#0d1520'; g.fillRect(0, 0, w, h);
  const span = E < 0.05 ? 3 : 5, sc = h * 0.62 / span;                         // km across the map's height → px/km
  const cx = w * 0.5, cy = h * 0.3, R = new RNG(11);
  // the coast (land north, up): a ragged line, its wiggles finer than a pixel fade as the map zooms out
  g.fillStyle = '#1d2a22'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, cy);
  for (let x = 0; x <= w; x += 3) { const km = (x - cx) / sc; const y = cy + sc * (0.35 * Math.sin(km * 0.9) + 2.5 * Math.sin(km * 0.031 + 1) + 14 * Math.sin(km * 0.004 + 2)); g.lineTo(x, Math.max(-4, y)); }
  g.lineTo(w, 0); g.closePath(); g.fill();
  // the railway along the coast, the road, a town
  g.strokeStyle = 'rgba(200,200,190,0.5)'; g.lineWidth = 2; g.beginPath();
  for (let x = 0; x <= w; x += 3) { const km = (x - cx) / sc; const y = cy - 0.02 * sc + sc * (0.35 * Math.sin(km * 0.9) + 2.5 * Math.sin(km * 0.031 + 1) + 14 * Math.sin(km * 0.004 + 2)) - 3; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  if (span < 400) { g.fillStyle = 'rgba(230,220,200,0.55)'; g.font = '600 15px sans-serif'; g.fillText(span < 30 ? 'Coast Rd' : 'COAST', 18, cy - 14); }
  void R;
  // where you really are (GPS doesn't know): only the line; the dot: E km south and a little east
  const dx = 0.32 * E * sc, dy = E * sc, px = MathX.clamp(cx + dx, 26, w - 26), py = cy + dy;
  const acc = Math.max(10, Math.min(110, 0.2 * E * sc + 10));
  if (E < 0.05) { g.fillStyle = 'rgba(70,140,255,0.16)'; g.beginPath(); g.arc(px, py, acc, 0, 6.29); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(px, py, 11, 0, 6.29); g.fill(); g.fillStyle = '#3d8bff'; g.beginPath(); g.arc(px, py, 8, 0, 6.29); g.fill(); }
  else {   // the receiver has lost lock: a grey dot where it last knew you, a searching ring
    const rr = 26 + 30 * ((s * 1.7) % 1); g.strokeStyle = `rgba(200,210,225,${(0.7 * (1 - ((s * 1.7) % 1))).toFixed(2)})`; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, rr, 0, 6.29); g.stroke();
    g.fillStyle = '#9aa3ae'; g.beginPath(); g.arc(cx, cy, 10, 0, 6.29); g.fill(); }
  // the scale bar
  const nice = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000], km = nice.find((v) => v * sc > 60) || 5000, bl = km * sc;
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(20, h - 70, bl, 4); g.font = '600 16px sans-serif'; g.fillText(km + ' km', 20, h - 80);
  // the top bar: the time, the battery; the search box
  const c = lfClockParts(Math.max(0, s)); g.fillStyle = '#ffffff'; g.font = '600 18px sans-serif'; g.fillText(`${c.h}:${String(c.m).padStart(2, '0')}`, 18, 26);
  g.fillRect(w - 46, 13, 26, 13); g.fillStyle = '#0d1520'; g.fillRect(w - 44, 15, 22 * 0.22, 9); g.fillStyle = '#ffffff';
  g.fillStyle = 'rgba(30,40,55,0.92)'; lfRR(g, 14, 40, w - 28, 40, 20); g.fill(); g.fillStyle = 'rgba(255,255,255,0.75)'; g.font = '500 16px sans-serif'; g.fillText('Search here', 34, 66);
  // the location card: how far off it thinks you are
  g.fillStyle = 'rgba(22,30,42,0.95)'; lfRR(g, 14, h - 160, w - 28, 66, 14); g.fill();
  g.fillStyle = '#ffffff'; g.font = '700 17px sans-serif'; g.fillText(E < 0.05 ? 'Your location' : 'GPS signal lost', 30, h - 132);
  g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = '500 14px sans-serif'; g.fillText(E < 0.05 ? 'Accuracy ±4 m' : 'Searching for satellites…', 30, h - 110);
}

// ---------------------------------------------------------------------------------------------------------------------
// THE SET
// ---------------------------------------------------------------------------------------------------------------------
LF_SETS.coast = (app) => {
  const S = lfSet(app, { sky: '#02040a', fov: 50, near: 0.05, far: 24000, hemi: ['#4a5a7a', '#14120e', 0.1], env: ['#1a2234', '#0c0f16', '#050506'] });
  const scene = S.scene, cam = S.camera;
  scene.fog = new THREE.FogExp2('#070b14', 0.00016);
  const sky = lfBuildSky(scene, {}), city = lfBuildCity(scene), sea = lfBuildSea(scene, city), W = lfBuildCoast(S), T = lfBuildTrain(scene);
  // ---- your hands, your phone, your ring
  const hands = new ViewerHands(cam, { script: { right: [[-9, 'hidden']], left: [[-9, 'hidden']] }, poses: LF_HAND_POSES, blends: LF_HAND_BL, skin: '#c9967a', nail: '#e2bba8', sleeve: '#4a5a4a', cuff: '#3a483a', watch: false, sleeveLen: 0.36 });
  const phone = new THREE.Group(), PT = lfCanvasTex(270, 576, lfDrawPhone);
  phone.add(new THREE.Mesh(new THREE.RoundedBoxGeometry(0.072, 0.152, 0.0085, 3, 0.008), lfStd('#2a2d33', 0.35, 0.4)));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.066, 0.1446), new THREE.MeshBasicMaterial({ map: PT.tex })); screen.position.z = 0.0058; phone.add(screen);   // (1.5 mm off the glass)
  const phoneL = new THREE.PointLight('#cfe0ff', 0, 1.6, 1.6); phoneL.position.set(0, 0, 0.06); phone.add(phoneL);
  phone.position.set(0.034, 0.074, 0.024); phone.rotation.set(0, 0, -Math.PI / 2); hands.right.g.add(phone);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0113, 0.0023, 10, 32), new THREE.MeshStandardMaterial({ color: '#ffd27a', metalness: 0.9, roughness: 0.28, envMapIntensity: 2.0 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.017; hands.left.fingers[2][0].add(ring);
  // ---- the soft points: flames, sparks (additive), smoke
  const fx = lfPuffs(scene, 3000, { additive: true, soft: 1.4 }), smoke = lfPuffs(scene, 1200, { soft: 1.8 });
  const brakeL = new THREE.PointLight('#ff9a40', 0, 26, 1.6); scene.add(brakeL);   // (the brake sparks' light; 0 until 16.6 s)
  // the hospital's roof across the bay (the 'roof' shot): its slab, the plant, the MRI's quench pipe, the red cross's frame
  const HR = lfBuildHospRoof(S);
  // the pole transformer by the road (it hums when the iron saturates)
  { const x = -268, z = -10.6; lfCyl(0.13, 0.16, 9.0, W.M.wood, x, LF_ST.wallTop + 4.5, z); lfBox(0.2, 0.2, 2.2, W.M.wood, x, LF_ST.wallTop + 8.6, z);
    W.xfmr = lfCyl(0.42, 0.42, 1.25, lfStd('#6a6e70', 0.55, 0.5), x + 0.6, LF_ST.wallTop + 6.6, z); lfBox(0.12, 0.6, 0.12, W.M.pole, x + 0.3, LF_ST.wallTop + 6.6, z);
    for (const dz of [-0.2, 0, 0.2]) lfCyl(0.05, 0.07, 0.3, lfStd('#6a4a3a', 0.4), x + 0.6, LF_ST.wallTop + 7.35, z + dz); }
  const set = {
    scene, camera: cam, sky, city, sea, W, T, hands, phone, ring, HR,
    cuts() { return []; },
    frame(t, shot) {
      const m = shot.mode, s = lfStoryAt(t), k = LFP.k(s), kk = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      this._s = s; this._k = k; this._shot = shot; this._t = t;
      const px = (app.renderH || 1080) / 1080;
      // ------------------------------------------------------------------ the world
      T.update(s); W.update(s, { px }); HR.update(s);
      city.crossGlow.visible = m !== 'roof';
      city.update(s, { fogD: 0.00026, px });
      if (m === 'roof') for (const c of city.cross) c.material.color.multiplyScalar(0.38);   // close up, the lightbox's own red
      const glowCity = city.districts.reduce((a, b) => a + b, 0) / 8, adapt = lfAdapt(s), old = k / adapt;
      this._adapt = adapt;
      // ------------------------------------------------------------------ the camera
      const v = { p: [0, 5, 10], at: [0, 4, 0], fov: 50, drift: 0.01, near: 0.08, far: 24000, expo: 1, roll: 0 };
      lfCoastCam(this, m, s, t, kk, shot, v);
      if (W.you.root.visible) { const r = W.you.root.position, c = v.p; if (Math.hypot(r.x - c[0], r.z - c[2]) < 0.9 && c[1] > r.y - 0.2 && c[1] < r.y + 2.2) W.you.root.visible = false; }   // (the camera is your eyes: your own body isn't drawn round it)
      const dr = v.drift ? lfDrift(t, v.drift, 0.3, 11) : [0, 0, 0];
      if (v.shake) { const j = v.shake; dr[0] += j * Math.sin(t * 61) * Math.sin(t * 11.3); dr[1] += j * 0.7 * Math.sin(t * 53 + 1); dr[2] += j * Math.sin(t * 47 + 2) * Math.sin(t * 7.1); }
      if (cam.near !== v.near) cam.near = v.near; if (cam.far !== v.far) cam.far = v.far;
      lfCam(cam, [v.p[0] + dr[0], v.p[1] + dr[1], v.p[2] + dr[2]], [v.at[0] + dr[0], v.at[1] + dr[1], v.at[2] + dr[2]], v.fov, v.roll);
      this._expo = v.expo; this._inside = !!v.inside;
      // ------------------------------------------------------------------ the sky, the sea (seen from here)
      const big = m === 'starsA' || m === 'starsB' || m === 'runout';   // (the stars' own shots: drawn a little larger and the Milky Way fuller, so they survive the encode)
      sky.update(s, { glow: 0.85 * glowCity, mw: big ? 1.5 : 1, size: big ? 1.3 : 1, k: old, starK: old, px, at: cam.position, blur: lfEyeBlurPx(k, cam.fov) });
      sea.update(s, { glow: 0.8 * glowCity, bio: lfBio(s) * 1.0, fire: W.fire * 1.0, fogD: 0.00022, starK: old, train: T.lit > 0.02 ? [T.group.position.x, T.lit] : null });
      // the starlight and sky glow that light the ground (old light too), the train's own light on the track
      S.hemi.intensity = (v.inside ? 0.05 : 0.11) * old + 0.05 * glowCity;
      // ------------------------------------------------------------------ your hands, your phone, your ring
      const eye = LF_EYE_MODES.has(m), hp = LF_HANDS_OF[m] || ['hidden', 'hidden'];
      hands.root.visible = eye;
      hands.o.script = { right: [[-9, hp[0]]], left: [[-9, hp[1]]] };
      if (eye) hands.update(t);
      phone.visible = eye && hp[0].startsWith('phone');
      if (phone.visible) { PT.update({ s: Math.round(s * 20) / 20 }); const lb = lfPhone(s); screen.material.color.setScalar(0.08 + 0.92 * lb); phoneL.intensity = (m === 'ring' ? 0.5 : 0.12) * lb; }
      { const c = lfGoldRGB(k); ring.material.color.setRGB(c[0], c[1], c[2]); }
      // the passengers aren't drawn where your own seat is (you are the camera)
      // ------------------------------------------------------------------ flames, sparks, smoke; brake sparks; arcs at the pantograph
      fx.begin(); smoke.begin();
      if (m !== 'win' && m !== 'phone' && m !== 'ring' && m !== 'emerg') this.fire(s, fx, smoke);
      this.brake(s, fx); this.arcs(s, fx, m);
      if (m === 'roof' || m === 'bay' || m === 'bayOut') this.plume(s, smoke, m === 'roof' ? 1 : 0.35);
      fx.end(); smoke.end();
    },
    // the bonfire's flames (their light 1/k² at the same heat), the embers, the smoke
    fire(s, fx, smoke) {
      const F = LF_FIRE, fl = W.fire;
      for (let i = 0; i < 170; i++) {
        const r1 = lfR(i, 81), r2 = lfR(i, 82), r3 = lfR(i, 83), life = 0.55 + 0.5 * r3, ph = ((s / life + r1) % 1 + 1) % 1;
        const a0 = r2 * 6.283, rad = 0.32 * Math.sqrt(lfR(i, 84)) * (1 - 0.7 * ph), h = ph * (0.75 + 0.75 * r3);
        const sway = 0.12 * ph * Math.sin(s * 3.1 + i) + 0.05 * ph;
        const x = F.x + Math.cos(a0) * rad + sway, z = F.z + Math.sin(a0) * rad + 0.04 * ph, y = F.y + 0.12 + h;
        const hot = 1 - ph, col = [1.0, 0.42 + 0.48 * hot * hot, 0.1 + 0.42 * hot * hot * hot];
        fx.add(x, y, z, 0.22 + 0.24 * (1 - ph) * (0.6 + 0.6 * r2), 0.42 * Math.pow(1 - ph, 1.3) * Math.min(1, ph * 9) * fl, col[0], col[1], col[2]);
      }
      for (let i = 0; i < 46; i++) { const life = 1.4 + 1.2 * lfR(i, 91), ph = ((s / life + lfR(i, 92)) % 1 + 1) % 1, a0 = lfR(i, 93) * 6.283;
        const x = F.x + Math.cos(a0) * 0.2 * (1 + ph) + 0.7 * ph * ph + 0.15 * Math.sin(s * 2 + i), z = F.z + Math.sin(a0) * 0.2 * (1 + ph) + 0.3 * ph * ph, y = F.y + 0.4 + ph * (2.6 + 1.6 * lfR(i, 94));
        fx.add(x, y, z, 0.035, 0.9 * (1 - ph) * fl * (0.5 + 0.5 * Math.sin(s * 17 + i * 3)), 1.0, 0.5, 0.15); }
      for (let i = 0; i < 70; i++) { const life = 6 + 3 * lfR(i, 95), ph = ((s / life + lfR(i, 96)) % 1 + 1) % 1;
        const x = F.x + 2.2 * ph + 0.6 * ph * Math.sin(s * 0.3 + i), z = F.z + 1.1 * ph + 0.4 * Math.sin(s * 0.27 + i * 1.7), y = F.y + 1.0 + ph * 5.5;
        const lit = 0.06 + 0.5 * fl * Math.max(0, 1 - ph * 1.6), sz = 0.5 + 1.6 * ph, P = cam.position, dc = Math.hypot(x - P.x, y - P.y, z - P.z);
        smoke.add(x, y, z, sz, 0.1 * Math.sin(Math.PI * ph) * MathX.clamp((dc - sz) / (2.5 * sz), 0, 1), lit * 1.0, lit * 0.7, lit * 0.5); }   // a puff fades as you get into it
    },
    // the MRI's helium venting through the quench pipe on the roof (from 9.58 s): a jet of cold gas that turns the air's
    // moisture into a white cloud, rising (helium is light) and drifting east on the sea breeze
    plume(s, smoke, q) {
      const s0 = LFP.sQuench; if (s < s0) return;
      const V = LF_HR.vent, lit = 0.1 + 0.55 * HR.lamp, red = HR.cross, n = Math.round(520 * q);
      for (let i = 0; i < n; i++) {
        const life = 2.6 + 1.4 * lfR(i, 61), a = (((s / life + lfR(i, 62)) % 1 + 1) % 1) * life, born = s - a;
        if (born < s0) continue;
        const ramp = lfSm(born, s0, s0 + 0.25), u = a / life;
        // the jet leaves the mouth fast, slows within a few metres and billows out; the breeze carries it east
        const h = 5.0 * (1 - Math.exp(-a / 0.22)) + 1.3 * a, rad = (0.15 + 1.9 * Math.pow(a, 0.8)) * Math.sqrt(lfR(i, 63));
        const an = lfR(i, 64) * 6.283 + a * 0.8, x = V[0] + Math.cos(an) * rad + 1.4 * a * a, z = V[2] + Math.sin(an) * rad + 0.4 * a, y = V[1] + h * (0.7 + 0.3 * ramp) + 0.45 * rad * Math.sin(an * 1.7);
        const sz = (0.3 + 1.9 * Math.pow(a, 0.8)) * (0.7 + 0.6 * lfR(i, 65)), al = 0.55 * Math.pow(1 - u, 1.4) * Math.min(1, a * 14) * ramp;
        const low = Math.exp(-h / 6), c = lit * (0.62 + 0.3 * lfR(i, 66));
        smoke.add(x, y, z, sz, al, c * 0.92 + 0.22 * red * low, c * 0.96 + 0.03 * red * low, c * 1.04 + 0.03 * red * low);
      }
    },
    // the brakes: sparks spraying back off the wheels while the train slows (from 16.6 s)
    brake(s, fx) {
      brakeL.intensity = 0;
      const P = LFP.train; if (s < P.sBrake || s > P.sStop) return;
      const v = lfTrainV(s) / P.v, on = lfSm(s, P.sBrake, P.sBrake + 0.3) * v;
      if (on < 0.02) return;
      const G = T.group.position;
      for (let c = 0; c < LF_TR.cars; c++) for (const bx of [-3.4, -LF_TR.L + 3.4]) for (const dx of [-1.1, 1.1]) for (const zs of [-1, 1]) {
        const x0 = G.x - c * (LF_TR.L + LF_TR.gap) + bx + dx, z0 = G.z + zs * 0.75;
        for (let i = 0; i < 16; i++) { const j = c * 1000 + (bx < -5 ? 500 : 0) + (dx > 0 ? 200 : 0) + (zs > 0 ? 100 : 0) + i, life = 0.18 + 0.2 * lfR(j, 41), ph = ((s / life + lfR(j, 42)) % 1 + 1) % 1;
          const vx = -(4 + 7 * lfR(j, 43)) * v, vy = 1.0 + 2.5 * lfR(j, 44), vz = zs * (0.4 + 1.6 * lfR(j, 45)), tt = ph * life;
          for (let q = 0; q < 3; q++) { const u = Math.max(0, tt - q * 0.014);   // (a short streak: the spark and two trailing samples)
            fx.add(x0 + vx * u - 0.43, LF_ST.railY + 0.05 + vy * u - 4.9 * u * u, z0 + vz * u, (0.055 + 0.035 * lfR(j, 46)) * (1 - 0.25 * q), 0.9 * on * (1 - ph) * (1 - 0.3 * q), 1.0, 0.72 - 0.1 * q, 0.32 - 0.08 * q); } }
      }
      // their orange flicker on the wheels, the rail and the wall
      brakeL.position.set(G.x - (LF_TR.L + LF_TR.gap) - 3, LF_ST.railY + 0.4, G.z + 1.6);
      brakeL.intensity = 9 * on * (0.6 + 0.4 * lfFlick(s, 9, 37));
    },
    // arcs where the pantograph meets the wire (the mains are failing): blue-white flashes
    arcs(s, fx, m) {
      if (m !== 'panto' && m !== 'flicker' && m !== 'ext3') return;
      const mains = lfTrainMains(s); if (mains <= 0.01) return;
      const G = T.group.position, x = G.x - (LF_TR.L + LF_TR.gap) - 10.2, y = LF_ST.wireY - 0.02, z = G.z;
      const sat = s > LFP.sTrans ? 1 : 0.25, f = lfFlick(s, 5, 30), f2 = lfFlick(s, 6, 71), a = (0.15 + 0.85 * Math.pow(f, 6) * sat) * mains;
      fx.add(x, y, z, 0.35 + 0.5 * f2 * sat, 0.9 * a, 0.7, 0.85, 1.0); fx.add(x, y, z, 1.6 * sat * f, 0.16 * a, 0.5, 0.7, 1.0);
      for (let i = 0; i < 10 * sat; i++) { const ph = ((s * 9 + lfR(i, 51)) % 1 + 1) % 1, tt = ph * 0.25; fx.add(x - 2 * tt + 0.5 * (lfR(i, 52) - 0.5), y - 4.9 * tt * tt, z + (lfR(i, 53) - 0.5) * 1.2 * tt, 0.02, (1 - ph) * a, 0.85, 0.92, 1.0); }
    },
    labels(t) { return lfCoastLabels(this, t); },
    grade(t, p, shot) {
      const s = this._s, k = this._k;
      // your eye catches k× less (LFP.eye) and opens up (lfAdapt): the exposure is their product, a partial compensation
      p.exposure = 1.0 * LFP.eye(k) * this._adapt * (this._expo || 1);
      p.saturation = 1.0 * lfSat(s) + 0.02; p.contrast = 1.08; p.warmth = -0.02; p.blackLift = 0.004;
      p.vignette = 0.58; p.bloom = 0.42; p.bloomThreshold = 0.82; p.grain = 0.03;
      void shot; void t;
    },
  };
  return set;
};

// ---------------------------------------------------------------------------------------------------------------------
// THE CAMERAS: one per mode. v = { p, at, fov, drift, near, far, expo, inside, shake, roll }.
// The world: x east, y up, z south. The sea wall's face is z 4 (top y 3), your track z 0 (rail top y 3.32), the road
// z −19…−12, the beach x 520…920 below the wall (steps at x 690), the fire at (726, 21), the city 2.5–4 km south.
// ---------------------------------------------------------------------------------------------------------------------
function lfCoastCam(set, m, s, t, k, shot, v) {
  const E = Ease.inOutSine, into = (a, b, u) => lfV(a, b, E(u)), T = set.T, W = set.W;
  const TL = (p) => T.L2W(p), eye = TL(LF_TR.eye), F = LF_FIRE, sy = lfSandY;
  const look = (p, d, L = 10) => { const n = lfN3(d); return [p[0] + n[0] * L, p[1] + n[1] * L, p[2] + n[2] * L]; };
  if (LF_TRAIN_EYE.has(m)) { v.p = eye; v.near = 0.03; v.far = 24000; v.inside = true; v.drift = 0.006;
    // the train's sway (a little) while it runs
    const run = lfTrainV(s) / LFP.train.v; v.p = [eye[0], eye[1] + 0.006 * run * Math.sin(t * 5.3), eye[2] + 0.004 * run * Math.sin(t * 3.7)]; }
  switch (m) {
    // ---- 1: the train out of the tunnel, along the sea wall (9:00 PM)
    case 'title': v.p = into([-512, 15, 50], [-534, 13.5, 45], k); v.at = [-668, 9.5, -2]; v.fov = 52; v.near = 0.5; v.drift = 0.05; v.expo = 1.1; break;
    case 'win': v.at = look(v.p, [0.2, -0.085, 1]); v.fov = 54; break;
    case 'phone': v.at = look(v.p, [1, -0.46, 0.12]); v.fov = 50; break;
    case 'ext2': v.p = into([-466, 5.3, -25.5], [-472, 5.2, -25.0], k); v.at = [-524, 4.4, 2.2]; v.fov = 42; v.near = 0.3; break;
    case 'bay': v.at = look(v.p, [0.16, -0.012, 1]); v.fov = 30; v.drift = 0.003; break;
    case 'ext3': v.p = [-404, 4.55, 2.9]; v.at = [-482, 4.9, 0.4]; v.fov = 40; v.near = 0.2; break;
    case 'panto': { const p = TL([-31.6 + 7.2, 7.6, -4.6]), a = TL([-31.6, 5.3, 0]); v.p = p; v.at = a; v.fov = 44; v.near = 0.2; v.drift = 0.02; break; }
    case 'flicker': v.p = into([-262, 4.75, -10.0], [-261, 4.8, -9.6], k); v.at = [-330, 6.6, -12.2]; v.fov = 46; v.near = 0.2; break;
    // ---- the hospital's roof across the bay: the quench pipe roaring helium (9:00:10 PM)
    case 'roof': { const R = LF_HR; v.p = into([R.x + 1.5, R.y + 1.85, R.z + 9.5], [R.x + 1.0, R.y + 1.8, R.z + 8.6], k); v.at = [R.x - 3.6, R.y + 6.8, R.z - 12]; v.fov = 60; v.near = 0.1; v.drift = 0.02; v.shake = 0.003; v.expo = 1.15; break; }
    // ---- the grid trips: the coast goes dark in a wave from the substation; the city across the bay district by district
    case 'bayOut': v.p = [686, 4.85, 2.75]; v.at = [-300, -4, 700]; v.fov = 56; v.near = 0.3; v.drift = 0.004; break;
    case 'brakeX': v.p = [-28.5, 3.55, 2.7]; v.at = [-72, 3.95, 0.8]; v.fov = 42; v.near = 0.1; v.shake = 0.004 * lfTrainV(s) / LFP.train.v; break;
    case 'emerg': v.at = look(v.p, [1, -0.14, -0.36]); v.fov = 56; break;
    case 'road': v.p = into([166, 4.75, -7.2], [168, 4.75, -7.4], k); v.at = [300, 3.7, -16.4]; v.fov = 44; v.near = 0.2; break;
    case 'roadCar': { const c = W.cars[1].g.position; v.p = [133.5, 4.35, -19.5]; v.at = [c.x + 1.2, 4.05, -17.25]; v.fov = 34; v.near = 0.2; v.drift = 0.004; break; }
    case 'ring': v.at = look(v.p, [1, -0.33, 0.06]); v.fov = 50; break;
    // ---- the beach (real speed from here)
    case 'stopX': v.p = into([738, sy(738, 33) + 1.45, 33], [737, sy(737, 32.5) + 1.5, 32.5], k); v.at = [702, 5.1, 0.6]; v.fov = 40; v.near = 0.2; break;
    case 'winBeach': { const q = [eye[0] + 0.12, eye[1] + 0.03, eye[2] + 0.3]; v.p = q; v.at = look(q, [F.x - q[0], F.y + 0.6 - q[1], F.z - q[2]]); v.fov = 48; break; }   // you lean to the glass
    case 'spk': { const K = LF_SPK, f = [Math.sin(K.yaw), 0, Math.cos(K.yaw)], sd = [f[2], 0, -f[0]], c = [K.x + f[0] * 0.14, K.y + 0.64, K.z + f[2] * 0.14];
      v.p = into([c[0] + f[0] * 1.0 + sd[0] * 0.42, c[1] + 0.2, c[2] + f[2] * 1.0 + sd[2] * 0.42], [c[0] + f[0] * 0.85 + sd[0] * 0.36, c[1] + 0.16, c[2] + f[2] * 0.85 + sd[2] * 0.36], k);
      v.at = c; v.fov = 38; v.near = 0.05; v.drift = 0.004; v.expo = 1.15; break; }
    case 'fireA': case 'colB': { const [x, z] = LF_YOU_FIRE.p, y = sy(x, z) + 1.22; v.p = [x, y, z]; v.near = 0.03; v.drift = 0.006;
      v.at = m === 'fireA' ? [F.x, F.y + 0.55, F.z] : [F.x + 1.2, F.y + 0.9, F.z + 2.4]; v.fov = 52; v.expo = m === 'colB' ? 1.25 : 1.05; break; }
    case 'fireB': v.p = into([F.x - 3.6, F.y + 0.75, F.z + 3.1], [F.x - 3.3, F.y + 0.72, F.z + 2.8], k); v.at = [F.x + 0.2, F.y + 0.55, F.z - 0.3]; v.fov = 42; v.near = 0.1; v.expo = 1.1; break;
    case 'waves': v.p = into([766, sy(766, 41) + 1.15, 41.2], [767, sy(767, 41.6) + 1.12, 41.6], k); v.at = [806, 0.1, 51]; v.fov = 46; v.near = 0.2; v.expo = 1.25; break;
    case 'colA': v.p = into([F.x + 2.9, F.y + 1.05, F.z - 2.9], [F.x + 2.6, F.y + 1.0, F.z - 2.6], k); v.at = [F.x - 1.0, F.y + 0.55, F.z + 0.9]; v.fov = 42; v.near = 0.1; v.expo = 1.35; break;
    case 'dayA': v.p = into([766, 7.5, 47], [764, 7.9, 46], k); v.at = [640, 26, -160]; v.fov = 56; v.near = 0.3; v.expo = 1.4; break;
    case 'heat': v.p = into([F.x - 4.6, F.y + 1.5, F.z + 3.9], [F.x - 4.2, F.y + 1.45, F.z + 3.6], k); v.at = [F.x + 0.4, F.y + 0.5, F.z - 0.5]; v.fov = 44; v.near = 0.1; v.expo = 1.6; break;
    case 'starsA': { const p = [F.x + 1.5, F.y + 1.1, F.z + 6], d0 = set.sky.dir(1.9, -52), d1 = set.sky.dir(4.4, -63); v.p = p; v.at = look(p, lfV(d0, d1, E(k)), 100); v.fov = 72; v.near = 0.2; v.drift = 0.004; v.expo = 1.35; break; }   // (south-east and up: Achernar, then the Magellanic Clouds)
    case 'starsB': { const p = [F.x - 2.3, F.y + 0.38, F.z - 1.4]; v.p = p; v.at = look(p, [0.45, 0.52, 0.72], 100); v.fov = 62; v.near = 0.05; v.expo = 1.5; break; }
    case 'runout': { const p = into([F.x + 0.5, F.y + 1.6, F.z + 9], [F.x + 0.3, F.y + 1.7, F.z + 9.5], k), d = set.sky.dir(0.35, -1.6); v.p = p; v.at = look(p, [d[0], d[1] - 0.18, d[2]], 100); v.fov = 64; v.near = 0.2; break; }
    // ---- 4: light's waves stretch (9:10): from the sand behind the party, their heads against a sky your eyes can't focus
    case 'stretch': { const p = into([F.x + 0.9, F.y + 0.5, F.z - 3.7], [F.x + 0.8, F.y + 0.46, F.z - 3.9], k); v.p = p; v.at = look(p, [-0.08, 0.36, 1], 100); v.fov = 58; v.near = 0.1; v.drift = 0.003; v.expo = 1.3; break; }
    case 'pupil': { const p = [722, sy(722, 43.5) + 1.55, 43.5], d = set.sky.dir(14.66, -60.83); v.p = p; v.at = look(p, [d[0] + 0.06, d[1] - 0.1, d[2]], 100); v.fov = 50; v.near = 0.2; v.drift = 0.002; break; }
    case 'question': { const p = into([725, sy(725, 33.5) + 1.8, 33.5], [725, sy(725, 31) + 2.4, 31], k), d = set.sky.dir(14.66, -60.83); v.p = p; v.at = look(p, [d[0] * 0.6, d[1] + 0.12, d[2]], 100); v.fov = 54; v.near = 0.2; break; }
  }
  void into;
}

// labels pinned in the scene: [{ p, text, sub, a, side }]
function lfCoastLabels(set, t) {
  const shot = lfShotAt(t), m = shot.mode, out = [], W = StoryHUD.win, s = set._s;
  const lab = (p, text, sub, a0 = 0.8, side) => out.push({ p, text, sub, a: W(t, shot.t0 + a0, shot.t1 - 0.25, 0.35, 0.3), side });
  if (m === 'bay') { const H = LF_ST.hospital; lab([H[0], lfCityY(H[0], H[2]) + 34, H[2]], 'THE HOSPITAL', 'MRI scanner', 1.0); const D = LF_ST.stadium; lab([D[0], lfCityY(D[0], D[2]) + 42, D[2]], 'THE STADIUM', '40,000 people', 1.4, 'r'); }
  if (m === 'flicker') lab([-267.4, LF_ST.wallTop + 6.6, -10.6], 'TRANSFORMER', 'its iron saturates', 1.0);
  if (m === 'roadCar') { const c = set.W.cars[1]; lab([c.g.position.x + 1.6, 5.2, -17.25], 'SPARK COIL', `${Math.round(100 / (LFP.k(s) ** 2))}% of its energy`, 0.8); }
  if (m === 'spk') { const K = LF_SPK; lab([K.x, K.y + 1.02, K.z], 'MAGNET + COIL', `pushes ${Math.round(100 / (LFP.k(s) ** 2))}% as hard`, 0.6); }
  if (m === 'runout') { const d = set.sky.dir(0.35, -1.6), c = set.camera.position; lab([c.x + d[0] * 300, c.y + d[1] * 300, c.z + d[2] * 300], 'SATURN', 'its sunlight: 2½ hours on the way', 1.2, 'r'); }
  if (m === 'roof') { const V = LF_HR.vent; lab([V[0], V[1] + 0.6, V[2]], 'QUENCH PIPE', 'helium, boiling off', 1.2); }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// THE HOSPITAL'S ROOF (city.js builds the block: 70 × 26 × 26 m on its hill; this is what stands on top of it)
// ---------------------------------------------------------------------------------------------------------------------
const LF_HR = (() => { const H = LF_ST.hospital, y = lfCityY(H[0], H[2]) - 0.5 + 26; return { x: H[0], z: H[2], y, vent: [H[0] - 7, y + 5.9, H[2] - 3.5] }; })();
function lfBuildHospRoof(S) {
  const R = LF_HR, top = R.y + 0.2;
  const M = { par: lfStd('#7c7e7a', 0.9), plant: lfStd('#5e6266', 0.6, 0.35), steel: lfStd('#aeb2b6', 0.32, 0.9), dark: lfStd('#24262a', 0.8), door: lfStd('#3a4a5a', 0.6, 0.3) };
  // the slab: embedded 10 cm into the block's top (no shared plane); the helipad's circle and H are in its texture
  const tex = lfTex(lfCanvas(1400, 512, (g, w, h) => {
    g.fillStyle = '#4c4e52'; g.fillRect(0, 0, w, h);
    const r = new RNG(77); for (let i = 0; i < 9000; i++) { const v = 60 + r.next() * 28; g.fillStyle = `rgba(${v},${v},${v + 3},0.35)`; g.fillRect(r.next() * w, r.next() * h, 2 + r.next() * 5, 2 + r.next() * 5); }
    g.strokeStyle = 'rgba(30,30,32,0.5)'; g.lineWidth = 2; for (let x = 0; x < w; x += 70) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    const cx = w * 0.79, cy = h * 0.5, rr = h * 0.36; g.lineWidth = 16; g.strokeStyle = '#d8d4c4'; g.beginPath(); g.arc(cx, cy, rr, 0, 6.29); g.stroke();
    g.fillStyle = '#d8d4c4'; g.fillRect(cx - rr * 0.42, cy - rr * 0.55, rr * 0.18, rr * 1.1); g.fillRect(cx + rr * 0.24, cy - rr * 0.55, rr * 0.18, rr * 1.1); g.fillRect(cx - rr * 0.3, cy - rr * 0.09, rr * 0.6, rr * 0.18);
  }), { repeat: false, aniso: 8 });
  const slab = lfBox(69.4, 0.3, 25.4, lfStd('#ffffff', 0.95, 0, { map: tex }), R.x, R.y + 0.05, R.z); slab.castShadow = false;
  // the parapet (its outer faces overhang the slab's edge by 5 cm; it sits 5 cm into the slab)
  for (const [w, d, x, z] of [[69.5, 0.25, 0, -12.625], [69.5, 0.25, 0, 12.625], [0.25, 25.0, -34.625, 0], [0.25, 25.0, 34.625, 0]]) lfBox(w, 1.1, d, M.par, R.x + x, top - 0.05 + 0.55, R.z + z);
  // the lift room and the stair house (a door, its lamp), the air handlers
  lfBox(8, 3.4, 6, M.par, R.x + 18, top - 0.05 + 1.7, R.z + 5);
  lfBox(4.2, 2.9, 3.6, M.par, R.x + 11, top - 0.05 + 1.45, R.z + 6.4);
  lfBox(1.0, 2.1, 0.08, M.door, R.x + 11, top + 1.05, R.z + 4.58);
  const lampM = new THREE.MeshBasicMaterial({ color: '#ffd9a0' }); lfBox(0.3, 0.16, 0.12, lampM, R.x + 11, top + 2.45, R.z + 4.58);
  const lamp = new THREE.PointLight('#ffcf90', 0, 30, 1.6); lamp.position.set(R.x + 11, top + 2.4, R.z + 4.1); S.scene.add(lamp);
  for (const [x, z] of [[-24, 7], [-17, 7], [-24, -6]]) { lfBox(3.4, 1.7, 2.2, M.plant, R.x + x, top - 0.05 + 0.85, R.z + z);
    lfCyl(0.7, 0.7, 0.12, M.dark, R.x + x, top - 0.05 + 1.74, R.z + z, null, 20); }
  // the aviation lights on the lift room (mains)
  const av = []; for (const [x, z] of [[14.2, 2.2], [21.8, 7.8]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff2a1a' })); m.position.set(R.x + x, top + 3.45, R.z + z); S.scene.add(m); av.push(m); }
  // the MRI's quench pipe: out of its plant housing, up 3.4 m to an open mouth with a mesh guard; frost creeps up it
  const V = R.vent;
  lfBox(2.4, 2.3, 2.4, M.plant, V[0], top - 0.05 + 1.15, V[2]);
  const bulkM = new THREE.MeshBasicMaterial({ color: '#ffe2b8' }); lfBox(0.28, 0.14, 0.1, bulkM, V[0] + 0.5, top + 1.9, V[2] + 1.25);
  const bulk = new THREE.PointLight('#ffd8a8', 0, 22, 1.5); bulk.position.set(V[0] + 0.5, top + 1.85, V[2] + 1.7); S.scene.add(bulk);
  const frostM = lfStd('#aeb2b6', 0.32, 0.9);
  const pipe = lfCyl(0.2, 0.2, V[1] - (top + 2.2), frostM, V[0], (V[1] + top + 2.2) / 2, V[2], null, 24);
  lfCyl(0.27, 0.27, 0.12, M.steel, V[0], top + 2.3, V[2], null, 24);
  const mouth = lfMesh(new THREE.CylinderGeometry(0.34, 0.21, 0.4, 24, 1, true), M.steel, V[0], V[1] + 0.12, V[2]); mouth.material = mouth.material.clone(); mouth.material.side = THREE.DoubleSide;
  for (const a of [0, 1, 2]) { const st = lfCyl(0.025, 0.025, 2.0, M.steel, V[0] + 0.55 * Math.cos(a * 2.09), top + 2.3 + 1.0, V[2] + 0.55 * Math.sin(a * 2.09), null, 6); st.castShadow = false;
    const br = lfBox(0.55, 0.04, 0.04, M.steel, V[0] + 0.33 * Math.cos(a * 2.09), top + 3.25, V[2] + 0.33 * Math.sin(a * 2.09)); br.rotation.y = -a * 2.09; }
  // the red cross's frame: two posts down the block's front, brackets into the cross's back (city.js draws the cross)
  for (const x of [-1.6, 1.6]) { lfBox(0.2, 11.0, 0.2, M.steel, R.x + x, R.y + 3.6, R.z - 12.95);
    for (const y of [2.6, 5.5, 8.3]) lfBox(0.12, 0.12, 0.3, M.steel, R.x + x, R.y + y, R.z - 13.15); }
  return {
    lamp: 1, cross: 1,
    update(s) {
      const on = lfHospital(s), em = 0.35 * lfEmerg(s, 0.15); this.lamp = on; this.cross = Math.max(on, em);
      lamp.intensity = 26 * on; bulk.intensity = 30 * on; bulkM.color.setRGB(on + 0.04, 0.88 * on + 0.03, 0.72 * on + 0.03); lampM.color.setRGB(1.0 * on + 0.04, 0.85 * on + 0.03, 0.62 * on + 0.03);
      for (const m of av) m.material.color.setRGB(0.05 + 0.95 * on, 0.04 + 0.12 * on, 0.03 + 0.08 * on);
      // frost: the cold gas freezes the air's moisture onto the pipe, from the bottom up, in the seconds after the quench
      const f = lfSm(s, LFP.sQuench + 0.05, LFP.sQuench + 0.9); frostM.color.setRGB(0.68 + 0.27 * f, 0.7 + 0.26 * f, 0.72 + 0.26 * f); frostM.roughness = 0.32 + 0.6 * f; frostM.metalness = 0.9 * (1 - f);
    },
  };
}
