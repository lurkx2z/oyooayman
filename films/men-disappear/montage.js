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
    const u = t - MD.fire, on = Math.floor(u * 3) % 2 === 0;
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

class MdMontage {
  constructor() { this.cockpit = new MdCockpit(); this.fire = new MdFireStation(); this.ward = new MdWard(); }
  shotAt(t) {
    if (t < MD.montage[0] || t >= MD.montage[1]) return null;
    return t < MD.fire ? this.cockpit : t < MD.ward ? this.fire : this.ward;
  }
  update(t) { const s = this.shotAt(t); if (s) s.update(t); return s; }
}
