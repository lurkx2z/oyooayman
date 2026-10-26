/* =====================================================================
   CAR — your car at a zebra crossing downtown. One set, two lights:
     cold      ten years from now, night, rain: you drive straight over the crossing while she waits; your eyes go
               to the phone on the dash (the portfolio ticking)
     drive     year three, daylight: the same kind of crossing (the study's diagram over it)
     nostop    you roll through; a woman steps back
     point     year ten, night, rain: driving towards the crossing again (the note is on the dash now)
     again     this time you stop; she crosses in your headlights, looks at you, lifts a hand; you lift yours
     question  you wait while she walks on; the wipers
   The car is left-hand drive in the right-hand lane, driving towards −z; the crossing's stripes span z ±1.6 at z = 0.
   The car's own parts are children of `car` (its origin on the road under its middle; your eye at SB_CAR.eye).
   ===================================================================== */

const SB_CAR = { eye: [-0.37, 1.13, 0.1], lane: 1.8, vNight: 8.9, vCold: 6.2, vDay: 6.6, half: 2.3, kerb: 5.6, replay: 0.9 };
SB_CAR.stopZ = 1.6 + 2.0 + SB_CAR.half;                 // (the car's middle when its nose is 2 m short of the stripes)
SB_CAR.decel = 3.2;
SB_CAR.brakeZ = SB_CAR.stopZ + SB_CAR.vNight * SB_CAR.vNight / (2 * SB_CAR.decel);
// where the car's middle is (z) at film time t, and its speed
function sbCarZ(t) {
  const v = SB_CAR.vNight, e = SB_CAR.eye[2];
  if (t < SB.titleShot) return -e + SB_CAR.vCold * (SB.coldPass - t);      // (your eye is over the crossing at coldPass)
  if (t < SB.point) return -e + SB_CAR.vDay * (SB.dayPass - t);
  if (t < SB.brakeAt) return SB_CAR.brakeZ + v * (SB.brakeAt - t);
  const u = Math.min(t - SB.brakeAt, v / SB_CAR.decel);
  return SB_CAR.brakeZ - (v * u - 0.5 * SB_CAR.decel * u * u);
}
// where she stands (x) in the cold open: at the kerb; she steps out onto the stripes; you don't slow; she jumps back.
// The woman at the day crossing does the same (sbHimX)
function sbHerX(t) { const T = SB.coldPass, g = sbCap('open', 1).show + 0.1; return SB_CAR.kerb + 0.4 - 0.95 * sbK(t, g, g + 1.1) + 1.4 * sbK(t, T - 0.5, T + 0.2); }
function sbHimX(t) { const T = SB.dayPass; return SB_CAR.kerb + 0.4 - 0.95 * sbK(t, T - 2.4, T - 1.3) + 1.4 * sbK(t, T - 0.5, T + 0.2); }
function sbCarV(t) { if (t < SB.titleShot) return SB_CAR.vCold; if (t < SB.point) return SB_CAR.vDay; if (t < SB.brakeAt) return SB_CAR.vNight; return Math.max(0, SB_CAR.vNight - SB_CAR.decel * (t - SB.brakeAt)); }

// the windscreen: rain drops that gather and the wipers that clear them (a shader on a plane, metric coords)
function sbScreenMat(W, H) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uT: { value: 0 }, uRain: { value: 1 }, uWet: { value: 1 }, uSize: { value: new THREE.Vector2(W, H) }, uWarm: { value: new THREE.Color('#ffc890') }, uCool: { value: new THREE.Color('#9fb4d8') }, uLight: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT, uRain, uWet, uLight; uniform vec2 uSize; uniform vec3 uWarm, uCool; varying vec2 vUv;
      float h1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      // the wipers: a cycle of P seconds: sweep up over S, back over S, rest. phi = the point's angle from the pivot
      const float P = 2.6, S = 0.62, A0 = 0.08, A1 = 2.55;
      float since(vec2 p, vec2 piv, float len){
        vec2 d = p - piv; float r = length(d); if (r > len) return 99.0;
        float phi = clamp(atan(d.y, d.x), A0, A1), ta = S * (phi - A0) / (A1 - A0), tb = 2.0 * S - ta, c = mod(uT, P);
        return c > tb ? c - tb : (c > ta ? c - ta : c + P - tb);
      }
      float blade(vec2 p, vec2 piv, float len){
        float c = mod(uT, P) * step(0.5, uRain), a = c < S ? mix(A0, A1, c / S) : (c < 2.0 * S ? mix(A1, A0, (c - S) / S) : A0);
        vec2 dir = vec2(cos(a), sin(a)), d = p - piv; float along = dot(d, dir), off = abs(dot(d, vec2(-dir.y, dir.x)));
        return (along > 0.05 && along < len) ? 1.0 - smoothstep(0.006, 0.012, off) : 0.0;
      }
      void main(){
        vec2 p = vUv * uSize;
        float s = min(since(p, vec2(uSize.x * 0.24, 0.02), 0.78), since(p, vec2(uSize.x * 0.66, 0.02), 0.72));
        // drops: one per 1.6 cm cell, each lands at its own moment after the last wipe (then they gather)
        vec2 cell = floor(p / 0.011), f = fract(p / 0.011) - 0.5;
        float a = 0.0; vec3 col = vec3(0.0);
        for (int j = 0; j < 2; j++) {
          vec2 c2 = cell + vec2(float(j) * 37.0, 0.0);
          float hh = h1(c2), born = 0.15 + hh * 3.2 / max(uRain, 0.05);
          vec2 o = vec2(h1(c2 + 1.3), h1(c2 + 7.1)) - 0.5;
          float r = 0.08 + 0.2 * pow(h1(c2 + 3.7), 2.0), d = length(f - o * 0.6);
          float on = step(born, s) * step(0.0, uRain - 0.01) * step(0.45, h1(c2 + 5.3));
          float drop = (1.0 - smoothstep(r * 0.75, r, d)) * on;
          // a bright rim on top (the street's light in it), dark below
          float rim = smoothstep(r * 0.4, r * 0.9, d) * drop, top = clamp(0.5 - (f.y - o.y * 0.6) / r, 0.0, 1.0);
          vec3 tint = mix(uCool, uWarm, h1(c2 + 9.9));
          col += drop * (tint * (0.06 + 0.9 * rim * top) * uLight);
          a = max(a, drop * (0.18 + 0.45 * rim * top));
        }
        // the film of water the blades leave, and the blades themselves
        float film = uWet * 0.06 * smoothstep(0.0, 0.25, s);
        float b = max(blade(p, vec2(uSize.x * 0.24, 0.02), 0.78), blade(p, vec2(uSize.x * 0.66, 0.02), 0.72));
        vec3 outc = col + vec3(0.55, 0.6, 0.68) * film * uLight;
        float outa = max(a, film);
        outc = mix(outc, vec3(0.02), b); outa = max(outa, b * 0.96);
        gl_FragColor = vec4(outc, outa);
      }`,
  });
}

SB_SETS.car = (app) => {
  const S = sbSet(app, { sky: '#05070c', fog: 0.012, fogColor: '#0b1018', fov: 58, near: 0.02, far: 1600, hemi: ['#5d6d94', '#2a2622', 0.14],
    sun: [40, 80, 30], sunColor: '#fff1dc', sunI: 0, shadow: 2048, shadowR: 30, shadowFar: 200 });
  const scene = S.scene, cam = S.camera;
  const envNight = sbEnv(app.renderer, '#0a0e18', '#262c3c', '#0b0b0d'), envDay = sbEnv(app.renderer, '#9ab4d4', '#d8d4ca', '#5a5650');
  scene.environment = envNight;
  const skyN = sbSky(scene, '#03050a', '#1a2132', '#07080b', { sunDir: [0.3, 0.05, -1], sunGlow: '#1c1610', hw: 0.25 });
  const skyD = sbSky(scene, '#4f7fb8', '#c6d6e6', '#8a8680', { sunDir: [0.4, 0.75, -0.5], sunGlow: '#fff2d8', hw: 0.3 }); skyD.visible = false;

  // ---- the street (downtown), the crossing at z = 0
  const ST = sbStreet(scene, { len: 640, zMid: -40, kind: 'tower', seed: 3, night: true, crossingZ: 0, lampsNear: [-40, 60], halfRoad: SB_CAR.kerb, pave: 4.0, clearBefore: 28 });
  const puffs = sbPuffs(scene, 3000, { additive: true, soft: 1.3 });
  const rain = sbRain(scene, { n: 2600, r: 13, h: 8, opacity: 0.16, len: 0.42 });

  // ---- the other traffic (the far lane, coming towards you) and parked cars come from the street
  const F = new VehicleFactory(), traffic = [];
  [['sedan', '#9a9ea4'], ['suv', '#1f2226'], ['hatch', '#6a2a2a'], ['van', '#e8e6e0'], ['sedan', '#2e3a4c'], ['hatch', '#c9c6be']].forEach(([ty, col], i) => {
    const c = F.build(ty, col); c.group.rotation.y = -Math.PI / 2; scene.add(c.group); traffic.push({ c, ph: i * 37 + 11 });
  });
  F.m.head.emissiveIntensity = 2.2;

  // ---- you: the car around you
  const car = new THREE.Group(); scene.add(car);
  const leather = sbStd('#1b1816', 0.62, 0.05), dark = sbStd('#0e0f11', 0.5, 0.2), trim = sbStd('#2a2826', 0.35, 0.6), alcan = sbStd('#2b2c30', 0.95, 0);
  const paintM = new THREE.MeshPhysicalMaterial({ color: '#0b0c0e', roughness: 0.22, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2 });
  const P = (m, x, y, z, parent = car) => { m.position.set(x, y, z); parent.add(m); m.castShadow = false; m.receiveShadow = true; return m; };
  // the dashboard (its top slopes down to the glass) and the binnacle in front of you
  { const sh = new THREE.Shape(); sh.moveTo(-0.55, 0.55); sh.lineTo(-0.55, 0.9); sh.quadraticCurveTo(-0.62, 0.96, -0.75, 0.95); sh.lineTo(-1.22, 0.9); sh.lineTo(-1.25, 0.6); sh.closePath();
    // (the shape is drawn in (z, y): turned so its depth runs along x)
    const g = new THREE.ExtrudeGeometry(sh, { depth: 1.7, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }); g.rotateY(-Math.PI / 2); g.translate(0.85, 0, 0);
    P(new THREE.Mesh(g, leather), 0, 0, 0); }
  { const visor = P(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.34, 24, 1, true, -Math.PI / 2, Math.PI), leather), SB_CAR.eye[0], 0.86, -0.64); visor.rotation.z = Math.PI / 2; visor.scale.set(1, 1, 0.45); visor.material = leather.clone(); visor.material.side = THREE.DoubleSide; }
  const clusterTex = sbCanvasTex(512, 160, (g, w, h, s) => {
    g.fillStyle = '#05070a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(140,180,220,0.5)'; g.lineWidth = 4; g.beginPath(); g.arc(110, 150, 120, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
    g.fillStyle = '#e8f0ff'; g.font = `300 78px ${SB_FONT}`; g.textAlign = 'center'; g.fillText(String(s.mph), 110, 118); g.font = `600 18px ${SB_FONT}`; g.fillStyle = '#8aa0c0'; g.fillText('MPH', 110, 144);
    g.textAlign = 'left'; g.font = `600 22px ${SB_FONT}`; g.fillStyle = '#9fe0b0'; g.fillText('D', 250, 70); g.fillStyle = '#c8d0dc'; g.font = `500 20px ${SB_FONT}`; g.fillText(s.temp, 250, 110); g.fillText('RANGE 412 mi', 330, 70);
  });
  const cluster = P(new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.094), new THREE.MeshBasicMaterial({ map: clusterTex.tex })), SB_CAR.eye[0], 0.87, -0.585); cluster.rotation.x = -0.25;
  // the centre screen and the vents
  const centreTex = sbCanvasTex(640, 400, (g, w, h, s) => {
    g.fillStyle = '#07090c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#121822'; g.fillRect(0, 0, w, 64); g.fillStyle = '#c8d0dc'; g.font = `600 26px ${SB_FONT}`; g.textAlign = 'left'; g.fillText(s.clock, 24, 42); g.textAlign = 'right'; g.fillText(s.temp, w - 24, 42);
    // a map: the street, your arrow
    g.fillStyle = '#0f141c'; g.fillRect(0, 64, w, h - 64); g.strokeStyle = '#2c3646'; g.lineWidth = 26; g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2, 64); g.stroke();
    g.lineWidth = 14; for (const y of [120, 230, 330]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.fillStyle = '#4a9cff'; g.beginPath(); g.moveTo(w / 2, h - 110); g.lineTo(w / 2 - 22, h - 60); g.lineTo(w / 2, h - 72); g.lineTo(w / 2 + 22, h - 60); g.closePath(); g.fill();
  });
  const centre = P(new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.17), new THREE.MeshBasicMaterial({ map: centreTex.tex })), 0.05, 0.86, -0.63); centre.rotation.x = -0.3;
  for (const x of [-0.12, 0.22]) P(new THREE.Mesh(sbRoundBox(0.12, 0.035, 0.03, 0.012, 0.004), trim), x, 0.78, -0.555);
  // the steering wheel (rim, spokes, hub), tilted to face you
  const wheel = new THREE.Group(); wheel.position.set(SB_CAR.eye[0], 0.86, -0.37); wheel.rotation.x = -0.43; car.add(wheel);
  { const rim = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.019, 14, 48), sbStd('#141210', 0.55, 0.05)); wheel.add(rim);
    for (const a of [Math.PI * 0.5, Math.PI * 1.17, Math.PI * 1.83]) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.012), trim); sp.position.set(Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0); sp.rotation.z = a; wheel.add(sp); }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.04, 24), leather); hub.rotation.x = Math.PI / 2; wheel.add(hub);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.3, 12), dark); col.rotation.x = Math.PI / 2; col.position.z = -0.17; wheel.add(col); }
  // the windscreen (the rain shader), the roof, the pillars, the doors and side glass, the mirror, the bonnet
  const WS = { w: 1.46, h: 0.92 }, wsMat = sbScreenMat(WS.w, WS.h);
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(WS.w, WS.h), wsMat); ws.position.set(0, 1.18, -0.83); ws.rotation.x = 1.02; ws.renderOrder = 8; car.add(ws);
  P(new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.05, 1.6), alcan), 0, 1.45, 0.25);
  for (const sx of [-1, 1]) {
    const pil = P(new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.95, 0.09), dark), sx * 0.76, 1.18, -0.83); pil.rotation.x = 1.02; pil.rotation.z = -sx * 0.06;
    P(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 1.5), leather), sx * 0.82, 0.62, 0.25);
    P(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.5), trim), sx * 0.8, 0.9, 0.25);
    // (the side glass: a faint tint, wet)
    const sg = P(new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.48), new THREE.MeshStandardMaterial({ color: '#0a0e14', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.18 })), sx * 0.83, 1.16, 0.2); sg.rotation.y = -sx * Math.PI / 2;
    // the seats
    P(new THREE.Mesh(sbRoundBox(0.52, 0.16, 0.54, 0.08, 0.04), leather), sx * 0.37, 0.4, 0.45);
  }
  P(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.06, 0.012), dark), 0, 1.33, -0.47).rotation.x = 0.25;
  const mirrorTex = sbCanvasTex(256, 68, (g, w, h, s) => {
    // (what's behind you: the street's lights, soft; or the bright day)
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, s.day ? '#a8bed6' : '#0a0e16'); gr.addColorStop(1, s.day ? '#6a6660' : '#16141a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (!s.day) for (let i = 0; i < 14; i++) { const x = hash1(i * 3.3) * w, y = h * (0.35 + 0.4 * hash1(i * 7.7)), r = 3 + 7 * hash1(i * 1.9); const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, i % 3 ? 'rgba(255,214,160,0.75)' : 'rgba(220,230,255,0.7)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); }
    else { g.fillStyle = 'rgba(60,60,64,0.6)'; g.fillRect(0, h * 0.62, w, h); }
  });
  const mirrorM = new THREE.MeshBasicMaterial({ map: mirrorTex.tex, color: '#9aa0aa' });
  P(new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.05, 0.004), mirrorM), 0, 1.33, -0.462).rotation.x = 0.25;
  { const g = new THREE.PlaneGeometry(1.7, 1.5, 8, 6), pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i); pa.setZ(i, -0.06 * (x * x)); } g.computeVertexNormals();
    const bonnet = P(new THREE.Mesh(g, paintM), 0, 0.86, -1.95); bonnet.rotation.x = -Math.PI / 2 + 0.09; }
  // the phone on the dash (in a mount by the glass) and the note (it's there at the end)
  const phone = sbPhone(); phone.g.scale.setScalar(1.25); phone.g.position.set(0.14, 0.99, -0.78); phone.g.rotation.set(-0.42, -0.2, 0); car.add(phone.g);
  P(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.06, 0.03), dark), 0.14, 0.94, -0.79);
  const noteTex = sbNoteTex(1);
  const note = P(new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.09), new THREE.MeshStandardMaterial({ map: noteTex, roughness: 0.85, emissive: '#fff4c0', emissiveMap: noteTex, emissiveIntensity: 0.35 })), 0.3, 0.985, -0.79); note.rotation.set(-0.42, -0.24, 0.07);   // (stuck up beside the phone, facing you)
  // the interior's light: the screens' glow, and what the street gives
  const glowL = new THREE.PointLight('#8fb0ff', 0.25, 1.4, 2); glowL.position.set(0.0, 0.95, -0.5); car.add(glowL);
  const dome = new THREE.PointLight('#ffe2c0', 0, 1.6, 2); dome.position.set(0, 1.38, 0.0); car.add(dome);
  // the headlights: a spot ahead (the road, her)
  const head = new THREE.SpotLight('#fff1dc', 0, 70, 0.48, 0.55, 1.2); head.position.set(0, 0.7, -2.3); car.add(head); head.target.position.set(0, 0, -30); car.add(head.target);
  head.castShadow = true; head.shadow.mapSize.set(1024, 1024); head.shadow.camera.near = 0.5; head.shadow.camera.far = 60; head.shadow.bias = -0.0005;

  // (a streetlight over the crossing on her side: she must read in the rain)
  const crossL = new THREE.SpotLight('#ffd9a8', 0, 18, 0.55, 0.6, 1.4); crossL.position.set(SB_CAR.kerb + 1.2, 6.2, 2.5); crossL.target.position.set(SB_CAR.kerb + 0.2, 0, -0.2); scene.add(crossL, crossL.target);
  // ---- the people: her (night), another woman (day), people on the pavements
  const her = sbPerson({ id: 'sbHer', look: 'sbWoman', path: [[0, SB_CAR.kerb + 0.4, -0.2]], face: 90, states: [[0, 'sbUmbrella']] }, scene, { umbrella: '#1d2a44' });
  const him = sbPerson({ id: 'sbHim', look: 'sbWoman', path: [[0, SB_CAR.kerb + 0.4, 0.3]], face: 90, states: [[0, 'idle']] }, scene);
  const walkers = [];
  for (let i = 0; i < 14; i++) {
    const sx = i % 2 ? 1 : -1, x = sx * (ST.HR + 1.2 + (i % 3) * 0.9), z0 = -120 + i * 23, dir = i % 3 ? -1 : 1, looks = ['casual1', 'casual2', 'casual5', 'casual6', 'casual7', 'sbVisitor', 'casual3'];
    const p = sbPerson({ id: 'sbW' + i, look: looks[i % looks.length], path: [[-10, x, z0], [500, x, z0 + dir * 1.25 * 510]], states: [[-10, i % 4 ? 'sbUmbrellaWalk' : 'walk']] }, scene, { umbrella: i % 4 ? ['#1a1a1e', '#3a1e22', '#1e2a3a', '#2a2a24'][i % 4] : null });
    walkers.push(p);
  }
  // your hands grip the rim (at half past ten and half past one); their poses are worked out each frame from the wheel itself,
  // so they stay on it when your eyes go to the phone or to her
  const hand0 = { right: [[-1, 'sbWR']], left: [[-1, 'sbWL'], [SB.herLook + 0.2, 'wheelUp'], [SB.herLook + 2.4, 'sbWL']] };
  const hands = sbHands(cam, hand0, { sleeve: '#2a2c30', cuff: '#1e2024', watch: true });
  const grip = { curl: [1.28, 1.34, 1.4, 1.45], thumb: [0.42, 0.38] };
  hands.poses.sbWR = Object.assign({ p: [0, 0, 0], F: [0, 1, 0], N: [0, 0, 1] }, grip); hands.poses.sbWL = Object.assign({ p: [0, 0, 0], F: [0, 1, 0], N: [0, 0, 1] }, grip);
  hands.blends.sbWR = 0.5; hands.blends.sbWL = 0.5;
  const _hp = new THREE.Vector3(), _hf = new THREE.Vector3(), _hn = new THREE.Vector3(), _wq = new THREE.Quaternion(), _cq = new THREE.Quaternion();
  const placeGrip = () => {
    wheel.updateMatrixWorld(true); wheel.getWorldQuaternion(_wq); cam.getWorldQuaternion(_cq).invert();
    for (const [name, a, sx] of [['sbWR', Math.PI * 0.25, 1], ['sbWL', Math.PI * 0.75, -1]]) {
      const ca = Math.cos(a), sa = Math.sin(a);
      // (in the wheel's own frame: r out along the rim, +y up its face, +z towards you)
      _hf.set(0.35 * ca, 0.35 * sa + 0.55, -0.75).normalize().applyQuaternion(_wq).applyQuaternion(_cq);
      _hn.set(-0.4 * ca, -0.4 * sa, -1).applyQuaternion(_wq).applyQuaternion(_cq);
      _hn.addScaledVector(_hf, -_hn.dot(_hf)).normalize();
      _hp.set(0.185 * ca, 0.185 * sa, 0); wheel.localToWorld(_hp); cam.worldToLocal(_hp);
      _hp.addScaledVector(_hf, -0.072).addScaledVector(_hn, -0.034);
      const P = hands.poses[name];
      P.p = [_hp.x * sx, _hp.y, _hp.z]; P.F = [_hf.x * sx, _hf.y, _hf.z]; P.N = [_hn.x * sx, _hn.y, _hn.z];
    }
  };
  // (from outside, for the two shots on the pavement: the car's body; the inside is hidden then)
  const inside = car.children.filter((o) => !o.isLight && o !== head.target);
  const body = F.build('sedan', '#0c0d10'); if (body.tail) body.tail.emissiveIntensity = 2.4; body.group.rotation.y = Math.PI / 2; body.group.visible = false; car.add(body.group);
  car.add(cam);

  const W = SB_W, K = sbK;
  // (the glance down: from your eye to the phone in its mount)
  const PH = phone.g.position, PE = SB_CAR.eye, PH_YAW = Math.atan2(-(PH.x - PE[0]), -(PH.z - PE[2])) + 0.04, PH_PITCH = Math.atan2(PH.y - PE[1], Math.hypot(PH.x - PE[0], PH.z - PE[2])) + 0.03;
  // what the light is: night (rain) or day
  let lightKey = null;
  const setLight = (day) => {
    if (lightKey === day) return; lightKey = day;
    skyN.visible = !day; skyD.visible = day;
    scene.background = new THREE.Color(day ? '#9ab8da' : '#05070c');
    scene.fog.color.set(day ? '#b8c6d4' : '#0b1018'); scene.fog.density = day ? 0.0045 : 0.012;
    scene.environment = day ? envDay : envNight;
    S.hemi.color.set(day ? '#cfe0f2' : '#5d6d94'); S.hemi.groundColor.set(day ? '#8a7a66' : '#2a2622'); S.hemi.intensity = day ? 0.9 : 0.14;
    S.sun.intensity = day ? 2.6 : 0; S.sun.castShadow = day;
    for (const m of ST.fronts) m.emissiveIntensity = day ? 0 : 0.9;
    ST.headM.emissiveIntensity = day ? 0 : 2.4; for (const L of ST.lamps) L.intensity = day ? 0 : 30;
    ST.road.material.roughness = day ? 0.62 : 0.2; ST.road.material.envMapIntensity = day ? 0.5 : 1.3;
    rain.lines.visible = !day; wsMat.uniforms.uRain.value = day ? 0 : 1; wsMat.uniforms.uWet.value = day ? 0 : 1; wsMat.uniforms.uLight.value = day ? 1.6 : 1;
    head.intensity = day ? 0 : 90; crossL.intensity = day ? 0 : 60; glowL.intensity = day ? 0.05 : 0.7;
    F.m.head.emissiveIntensity = day ? 0.4 : 2.2;
    mirrorTex.update({ day }); mirrorM.color.set(day ? '#d0d4da' : '#7a808a');
  };

  const set = {
    scene, camera: cam, _v: new THREE.Vector3(),
    cuts() { return [SB.coldPass + 0.35, SB.dayPass + 0.35]; },
    frame(t, shot) {
      const m = shot.mode, day = m === 'drive' || m === 'nostop';
      setLight(day);
      // (the two shots from the pavement replay the last second, so you see the car reach her)
      const ext = (m === 'cold' && t >= SB.coldPass + 0.35) || (m === 'nostop' && t >= SB.dayPass + 0.35), tt = ext ? t - SB_CAR.replay : t;
      const z = sbCarZ(tt), v = sbCarV(tt);
      if (!day) head.intensity = (m === 'again' || m === 'question') ? 90 - 55 * K(t, SB.brakeAt + 1, SB.herCross) : 90;   // (dipped once you've stopped, so she isn't a white blur)
      car.position.set(SB_CAR.lane, 0, z);
      // (a little life in the ride: the road under the wheels)
      const bump = v > 0.1 ? 0.004 * Math.sin(t * 9.1) + 0.003 * noise1(t * 3, 4) : 0, dive = m === 'again' ? 0.02 * Math.exp(-Math.pow((t - SB.brakeAt - 2.6) * 2.2, 2)) : 0;
      car.rotation.set(-dive + bump * 0.3, 0, 0.003 * noise1(t * 0.7, 2));
      car.position.y = bump;
      // ---- where your eyes go
      const E = SB_CAR.eye, dr = sbDrift(t, 0.004, 0.3, 3);
      let yaw = 0.02 * noise1(t * 0.2, 8), pitch = -0.1, fov = 58;
      if (m === 'cold') {
        // ahead at the crossing, then down to the phone as you reach her
        const k = K(t, sbCap('open', 2).show - 0.8, sbCap('open', 2).show + 0.2);
        // (your eyes go to her as she steps out; then to the phone)
        const kh = W(t, sbCap('open', 1).show - 0.6, sbCap('open', 2).show - 0.8, 1.0, 0.3), aim = Math.atan2(-(sbHerX(t) - SB_CAR.lane - E[0]), -(-0.2 - z - E[2]));
        yaw = sbLerp(sbLerp(0.02, MathX.clamp(aim * 0.7, -0.4, 0), kh), PH_YAW, k); pitch = sbLerp(-0.05, PH_PITCH, k);
        fov = sbLerp(sbLerp(52, 44, kh), 34, k);
      } else if (m === 'drive') {
        yaw = 0.03 * Math.sin(t * 0.3);
      } else if (m === 'nostop') {
        const k = K(t, SB.dayPass - 0.9, SB.dayPass + 0.1), kh = W(t, SB.nostop - 0.3, SB.dayPass - 0.9, 0.5, 0.3), aim = Math.atan2(-(sbHimX(t) - SB_CAR.lane - E[0]), -(0.3 - z - E[2]));
        yaw = sbLerp(sbLerp(0.0, MathX.clamp(aim * 0.7, -0.4, 0), kh), PH_YAW, k); pitch = sbLerp(-0.06, PH_PITCH, k); fov = sbLerp(sbLerp(58, 48, kh), 34, k);
      } else if (m === 'point') {
        yaw = 0.02 * Math.sin(t * 0.25); pitch = -0.05;
      } else if (m === 'again' || m === 'question') {
        // stopped: you watch her cross (right to left), she looks at you, then you watch her go
        const hx = her.root.position.x, hz = her.root.position.z, ex = SB_CAR.lane + E[0], ez = z + E[2];
        const aim = Math.atan2(-(hx - ex), -(hz - ez));
        const k = K(t, SB.herCross - 0.4, SB.herCross + 1.0) * (1 - K(t, SB.herLook + 2.2, SB.herLook + 4.2));
        yaw = sbLerp(0.0, MathX.clamp(aim * 0.8, -0.5, 0.5), k); pitch = sbLerp(-0.05, -0.02, k); fov = sbLerp(58, 46, K(t, SB.herCross, SB.herLook) * (1 - K(t, SB.herLook + 2.2, SB.herLook + 4.2)));
      }
      for (const o of inside) o.visible = !ext;
      body.group.visible = ext; hands.root.visible = !ext;
      if (ext) {
        // on the pavement behind her: the car comes out of the rain, passes her, goes
        if (cam.parent !== scene) scene.add(cam);
        const t0 = m === 'cold' ? SB.coldPass + 0.35 : SB.dayPass + 0.35, k = K(t, t0, t0 + 5, Ease.inOutSine), bz = m === 'cold' ? -0.2 : 0.3;
        sbCam(cam, [SB_CAR.kerb + 3.1 + dr[0] * 4, 1.2 + dr[1] * 4, bz - 2.3], [2.0, 0.95, bz + 2.6 - 3.2 * k], 44);
        for (const w of body.wheels) w.rotation.z = -tt * v / body.r;
      } else {
      if (cam.parent !== car) car.add(cam);
      // (the camera is a child of the car: its position is in the car's own coordinates, its aim in the world's)
      const d = sbDir(yaw, pitch);
      car.updateMatrixWorld(true);
      cam.position.set(E[0] + dr[0], E[1] + dr[1], E[2] + dr[2]); cam.up.set(0, 1, 0);
      cam.lookAt(car.localToWorld(set._v.set(E[0] + d[0], E[1] + d[1], E[2] + d[2])));
      if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
      }
      cam.updateMatrixWorld(true);
      // ---- the wheel (a little steering), the screens, the phone, the note
      wheel.rotation.z = 0.04 * noise1(t * 0.4, 6);
      clusterTex.update({ mph: Math.round(v * 2.237), temp: day ? '68°F' : '51°F' });
      centreTex.update({ clock: day ? '2:14 PM' : '9:36 PM', temp: day ? '68°F' : '51°F' });
      phone.update(sbPhoneState(t, 'stocks'));
      note.visible = m === 'point' || m === 'again' || m === 'question';
      // ---- the rain, the wipers' clock
      wsMat.uniforms.uT.value = t;
      rain.update(t, ext ? [cam.position.x - 3, 0, cam.position.z + 2] : [car.position.x, 0, z - 4], ext ? 0 : v);
      // ---- her (night), the other woman (day)
      her.root.visible = !day; him.root.visible = day;
      if (!day) {
        if (m === 'cold') {
          // she waits at the kerb; she steps out onto the stripes; you don't slow down: she jumps back
          const g = sbCap('open', 1).show + 0.1;
          her.spec.path = [[0, sbHerX(tt), -0.2]];
          her.states = [[0, 'sbUmbrella'], [g, 'sbUmbrellaWalk'], [g + 1.1, 'sbUmbrella'], [SB.coldPass - 0.5, 'sbStartle'], [SB.coldPass + 1.8, 'sbUmbrella']];
          her.spec.face = 90;
        } else {
          // she waits; you stop; she crosses, looks at you, lifts a hand; walks on
          // (she stops in your headlights to thank you, then walks on)
          const x0 = SB_CAR.kerb + 0.4, x1 = -SB_CAR.kerb - 0.4, t0 = SB.herCross, tL = SB.herLook, xL = Math.max(x1 + 1, x0 - 1.45 * (tL - t0)), t2 = tL + 1.6, t1 = t2 + (xL - x1) / 1.45;
          her.spec.path = [[0, x0, -0.2], [t0, x0, -0.2], [tL, xL, -0.2], [t2, xL, -0.2], [t1, x1, -0.2], [t1 + 0.6, x1 - 0.5, -0.6], [t1 + 30, x1 - 0.8, -40]];
          her.states = [[0, 'sbUmbrella'], [t0, 'sbUmbrellaWalk'], [SB.herLook, 'sbThanks'], [SB.herLook + 1.6, 'sbUmbrellaWalk']];
          her.spec.face = undefined;
        }
        her._preparePath(); her.update(tt);
        // (her head turns to you while she thanks you)
        if (m !== 'cold') { const k = W(t, SB.herLook - 0.2, SB.herLook + 1.8, 0.4, 0.5); her.j.head.rotation.y += 1.0 * k; her.j.neck.rotation.y += 0.5 * k; }
        else { const k = W(tt, sbCap('open', 1).show - 0.5, SB.coldPass + 0.4, 0.4, 0.4), k2 = W(tt, SB.coldPass + 0.5, SB.titleShot, 0.4, 0.3); her.j.head.rotation.y += 0.9 * k - 0.9 * k2; her.j.neck.rotation.y += 0.4 * (k - k2); }
      } else {
        him.spec.path = [[0, sbHimX(tt), 0.3]];
        him.states = [[0, 'idle'], [SB.dayPass - 2.4, 'walk'], [SB.dayPass - 1.3, 'idle'], [SB.dayPass - 0.5, 'recoil'], [SB.dayPass + 1.6, 'idle']];
        him._preparePath(); him.update(tt);
        { const k = W(tt, SB.dayPass - 3, SB.dayPass + 0.4, 0.4, 0.4), k2 = W(tt, SB.dayPass + 0.5, SB.years, 0.4, 0.3); him.j.head.rotation.y += 0.9 * k - 0.9 * k2; him.j.neck.rotation.y += 0.4 * (k - k2); }
      }
      for (const p of walkers) { p.update(t); if (p.umbrella) p.umbrella.visible = !day; }
      // ---- traffic in the far lane (towards you), headlights on at night
      for (const tr of traffic) {
        const zz = ((-400 + ((t * 9.5 + tr.ph * 13.7) % 520)));
        tr.c.group.position.set(-SB_CAR.lane, 0, zz); tr.c.group.visible = Math.abs(zz - z) < 220;
        for (const w of tr.c.wheels) w.rotation.z = -t * 9.5 / tr.c.r;
      }
      // ---- glows: streetlights, their reflections on the wet road, the crossing's amber globes, the traffic's lamps
      puffs.begin();
      const ex = ext ? cam.position.x : car.position.x + E[0], ey = ext ? cam.position.y : E[1], ez = ext ? cam.position.z : z + E[2];
      const blink = (Math.floor(t * 1.1) % 2) ? 1 : 0.08;
      ST.globeM.emissiveIntensity = day ? 0.6 * blink : 2.2 * blink;
      if (!day) {
        const refl = (x, y, zz, size, a, r, g, b) => {
          // (where a light's reflection sits on the wet road, seen from your eye; drawn as a short streak towards you)
          const dx = x - ex, dz = zz - ez, D = Math.hypot(dx, dz); if (D < 2 || D > 160) return;
          const f = ey / (ey + y);
          for (let k = 0; k < 5; k++) { const ff = f * (1 - k * 0.06); puffs.add(ex + dx * ff, 0.03, ez + dz * ff, size * (0.7 + k * 0.15), a * (0.5 - k * 0.08), r, g, b); }
        };
        for (const gp of ST.glowAt) { const D = Math.abs(gp[2] - z); if (D > 200) continue; puffs.add(gp[0], gp[1] - 0.1, gp[2], 1.0 + D * 0.006, 0.3, 1, 0.82, 0.6); refl(gp[0], gp[1], gp[2], 0.9, 0.35, 1, 0.75, 0.5); }
        for (const gl of ST.globes) { puffs.add(gl.position.x, gl.position.y, gl.position.z, 0.9, 0.5 * blink, 1, 0.6, 0.15); refl(gl.position.x, gl.position.y, gl.position.z, 0.6, 0.6 * blink, 1, 0.55, 0.12); }
        for (const tr of traffic) if (tr.c.group.visible) {
          const p = tr.c.group.position;
          for (const sz of [-0.62, 0.62]) { puffs.add(p.x + sz, 0.72, p.z + tr.c.L / 2 + 0.05, 0.7, 0.8, 1, 0.95, 0.85); refl(p.x + sz, 0.72, p.z + tr.c.L / 2, 0.6, 0.7, 1, 0.9, 0.8); }
        }
        // the shops' windows on the road
        for (const bd of ST.buildings) if (bd.shop && Math.abs(bd.z - z) < 90) refl(bd.sx * (ST.HR + ST.PV), 1.6, bd.z, 2.2, 0.25, 1, 0.85, 0.65);
      }
      if (ext && v > 0.5) { const tz = z + 2.2; for (let k = 0; k < 18; k++) { const u = k / 18; for (const sx of [-0.8, 0.8]) puffs.add(SB_CAR.lane + sx * (1 + 0.6 * u), 0.15 + 0.5 * u, tz + 4 * u, 0.5 + 1.2 * u, (day ? 0.05 : 0.09) * (1 - u), 0.8, 0.85, 0.9); } }
      puffs.end();
      placeGrip();
      hands.update(t);
      hands.show(null);
      this._t = t;
    },
    grade(t, p, shot) {
      const m = shot.mode;
      if (m === 'drive' || m === 'nostop') { p.exposure = 1.05; p.bloom = 0.25; p.bloomThreshold = 1.1; p.saturation = 1.02; p.vignette = 0.5; p.warmth = 0.02; }
      else { p.exposure = 1.18; p.bloom = 0.62; p.bloomThreshold = 0.6; p.saturation = 0.98; p.contrast = 1.06; p.vignette = 0.62; p.warmth = -0.02; p.grain = 0.032; }
      if (m === 'question') p.fade = Math.max(p.fade, 0.25 * MathX.smooth(t, SB.question + 1.0, SB.end - 0.4));
    },
    labels(t) {
      const m = sbShotAt(t).mode;
      if (m === 'cold') return [{ p: [SB_CAR.kerb + 0.4, 2.25, -0.2], text: 'SHE\'S WAITING TO CROSS', a: W(t, sbCap('open', 1).show + 0.2, sbCap('open', 2).show - 0.7, 0.4, 0.3) }];
      return [];
    },
  };
  return set;
};
