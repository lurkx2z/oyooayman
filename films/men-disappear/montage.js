/* =====================================================================
   MONTAGE — "meanwhile", three short shots elsewhere at the same moment (each its own small scene + camera,
   shown through FILM.view):
     1. an airliner's cockpit above the clouds: two empty seats, the autopilot still flying (≈95 % of airline
        pilots are men);
     2. a fire station's engine bay: the alarm going, the doors open, the gear hanging ready, nobody coming
        (≈95 % of US firefighters are men);
     3. a hospital ward that carries on: nurses at work (≈90 % of the world's nurses are women).
   ===================================================================== */

function mdStd(c, o = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.75 }, o)); }
function mdBox(parent, w, h, d, x, y, z, mat, rx = 0, ry = 0, rz = 0) { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; }
function mdCyl(parent, r0, r1, h, x, y, z, mat, rx = 0, ry = 0, rz = 0, seg = 12) { const o = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg), mat); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; }

/* ---------------- 1. the cockpit ---------------- */
class MdCockpit {
  constructor() {
    const S = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, 9 / 16, 0.03, 8000);
    S.fog = new THREE.FogExp2(new THREE.Color('#c9b9a0'), 0.00008);
    S.background = new THREE.Color('#b9b2a4');
    // sky and the cloud sea below (late sun ahead-left)
    this.sun = new THREE.Vector3(-0.45, 0.1, -0.88).normalize();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(6000, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, uniforms: { uSun: { value: this.sun }, uT: { value: 0 } },
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
      fragmentShader: `uniform vec3 uSun; uniform float uT; varying vec3 vD;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
        float fb(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 6; i++){ v += a * n(p); p = p * 2.05 + 3.1; a *= 0.5; } return v; }
        void main(){
          vec3 d = normalize(vD); float s = max(dot(d, uSun), 0.0);
          vec3 col = mix(vec3(0.86, 0.74, 0.58), vec3(0.32, 0.45, 0.62), pow(clamp(d.y, 0.0, 1.0), 0.45));
          col += vec3(1.0, 0.78, 0.5) * (pow(s, 8.0) * 0.35 + pow(s, 200.0) * 2.0);
          if (d.y < 0.02) {
            // the cloud tops: a bright field seen from above, lumpy, with soft shadowed hollows
            vec2 uv = d.xz / max(0.02 - d.y + 0.03, 0.01) * 0.6 + vec2(0.0, uT * 0.08);
            float c = fb(uv), c2 = fb(uv * 2.4 + 5.0);
            vec3 lit = mix(vec3(0.92, 0.86, 0.78), vec3(1.0, 0.88, 0.7), pow(s, 2.0));
            vec3 cl = mix(lit * 0.62, lit, smoothstep(0.35, 0.75, c + 0.2 * (c2 - 0.5)));
            col = mix(col, cl, smoothstep(0.02, -0.04, d.y));
          }
          gl_FragColor = vec4(col * vec3(0.5, 0.54, 0.6), 1.0);
        }` }));
    sky.frustumCulled = false; S.add(sky); this.sky = sky;
    // light: the low sun through the windscreen, a soft fill
    const sunL = new THREE.DirectionalLight('#ffd9a8', 3.0); sunL.position.copy(this.sun).multiplyScalar(20); sunL.castShadow = true;
    sunL.shadow.mapSize.set(1024, 1024); Object.assign(sunL.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 1, far: 50 }); sunL.shadow.bias = -0.0005; S.add(sunL);
    S.add(new THREE.HemisphereLight('#c8d4e2', '#3a342c', 1.6));
    const fill = new THREE.PointLight('#ffe8cc', 3.0, 5, 1.5); fill.position.set(0, 1.45, 1.2); S.add(fill);
    const m = { panel: mdStd('#2c3036', { roughness: 0.6 }), panelL: mdStd('#454b52', { roughness: 0.65 }), frame: mdStd('#3a3e44', { roughness: 0.55 }),
      seat: mdStd('#3a3632', { roughness: 0.9 }), fleece: mdStd('#c8bba4', { roughness: 1 }), metal: mdStd('#8c9196', { roughness: 0.35, metalness: 0.8 }),
      lever: mdStd('#1c1e21', { roughness: 0.5 }), glass: new THREE.MeshStandardMaterial({ color: '#d8e4ec', roughness: 0.05, transparent: true, opacity: 0.08, depthWrite: false, name: 'cockpit glass' }) };
    const g = new THREE.Group(); S.add(g);
    // floor, side walls, ceiling (overhead panel), glareshield and the main panel
    mdBox(g, 3.2, 0.05, 3.6, 0, 0, 0, m.panel);
    mdBox(g, 2.6, 0.08, 2.2, 0, 2.05, 0.4, m.panelL, -0.25);
    mdBox(g, 2.8, 0.12, 0.45, 0, 1.13, -1.18, m.panel);                                   // glareshield
    mdBox(g, 2.8, 0.55, 0.12, 0, 0.82, -1.3, m.panel);                                    // the main panel
    // the displays (attitude, navigation) and the autopilot panel's lit readouts
    const disp = (x, kind) => {
      const c = Tex.canvas(256, 256), x2 = c.getContext('2d');
      x2.fillStyle = '#05080a'; x2.fillRect(0, 0, 256, 256);
      if (kind === 'pfd') { x2.fillStyle = '#2a6aa8'; x2.fillRect(28, 28, 200, 100); x2.fillStyle = '#7a5434'; x2.fillRect(28, 128, 200, 100); x2.strokeStyle = '#f4f4f4'; x2.lineWidth = 3; x2.beginPath(); x2.moveTo(90, 128); x2.lineTo(166, 128); x2.stroke(); x2.strokeStyle = '#f2c230'; x2.strokeRect(108, 120, 40, 16); x2.fillStyle = '#e8e8e8'; x2.font = '600 16px "JetBrains Mono"'; x2.fillText('FL370', 180, 60); x2.fillText('M.78', 20, 60); x2.fillStyle = '#43e07a'; x2.fillText('AP1  A/THR', 74, 22); }
      else { x2.strokeStyle = '#e8e8e8'; x2.lineWidth = 2; x2.beginPath(); x2.arc(128, 150, 90, Math.PI, 2 * Math.PI); x2.stroke(); x2.strokeStyle = '#d050d0'; x2.beginPath(); x2.moveTo(128, 150); x2.lineTo(140, 40); x2.stroke(); x2.fillStyle = '#43e07a'; x2.font = '600 15px "JetBrains Mono"'; x2.fillText('GS 482  TAS 456', 20, 22); x2.fillText('ETA 18:42', 150, 240); }
      const mat = new THREE.MeshBasicMaterial({ map: Tex.tex(c, { repeat: false }), color: new THREE.Color(1.15, 1.15, 1.15), name: 'display' });
      const o = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), mat); o.position.set(x, 0.85, -1.235); g.add(o);
    };
    disp(-0.95, 'pfd'); disp(-0.66, 'nd'); disp(0.66, 'nd'); disp(0.95, 'pfd');
    disp(-0.15, 'nd'); disp(0.15, 'nd');
    const fcu = Tex.label([['SPD 280   HDG 245   ALT 37000   AP1 ●', 30]], { w: 1024, h: 64, bg: '#14171a', fg: '#ffb63a', font: 30 });
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.09), new THREE.MeshBasicMaterial({ map: fcu, color: new THREE.Color(1.3, 1.3, 1.3), name: 'fcu' })); f.position.set(0, 1.17, -1.0); f.rotation.x = -1.1; g.add(f);
    // the centre pedestal with the thrust levers
    mdBox(g, 0.5, 0.75, 1.1, 0, 0.38, -0.55, m.panel);
    mdBox(g, 0.5, 0.05, 0.9, 0, 0.77, -0.6, m.panelL, 0.1);
    for (const x of [-0.08, 0.08]) { mdBox(g, 0.035, 0.22, 0.04, x, 0.88, -0.62, m.metal, 0.4); mdBox(g, 0.1, 0.03, 0.04, x, 0.98, -0.66, m.lever); }
    // the two seats (empty), with sheepskin covers and headrests; the side-sticks; a headset left on a hook
    this.sticks = [];
    for (const s of [-1, 1]) {
      const x = s * 0.62;
      mdBox(g, 0.5, 0.12, 0.5, x, 0.5, 0.15, m.seat); mdBox(g, 0.46, 0.06, 0.46, x, 0.58, 0.15, m.fleece);
      mdBox(g, 0.5, 0.8, 0.12, x, 1.0, 0.43, m.seat, -0.12); mdBox(g, 0.44, 0.7, 0.04, x, 1.0, 0.37, m.fleece, -0.12);
      mdBox(g, 0.3, 0.2, 0.1, x, 1.5, 0.48, m.seat, -0.12);
      for (const e of [-1, 1]) mdBox(g, 0.06, 0.06, 0.4, x + e * 0.27, 0.78, 0.2, m.seat);
      mdCyl(g, 0.06, 0.08, 0.4, x, 0.25, 0.15, m.metal);
      const stick = new THREE.Group(); stick.position.set(x + s * 0.48, 0.72, -0.15); g.add(stick);
      mdBox(stick, 0.14, 0.05, 0.2, 0, 0, 0, m.panel); mdCyl(stick, 0.022, 0.03, 0.18, 0, 0.1, 0, m.lever); this.sticks.push(stick);
      mdBox(g, 0.12, 0.5, 1.2, s * 1.35, 0.95, -0.2, m.panelL);                           // side consoles / walls
    }
    const hs = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 16, Math.PI), m.lever); hs.position.set(1.25, 1.35, 0.1); hs.rotation.y = Math.PI / 2; g.add(hs);
    // windscreen frames (panes) and the glass
    for (const xx of [-1.3, -0.5, 0, 0.5, 1.3]) mdBox(g, 0.07, 0.75, 0.07, xx, 1.55, -1.42 + Math.abs(xx) * 0.32, m.frame, 0.25);
    mdBox(g, 2.8, 0.1, 0.1, 0, 1.92, -1.32, m.frame); mdBox(g, 2.8, 0.06, 0.06, 0, 1.2, -1.5, m.frame);
    const ws = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 0.75), m.glass); ws.position.set(0, 1.55, -1.44); ws.rotation.x = 0.25; g.add(ws);
    this.g = g;
  }
  update(t) {
    const u = t - MD.cockpit;
    this.sky.material.uniforms.uT.value = t;
    // the autopilot's small corrections: the sticks don't move (fly-by-wire), the aircraft rolls a hair
    this.g.rotation.z = 0.006 * Math.sin(u * 0.7);
    // camera: the jump seat behind and between them, a slow push toward the windscreen
    const k = Ease.inOutSine(MathX.clamp(u / 2.8, 0, 1));
    this.camera.position.set(0.05, 1.78 - 0.06 * k, 2.35 - 0.45 * k);
    this.camera.lookAt(0.0, 0.95, -0.5);
    this.camera.fov = 70; this.camera.updateProjectionMatrix();
  }
}

/* ---------------- 2. the fire station ---------------- */
class MdFireStation {
  constructor() {
    const S = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 9 / 16, 0.05, 500);
    S.fog = new THREE.FogExp2(new THREE.Color('#9fa39c'), 0.012);
    S.background = new THREE.Color('#c8c8c0');
    const m = { floor: new THREE.MeshStandardMaterial({ map: Tex.concrete(71, [128, 126, 120]), roughness: 0.35, name: 'bay floor' }), wall: mdStd('#c8c2b4', { roughness: 0.9 }), brick: mdStd('#8a5a48', { roughness: 0.9 }),
      red: mdStd('#a8241d', { roughness: 0.38, metalness: 0.1 }), dark: mdStd('#1e2023', { roughness: 0.6 }), chrome: mdStd('#c8ccd0', { roughness: 0.2, metalness: 0.9 }), tyre: mdStd('#141414', { roughness: 0.9 }),
      yellow: mdStd('#d8b62a', { roughness: 0.5 }), white: mdStd('#e8e4dc', { roughness: 0.5 }), glass: mdStd('#1c252c', { roughness: 0.1, metalness: 0.4 }),
      tan: mdStd('#b19a62', { roughness: 0.9 }), stripe: new THREE.MeshStandardMaterial({ color: '#dcdccc', emissive: '#4a4a40', roughness: 0.4, name: 'reflective' }), steel: mdStd('#8a9096', { roughness: 0.45, metalness: 0.7 }) };
    // the bay: 14 m wide, 26 m deep; the front opening at z −13 (doors up), daylight beyond
    mdBox(S, 14, 0.1, 26, 0, -0.05, 0, m.floor);
    for (const x of [-7, 7]) mdBox(S, 0.3, 6, 26, x, 3, 0, m.wall);
    mdBox(S, 14, 0.3, 26, 0, 6.1, 0, m.wall);
    mdBox(S, 14, 6, 0.3, 0, 3, 13, m.wall);
    mdBox(S, 14, 1.4, 0.3, 0, 5.3, -13, m.brick);
    for (const x of [-6.3, 0, 6.3]) mdBox(S, 1.2, 4.6, 0.4, x, 2.3, -13, m.brick);
    // the raised doors (rolled up at the top) and the street outside (a sunlit wall, a kerb)
    for (const x of [-3.15, 3.15]) mdBox(S, 5.1, 0.6, 0.6, x, 4.4, -12.6, m.white);
    mdBox(S, 60, 0.1, 30, 0, -0.04, -28, mdStd('#5e5c58', { roughness: 0.95 }));
    mdBox(S, 60, 14, 1, 0, 7, -40, mdStd('#cfc6b2', { roughness: 0.9 }));
    for (let i = 0; i < 8; i++) mdBox(S, 1.4, 1.8, 0.1, -12 + i * 3.4, 5 + (i % 2) * 3.4, -39.4, mdStd('#2a3038', { roughness: 0.2 }));
    // floor markings
    for (const x of [-3.15, 3.15]) for (const e of [-1, 1]) mdBox(S, 0.12, 0.012, 24, x + e * 1.6, 0.006, 0, m.yellow);
    // the engine (left bay) — cab, body with lockers, ladder rack, light bar, wheels; another engine's back in the right bay
    const E = new THREE.Group(); E.position.set(-3.15, 0, -2.5); S.add(E); this.engine = E;
    mdBox(E, 2.5, 1.9, 2.4, 0, 1.75, -3.6, m.red);                                          // cab
    mdBox(E, 2.36, 0.9, 0.08, 0, 2.15, -4.82, m.glass, -0.12);                               // windscreen
    for (const s of [-1, 1]) mdBox(E, 0.06, 0.75, 1.0, s * 1.26, 2.15, -3.95, m.glass);
    mdBox(E, 2.5, 0.25, 0.3, 0, 0.75, -4.9, m.chrome);                                       // bumper
    mdBox(E, 2.5, 2.4, 6.0, 0, 1.95, 0.6, m.red);                                            // body
    for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { mdBox(E, 0.04, 1.6, 1.7, s * 1.27, 2.0, -1.45 + i * 2.0, m.steel); mdBox(E, 0.05, 0.14, 1.75, s * 1.27, 1.05, -1.45 + i * 2.0, m.stripe); }
    for (const s of [-1, 1]) mdBox(E, 0.06, 0.18, 8.4, s * 1.28, 0.95, -0.6, m.stripe);
    mdBox(E, 0.5, 0.2, 7.0, 0.55, 3.35, 0.2, m.steel); mdBox(E, 0.5, 0.2, 7.0, -0.55, 3.35, 0.2, m.steel);
    for (let i = 0; i < 14; i++) mdBox(E, 1.3, 0.06, 0.06, 0, 3.42, -3.0 + i * 0.5, m.steel);
    this.bar = [mdBox(E, 0.6, 0.14, 0.25, -0.65, 2.78, -4.2, new THREE.MeshBasicMaterial({ color: '#ff2a1a', name: 'beacon' })), mdBox(E, 0.6, 0.14, 0.25, 0.65, 2.78, -4.2, new THREE.MeshBasicMaterial({ color: '#2a5aff', name: 'beacon2' }))];
    for (const zz of [-3.2, 1.6, 3.0]) for (const s of [-1, 1]) mdCyl(E, 0.52, 0.52, 0.35, s * 1.12, 0.52, zz, m.tyre, 0, 0, Math.PI / 2, 16);
    const E2 = new THREE.Group(); E2.position.set(3.15, 0, 3.5); S.add(E2);
    mdBox(E2, 2.5, 2.4, 7.5, 0, 1.95, 0, m.red); mdBox(E2, 2.5, 1.9, 2.4, 0, 1.75, -4.9, m.red);
    for (const zz of [-4.5, 1.8, 3.2]) for (const s of [-1, 1]) mdCyl(E2, 0.52, 0.52, 0.35, s * 1.12, 0.52, zz, m.tyre, 0, 0, Math.PI / 2, 16);
    // the turnout gear on its rack along the left wall: jackets on hooks, helmets above, boots on the floor, ready
    for (let i = 0; i < 7; i++) {
      const z = 4 - i * 1.15, x = -6.6;
      mdBox(S, 0.3, 0.05, 0.9, x + 0.1, 2.35, z, m.steel);
      mdBox(S, 0.32, 0.85, 0.58, x + 0.22, 1.85, z, m.tan);                                // a jacket
      mdBox(S, 0.33, 0.06, 0.6, x + 0.22, 1.6, z, m.stripe); mdBox(S, 0.33, 0.06, 0.6, x + 0.22, 2.0, z, m.stripe);
      const h = mdCyl(S, 0.15, 0.17, 0.18, x + 0.22, 2.55, z, i % 3 ? m.yellow : m.white); void h;
      mdBox(S, 0.32, 0.6, 0.55, x + 0.22, 0.95, z, m.tan);                                 // trousers folded down over…
      for (const e of [-1, 1]) mdBox(S, 0.18, 0.4, 0.16, x + 0.25, 0.2, z + e * 0.12, m.dark);   // …the boots
    }
    // the alarm: a red rotating beacon and a lit TURNOUT panel on the back wall; the fluorescent lights
    this.beacon = mdCyl(S, 0.12, 0.12, 0.2, -2, 5.6, 12.7, new THREE.MeshBasicMaterial({ color: '#ff3a1a', name: 'alarm' }));
    const sign = Tex.label([['TURNOUT', 60], ['STATION 4 · ENGINE 1', 30]], { w: 512, h: 192, bg: '#240806', fg: '#ff5a3a', font: 60 });
    this.signM = new THREE.MeshBasicMaterial({ map: sign, color: new THREE.Color(1.6, 1.6, 1.6), name: 'turnout' });
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.75), this.signM); sg.position.set(-6.82, 3.5, 0.6); sg.rotation.y = Math.PI / 2; S.add(sg);
    for (let i = 0; i < 4; i++) for (const x of [-3.2, 3.2]) mdBox(S, 0.25, 0.06, 2.2, x, 6.0, -8 + i * 6, new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff6e8', emissiveIntensity: 1.6, name: 'tube' }));
    this.alarmL = new THREE.PointLight('#ff3018', 0, 14, 1.4); this.alarmL.position.set(-2, 5.2, 11.5); S.add(this.alarmL);
    for (const z of [-6, 2, 9]) { const L = new THREE.PointLight('#f2f0ea', 7, 16, 1.4); L.position.set(0, 5.6, z); S.add(L); }
    const sun = new THREE.DirectionalLight('#ffe2b8', 2.4); sun.position.set(-8, 14, -30); sun.target.position.set(0, 0, -8); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 80 }); S.add(sun, sun.target);
    S.add(new THREE.HemisphereLight('#c8ccd0', '#4a4640', 0.8));
  }
  update(t) {
    const u = t - MD.fireSt[0], on = Math.floor(u * 3) % 2 === 0;
    this.beacon.material.color.setRGB(on ? 2.4 : 0.35, on ? 0.35 : 0.05, 0.03);
    this.signM.color.setScalar(on ? 1.8 : 0.7);
    this.alarmL.intensity = on ? 6 : 0.8;
    // the engine's own warning lights are off (nobody in it); its beacons just catch the light
    // camera: low, alongside the engine's cab, drifting toward the open door
    const k = Ease.inOutSine(MathX.clamp(u / 2.6, 0, 1));
    this.camera.position.set(1.2 - 0.3 * k, 1.75, 10.6 - 1.6 * k);
    this.camera.lookAt(-2.4, 1.5, -6.0);
    this.camera.fov = 60; this.camera.updateProjectionMatrix();
  }
}

/* ---------------- 3. the ward ---------------- */
class MdWard {
  constructor() {
    const S = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(56, 9 / 16, 0.05, 200);
    S.fog = new THREE.FogExp2(new THREE.Color('#b8c0bc'), 0.01);
    S.background = new THREE.Color('#d0d4d0');
    const m = { floor: mdStd('#9aa6a2', { roughness: 0.4 }), wall: mdStd('#dcdcd2', { roughness: 0.85 }), wall2: mdStd('#b8cac6', { roughness: 0.85 }), sheet: mdStd('#e8ece8', { roughness: 0.95 }), blanket: mdStd('#7d9ab0', { roughness: 0.95 }),
      frame: mdStd('#c8ccd0', { roughness: 0.3, metalness: 0.7 }), dark: mdStd('#2a2e32', { roughness: 0.5 }), curtain: mdStd('#8fb0a8', { roughness: 0.95, side: THREE.DoubleSide }), wood: mdStd('#a88a64', { roughness: 0.7 }) };
    // room 9 × 12, a window on the right wall (daylight)
    mdBox(S, 9, 0.1, 12, 0, -0.05, 0, m.floor); mdBox(S, 9, 0.1, 12, 0, 3.0, 0, m.wall);
    mdBox(S, 0.2, 3, 12, -4.5, 1.5, 0, m.wall2); mdBox(S, 9, 3, 0.2, 0, 1.5, -6, m.wall); mdBox(S, 9, 3, 0.2, 0, 1.5, 6, m.wall);
    mdBox(S, 0.2, 0.9, 12, 4.5, 0.45, 0, m.wall2); mdBox(S, 0.2, 0.5, 12, 4.5, 2.75, 0, m.wall2);
    for (let z = -6; z <= 6; z += 2.4) mdBox(S, 0.22, 1.6, 0.12, 4.5, 1.7, z, m.wall);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#e8eef2').multiplyScalar(1.25), name: 'daylight' })); win.position.set(4.62, 1.7, 0); win.rotation.y = -Math.PI / 2; S.add(win);
    // lights
    const sun = new THREE.DirectionalLight('#fff0dc', 2.0); sun.position.set(12, 8, 3); sun.target.position.set(0, 0, 0); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 }); S.add(sun, sun.target);
    S.add(new THREE.HemisphereLight('#e2e8ee', '#6a6a62', 1.0));
    for (const z of [-3.5, 0.5, 4]) { const L = new THREE.PointLight('#f4f6ff', 4, 9, 1.5); L.position.set(0, 2.8, z); S.add(L); mdBox(S, 1.2, 0.04, 0.3, 0, 2.94, z, new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#f8f8ff', emissiveIntensity: 1.5, name: 'ward light' })); }
    // beds along the left wall: frames, mattresses, sheets, blankets; monitors on stands with a moving trace
    this.traces = [];
    const ecg = () => { const c = Tex.canvas(512, 128), x = c.getContext('2d'); x.fillStyle = '#04110c'; x.fillRect(0, 0, 512, 128); x.strokeStyle = '#4ff09a'; x.lineWidth = 3; x.beginPath();
      for (let i = 0; i <= 512; i++) { const ph = (i % 128) / 128; let y = 70; if (ph > 0.3 && ph < 0.34) y = 70 - (ph - 0.3) * 1200; else if (ph >= 0.34 && ph < 0.38) y = 22 + (ph - 0.34) * 2000; else if (ph >= 0.38 && ph < 0.42) y = 102 - (ph - 0.38) * 800; else if (ph > 0.55 && ph < 0.65) y = 70 - Math.sin((ph - 0.55) / 0.1 * Math.PI) * 10; i ? x.lineTo(i, y) : x.moveTo(i, y); }
      x.stroke(); const t = Tex.tex(c); t.repeat.set(0.5, 1); return t; };
    const beds = [[-3.1, -3.6], [-3.1, -0.4], [-3.1, 2.8]];
    beds.forEach(([x, z], i) => {
      const B = new THREE.Group(); B.position.set(x, 0, z); S.add(B);
      mdBox(B, 1.0, 0.08, 2.1, 0.4, 0.55, 0, m.frame); mdBox(B, 0.95, 0.16, 2.0, 0.4, 0.67, 0, m.sheet);
      mdBox(B, 0.98, 0.06, 1.3, 0.4, 0.78, 0.3, m.blanket);
      mdBox(B, 0.6, 0.12, 0.35, 0.4, 0.82, -0.8, m.sheet, 0.4);                                   // pillow, raised
      mdBox(B, 1.0, 0.6, 0.05, 0.4, 0.85, -1.05, m.frame); mdBox(B, 1.0, 0.35, 0.05, 0.4, 0.7, 1.05, m.frame);
      for (const e of [-1, 1]) for (const f of [-1, 1]) mdCyl(B, 0.03, 0.03, 0.5, 0.4 + e * 0.45, 0.25, f * 0.95, m.frame);
      const st = new THREE.Group(); st.position.set(-0.5, 0, -0.9); B.add(st);
      mdCyl(st, 0.02, 0.02, 1.5, 0, 0.75, 0, m.frame); mdBox(st, 0.42, 0.3, 0.08, 0.12, 1.55, 0.04, m.dark);
      const tr = ecg(); this.traces.push(tr);
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.22), new THREE.MeshBasicMaterial({ map: tr, color: new THREE.Color(1.3, 1.3, 1.3), name: 'ecg' })); sc.position.set(0.12, 1.55, 0.085); sc.rotation.y = 0.6; st.add(sc);
      // a curtain rail and a half-drawn curtain
      mdBox(S, 0.04, 0.04, 2.6, x + 1.4, 2.6, z, m.frame);
      const cu = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0, 8, 1), m.curtain); cu.position.set(x + 1.4, 1.55, z - 1.0); cu.rotation.y = Math.PI / 2;
      const p = cu.geometry.attributes.position; for (let k = 0; k < p.count; k++) p.setZ(k, 0.06 * Math.sin(p.getX(k) * 18)); cu.geometry.computeVertexNormals(); S.add(cu);
      mdBox(S, 0.45, 0.8, 0.45, x - 0.2, 0.4, z + 1.35, m.wood);                                 // bedside locker
    });
    // patients (women, sitting up in bed) and the nurses (scrubs)
    Object.assign(LOOKS, {
      mdNurse1: { skin: 2, build: 'slim', shirt: '#4f7f8a', sleeves: 'short', pants: '#4f7f8a', shoes: '#e8e4dc', sole: '#d8d4cc', hair: '#2a1a12', hairStyle: 'bun' },
      mdNurse2: { skin: 4, build: 'avg', shirt: '#5a6f9a', sleeves: 'short', pants: '#5a6f9a', shoes: '#e8e4dc', sole: '#d8d4cc', hair: '#120c0a', hairStyle: 'pony' },
      mdNurse3: { skin: 0, build: 'slim', shirt: '#4f7f8a', sleeves: 'short', pants: '#4f7f8a', shoes: '#2a2a2a', sole: '#d8d4cc', hair: '#8a6440', hairStyle: 'bun' },
      mdPat1: { skin: 1, build: 'slim', shirt: '#b8c8d8', sleeves: 'short', pants: '#b8c8d8', shoes: '#ccc', hair: '#9a9590', hairStyle: 'long' },
      mdPat2: { skin: 3, build: 'avg', shirt: '#c8d4dc', sleeves: 'short', pants: '#c8d4dc', shoes: '#ccc', hair: '#2a1a12', hairStyle: 'bun' },
    });
    const M0 = MD.ward;
    this.people = [
      new Person({ id: 'N1', look: 'mdNurse1', path: [[M0, -1.2, -0.9]], states: [[0, 'mdStandLook']], face: 120 }, S),
      new Person({ id: 'N2', look: 'mdNurse2', path: [[M0, 1.6, -4.4], [M0 + 2.6, 1.2, -1.4]], states: [[0, 'walk']] }, S),
      new Person({ id: 'N3', look: 'mdNurse3', path: [[M0, -1.3, 2.4]], states: [[0, 'mdPhone']], face: 90, seat: 0.45, y: 0 }, S),
      new Person({ id: 'P1', look: 'mdPat1', path: [[M0, -2.7, -0.2]], states: [[0, 'sit']], face: 180, seat: 0.72, y: 0.0 }, S),
      new Person({ id: 'P2', look: 'mdPat2', path: [[M0, -2.7, -3.4]], states: [[0, 'sit']], face: 180, seat: 0.72, y: 0.0 }, S),
    ];
    this.people[2].states = [[0, 'idle']];
    // a nurse's clipboard / a drip stand
    mdCyl(S, 0.015, 0.015, 1.9, -1.9, 0.95, -1.4, m.frame); mdBox(S, 0.12, 0.2, 0.05, -1.9, 1.8, -1.4, mdStd('#dfe8ee', { roughness: 0.2, transparent: true, opacity: 0.7 }));
  }
  update(t) {
    const u = t - MD.ward;
    for (const p of this.people) p.update(t);
    for (const tr of this.traces) tr.offset.x = (u * 0.55) % 1;
    const k = Ease.inOutSine(MathX.clamp(u / 2.6, 0, 1));
    this.camera.position.set(2.6 - 0.6 * k, 1.62, 4.6 - 0.9 * k);
    this.camera.lookAt(-1.2, 1.15, -1.4 + 0.3 * k);
    this.camera.fov = 56; this.camera.updateProjectionMatrix();
  }
}

/* ---------------- 4. the grid control room (v3) ---------------- */
// A regional control room at dusk: the video wall's map, frequency falling from 50.00 Hz as generation and demand
// drift apart with nobody dispatching; alarms; the desks and chairs empty.
class MdGridRoom {
  constructor() {
    const S = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(58, 9 / 16, 0.05, 200);
    S.background = new THREE.Color('#06080b');
    S.fog = new THREE.FogExp2(new THREE.Color('#06080b'), 0.02);
    const m = { floor: mdStd('#2a2d31', { roughness: 0.8 }), wall: mdStd('#3a3f46', { roughness: 0.9 }), desk: mdStd('#4a4f56', { roughness: 0.5 }), top: mdStd('#2f3338', { roughness: 0.4 }),
      chair: mdStd('#1c1e22', { roughness: 0.7 }), metal: mdStd('#8a9096', { roughness: 0.35, metalness: 0.8 }) };
    mdBox(S, 30, 0.1, 30, 0, -0.05, 0, m.floor);
    mdBox(S, 30, 7, 0.3, 0, 3.5, -10, m.wall); mdBox(S, 0.3, 7, 30, -11, 3.5, 0, m.wall); mdBox(S, 0.3, 7, 30, 11, 3.5, 0, m.wall); mdBox(S, 30, 0.3, 30, 0, 7, 0, m.wall);
    // the video wall
    this.cv = document.createElement('canvas'); this.cv.width = 1024; this.cv.height = 400; this.ctx = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace;
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(16, 6.25), new THREE.MeshBasicMaterial({ map: this.tex, color: new THREE.Color(1.25, 1.25, 1.25), name: 'videowall' }));
    wall.position.set(0, 3.6, -9.8); S.add(wall);
    // the map: substations and lines (seeded)
    const r = new RNG(9911); this.nodes = []; this.lines = [];
    for (let i = 0; i < 26; i++) this.nodes.push([60 + r.next() * 640, 70 + r.next() * 290]);
    for (let i = 0; i < 26; i++) for (let j = i + 1; j < 26; j++) { const a = this.nodes[i], b = this.nodes[j]; if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 150 && r.next() < 0.7) this.lines.push([i, j, r.next()]); }
    // three rows of desks with monitors, the chairs pushed back
    this.screens = [];
    for (let row = 0; row < 3; row++) for (let i = 0; i < 4; i++) {
      const x = -6 + i * 4, z = -4 + row * 3.4;
      mdBox(S, 3.4, 0.08, 1.1, x, 0.76, z, m.top); mdBox(S, 3.3, 0.7, 0.08, x, 0.38, z + 0.5, m.desk);
      for (let k = -1; k <= 1; k++) {
        const sm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 0.4, 0.55), name: 'monitor' });
        mdBox(S, 0.95, 0.55, 0.05, x + k * 1.05, 1.18, z - 0.3, sm, -0.08); this.screens.push(sm);
      }
      const ch = new THREE.Group(); ch.position.set(x + (hash1(i + row * 4) - 0.5) * 1.2, 0, z + 1.0 + hash1(i * 3 + row) * 0.6); ch.rotation.y = (hash1(i * 7 + row) - 0.5) * 1.6; S.add(ch);
      mdBox(ch, 0.55, 0.1, 0.55, 0, 0.5, 0, m.chair); mdBox(ch, 0.55, 0.6, 0.08, 0, 0.85, 0.26, m.chair, 0.1); mdCyl(ch, 0.03, 0.03, 0.45, 0, 0.25, 0, m.metal);
    }
    mdCyl(S, 0.045, 0.04, 0.1, 2.3, 0.85, -0.7, mdStd('#e0dcd2'));   // a mug, left on a desk
    // the alarm beacons on the side walls, the room lights low
    this.beacons = [-10.7, 10.7].map((x) => { const b = mdCyl(S, 0.15, 0.15, 0.25, x, 5.8, -6, new THREE.MeshBasicMaterial({ color: '#ff8a10' })); b.rotation.z = Math.PI / 2; return b; });
    this.alarmL = new THREE.PointLight('#ff3a10', 0, 18, 1.5); this.alarmL.position.set(0, 5.5, -6); S.add(this.alarmL);
    this.wallL = new THREE.PointLight('#7aa8ff', 9, 16, 1.5); this.wallL.position.set(0, 3.5, -7); S.add(this.wallL);
    S.add(new THREE.HemisphereLight('#4a5260', '#101214', 0.5));
  }
  _draw(u) {
    const c = this.ctx, W = 1024, H = 400;
    c.fillStyle = '#081420'; c.fillRect(0, 0, W, H);
    // lines trip one after another (red), then the whole map goes red
    const trip = MathX.clamp(u / 1.8, 0, 1);
    for (const [i, j, k] of this.lines) {
      const a = this.nodes[i], b = this.nodes[j], red = k < trip * 1.1;
      c.strokeStyle = red ? (Math.floor(u * 6 + k * 10) % 2 ? '#ff3020' : '#7a1810') : '#3ad08a'; c.lineWidth = red ? 4 : 3;
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
    for (const [x, y] of this.nodes) { c.fillStyle = '#d8e8f0'; c.fillRect(x - 5, y - 5, 10, 10); }
    // frequency and balance
    const f = 50.0 - 1.45 * Math.pow(trip, 1.6);
    c.fillStyle = '#0d1c2a'; c.fillRect(740, 30, 260, 340);
    c.font = 'bold 26px sans-serif'; c.fillStyle = '#9ab8cc'; c.fillText('FREQUENCY', 760, 70);
    c.font = 'bold 64px sans-serif'; c.fillStyle = f < 49.8 ? (Math.floor(u * 4) % 2 ? '#ff3a28' : '#ffb0a0') : '#5af0a0'; c.fillText(f.toFixed(2), 760, 140);
    c.font = 'bold 26px sans-serif'; c.fillText('Hz', 940, 140);
    c.fillStyle = '#9ab8cc'; c.fillText('GENERATION', 760, 200); c.fillText('DEMAND', 760, 280);
    c.fillStyle = '#3ad08a'; c.fillRect(760, 212, 200 * (0.92 - 0.5 * trip), 26);
    c.fillStyle = '#e0b040'; c.fillRect(760, 292, 200 * 0.86, 26);
    c.fillStyle = trip > 0.4 ? '#ff3a28' : '#9ab8cc'; c.font = 'bold 22px sans-serif'; c.fillText(trip > 0.4 ? 'LOAD SHEDDING · FAILED' : 'DISPATCH · NO RESPONSE', 760, 350);
    this.tex.needsUpdate = true;
  }
  update(t) {
    const u = t - MD.gridRoom[0], on = Math.floor(u * 2.5) % 2 === 0;
    const q = Math.floor(u * 15) / 15;                 // redraw at 15 fps
    if (this._q !== q) { this._draw(q); this._q = q; }
    for (const b of this.beacons) b.material.color.setRGB(on ? 2.4 : 0.4, on ? 1.0 : 0.15, 0.05);
    this.alarmL.intensity = on ? 5 : 0.6;
    this.screens.forEach((sm, i) => { const red = hash1(i * 3.3) < MathX.clamp(u / 1.6, 0, 1); sm.color.setRGB(red ? (on ? 0.95 : 0.35) : 0.12, red ? 0.08 : 0.2, red ? 0.05 : 0.3); });
    const k = Ease.inOutSine(MathX.clamp(u / 2.1, 0, 1));
    this.camera.position.set(1.2 + 0.6 * k, 1.75, 6.5 - 1.6 * k);
    this.camera.lookAt(3.0, 3.8, -9.8);
    this.camera.fov = 58; this.camera.updateProjectionMatrix();
  }
}

/* ---------------- 5. the supermarket, two weeks on (v3) ---------------- */
// An aisle with the shelves stripped, the power off: grey daylight from the front windows, one emergency light,
// a few things nobody wanted, a trolley left in the aisle.
class MdMarket {
  constructor() {
    const S = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 9 / 16, 0.05, 200);
    S.background = new THREE.Color('#1a1b1c');
    S.fog = new THREE.FogExp2(new THREE.Color('#2a2b2c'), 0.018);
    const m = { floor: new THREE.MeshStandardMaterial({ map: Tex.concrete(77, [168, 164, 156]), roughness: 0.3, name: 'shop floor' }), shelf: mdStd('#c8ccd0', { roughness: 0.5, metalness: 0.3 }),
      back: mdStd('#e2e0da', { roughness: 0.8 }), ceil: mdStd('#6a6c6e', { roughness: 0.9 }), tag: mdStd('#f2d840', { roughness: 0.6 }), wire: mdStd('#8a9096', { roughness: 0.3, metalness: 0.9 }) };
    mdBox(S, 12, 0.1, 40, 0, -0.05, 0, m.floor);
    mdBox(S, 12, 0.2, 40, 0, 4.2, 0, m.ceil);
    // two shelf runs either side of the aisle
    const r = new RNG(5151), cols = ['#c83a2a', '#e8d8a0', '#2a6ab0', '#f0a030', '#3a8a4a', '#d8d4cc', '#7a2a6a'];
    for (const side of [-1, 1]) {
      const x = side * 1.55;
      mdBox(S, 0.9, 2.1, 32, x + side * 0.45, 1.05, -2, m.back);
      for (let lv = 0; lv < 5; lv++) {
        const y = 0.18 + lv * 0.44;
        mdBox(S, 0.7, 0.03, 32, x + side * 0.05, y, -2, m.shelf);
        mdBox(S, 0.02, 0.05, 32, x - side * 0.3, y + 0.02, -2, m.tag);
        // what's left: a few packs, mostly at the back of the shelf
        for (let i = 0; i < 70; i++) {
          if (r.next() > 0.08) continue;
          const z = -17.5 + i * 0.45, w = r.range(0.15, 0.3), h = r.range(0.12, 0.32);
          mdBox(S, w, h, r.range(0.12, 0.25), x + side * r.range(0.05, 0.25), y + h / 2 + 0.02, z, mdStd(r.pick(cols), { roughness: 0.6 }), 0, r.range(-0.4, 0.4));
        }
      }
    }
    // a box on the floor, a trolley left in the aisle
    mdBox(S, 0.45, 0.3, 0.35, 0.5, 0.15, -3.5, mdStd('#b89a6a'), 0, 0.5);
    const tr = new THREE.Group(); tr.position.set(-0.35, 0, -6.5); tr.rotation.y = 0.35; S.add(tr);
    for (const [w, h, d, x, y, z] of [[0.55, 0.02, 0.9, 0, 0.3, 0], [0.55, 0.5, 0.02, 0, 0.6, -0.45], [0.55, 0.5, 0.02, 0, 0.6, 0.45], [0.02, 0.5, 0.9, -0.27, 0.6, 0], [0.02, 0.5, 0.9, 0.27, 0.6, 0], [0.6, 0.03, 0.03, 0, 1.0, 0.55]]) mdBox(tr, w, h, d, x, y, z, m.wire);
    // the hanging aisle sign
    const sign = Tex.label([['BREAD · MILK · EGGS', 40]], { w: 512, h: 96, bg: '#1e4a8a', fg: '#ffffff', font: 40 });
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.45), new THREE.MeshStandardMaterial({ map: sign, roughness: 0.7 })); sg.position.set(0, 3.4, -9); S.add(sg);
    // the light: grey day through the front windows (behind the camera), one emergency light down the aisle
    const day = new THREE.DirectionalLight('#c8ccd0', 2.4); day.position.set(2, 3, 10); S.add(day);
    S.add(new THREE.HemisphereLight('#9aa0a6', '#3a3836', 1.4));
    this.em = new THREE.PointLight('#fff2d8', 9, 16, 1.6); this.em.position.set(0, 3.8, -12); S.add(this.em);
    mdBox(S, 0.5, 0.12, 0.2, 0, 4.05, -12, new THREE.MeshBasicMaterial({ color: '#fff4e0' }));
    for (let i = 0; i < 6; i++) mdBox(S, 0.2, 0.05, 2.0, 0, 4.08, 6 - i * 5, mdStd('#9a9c9e', { roughness: 0.5 }));   // the strip lights, off
    // the women stripping what's left: one reaching to the top shelf, one with a child, one pushing a trolley, one
    // checking a phone with no signal
    this.people = [
      mdPerson(S, 'mkA', 'mdW3', -0.85, -3.0, 90, [[0, 'mdReach']]),
      mdPerson(S, 'mkB', 'mdW8', 0.7, -7.5, 200, [[0, 'mdHold']]),
      mdPerson(S, 'mkC', 'mdW5', 0.2, -11.0, 0, [[0, 'walk']], [[0, 0.2, -11.0], [4, 0.1, -7.4]]),
      mdPerson(S, 'mkD', 'mdW4', -0.6, -14.5, 180, [[0, 'mdNoSignal']]),
    ];
    const kid = mdPerson(S, 'mkKid', 'mdBoy', 1.05, -7.0, 210, [[0, 'look']]); kid.root.scale.setScalar(0.7); this.people.push(kid);
    const tr2 = new THREE.Group(); tr2.position.set(0.2, 0, -10.3); S.add(tr2); this.tr2 = tr2;
    for (const [w, h, d, x, y, z] of [[0.55, 0.02, 0.9, 0, 0.3, 0], [0.55, 0.5, 0.02, 0, 0.6, -0.45], [0.55, 0.5, 0.02, 0, 0.6, 0.45], [0.02, 0.5, 0.9, -0.27, 0.6, 0], [0.02, 0.5, 0.9, 0.27, 0.6, 0]]) mdBox(tr2, w, h, d, x, y, z, m.wire);
  }
  update(t) {
    const u = t - MD.food[0];
    for (const p of this.people) p.update(u);
    this.tr2.position.z = this.people[2].locate(u).z + 0.9;
    this.em.intensity = 4 * (0.75 + 0.25 * (Math.floor(u * 9) % 7 === 0 ? 0.2 : 1));
    const k = Ease.inOutSine(MathX.clamp(u / 2.4, 0, 1));
    this.camera.position.set(0.15, 1.55, 3.5 - 2.0 * k);
    this.camera.lookAt(-0.2, 1.1, -12);
    this.camera.fov = 60; this.camera.updateProjectionMatrix();
  }
}

/* ---------------- 7. people: the women left to cope (v3) ---------------- */
// film actions for the survival scenes (pure functions of τ)
Object.assign(ACTIONS, {
  // working a dry tap: bent over it, both hands on the handle, turning it again and again
  mdTap(τ, c) { const p = ACTIONS.idle(τ, c), w = Math.sin(τ * 5.5 + c.seed * 4); p.spine = 0.42; p.neck = 0.25; p.lSh = [0.95, 0.12]; p.rSh = [0.95, 0.12]; p.lEl = 0.7 + 0.25 * w; p.rEl = 0.7 - 0.25 * w; p.lKnee = 0.18; p.rKnee = 0.18; p.hipY = 0.9; return p; },
  // holding a bucket (or a bottle) in the right hand, waiting, looking about
  mdBucket(τ, c) { const p = ACTIONS.look(τ, c); p.rSh = [0.04, 0.16]; p.rEl = 0.08; return p; },
  // reaching up to an empty shelf
  mdReach(τ, c) { const p = ACTIONS.idle(τ, c), w = Math.sin(τ * 1.4 + c.seed * 3); p.rSh = [2.2 + 0.2 * w, 0.2]; p.rEl = 0.3; p.lSh = [0.5, 0.1]; p.lEl = 1.0; p.neck = -0.35; p.spine = -0.08; p.headYaw = 0.2 * w; return p; },
  // holding a phone up: no signal
  mdNoSignal(τ, c) { const p = ACTIONS.idle(τ, c); p.rSh = [1.55 + 0.25 * Math.sin(τ * 0.9 + c.seed), 0.18]; p.rEl = 0.65; p.neck = -0.25; p.headYaw = 0.25 * Math.sin(τ * 0.7); p.lSh = [0.1, 0.12]; return p; },
  // an arm round a child's shoulders
  mdHold(τ, c) { const p = ACTIONS.look(τ, c); p.lSh = [0.35, 0.55]; p.lEl = 1.35; return p; },
});
function mdPerson(scene, id, look, x, z, face, states, path) {
  const p = new Person({ id, look, path: path || [[0, x, z]], states, face, y: 0 }, scene);
  return p;
}
function mdHeld(person, mesh, side = -1, y = -0.18) { const h = (side < 0 ? person.j.ra : person.j.la).hand; mesh.position.set(0, y, 0); h.add(mesh); return mesh; }
function mdBucketMesh(color = '#c8c4b8') { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.3, 14, 1, true), mdStd(color, { roughness: 0.6, side: THREE.DoubleSide })); b.position.y = -0.12; g.add(b); const bot = new THREE.Mesh(new THREE.CircleGeometry(0.11, 14), mdStd(color)); bot.rotation.x = -Math.PI / 2; bot.position.y = -0.27; g.add(bot); return g; }

// the government: the national assembly's chamber, an hour on. Most seats empty; a few women standing in the aisles,
// one on a phone that won't connect; the screen over the speaker's chair with nothing to announce.
class MdChamber {
  constructor() {
    const S = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(56, 9 / 16, 0.05, 300);
    S.background = new THREE.Color('#14100c');
    S.fog = new THREE.FogExp2(new THREE.Color('#1a140e'), 0.012);
    const m = { carpet: mdStd('#3a4a6a', { roughness: 0.95 }), wood: mdStd('#6a4628', { roughness: 0.55 }), woodD: mdStd('#3e2816', { roughness: 0.6 }), seat: mdStd('#2c4a7a', { roughness: 0.8 }),
      wall: mdStd('#8a7454', { roughness: 0.9 }), paper: mdStd('#f2efe6', { roughness: 0.9 }), mic: mdStd('#202224', { roughness: 0.4, metalness: 0.6 }), gold: mdStd('#c8a050', { roughness: 0.4, metalness: 0.6 }) };
    mdBox(S, 60, 0.1, 60, 0, -0.05, 0, m.carpet);
    // the hemicycle: five tiers of curved desks facing the speaker's chair (at z = −10)
    const C = [0, -10], r = new RNG(6161);
    for (let row = 0; row < 6; row++) {
      const R = 7 + row * 2.0, y = row * 0.45, n = 10 + row * 3;
      mdBox(S, 2 * R + 6, y, 2.0, 0, y / 2, C[1] + R, m.woodD);   // (the tier's floor, under the desks)
      for (let i = 0; i < n; i++) {
        const a = -1.15 + 2.3 * (i + 0.5) / n, x = C[0] + Math.sin(a) * R, z = C[1] + Math.cos(a) * R;
        mdBox(S, 1.25, 0.8, 0.55, x, y + 0.4, z, m.wood, 0, a);
        const ch = new THREE.Group(); ch.position.set(C[0] + Math.sin(a) * (R + 0.85), y, C[1] + Math.cos(a) * (R + 0.85)); ch.rotation.y = a + (r.next() - 0.5) * 0.6; S.add(ch);
        mdBox(ch, 0.6, 0.1, 0.55, 0, 0.5, 0, m.seat); mdBox(ch, 0.6, 0.75, 0.1, 0, 0.9, 0.28, m.seat, -0.1);
        if (r.next() < 0.5) mdBox(S, 0.3, 0.01, 0.4, x + (r.next() - 0.5) * 0.6, y + 0.81, z, m.paper, 0, a + r.next());   // the papers where they left them
        if (i % 2 === 0) mdCyl(S, 0.01, 0.01, 0.35, x, y + 0.98, z - 0.1, m.mic, 0.4, a);
      }
    }
    // the speaker's chair, the clerks' table, the screen above
    mdBox(S, 7, 1.2, 2.2, 0, 0.6, -10.5, m.wood); mdBox(S, 1.2, 2.6, 1.0, 0, 1.3, -12.2, m.seat);
    mdBox(S, 40, 14, 0.4, 0, 7, -14, m.wall); mdBox(S, 0.4, 14, 60, -22, 7, 0, m.wall); mdBox(S, 0.4, 14, 60, 22, 7, 0, m.wall);
    const scr = Tex.label([['EMERGENCY SESSION', 46], ['NO QUORUM · NO STATEMENT', 38]], { w: 1024, h: 300, bg: '#0a1a3a', fg: '#e8eef8', font: 46 });
    this.screen = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.64), new THREE.MeshBasicMaterial({ map: scr, color: new THREE.Color(1.1, 1.1, 1.1) })); this.screen.position.set(0, 6.0, -13.7); S.add(this.screen);
    mdCyl(S, 1.1, 1.1, 0.15, 0, 9.5, -13.7, m.gold, Math.PI / 2);   // the crest
    // the women: in the aisle, on the steps, at the clerks' table
    this.people = [
      mdPerson(S, 'chA', 'mdW6', -2.2, -6.2, 160, [[0, 'look']]),
      mdPerson(S, 'chB', 'mdW2', 1.6, -5.4, 200, [[0, 'mdNoSignal']]),
      mdPerson(S, 'chC', 'mdW9', 3.4, -7.4, 230, [[0, 'handHead']]),
      mdPerson(S, 'chD', 'mdW1', -3.8, -8.6, 140, [[0, 'phone']]),
      mdPerson(S, 'chE', 'mdW7', 0.6, -3.6, 180, [[0, 'walk']], [[0, 0.6, -3.6], [3.6, -0.6, -6.6]]),
    ];
    S.add(new THREE.HemisphereLight('#c8b898', '#2a2018', 0.9));
    const key = new THREE.DirectionalLight('#ffe2b8', 1.6); key.position.set(-6, 14, 8); S.add(key);
    this.sp = new THREE.PointLight('#ffd9a0', 30, 30, 1.5); this.sp.position.set(0, 9, -6); S.add(this.sp);
  }
  update(t) {
    const u = t - MD.gov[0];
    for (const p of this.people) p.update(u);
    const k = Ease.inOutSine(MathX.clamp(u / (MD.gov[1] - MD.gov[0]), 0, 1));
    this.camera.position.set(-2.0 + 1.6 * k, 4.6 - 0.6 * k, 10.5 - 2.6 * k);
    this.camera.lookAt(0.3, 1.5, -6.5);
    this.camera.fov = 56; this.camera.updateProjectionMatrix();
  }
}

// +2 DAYS: a square with a public standpipe. A line of women with buckets and bottles; the one at the front works the
// tap; nothing comes. No signal on the phones, nobody in charge to ask.
class MdQueue {
  constructor() {
    const S = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 9 / 16, 0.05, 300);
    S.background = new THREE.Color('#8e8f8a');
    S.fog = new THREE.FogExp2(new THREE.Color('#8e8f8a'), 0.018);
    const ground = new THREE.MeshStandardMaterial({ map: Tex.concrete(91, [150, 146, 138]), roughness: 0.9 }); ground.map.repeat.set(10, 10);
    mdBox(S, 80, 0.1, 80, 0, -0.05, 0, ground);
    // the buildings round the square (facade texture from the shared kit)
    for (const [x, z, w, h, ry, st, sd] of [[-14, -8, 26, 16, 0.25, 'redbrick', 901], [10, -16, 22, 19, -0.1, 'tanbrick', 902], [18, 6, 20, 14, -1.4, 'whitebrick', 903]]) {
      const tx = Tex.facade(FACADE_STYLES[st], sd); tx.map.repeat.set(w / (tx.tileW || 12), h / (tx.tileH || 13.2));
      const mat = new THREE.MeshStandardMaterial({ map: tx.map, roughness: 1 });
      const b = mdBox(S, w, h, 12, x, h / 2, z, mat, 0, ry);
    }
    // the standpipe: a post with a tap, a grate below, a few jerrycans
    const iron = mdStd('#3c5a4a', { roughness: 0.5, metalness: 0.4 }), steel = mdStd('#9aa0a4', { roughness: 0.3, metalness: 0.8 });
    mdCyl(S, 0.12, 0.15, 1.1, 0, 0.55, 0, iron); mdCyl(S, 0.04, 0.04, 0.3, 0, 0.95, 0.15, steel, Math.PI / 2); mdBox(S, 0.18, 0.05, 0.05, 0, 1.15, 0, steel);
    mdBox(S, 0.8, 0.02, 0.8, 0, 0.01, 0.3, mdStd('#2a2a2a', { roughness: 0.6 }));
    for (const [x, z, c] of [[0.9, 0.6, '#d8c040'], [1.2, 0.2, '#2a5aa0'], [-0.9, 1.4, '#d8c040']]) mdBox(S, 0.3, 0.45, 0.18, x, 0.22, z, mdStd(c, { roughness: 0.5 }), 0, x);
    // the line: front one at the tap, the rest waiting with buckets
    const looks = ['mdW3', 'mdW4', 'mdW8', 'mdW5', 'mdW2', 'mdW1', 'mdW7', 'mdW9'];
    this.people = [mdPerson(S, 'qA', 'mdW6', 0, 0.75, 180, [[0, 'mdTap']])];
    for (let i = 0; i < 8; i++) {
      const z = 2.0 + i * 1.05, x = 0.25 * Math.sin(i * 1.7), p = mdPerson(S, 'q' + i, looks[i], x, z, 180 + 10 * Math.sin(i * 2.3), [[0, i === 3 ? 'mdNoSignal' : i === 5 ? 'mdHold' : 'mdBucket']]);
      if (i !== 3 && i !== 5) mdHeld(p, mdBucketMesh(['#c8c4b8', '#3a6aa8', '#c84a3a', '#e0d8c0'][i % 4]));
      this.people.push(p);
    }
    const kid = mdPerson(S, 'qKid', 'mdBoy', 0.75, 7.25, 190, [[0, 'look']]); kid.root.scale.setScalar(0.72); this.people.push(kid);
    S.add(new THREE.HemisphereLight('#c8ccd0', '#4a4844', 1.3));
    const sun = new THREE.DirectionalLight('#e8e4dc', 1.4); sun.position.set(8, 14, 6); S.add(sun);
  }
  update(t) {
    const u = t - MD.queue[0];
    for (const p of this.people) p.update(u);
    const k = Ease.inOutSine(MathX.clamp(u / (MD.queue[1] - MD.queue[0]), 0, 1));
    this.camera.position.set(3.4 - 0.6 * k, 1.5, 9.5 - 5.0 * k);
    this.camera.lookAt(0, 1.0, 1.2 - 0.6 * k);
    this.camera.fov = 50; this.camera.updateProjectionMatrix();
  }
}

/* ---------------- 6. the planet at night: the lights go out (v3) ---------------- */
// The shared Earth (js/world/earth.js) from the night side over the Atlantic: North America's east coast, Europe and
// West Africa lit; the lights go out in three steps (the patches the engine already draws).
class MdEarth extends EarthScene {
  constructor() {
    super();
    this.viewDir = EarthScene.dirFromLonLat(18, 40);
    this.sunDir.copy(EarthScene.dirFromLonLat(-150, -10)); this.uniforms.uSun.value.copy(this.sunDir);
    this._side = new THREE.Vector3(); this._up = new THREE.Vector3(0, 1, 0);
  }
  update(t) {
    const u = t - MD.earth[0];
    this.earth.rotation.y = u * 0.01; this.clouds.rotation.y = u * 0.012;
    // all lit, then three hard steps down to a few scattered points (hospitals, plants on their own generators)
    const steps = [[0.5, 0.6], [0.95, 0.28], [1.4, 0.05]];
    let L = 1; for (const [ts, v] of steps) if (u >= ts) L = v;
    this.uniforms.uLights.value = L;
    const dist = 3.3 - 0.25 * Ease.inOutSine(MathX.clamp(u / 2.0, 0, 1));
    this._side.copy(this._up).cross(this.viewDir).normalize();
    this.camera.position.copy(this.viewDir).multiplyScalar(dist).addScaledVector(this._side, 0.12 * u);
    this.camera.lookAt(0, 0.1, 0);
    this.camera.updateMatrixWorld(true);
  }
}

class MdMontage {
  constructor() { this.fire = new MdFireStation(); this.grid = new MdGridRoom(); this.market = new MdMarket(); this.earth = new MdEarth(); this.chamber = new MdChamber(); this.queue = new MdQueue(); }
  shotAt(t) {
    if (t >= MD.fireSt[0] && t < MD.fireSt[1]) return this.fire;
    if (t >= MD.gridRoom[0] && t < MD.gridRoom[1]) return this.grid;
    if (t >= MD.food[0] && t < MD.food[1]) return this.market;
    if (t >= MD.earth[0] && t < MD.earth[1]) return this.earth;
    if (t >= MD.gov[0] && t < MD.gov[1]) return this.chamber;
    if (t >= MD.queue[0] && t < MD.queue[1]) return this.queue;
    return null;
  }
  update(t) { const s = this.shotAt(t); if (s) s.update(t); return s; }
}
