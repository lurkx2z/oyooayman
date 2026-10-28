/* =====================================================================
   GARDEN — your back garden on a clear late-October night and the sky over it (garden-build.js builds the house and
   the garden; sky.js draws the sky; physics.js says when everything happens). One set, many shots (modes, shots.js):
     open      10:03:32: the half-black sky, the half-Moon (long lens); the shock   title     the whole sky under the title
     before    9:59:38: the stars, the Moon, the cat on the wall             rule      the sky behind the rule's diagram
     vanish    the whole sky to the east; at 10:00:00 half of it goes black   line      the line across the sky, labelled
     replay    the Moon (long lens), slowed down 8×: its far half wipes away
     nothing   the tea on the table: steam rising straight up                 why       the garden behind the diagram
     calls     your phone on the table: the call to Sydney dropped at 10:00
     tv        next door's upstairs window: NO SIGNAL                         moonedge  the telescope: the Moon's glowing edge
     tea       the tea in the mug, shivering (the half-Moon in it)            saturn    where Saturn was (labelled)
     cat       the cat on the back wall, unbothered
     heavier   the bird feeder starting to lean (south)                       bath      the bird bath: its water creeping up one side
     ears      down the garden from the patio: your ears pop
     alarms    the cat, alert; car alarms flashing behind the wall            count     twelve seconds: down the garden, then quick cuts
     hit       10:03:42.5: the shock (down the garden; the feeder swinging; the cat bolting)
     real / question   9:59 PM, tonight (the sky; the feeder; the table)
   Layout (metres): the house's back wall is z = 0, the garden runs to −z (SSE, azimuth 150°), +x is WSW, −x ENE.
   ===================================================================== */

const HV_GD = {
  you: [0.3, 1.62, -2.6],
  lamp: [3.6, 0, -18.6],             // the streetlight in the lane behind the back wall
  hang: [-2.38, 2.6, -12.5],         // where the bird feeder hangs from the apple tree's branch
  tv: [9.2, 4.25, -0.05],            // next door's upstairs window (their back wall is in line with yours)
  night: { starSize: 1.45, starK: 1.3, mw: 2.1, lens: 36 },   // the wide night shots: a full starry sky; the Moon drawn 3.6× its size (PLAN § 4)
};
// a direction in the garden from azimuth / altitude, d metres from p
const hvAim = (p, az, alt, d = 40) => { const g = hvGardenDir(az, alt); return [p[0] + g[0] * d, p[1] + g[1] * d, p[2] + g[2] * d]; };
// which way "down" tips (garden frame, horizontal): towards the half-Earth's middle, NNW
const HV_TIP = hvGardenDir(HVP.tiltAz, 0);

// the streetlight in the lane: a modern full cut-off head (its LEDs face straight down, so from the garden you see only
// a sliver of light under a dark head, not a glowing ball that could pass for the Moon)
function hvStreetlight(scene, at) {
  const g = new THREE.Group(); g.position.set(...at); scene.add(g);
  const grey = hvStd('#3e4246', 0.6, 0.5);
  hvCyl(0.07, 0.09, 5.0, grey, 0, 2.5, 0, g, 10);
  hvBox(0.08, 0.08, 1.0, grey, 0, 4.96, 0.45, g);
  hvBox(0.36, 0.09, 0.62, grey, 0, 4.93, 1.0, g);
  const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.46), new THREE.MeshBasicMaterial({ color: '#d9c4a2' })); lens.rotation.x = Math.PI / 2; lens.position.set(0, 4.883, 1.0); g.add(lens);
  const light = new THREE.SpotLight('#ffdcb0', 0, 30, 1.05, 0.75, 1.3);
  light.position.set(at[0], 4.85, at[2] + 1.0); light.target.position.set(at[0] - 0.5, 0, at[2] + 4.0); scene.add(light, light.target);
  return { g, light };
}

// your phone, lying on the patio table: a screen that is a canvas redrawn when what it shows changes
function hvPhone(parent) {
  const g = new THREE.Group(); parent.add(g);
  hvMesh(hvRoundBox(0.074, 0.008, 0.156, 0.008, 0.002), hvStd('#1a1c20', 0.35, 0.4), 0, 0, 0, g);          // (0 → 8 mm up)
  const W = 360, H = 760, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.144), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  scr.rotation.x = -Math.PI / 2; scr.position.y = 0.0085; g.add(scr);
  const c = cv.getContext('2d');
  const font = (w, px) => `${w} ${px}px "Inter", "Helvetica Neue", Arial, sans-serif`;
  let key = '';
  const status = (clock) => { c.fillStyle = '#e8e8ea'; c.font = font(600, 22); c.textAlign = 'left'; c.fillText(clock, 26, 40); c.textAlign = 'right'; c.fillText('▮▮▯▯  ◔ 61%', W - 24, 40); };
  return {
    g, scr,
    // the call that dropped at 10:00:00; clock: the status bar
    draw(mode, clock) {
      const k = mode + '|' + clock;
      if (k === key) return; key = k;
      c.fillStyle = '#0c0d10'; c.fillRect(0, 0, W, H);
      {
        status(clock);
        c.textAlign = 'center';
        c.fillStyle = '#2b2e36'; c.beginPath(); c.arc(W / 2, 200, 66, 0, 6.2832); c.fill();
        c.fillStyle = '#c9ccd4'; c.font = font(600, 54); c.fillText('S', W / 2, 220);
        c.fillStyle = '#ffffff'; c.font = font(500, 40); c.fillText('Sam (Sydney)', W / 2, 330);
        c.fillStyle = '#9da1aa'; c.font = font(400, 24); c.fillText('+61 2 5550 0198', W / 2, 372);
        c.fillStyle = '#ff6b5e'; c.font = font(600, 34); c.fillText('Call failed', W / 2, 452);
        c.fillStyle = '#9da1aa'; c.font = font(400, 22); c.fillText('Call ended 10:00:00 PM', W / 2, 492); c.fillText('No route to destination', W / 2, 524);
        c.fillStyle = '#3a3d45'; c.beginPath(); c.arc(W / 2 - 80, 640, 40, 0, 6.2832); c.fill(); c.beginPath(); c.arc(W / 2 + 80, 640, 40, 0, 6.2832); c.fill();
        c.fillStyle = '#e8e8ea'; c.font = font(600, 18); c.fillText('Call again', W / 2 - 80, 710); c.fillText('Message', W / 2 + 80, 710);
      }
      tex.needsUpdate = true;
    },
  };
}
// next door's upstairs window: a dark room lit by a television showing NO SIGNAL (the box drifts round the screen)
function hvTvWindow(scene, at) {
  const W = 300, H = 288, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.2), new THREE.MeshBasicMaterial({ map: tex, toneMapped: true }));
  m.position.set(...at); m.rotation.y = Math.PI; scene.add(m);
  const frame = hvStd('#ddd8ce', 0.6);
  for (const [w, h, x, y] of [[1.36, 0.07, 0, 0.635], [1.36, 0.1, 0, -0.64], [0.07, 1.3, 0.66, 0], [0.07, 1.3, -0.66, 0], [0.05, 1.2, 0, 0]]) hvBox(w, h, 0.06, frame, at[0] - x, at[1] + y, at[2] - 0.01, scene);
  const c = cv.getContext('2d'); let key = '';
  const light = new THREE.PointLight('#6f8cff', 0, 9, 1.8); light.position.set(at[0], at[1] - 0.3, at[2] - 0.8); scene.add(light);
  return {
    m, light,
    draw(t, on = 1) {
      const ph = Math.floor(t * 4), k = ph + '|' + on; if (k === key) return; key = k;
      // the room: its back wall and ceiling washed blue by the screen, the screen itself low on the right
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a1230'); g.addColorStop(1, '#03050c'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      const rg = c.createRadialGradient(W * 0.62, H * 0.7, 10, W * 0.62, H * 0.7, W * 0.7); rg.addColorStop(0, `rgba(70,110,255,${0.55 * on})`); rg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
      c.fillStyle = '#05060a'; c.fillRect(W * 0.35, H * 0.55, W * 0.56, H * 0.36);
      c.fillStyle = on ? '#1d46c8' : '#0b0d12'; c.fillRect(W * 0.38, H * 0.58, W * 0.5, H * 0.29);
      if (on) {
        const bx = W * 0.4 + (Math.sin(ph * 0.37) * 0.5 + 0.5) * W * 0.26, by = H * 0.6 + (Math.sin(ph * 0.23 + 1) * 0.5 + 0.5) * H * 0.17;
        c.fillStyle = '#0d1e66'; c.fillRect(bx, by, W * 0.2, H * 0.08); c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.strokeRect(bx, by, W * 0.2, H * 0.08);
        c.fillStyle = '#ffffff'; c.font = '700 13px Arial, sans-serif'; c.textAlign = 'center'; c.fillText('NO SIGNAL', bx + W * 0.1, by + H * 0.055);
      }
      // a figure in an armchair, against the screen
      c.fillStyle = '#020306'; c.beginPath(); c.ellipse(W * 0.25, H * 0.72, W * 0.09, H * 0.13, 0, 0, 6.2832); c.fill(); c.beginPath(); c.arc(W * 0.25, H * 0.53, W * 0.045, 0, 6.2832); c.fill();
      c.fillRect(W * 0.12, H * 0.68, W * 0.26, H * 0.32);
      tex.needsUpdate = true;
    },
  };
}
// a hanging bird feeder (a tube of seed under a little roof) on a cord: its pivot leans with the felt pull
function hvFeeder(scene, at) {
  const pivot = new THREE.Group(); pivot.position.set(...at); scene.add(pivot);
  const cord = hvStd('#2a2622', 0.9), green = hvStd('#3c5a3a', 0.6, 0.2), seed = hvStd('#a08458', 0.95), clear = new THREE.MeshStandardMaterial({ color: '#cfd8dc', transparent: true, opacity: 0.35, roughness: 0.1 });
  hvCyl(0.004, 0.004, 0.5, cord, 0, -0.25, 0, pivot, 5);
  const f = new THREE.Group(); f.position.y = -0.5; pivot.add(f);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.06, 16), green); roof.position.y = -0.02; f.add(roof);
  hvCyl(0.042, 0.042, 0.26, seed, 0, -0.19, 0, f, 14); hvCyl(0.046, 0.046, 0.27, clear, 0, -0.19, 0, f, 14);
  hvCyl(0.06, 0.06, 0.012, green, 0, -0.33, 0, f, 16);
  for (const a of [0, Math.PI]) hvCyl(0.004, 0.004, 0.09, green, Math.cos(a) * 0.06, -0.26, Math.sin(a) * 0.06, f, 5).rotation.z = Math.PI / 2;
  pivot.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  return { pivot };
}
// the bird bath's water: a disc that really tilts with the felt pull (about its middle, 13.5 cm up the bowl), trimmed to
// the inside of the stone bowl; and a ring of green-brown scum on the stone where the water has always stood (the old
// level: on the high side the water climbs over it, on the low side it drops below it)
function hvBathWater(bath) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uB: { value: new THREE.Matrix4() }, uTilt: { value: new THREE.Vector3(0, 1, 0) }, uSky: { value: new THREE.Color('#1a2438') }, uMoon: { value: new THREE.Vector3(0, 1, 0) }, uK: { value: 1 }, uRip: { value: 0 }, uTime: { value: 0 } },
    vertexShader: 'uniform mat4 uB; varying vec3 vL; varying vec3 vW; void main(){ vL = (uB * vec4(position, 1.0)).xyz; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: /* glsl */`
      uniform vec3 uTilt, uSky, uMoon; uniform float uK, uRip, uTime; varying vec3 vL; varying vec3 vW;
      void main() {
        // (vL: the bowl's frame. Its inside: radius 0.30 m at 8 cm up to 0.40 m at its 16 cm rim)
        float y = vL.y, r = length(vL.xz), wall = 0.3 + (y - 0.08) * 1.25; if (r > wall || y > 0.158) discard;
        vec2 rd = vL.xz / max(r, 1e-3);                                                     // (the tremors: rings off the bowl's wall)
        float rip = sin((wall - r) * 260.0 - uTime * 19.0) * 0.6 + sin(dot(vL.xz, vec2(173.0, 121.0)) - uTime * 23.0) * 0.4;
        vec3 v = normalize(cameraPosition - vW), n = normalize(uTilt + vec3(rd.x, 0.0, rd.y) * rip * 0.035 * uRip);
        float fr = 0.05 + 0.95 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
        vec3 col = mix(vec3(0.03, 0.035, 0.04), uSky, fr);
        col += vec3(0.85, 0.9, 1.0) * pow(max(dot(reflect(-v, n), uMoon), 0.0), 400.0) * 1.6;
        float edge = smoothstep(0.006, 0.0, wall - r);                                  // (a bright meniscus where it meets the stone)
        gl_FragColor = vec4((col + vec3(0.32, 0.3, 0.26) * edge) * uK, 1.0);
      }`,
  });
  const geo = new THREE.CircleGeometry(0.44, 64); geo.rotateX(-Math.PI / 2);
  const pivot = new THREE.Group(); pivot.position.y = 0.84 + 0.135; bath.add(pivot);
  const m = new THREE.Mesh(geo, mat); pivot.add(m);
  // the scum line: a 6 mm band just proud of the bowl's inner wall, centred on the old level
  const band = [0.129, 0.141].map((y) => new THREE.Vector2(0.3 + (y - 0.08) * 1.25 - 0.0015, y));
  const ring = new THREE.Mesh(new THREE.LatheGeometry(band, 24), new THREE.MeshStandardMaterial({ color: '#4a4a2c', roughness: 0.95, side: THREE.DoubleSide }));
  ring.position.y = 0.84; bath.add(ring);
  const tmp = new THREE.Matrix4();
  return {
    m, mat, pivot,
    // q: the tilt (a quaternion, garden frame); the uniform maps the disc into the bowl's frame
    set(q) { pivot.quaternion.copy(q); pivot.updateMatrix(); tmp.makeTranslation(0, -0.84, 0); mat.uniforms.uB.value.multiplyMatrices(tmp, pivot.matrix); },
  };
}

HV_SETS.garden = (app) => {
  const S = hvSet(app, { sky: '#000000', fov: 55, near: 0.02, far: 6000, hemi: ['#2a3550', '#16120e', 0.2], sun: [0, 60, -60], sunI: 0, shadow: 2048, shadowR: 22, shadowFar: 400 });
  const scene = S.scene, cam = S.camera, K = hvK, G = HV_G;
  scene.environment = hvEnv(app.renderer, '#9fb8d8', '#d6d2ca', '#5a544a');
  const P = hvBuildGarden(app, S), M = P.M;
  const sky = new HvSky(scene, { town: '#3a2c22' });
  // ---- light: the Moon (as its own light: a directional), the sky; the lamps
  const moonL = S.sun; moonL.color.set('#a8b8d8');
  const warm = '#ffb468';
  const spill = new THREE.SpotLight(warm, 0, 16, 0.95, 0.85, 1.6); spill.position.set(-1.6, 1.7, 0.6); spill.target.position.set(-1.4, 0, -5); scene.add(spill, spill.target);
  const strings = [-2.5, -8, -13.5].map((z) => { const p = new THREE.PointLight('#ffc070', 0, 6, 1.8); p.position.set(-G.lawnW / 2 + 0.25, 1.75, z); scene.add(p); return p; });
  const pendant = new THREE.PointLight('#ffcf96', 0, 9, 1.6); pendant.position.set(...P.lampAt); scene.add(pendant);
  const candle = new THREE.PointLight('#ffad5a', 0, 7, 1.8); scene.add(candle);
  const street = hvStreetlight(scene, HV_GD.lamp);
  { const tubeM = hvStd('#a9adb2', 0.45, 0.35); P.tube.traverse((o) => { if (o.isMesh && o.material === M.white) o.material = tubeM; }); P.bathIce.visible = false; P.bathWater.visible = false; }
  const water = hvBathWater(P.bath);
  // ---- the candle's flame (the lantern on the patio table)
  const flame = new THREE.Group(); flame.position.set(...P.wickAt); flame.position.y += 0.018; P.lantern.add(flame);
  const fl = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), new THREE.MeshBasicMaterial({ color: '#ffd28a' })); fl.scale.set(0.007, 0.018, 0.007); flame.add(fl);
  const flCore = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color: '#fff4dc' })); flCore.scale.set(0.004, 0.009, 0.004); flCore.position.y = -0.006; flame.add(flCore);
  // ---- the tea's surface (it shivers with the tremors; the Moon in it)
  const teaU = { uRip: { value: 0 }, uTime: { value: 0 }, uMoon: { value: new THREE.Vector3(0, 1, 0) }, uC: { value: new THREE.Vector3() }, uCandle: { value: new THREE.Vector3() } };
  P.teaTop.material = new THREE.ShaderMaterial({ uniforms: teaU,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uRip, uTime; uniform vec3 uMoon, uC, uCandle; varying vec3 vW;
      void main() { vec2 d = vW.xz - uC.xz; float r = length(d); vec2 rd = d / max(r, 1e-4);
        float rip = sin(r * 900.0 - uTime * 26.0) * exp(-r * 18.0) * 0.7 + sin((0.036 - r) * 1300.0 - uTime * 21.0) * 0.5;
        vec3 n = normalize(vec3(0.0, 1.0, 0.0) + vec3(rd.x, 0.0, rd.y) * rip * 0.09 * uRip), v = normalize(cameraPosition - vW), R = reflect(-v, n);
        float fr = 0.03 + 0.97 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
        vec3 col = vec3(0.07, 0.035, 0.012) * 0.6 + vec3(0.1, 0.13, 0.2) * fr * 0.5;
        col += vec3(0.95, 0.97, 1.0) * smoothstep(0.9993, 0.99985, dot(R, normalize(uMoon))) * 2.2;          // (the Moon)
        col += vec3(1.0, 0.7, 0.35) * pow(max(dot(R, normalize(uCandle - vW)), 0.0), 600.0) * 1.4;            // (the lantern)
        gl_FragColor = vec4(col, 1.0); }` });
  // ---- the cat on the back wall; the phone; next door's TV; the bird feeder; the tea's steam
  const catRoot = new THREE.Group(); catRoot.position.set(G.catAt[0], G.wallH + 0.08, G.catAt[2]); catRoot.rotation.y = 0.35; scene.add(catRoot);
  const catFill = new THREE.PointLight('#ffc88a', 0, 3.5, 1.6); catFill.position.set(G.catAt[0] + 0.9, G.wallH + 0.7, G.catAt[2] + 1.6); scene.add(catFill);
  const cat = hvBuildCat(catRoot);
  const phone = hvPhone(P.table); phone.g.position.set(-0.08, 0.7325, 0.22); phone.g.rotation.y = 0.5;
  const tv = hvTvWindow(scene, HV_GD.tv);
  const feeder = hvFeeder(scene, HV_GD.hang);
  // the true vertical under the feeder's branch (drawn in for the 'heavier' shot): where it hung before 10:00
  const plumb = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.98, 0)]), new THREE.LineDashedMaterial({ color: '#f3d9a8', dashSize: 0.025, gapSize: 0.018, transparent: true, opacity: 0.85, fog: false }));
  plumb.computeLineDistances(); plumb.position.set(...HV_GD.hang); scene.add(plumb);
  // the car alarms in the street behind (from 10:02:58, when their tilt sensors trip: sound-amb.js): their hazard lights
  // flash amber on the backs of the terrace and the trees beyond the wall (the cars themselves are hidden by it; a dim
  // light high over the lane stands in for what bounces back off the houses). [x, z, story second, flashes a second, phase]
  const hazards = [[2.2, -21.0, 186.0, 1.30, 0.0], [-5.0, -22.5, 178.5, 1.18, 0.4], [8.0, -24.0, 201.5, 1.42, 0.7]].map(([x, z, s0, hz, ph]) => {
    const L = new THREE.SpotLight('#ff9a2a', 0, 28, 0.62, 0.85, 1.4); L.position.set(x, 0.9, z); L.target.position.set(x, 3.2, -32); scene.add(L, L.target);
    return { L, s0, hz, ph };
  });
  const bounce = new THREE.PointLight('#ff9a3a', 0, 30, 1.2); bounce.position.set(0.5, 7.0, -22); scene.add(bounce);
  const steam = hvPuffs(scene, 300, { soft: 1.8 });
  const mugW = new THREE.Vector3(); P.mug.updateWorldMatrix(true, false); P.mug.getWorldPosition(mugW);
  const phoneW = new THREE.Vector3(); phone.g.updateWorldMatrix(true, false); phone.g.getWorldPosition(phoneW);

  const skyTime = (t) => hvStoryAt(t);
  HV_GARDEN.skyTime = skyTime;
  const look = (p, at, fov, t, drift = 0.004, roll = 0) => { const d = hvDrift(t, drift, 0.3, 11); hvCam(cam, [p[0] + d[0], p[1] + d[1], p[2] + d[2]], at, fov, roll); };
  // the shock: the ground lurches towards the cut (up and to the SSE), and keeps shaking
  const jolt = (t, t1) => {
    const u = t - t1; if (u < 0) return { p: [0, 0, 0], roll: 0 };
    const a = Math.min(1, u / 0.05), lurch = 0.9 * (1 - Math.exp(-u / 0.08)) * a;
    const sh = 0.16 * a * Math.exp(-u * 0.6), n = (s) => noise1(t * 31 + s, s) * sh;
    return { p: [n(1) - HV_TIP[0] * lurch * 0.6, lurch * 0.8 + n(2), n(3) - HV_TIP[2] * lurch * 0.6], roll: 14 * noise1(t * 9, 4) * a };
  };

  const set = {
    scene, camera: cam, sky,
    cuts() { return [...HV.openCuts, HV.cat, hvCap('line', 1).show - 0.3, hvCap('nothing', 1).show - 0.4, ...HV.countCuts, ...HV.hitCuts, hvCap('real2', 0).show - 0.3, HV.real3, HV.real4, HV.real5]; },
    frame(t, shot) {
      const m = shot.mode, s = skyTime(t);
      let pos = HV_GD.you, at = [0, 1.2, -14], fov = 55, drift = 0.004, roll = 0;
      const sk = { t, lens: 0 };
      let felt = hvFelt(s), shake = null;
      cam.near = 0.02; cam.far = 6000;
      catRoot.visible = true; steam.begin();
      catRoot.rotation.y = m === 'alarms' || m === 'count' ? 1.3 : 0.35;          // (at the alarms it turns towards them)
      const moonD = hvLocal(HV_CUT.Mdir, hvFrame(MathX.clamp(m === 'replay' ? hvReplayS(t) : s, -600, 600)));   // (this frame's, not the last frame's)
      // the telescope: on the Moon
      P.scopeHead.rotation.y = Math.atan2(moonD[0], moonD[2]); P.tube.rotation.x = -Math.asin(MathX.clamp(moonD[1], -1, 1));
      const moonAt = (p, d = 40) => [p[0] + moonD[0] * d, p[1] + moonD[1] * d, p[2] + moonD[2] * d];
      // (cameras used by more than one shot: the cat on the wall, the feeder side on, the bird bath, the back wall)
      const camCat = (q) => { pos = hvV([0.2, 1.5, -14.2], [0.15, 1.5, -14.45], q); at = [G.catAt[0], G.wallH + 0.22, G.catAt[2]]; fov = 18; drift = 0.001; };
      const camFeeder = (k) => { const H = HV_GD.hang; pos = [H[0] + 1.8, 1.9, H[2] + hvLerp(0.03, 0.0, k)]; at = [H[0], 1.88, H[2]]; fov = hvLerp(22, 19, k); drift = 0.0003; Object.assign(sk, HV_GD.night); };
      // (the bird bath: low, just over the rim, looking across the bowl square to the tilt, so the water's edge on the far
      // wall runs up across the old water line: under water on the high side, the scum showing on the low side)
      const camBath = (k) => { const B = G.bath, d = hvN3(hvCross(HV_TIP, [0, 1, 0])), c = [B[0], 0.975, B[2]]; pos = hvAdd(hvAdd(c, d, -hvLerp(0.86, 0.7, k)), [0, 1, 0], hvLerp(0.085, 0.07, k)); at = hvAdd(hvAdd(c, d, 0.3), [0, 1, 0], -0.012); fov = hvLerp(25, 21, k); drift = 0.0003; Object.assign(sk, HV_GD.night); };
      const camWall = (k) => { pos = hvV([-3.0, 1.55, -12.6], [-2.85, 1.55, -13.0], k); at = [-0.3, 2.05, -17.6]; fov = 26; drift = 0.001; Object.assign(sk, HV_GD.night); };
      const camCatSide = (q) => { pos = hvV([-0.95, 1.6, -13.4], [-0.9, 1.6, -13.75], q); at = hvAdd(G.catAt, [0, 0.18, 0]); fov = 17; drift = 0.0012; };
      this._sub = 0; let subH = 0;
      // ------------------------------------------------------------------ the shots
      if (m === 'open') {
        // 10:03:32: the half-black sky over the garden (the cut through the middle of the frame); the half-Moon through the
        // long lens; then wide again as the shock arrives
        const sub = HV.openCuts.filter((c) => t >= c).length; this._sub = sub;
        if (sub === 1) { const u = K(t, HV.openCuts[0], HV.openCuts[1], (x) => x); pos = HV_GD.you; at = moonAt(pos); fov = hvLerp(1.62, 1.45, u); drift = 0.00002; cam.near = 1; sk.field = 1; sk.lim = 9.8; sk.starSize = 0.85; }
        else if (sub === 0) { const k = K(t, 0, HV.openCuts[0], (x) => x); pos = hvV([-0.6, 1.62, -5.6], [-0.66, 1.62, -6.2], k); at = hvAim(pos, hvLerp(104, 108, k), hvLerp(31, 29, k)); fov = 76; drift = 0.003; Object.assign(sk, HV_GD.night); }
        else { const k = K(t, HV.openCuts[1], HV.openHit, (x) => x); pos = hvV([-0.3, 1.58, -7.0], [-0.4, 1.58, -7.5], k); at = hvAim(pos, hvLerp(112, 116, k), hvLerp(24, 22, k)); fov = 72; drift = 0.003; Object.assign(sk, HV_GD.night); }
        shake = jolt(t, HV.openHit);
      } else if (m === 'title') {
        const k = K(t, HV.titleShot, HV.before, (x) => x);
        pos = hvV([0.3, 3.0, -0.9], [0.3, 3.3, -2.0], k); at = hvAim(pos, 124, hvLerp(27, 29, k)); fov = 66; drift = 0.002;
        Object.assign(sk, HV_GD.night);
      } else if (m === 'before') {
        if (t < HV.cat) { const q = Ease.inOutSine(K(t, HV.before, HV.cat, (x) => x)); pos = [0.4, 1.5, -5.0]; at = hvAim(pos, hvLerp(158, 135, q), hvLerp(46, 36, q)); fov = hvLerp(74, 66, q); drift = 0.002; Object.assign(sk, HV_GD.night); }
        else { const q = K(t, HV.cat, HV.rule, (x) => x); pos = hvV([-0.95, 1.6, -13.4], [-0.9, 1.6, -13.75], q); at = hvAdd(G.catAt, [0, 0.1, 0]); fov = 17; drift = 0.0012; }
      } else if (m === 'rule') {
        const k = K(t, HV.rule, HV.count, (x) => x);
        pos = [-1.4, 1.62, -6.5]; at = hvAim(pos, hvLerp(112, 120, k), hvLerp(30, 33, k)); fov = 62; drift = 0.003;
        Object.assign(sk, HV_GD.night);
      } else if (m === 'vanish' || m === 'line') {
        // the whole eastern and southern sky over the rooftops, the Moon among the stars; at 10:00:00 the half beyond
        // the cut goes black. (line: the same sky with the cut drawn in and the stars that went labelled)
        const k = m === 'vanish' ? K(t, HV.count, HV.line, (x) => x) : K(t, HV.line, HV.moon, (x) => x);
        pos = [-0.4, 1.45, -6.8];
        if (m === 'vanish') { at = hvAim(pos, hvLerp(110, 106, k), hvLerp(31, 32, k)); fov = hvLerp(80, 76, k); }
        else { at = hvAim(pos, hvLerp(106, 116, k), hvLerp(32, 34, k)); fov = hvLerp(78, 82, k); sk.line = hvWin(t, HV.line + 0.6, HV.moon - 0.1, 0.6, 0.3); }
        drift = 0.0012; Object.assign(sk, HV_GD.night);
      } else if (m === 'replay' || m === 'moonedge') {
        // the Moon through a long lens (the replay: slowed down 8×) / through your telescope (round field: hud.js)
        pos = HV_GD.you;
        if (m === 'replay') { const k = K(t, HV.moon, HV.moonEnd, (x) => x); at = moonAt(pos); fov = hvLerp(1.5, 1.38, k); sk.line = 0.55; sk.skyS = hvReplayS(t); }
        else { const k = Ease.inOutSine(K(t, HV.moonedge, HV.others, (x) => x)); at = moonAt(pos); fov = hvLerp(1.0, 0.74, k); }
        drift = 0.00002; cam.near = 1; sk.field = 1; sk.lim = 9.8; sk.starSize = 0.85;
      } else if (m === 'nothing') {
        // the tea on the table, the half-black sky beyond it; its steam rising straight up
        const k = K(t, HV.nothing, HV.why, (x) => x), M0 = mugW.toArray();
        if (t < hvCap('nothing', 1).show - 0.4) { pos = [M0[0] + 0.3, M0[1] + 0.15, M0[2] + hvLerp(0.58, 0.52, k)]; at = [M0[0] + 0.02, M0[1] + 0.17, M0[2] - 0.6]; fov = 30; drift = 0.0006; }
        else { pos = hvV([0.2, 1.62, -3.4], [0.1, 1.62, -3.8], k); at = hvAim(pos, 140, 24); fov = 70; }
      } else if (m === 'why') {
        const k = K(t, HV.why, HV.gone, (x) => x);
        pos = [hvLerp(-1.8, -1.2, k), 1.62, hvLerp(-2.9, -4.3, k)]; at = hvAim(pos, hvLerp(128, 140, k), hvLerp(16, 21, k)); fov = 64; drift = 0.003;
      } else if (m === 'tea') {
        // the tea in the mug, close, from where the Moon's reflection sits in it: the surface shivering in rings
        const k = K(t, HV.tea, HV.saturn, (x) => x), M0 = mugW.toArray(), top = [M0[0], M0[1] + 0.082, M0[2]], d = hvN3([moonD[0], -moonD[1], moonD[2]]);
        pos = hvAdd(top, d, -hvLerp(0.36, 0.3, k)); at = hvAdd(top, d, 0.02); fov = hvLerp(26, 22, k); drift = 0.0003;
      } else if (m === 'calls') {
        // your phone on the table (from above, a little to one side)
        const k = K(t, HV.calls, HV.tv, (x) => x), Pw = phoneW.toArray();
        pos = [Pw[0] + hvLerp(0.07, 0.06, k), Pw[1] + hvLerp(0.27, 0.24, k), Pw[2] + hvLerp(0.11, 0.1, k)]; at = [Pw[0], Pw[1], Pw[2]]; fov = 38; drift = 0.0005;
      } else if (m === 'tv') {
        // from the bottom of the garden, back up at next door's upstairs window
        const k = K(t, HV.tv, HV.front, (x) => x), T = HV_GD.tv;
        pos = [hvLerp(-1.6, -1.4, k), 1.62, hvLerp(-12.5, -12.0, k)]; at = [T[0] - 0.2, T[1] - 0.4, T[2]]; fov = hvLerp(30, 24, k); drift = 0.0015;
      } else if (m === 'saturn') {
        // south over the back wall and the terrace's roofs: where Saturn was at 10:00 (and Neptune, near it)
        const k = Ease.inOutSine(K(t, HV.saturn, HV.sun, (x) => x));
        pos = [0.0, 1.5, -7.0]; at = hvAim(pos, hvLerp(176, 180, k), hvLerp(25, 29, k)); fov = hvLerp(62, 52, k); drift = 0.0012; Object.assign(sk, HV_GD.night);
      } else if (m === 'cat') {
        camCatSide(K(t, HV.cat2, HV.heavier, (x) => x));
      } else if (m === 'heavier') {
        // side on to the bird feeder (the tree's trunk behind it: a true vertical)
        camFeeder(K(t, HV.heavier, HV.bath, (x) => x));
      } else if (m === 'bath') {
        camBath(K(t, HV.bath, HV.ears, (x) => x));
      } else if (m === 'ears') {
        // from the patio, down the garden: the half-black sky over the wall; a shake of the head as your ears pop
        const k = Ease.inOutSine(K(t, HV.ears, HV.paris, (x) => x)), u = t - hvCap('ears', 0).show;
        pos = hvV([1.0, 1.62, -1.4], [0.7, 1.62, -2.2], k); at = hvAim(pos, hvLerp(162, 146, k), hvLerp(16, 20, k)); fov = 62; drift = 0.003;
        roll += u > 0 ? 2.2 * Math.sin(u * 9) * Math.exp(-u * 3) : 0;
        Object.assign(sk, HV_GD.night);
      } else if (m === 'alarms') {
        // the back wall: the cat up and staring, the terrace beyond it flashing amber
        camWall(K(t, HV.alarms, HV.count2, (x) => x));
      } else if (m === 'count' || m === 'hit') {
        // down the garden: the half-black sky, the half-Moon, twelve seconds; then quick cuts round the garden (the cat,
        // the feeder, the bird bath, the Moon through the long lens, the back wall), then down the garden for the shock
        const sub = m === 'count' ? HV.countCuts.filter((c) => t >= c).length : 0, c0 = sub ? HV.countCuts[sub - 1] : 0, u = sub ? K(t, c0, c0 + 1.8, (x) => x) : 0;
        subH = m === 'hit' ? HV.hitCuts.filter((c) => t >= c).length : 0;
        this._sub = sub; this._subH = subH;
        if (subH === 1) camFeeder(1);                                                    // (the shock: the feeder swinging)
        else if (subH === 2) camCatSide(1);                                              // (the cat, gone off the wall)
        else if (sub === 1) camCatSide(0.5 + 0.5 * u);
        else if (sub === 2) camFeeder(0.6 + 0.4 * u);
        else if (sub === 3) camBath(0.5 + 0.5 * u);
        else if (sub === 4) { pos = HV_GD.you; at = moonAt(pos); fov = hvLerp(1.45, 1.36, u); drift = 0.00002; cam.near = 1; sk.field = 1; sk.lim = 9.8; sk.starSize = 0.85; }
        else if (sub === 5) camWall(0.7 + 0.3 * u);
        else if (m === 'count') {
          const k = K(t, HV.count2, HV.countCuts[0], (x) => x);
          pos = hvV([0.6, 1.62, -4.0], [0.4, 1.62, -4.5], k); at = hvAim(pos, hvLerp(106, 102, k), hvLerp(27, 29, k)); fov = hvLerp(66, 60, k); drift = 0.002;
          Object.assign(sk, HV_GD.night);
        } else {
          // the shock, down the garden: the feeder, the bird bath, the string lights, the half-black sky over the wall
          const k = K(t, HV.hitShot, HV.hit, (x) => x);
          pos = hvV([0.25, 1.62, -4.4], [0.15, 1.6, -5.0], k); at = hvAim(pos, hvLerp(146, 149, k), hvLerp(10, 8, k)); fov = hvLerp(54, 50, k); drift = 0.002;
          Object.assign(sk, HV_GD.night);
        }
        shake = jolt(t, HV.hit);
      } else if (m === 'real' || m === 'question') {
        // 9:59 PM tonight: the whole sky, still all there
        const k = m === 'question' ? K(t, HV.question, HV.end, (x) => x) : K(t, HV.real, HV.question, (x) => x);
        // (the real part: the sky; the feeder hanging still (gravity); the table, the mug, the lantern (the ground); the sky)
        Object.assign(sk, HV_GD.night); felt = hvFelt(-1);
        if (m === 'real' && t >= HV.real5) { const q = K(t, HV.real5, HV.question, (x) => x); pos = [-0.4, 1.45, -6.8]; at = hvAim(pos, hvLerp(108, 114, q), 32); fov = hvLerp(80, 76, q); }
        else if (m === 'real' && t >= HV.real4) { const q = K(t, HV.real4, HV.real5, (x) => x), M0 = mugW.toArray(); pos = [M0[0] + hvLerp(1.25, 1.05, q), M0[1] + 0.42, M0[2] - hvLerp(1.0, 0.85, q)]; at = [M0[0] + 0.55, M0[1] + 0.08, M0[2] + 0.1]; fov = 40; drift = 0.0008; }
        else if (m === 'real' && t >= HV.real3) camFeeder(K(t, HV.real3, HV.real4, (x) => x));
        else if (m === 'question') { pos = hvV([0.7, 1.64, -1.9], [0.5, 1.64, -2.8], k); at = hvAim(pos, 128, 20); fov = 64; }
        else { const q = K(t, HV.real, HV.real3, (x) => x); pos = hvV([0.4, 1.5, -5.0], [0.2, 1.5, -6.0], q); at = hvAim(pos, hvLerp(140, 128, q), hvLerp(36, 33, q)); fov = hvLerp(72, 66, q); }
      }
      // (the small quakes before the shock: a slight, growing tremble, scaled to the lens so it reads the same in every shot)
      if (s > 0 && s < HVP.tHit && m !== 'replay') { const A = hvTremor(s) * fov * 0.0045 * HV_D2R * Math.hypot(at[0] - pos[0], at[1] - pos[1], at[2] - pos[2]), n = (q) => (noise1(t * 9.3 + q, q) * 0.6 + noise1(t * 17.1 + q, q + 5) * 0.4) * A;
        at = [at[0] + n(1), at[1] + n(2), at[2] + n(3)]; roll += 0.25 * hvTremor(s) * noise1(t * 7.7, 9); }
      if (subH > 0) { const u = t - HV.hit, n = (q) => noise1(t * 31 + q, q) * 0.012 * Math.exp(-u * 0.8); shake = { p: [n(1), n(2), n(3)], roll: 3 * noise1(t * 9, 4) * Math.exp(-u * 0.8) }; }   // (the close shots after the shock: the ground still shaking)
      if (shake) { pos = hvAdd(pos, shake.p); roll += shake.roll; }
      look(pos, at, fov, t, drift, roll);
      // ------------------------------------------------------------------ the sky, then the light
      const st = sky.update(s, cam, app.renderH || 1080, sk);
      const c = [cam.position.x, 0, cam.position.z - 3];
      moonL.intensity = 0.34 * st.left * MathX.smooth(moonD[1], -0.02, 0.1);
      moonL.position.set(c[0] + moonD[0] * 150, c[1] + moonD[1] * 150, c[2] + moonD[2] * 150); moonL.target.position.set(...c); moonL.target.updateMatrixWorld();
      moonL.castShadow = true;
      { const sc = moonL.shadow.camera; if (sc.right !== 22) { sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.updateProjectionMatrix(); } }
      S.hemi.intensity = 0.07; S.hemi.color.set('#2a3a5c'); S.hemi.groundColor.set('#120f0c');
      scene.environmentIntensity = 0.03;
      // the lamps (all on: it is a normal night, as far as anyone here can tell)
      const flick = 0.9 + 0.1 * noise1(t * 7, 3) + 0.05 * noise1(t * 23, 5);
      spill.intensity = 9; pendant.intensity = 5.5; M.glassLit.emissiveIntensity = 1.25;
      for (const p of strings) p.intensity = 1.1;
      catFill.intensity = m === 'cat' || m === 'alarms' || (m === 'count' && (this._sub === 1 || this._sub === 5)) || (m === 'hit' && subH === 2) || (m === 'before' && t >= HV.cat) ? 1.4 : 0;
      street.light.intensity = 26;
      { let n = 0; for (const h of hazards) { const on = s >= h.s0 && s < HVP.tHit + 1.0 ? (() => { const f = (((s - h.s0) * h.hz + h.ph) % 1 + 1) % 1; return MathX.smooth(f, 0.0, 0.05) * (1 - MathX.smooth(f, 0.5, 0.56)); })() : 0; h.L.intensity = 34 * on; n += on; }
        bounce.intensity = 1.6 * n; }
      candle.intensity = 1.1 * flick; fl.scale.set(0.007, 0.018 * flick, 0.007);
      { const W = new THREE.Vector3(); fl.getWorldPosition(W); candle.position.copy(W); }
      // the felt pull: the feeder leans, the bird bath's water tilts (towards the half-Earth's middle, NNW)
      const tilt = felt.tilt * HV_D2R, ax = hvN3(hvCross([0, 1, 0], HV_TIP));                  // (rotate "up" towards HV_TIP)
      const swing = s > HVP.tHit && m === 'hit' ? 0.5 * Math.sin((s - HVP.tHit) * 7) * Math.exp(-(s - HVP.tHit) * 0.5) : 0;
      const tremble = hvTremor(s) * (0.018 * Math.sin(t * 3.9 + 2.0 * noise1(t * 0.4, 7)) + 0.008 * noise1(t * 6.0, 8));
      feeder.pivot.quaternion.setFromAxisAngle(new THREE.Vector3(...ax), tilt + swing + tremble);
      water.mat.uniforms.uTilt.value.set(...hvAdd(hvSc([0, 1, 0], Math.cos(tilt)), HV_TIP, -Math.sin(tilt)));   // (the water's surface faces up, leaning away from the high side)
      water.set(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...ax), -tilt));       // (it rises on the HV_TIP side)
      plumb.visible = m === 'heavier';
      water.mat.uniforms.uMoon.value.set(...moonD);
      // the phone, the TV
      const clk = hvClockText(s);
      if (m === 'calls') phone.draw('call', clk);
      else phone.draw('call', clk);
      // the tremors: the tea, the bird bath
      { const A = hvTremor(s); teaU.uRip.value = A; teaU.uTime.value = t; water.mat.uniforms.uRip.value = A; water.mat.uniforms.uTime.value = t;
        teaU.uMoon.value.set(...moonD); teaU.uC.value.set(...mugW.toArray()); const W = new THREE.Vector3(); fl.getWorldPosition(W); teaU.uCandle.value.copy(W); }
      tv.draw(t, 1); tv.light.intensity = m === 'tv' ? 1.2 : 0.6;
      // the tea's steam: rising straight up, curling a little
      if (m === 'nothing') {
        const M0 = mugW.toArray();
        for (let i = 0; i < 90; i++) {
          const life = 3.2, ph = ((t + hvR(i, 3) * life) % life) / life, h = ph * 0.32;
          const sw = 0.012 * Math.sin(t * 1.3 + i) * ph + 0.02 * noise1(t * 0.6 + i * 0.37, 5) * ph;
          steam.add(M0[0] + sw + (hvR(i, 1) - 0.5) * 0.03, M0[1] + 0.09 + h, M0[2] + (hvR(i, 2) - 0.5) * 0.03 + sw * 0.5, 0.02 + 0.05 * ph, 0.05 * Math.sin(Math.PI * ph), 0.82, 0.84, 0.88);
        }
      }
      steam.end();
      // the cat: asleep on the wall; it lifts its head, blinks, settles (and at the shock, it bolts)
      if (catRoot.visible) {
        let pose = HV_CAT_POSES.loaf;
        if (m === 'cat') { const u = t - HV.cat2; pose = hvCatBlend(HV_CAT_POSES.loaf, HV_CAT_POSES.alert, MathX.smooth(u, 1.2, 2.0) * (1 - MathX.smooth(u, 6.0, 7.5))); }
        if (m === 'alarms' || m === 'count') pose = HV_CAT_POSES.alert;                  // (the alarms: now it has noticed)
        if (m === 'hit' && s > HVP.tHit) pose = HV_CAT_POSES.startle;
        cat.pose(pose, t);
        catRoot.position.set(G.catAt[0], G.wallH + 0.08, G.catAt[2]);
        if (m === 'hit' && subH === 2) { const u = t - HV.hitCuts[1]; catRoot.position.x += 2.8 * u; catRoot.position.y += 0.45 * Math.sin(Math.PI * Math.min(1, u / 0.5)); }   // (it bolts, off along the wall)
      }
      this._st = st; this._s = s; this._felt = felt;
    },
    labels(t) {
      const m = hvShotAt(t).mode, out = [], W = StoryHUD.win, F = this._st ? this._st.F : HV_CUT.F;
      const star = (n) => sky.at(n, 400);
      if (m === 'line') {
        const a1 = W(t, hvCap('line', 0).show + 0.4, hvCap('line', 1).show - 0.1, 0.3, 0.3), a2 = W(t, hvCap('line', 1).show + 0.2, HV.moon - 0.2, 0.3, 0.2);   // (the line first, then the stars: they would overlap)
        out.push({ p: sky.lineAt(this._lineA ?? (this._lineA = HV_GARDEN.lineLabelA(F)), 400), text: 'THE CUT', sub: 'A STRAIGHT LINE ACROSS THE SKY', a: a1 });
        out.push({ p: star('ALDEBARAN'), text: 'ALDEBARAN', sub: 'GONE AT 10:00:00.04', a: a2 });
        out.push({ p: star('CAPELLA'), text: 'CAPELLA', sub: 'STILL THERE', a: a2, side: 'r' });
        out.push({ p: star('HAMAL'), text: 'HAMAL', sub: 'GONE AT 10:00:00.04', a: a2 });
      }
      if (m === 'replay') out.push({ p: sky.lineAt(HV_GARDEN.lineNearMoon(F), 400), text: 'THE CUT', sub: 'THE LINE IN THE SKY', a: W(t, HV.moon + 0.6, hvCap('moon', 1).show - 0.3, 0.3, 0.3) });
      if (m === 'before' && t < HV.cat) out.push({ p: star('SATURN'), text: 'SATURN', sub: '1.3 BILLION km AWAY', a: W(t, hvCap('before', 1).show + 0.3, HV.cat - 0.15, 0.3, 0.15), side: 'r' });
      if (m === 'saturn') {
        out.push({ p: star('SATURN'), text: 'SATURN', sub: 'GONE AT 10:00:00.015', a: W(t, HV.saturn + 0.8, HV.cat2 - 0.2, 0.3, 0.2), side: 'r' });
        out.push({ p: star('NEPTUNE'), text: 'NEPTUNE', sub: 'GONE TOO', a: W(t, hvCap('saturn', 1).show + 0.5, HV.cat2 - 0.2, 0.3, 0.2) });
      }
      if (m === 'vanish' && t < HV.t0) out.push({ p: sky.at('MOON', 400), text: 'THE MOON', sub: '360,000 km AWAY', a: W(t, HV.count + 0.2, HV.t0 - 0.2, 0.3, 0.2) });
      if (m === 'heavier') out.push({ p: [HV_GD.hang[0], HV_GD.hang[1] - 0.95, HV_GD.hang[2]], text: 'STRAIGHT DOWN', sub: 'WHERE IT HUNG AT 10:00', a: W(t, hvCap('heavier', 1).show + 0.4, HV.bath - 0.2, 0.3, 0.2), side: 'r' });
      if (m === 'bath') out.push({ p: hvAdd(G.bath, [0.0, 0.975, 0.36]), text: 'THE OLD WATER LINE', sub: 'THE WATER IS ABOVE IT NOW', a: W(t, HV.bath + 0.8, HV.paris - 0.2, 0.3, 0.2), side: 'r' });
      if (m === 'tv') out.push({ p: [HV_GD.tv[0] - 0.7, HV_GD.tv[1] + 0.2, HV_GD.tv[2]], text: 'NEXT DOOR', sub: 'SATELLITE TV', a: W(t, HV.tv + 0.6, hvCap('tv', 1).show - 0.2, 0.3, 0.2), side: 'r' });
      return out;
    },
    grade(t, p, shot) {
      const m = shot.mode;
      p.exposure = 1.55; p.bloom = 0.42; p.warmth = -0.02; p.saturation = 0.9;
      if (m === 'replay' || m === 'moonedge' || (m === 'count' && this._sub === 4) || (m === 'open' && this._sub === 1)) { p.vignette = 0.35; p.bloom = 0.2; p.exposure = 1.15; }
      if (m === 'title') { p.exposure = 1.25; p.vignette = 0.5; p.saturation = 1.0; }
      if (m === 'calls') { p.exposure = 1.25; p.bloom = 0.3; p.vignette = 0.45; }
      if (m === 'tea') { p.exposure = 1.35; p.bloom = 0.35; p.vignette = 0.55; }
      if (m === 'nothing' && t < hvCap('nothing', 1).show - 0.4) { p.exposure = 1.4; p.vignette = 0.55; }
      // the shock: a hard white kick, then black
      const hit = m === 'hit' ? HV.hit : m === 'open' ? HV.openHit : null;
      if (hit != null && t >= hit) { const u = t - hit; p.flash = Math.max(p.flash || 0, 0.5 * Math.exp(-u / 0.06)); p.chroma = 0.6 * Math.exp(-u / 0.3); p.smear.set(0, 0.02 * Math.exp(-u / 0.2)); if (m === 'hit') p.fade = Math.max(p.fade, MathX.smooth(u, 1.9, 2.5)); }
    },
  };
  return set;
};
const HV_GARDEN = {
  // the angle round the cut's circle (sky.lineAt) where the line is highest in the garden's sky / nearest the Moon
  lineLabelA(F) { let best = 0, bh = -2; for (let a = 0; a < 360; a += 1) { const U = hvAdd(hvSc(hvNrm(hvCross(HVP.n, [0, 0, 1])), Math.cos(a * HV_D2R)), hvCross(HVP.n, hvNrm(hvCross(HVP.n, [0, 0, 1]))), Math.sin(a * HV_D2R)), az = hvAltAz(U, F);
    if (az.alt > 8 && az.alt < 30 && az.az > 85 && az.az < 120 && az.alt > bh) { bh = az.alt; best = a; } } return best; },
  lineNearMoon(F) { let best = 0, bd = 9; const b1 = hvNrm(hvCross(HVP.n, [0, 0, 1])), b2 = hvCross(HVP.n, b1);
    for (let a = 0; a < 360; a += 0.05) { const U = hvAdd(hvSc(b1, Math.cos(a * HV_D2R)), b2, Math.sin(a * HV_D2R)), d = Math.acos(MathX.clamp(hvDot(U, HV_CUT.Mdir), -1, 1)); if (d < bd) { bd = d; best = a; } }
    return best + 0.5; },
};
