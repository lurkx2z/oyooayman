/* =====================================================================
   ROOM PHONE — your phone, down to its subpixels (metres, phone-local: x = screen right, z = screen down, y up).
   A 71.5 × 147 × 7.8 mm slab: metal frame, black glass, a 1170 × 2532 OLED 0.5 mm under the cover glass.
   The screen shader draws every pixel as three separate red, green and blue lights once a pixel is bigger than a dot
   on your screen, and blends back to the plain picture further away. Screens: off · lock + "Mum: Dinner's ready!" · call.
     shBuildPhone(root) → { g, screen, glass, light, setScreen(name), bright }
   ===================================================================== */

const SH_PHONE = { w: 0.0715, l: 0.147, t: 0.0078, scrW: 0.0646, scrL: 0.1398, px: 1170, py: 2532 };
// a pixel's centre in phone-local coordinates (x right, z down), top-left = (0, 0)
const shPx = (x, y) => [-SH_PHONE.scrW / 2 + (x + 0.5) * SH_PHONE.scrW / SH_PHONE.px, SH_PHONE.t - 0.0005, -SH_PHONE.scrL / 2 + (y + 0.5) * SH_PHONE.scrL / SH_PHONE.py];

// rounded rectangle path on a 2D canvas
function shRR(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

function shWallpaper(g, w, h, dim = 1) {
  const gr = g.createLinearGradient(0, 0, w * 0.3, h);
  gr.addColorStop(0, '#22134f'); gr.addColorStop(0.38, '#5b2a8c'); gr.addColorStop(0.62, '#c03c7c'); gr.addColorStop(0.85, '#ff8a4c'); gr.addColorStop(1, '#ffc46a');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // soft colour blobs
  const blob = (x, y, r, c) => { const b = g.createRadialGradient(x, y, 0, x, y, r); b.addColorStop(0, c); b.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = b; g.fillRect(x - r, y - r, 2 * r, 2 * r); };
  blob(w * 0.85, h * 0.25, 600, 'rgba(60,200,255,0.55)');
  blob(w * 0.1, h * 0.6, 700, 'rgba(255,60,120,0.5)');
  blob(w * 0.7, h * 0.82, 650, 'rgba(255,220,80,0.45)');
  if (dim < 1) { g.fillStyle = `rgba(0,0,0,${1 - dim})`; g.fillRect(0, 0, w, h); }
}
function shStatusBar(g, w, dark) {
  g.fillStyle = '#000'; shRR(g, 405, 34, 360, 104, 52); g.fill();   // the camera cut-out
  g.fillStyle = '#fff'; g.font = '600 50px Inter';
  g.textAlign = 'left'; g.fillText('●●●●', 90, 112);
  g.textAlign = 'right'; g.fillText('5G', 930, 112);
  g.strokeStyle = '#fff'; g.lineWidth = 5; shRR(g, 960, 78, 100, 46, 14); g.stroke();
  g.fillStyle = '#fff'; shRR(g, 968, 86, 66, 30, 8); g.fill(); g.fillRect(1066, 92, 8, 18);
}
function shPhoneCanvas(kind) {
  return shCanvas(SH_PHONE.px, SH_PHONE.py, (g, w, h) => {
    if (kind === 'lock') {
      shWallpaper(g, w, h);
      shStatusBar(g, w);
      g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,0.92)';
      g.font = '600 58px Inter'; g.fillText('Sunday 18 October', w / 2, 300);
      g.font = '650 280px Inter'; g.fillText('18:42', w / 2, 590);
      // the notification (dark banner, white text)
      g.fillStyle = 'rgba(52,48,66,0.72)'; shRR(g, 42, 1450, w - 84, 270, 52); g.fill();
      const ic = g.createLinearGradient(0, 1500, 0, 1640); ic.addColorStop(0, '#73ea6c'); ic.addColorStop(1, '#2fc23b');
      g.fillStyle = ic; shRR(g, 82, 1500, 126, 126, 30); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(145, 1560, 40, 33, 0, 0, 7); g.fill();
      g.textAlign = 'left'; g.fillStyle = '#ffffff'; g.font = '700 54px Inter'; g.fillText('Mum', 240, 1548);
      g.font = '450 54px Inter'; g.fillText('Dinner’s ready!', 240, 1622);
      g.textAlign = 'right'; g.fillStyle = 'rgba(255,255,255,0.6)'; g.font = '450 42px Inter'; g.fillText('now', w - 92, 1546);
      // flashlight and camera buttons, the home bar
      g.fillStyle = 'rgba(30,30,40,0.55)';
      for (const x of [190, w - 190]) { g.beginPath(); g.arc(x, 2280, 82, 0, 7); g.fill(); }
      g.fillStyle = '#fff'; g.fillRect(170, 2245, 40, 70); g.fillRect(w - 225, 2258, 70, 48);
      shRR(g, w / 2 - 210, 2480, 420, 14, 7); g.fill();
    } else if (kind === 'call') {
      // incoming call: deep green poster, the name huge, red and green buttons
      const gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#0d3b2c'); gr.addColorStop(0.45, '#17a36a'); gr.addColorStop(0.75, '#3fd18a'); gr.addColorStop(1, '#0a2a20');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      shStatusBar(g, w);
      g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,0.75)'; g.font = '500 54px Inter'; g.fillText('mobile', w / 2, 420);
      g.fillStyle = '#ffffff'; g.font = '700 330px Inter'; g.fillText('Mum', w / 2, 1640);
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.font = '500 50px Inter';
      g.fillText('Remind Me', 290, 1940); g.fillText('Message', w - 290, 1940);
      g.fillStyle = '#ff3b30'; g.beginPath(); g.arc(290, 2180, 118, 0, 7); g.fill();
      g.fillStyle = '#34c759'; g.beginPath(); g.arc(w - 290, 2180, 118, 0, 7); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 26; g.lineCap = 'round';
      g.beginPath(); g.arc(290, 2205, 52, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
      g.beginPath(); g.arc(w - 290, 2160, 52, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
      g.fillStyle = '#fff'; shRR(g, w / 2 - 210, 2480, 420, 14, 7); g.fill();
    }
  });
}

function shBuildPhone(root) {
  const P = SH_PHONE, g = new THREE.Group();
  // body (frame) below the glass, the metal rim, the glass
  const frameM = shStd('#62656b', 0.32, 0.9), blackM = shStd('#050506', 0.3), backM = shStd('#3a3d44', 0.38, 0.1);
  const body = new THREE.Mesh(shRoundBox(P.w, 0.0071, P.l, 0.0095, 0.0011, 3), frameM);
  body.castShadow = body.receiveShadow = true; g.add(body);
  const backing = new THREE.Mesh(shRoundBox(P.w - 0.0009, 0.0002, P.l - 0.0009, 0.009, 0, 3), blackM);
  backing.position.y = 0.0068; g.add(backing);   // (its top stays 0.3 mm under the pixels)
  {
    // the rim: a rounded-rectangle ring from the body up to the glass
    const ring = (w, l, r) => { const s = new THREE.Shape(), x = w / 2 - r, z = l / 2 - r;
      s.moveTo(-x, -l / 2); s.lineTo(x, -l / 2); s.absarc(x, -z, r, -Math.PI / 2, 0, false); s.lineTo(w / 2, z);
      s.absarc(x, z, r, 0, Math.PI / 2, false); s.lineTo(-x, l / 2); s.absarc(-x, z, r, Math.PI / 2, Math.PI, false); s.lineTo(-w / 2, -z); s.absarc(-x, -z, r, Math.PI, Math.PI * 1.5, false); return s; };
    const o = ring(P.w, P.l, 0.0095), inner = ring(P.w - 0.0008, P.l - 0.0008, 0.0091);
    o.holes.push(new THREE.Path(inner.getPoints(24).reverse()));
    const rg = new THREE.ExtrudeGeometry(o, { depth: 0.0008, bevelEnabled: true, bevelThickness: 0.0002, bevelSize: 0.0002, bevelSegments: 2, curveSegments: 24 });
    rg.rotateX(-Math.PI / 2); rg.translate(0, 0.0069, 0);
    const rim = new THREE.Mesh(rg, frameM); rim.castShadow = true; g.add(rim);
  }
  // side buttons, the port and speaker holes, antenna bands
  const bat = new Batcher();
  for (const [z, len, side] of [[-0.046, 0.006, -1], [-0.031, 0.009, -1], [-0.019, 0.009, -1], [-0.026, 0.016, 1]]) bat.box(0.0008, 0.0026, len, side * (P.w / 2 + 0.0002), 0.0037, z, frameM);
  bat.box(0.009, 0.0026, 0.0012, 0, 0.0036, P.l / 2 - 0.0002, blackM);
  for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) bat.add(new THREE.CylinderGeometry(0.00035, 0.00035, 0.002, 8), blackM, Geo.matrix(sx * (0.0085 + i * 0.0014), 0.0036, P.l / 2 - 0.0004, Math.PI / 2, 0, 0));
  for (const z of [-0.06, 0.062]) for (const sx of [-1, 1]) bat.box(0.0009, 0.0071, 0.0009, sx * (P.w / 2 - 0.0001), 0.0036, z, shStd('#3a3c40', 0.6));
  // the back: camera bump (seen while it falls)
  bat.add(shRoundBox(0.03, 0.0016, 0.03, 0.006, 0.0004, 2), backM, Geo.matrix(-0.0175, -0.0016, -0.0565));
  for (const [x, z] of [[-0.0255, -0.0645], [-0.0255, -0.0485], [-0.0095, -0.0565]]) bat.add(new THREE.CylinderGeometry(0.0048, 0.0048, 0.0018, 24), blackM, Geo.matrix(x, -0.0024, z));
  bat.build(g, 'phone');

  // ---- the screen: subpixels
  const tex = { off: null, lock: shTex(shPhoneCanvas('lock'), { repeat: false, aniso: 16 }), call: shTex(shPhoneCanvas('call'), { repeat: false, aniso: 16 }) };
  for (const k of ['lock', 'call']) { tex[k].minFilter = THREE.LinearMipmapLinearFilter; tex[k].generateMipmaps = true; }
  const scrMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex.lock }, res: { value: new THREE.Vector2(P.px, P.py) }, bright: { value: 0 }, gain: { value: 1.35 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`
      uniform sampler2D map; uniform vec2 res; uniform float bright, gain; varying vec2 vUv;
      vec3 lin(vec3 c){ return pow(c, vec3(2.2)); }
      // a soft-edged bar [a, b] of width w (anti-aliased by the pixel footprint f)
      float bar(float x, float a, float b, float f){ return smoothstep(a - f, a + f, x) * (1.0 - smoothstep(b - f, b + f, x)); }
      void main(){
        vec2 p = vUv * res;
        vec2 fw = max(fwidth(p), vec2(1e-5));
        float far = smoothstep(0.35, 0.9, max(fw.x, fw.y));          // 1 = a pixel smaller than a dot on your screen
        vec3 avg = lin(texture(map, vUv).rgb);
        vec2 cell = floor(p) + 0.5;
        vec3 c = lin(textureLod(map, vec2(cell.x, cell.y) / res, 0.0).rgb);
        vec2 f = fract(p);
        float fx = min(fw.x * 0.75, 0.2), fy = min(fw.y * 0.75, 0.2);
        float vy = bar(f.y, 0.07, 0.93, fy);
        vec3 m = vec3(bar(f.x, 0.05, 0.29, fx), bar(f.x, 0.38, 0.62, fx), bar(f.x, 0.71, 0.95, fx)) * vy;
        // each subpixel lights only its own colour; brighter than the average so the three together add up to the pixel
        vec3 sub = c * m * 4.6;
        // a faint glow inside each bar (the light spreads a little in the glass)
        sub += c * vy * 0.12;
        vec3 col = mix(sub, avg, far) * bright * gain;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const scrG = new THREE.PlaneGeometry(P.scrW, P.scrL); scrG.rotateX(-Math.PI / 2);
  const screen = new THREE.Mesh(scrG, scrMat); screen.position.y = P.t - 0.0005; g.add(screen);
  // the cover glass: only its reflections (added on top, no depth write); fingerprints make it rougher in places
  const smudge = shTex(shCanvas(512, 1024, (c, w, h) => {
    c.fillStyle = '#1a1a1a'; c.fillRect(0, 0, w, h);
    const r = new RNG(31);
    for (let k = 0; k < 7; k++) {
      const cx = r.range(0.15, 0.85) * w, cy = r.range(0.15, 0.9) * h, rr = r.range(30, 55);
      c.strokeStyle = 'rgba(160,160,160,0.5)'; c.lineWidth = 2.2;
      for (let i = 0; i < 14; i++) { c.beginPath(); c.ellipse(cx, cy, rr * (i / 14) + 2, rr * 1.35 * (i / 14) + 2, r.range(-0.3, 0.3), 0, 6.283); c.stroke(); }
    }
  }), { repeat: false, srgb: false });
  // (its own little shader: a fresnel reflection of the room — dim walls, the blue window, the lamp — and the smudges;
  // no scene lights, so the phone's own glow never makes a hot spot on it)
  const glassM = new THREE.ShaderMaterial({
    uniforms: { smudge: { value: smudge }, lampDir: { value: new THREE.Vector3(0, 1, 0) }, winDir: { value: new THREE.Vector3(0, 0.5, -1) } },
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    vertexShader: 'varying vec3 vWP; varying vec3 vN; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: /* glsl */`
      uniform sampler2D smudge; uniform vec3 lampDir, winDir; varying vec3 vWP; varying vec3 vN; varying vec2 vUv;
      void main(){
        vec3 V = normalize(vWP - cameraPosition), N = normalize(vN), R = reflect(V, N);
        float f = 0.04 + 0.96 * pow(1.0 - clamp(dot(-V, N), 0.0, 1.0), 5.0);
        float sm = texture2D(smudge, vUv).r;
        vec3 env = vec3(0.02, 0.018, 0.026) + vec3(0.05, 0.04, 0.035) * max(R.y, 0.0);
        env += vec3(0.22, 0.32, 0.65) * smoothstep(0.88, 0.96, dot(R, winDir));
        env += vec3(2.4, 1.5, 0.8) * smoothstep(0.9935 - sm * 0.012, 0.9985, dot(R, lampDir));
        gl_FragColor = vec4(env * f * (1.0 + sm * 0.5) + vec3(0.006, 0.0055, 0.005) * sm, 1.0);
      }`,
  });
  const glassG = shRoundBox(P.w - 0.0009, 0.00001, P.l - 0.0009, 0.009, 0, 3);
  shPlanarUV(glassG, (x, y, z) => [x / P.w + 0.5, 0.5 - z / P.l]);
  const glass = new THREE.Mesh(glassG, glassM); glass.position.y = P.t; glass.renderOrder = 2; g.add(glass);
  // the screen's light on its surroundings
  const light = new THREE.PointLight('#c7a6ff', 0, 0, 2); light.position.set(0, 0.03, 0); g.add(light);
  root.add(g);
  const api = {
    g, screen, glass, light, tex, cur: 'lock',
    setScreen(name, bright) {
      if (name !== api.cur && tex[name]) { scrMat.uniforms.map.value = tex[name]; api.cur = name; }
      scrMat.uniforms.bright.value = bright;
      light.color.set(name === 'call' ? '#7fe3a8' : '#c9a2ff');
    },
  };
  return api;
}
