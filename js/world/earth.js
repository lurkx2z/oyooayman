/* =====================================================================
   EARTH — the closing scale shot. A stylised low-poly-flavoured planet
   built entirely in code: simplified continent outlines (lon/lat polygons),
   oceans with a sun glint, a drifting cloud layer, a thin blue atmosphere
   (N₂ still scatters blue light, so the sky stays blue) and night-side city
   lights that go out in waves as backup power runs down.
   ===================================================================== */

const EARTH_LAND = [
  // North America
  [[-168, 66], [-162, 70], [-150, 71], [-140, 70], [-128, 70], [-115, 68], [-100, 68], [-95, 72], [-85, 70], [-80, 63], [-90, 57], [-82, 52], [-78, 58], [-70, 60], [-65, 60], [-61, 56], [-56, 52], [-60, 47], [-66, 44], [-70, 42], [-74, 40], [-76, 35], [-81, 31], [-80, 26], [-82, 27], [-84, 30], [-90, 29], [-97, 27], [-97, 22], [-94, 18], [-90, 21], [-87, 21], [-88, 16], [-84, 15], [-83, 10], [-79, 9], [-80, 7], [-86, 12], [-92, 14], [-98, 16], [-106, 23], [-110, 24], [-112, 29], [-115, 31], [-117, 32], [-121, 35], [-124, 40], [-124, 46], [-123, 49], [-130, 54], [-135, 58], [-142, 60], [-150, 59], [-155, 57], [-162, 55], [-158, 58], [-165, 60], [-166, 64]],
  // Baja California
  [[-117, 32], [-115, 30], [-110, 23], [-112, 25], [-114, 28]],
  // Canadian Arctic
  [[-120, 71], [-100, 73], [-95, 78], [-80, 80], [-70, 82], [-90, 82], [-110, 78], [-125, 76]],
  [[-80, 73], [-68, 70], [-62, 66], [-74, 62], [-80, 64]],
  // Greenland, Iceland
  [[-73, 78], [-60, 82], [-40, 83], [-22, 82], [-18, 76], [-20, 70], [-32, 68], [-42, 60], [-50, 62], [-54, 67], [-58, 74], [-68, 76]],
  [[-24, 64], [-14, 64], [-14, 66], [-22, 66.5]],
  // Cuba
  [[-85, 22], [-74, 20], [-77, 19.5], [-84, 21]],
  // South America
  [[-80, 9], [-75, 11], [-72, 12], [-63, 11], [-60, 8], [-52, 5], [-50, 0], [-44, -2], [-35, -5], [-35, -9], [-39, -14], [-39, -19], [-41, -22], [-48, -26], [-49, -29], [-53, -34], [-58, -35], [-57, -38], [-62, -39], [-65, -42], [-66, -47], [-69, -51], [-68, -55], [-72, -54], [-75, -50], [-74, -43], [-73, -37], [-71, -30], [-70, -18], [-76, -14], [-81, -6], [-80, -1], [-78, 2]],
  // Eurasia
  [[-10, 36], [-9, 43], [-1, 44], [-4, 48], [2, 51], [5, 53], [8, 55], [8, 57], [11, 58], [6, 59], [5, 62], [12, 66], [16, 69], [22, 70], [28, 71], [33, 69], [41, 67], [44, 68], [54, 69], [60, 70], [69, 73], [80, 73], [87, 75], [100, 77], [112, 74], [128, 72], [140, 72], [150, 71], [160, 70], [170, 70], [180, 68], [180, 65], [175, 62], [163, 60], [162, 56], [156, 51], [156, 57], [150, 59], [143, 59], [137, 54], [141, 52], [140, 48], [135, 43], [131, 43], [129, 40], [129, 35], [127, 35], [126, 38], [122, 40], [118, 39], [122, 37], [120, 32], [122, 30], [120, 26], [116, 23], [110, 21], [108, 18], [106, 11], [104, 9], [100, 13], [100, 7], [103, 3], [101, 3], [98, 8], [98, 16], [94, 17], [92, 22], [87, 22], [80, 15], [78, 8], [76, 10], [73, 18], [72, 22], [67, 25], [61, 25], [57, 25], [56, 27], [51, 30], [48, 30], [50, 26], [55, 24], [56, 22], [59, 22], [55, 17], [52, 16], [45, 13], [43, 15], [39, 21], [35, 28], [34, 31], [36, 36], [30, 36], [27, 37], [26, 40], [29, 41], [29, 45], [31, 46], [34, 45], [39, 47], [42, 42], [36, 41], [26, 41], [24, 38], [22, 37], [20, 40], [16, 40], [16, 38], [12, 38], [15, 41], [12, 44], [14, 45], [10, 44], [7, 44], [3, 43], [3, 42], [-1, 37], [-5, 36]],
  // Scandinavia (filled out)
  [[5, 58], [8, 58], [11, 59], [12, 56], [14, 56], [18, 60], [17, 62], [22, 65], [25, 66], [24, 69], [16, 69], [12, 66], [5, 62]],
  // Britain, Ireland
  [[-5, 50], [1, 51], [2, 53], [-1, 55], [-3, 59], [-6, 58], [-5, 55], [-3, 54], [-5, 52]],
  [[-10, 52], [-6, 52], [-6, 55], [-8, 55]],
  // Africa, Madagascar
  [[-6, 36], [10, 37], [11, 33], [20, 31], [25, 32], [32, 31], [34, 28], [38, 18], [43, 12], [51, 12], [51, 10], [44, 4], [41, -2], [39, -6], [40, -11], [40, -16], [35, -24], [32, -29], [27, -34], [20, -35], [18, -32], [15, -27], [12, -17], [13, -11], [9, -1], [9, 4], [5, 6], [-1, 5], [-8, 4], [-13, 8], [-17, 13], [-17, 21], [-13, 27], [-10, 30], [-9, 33]],
  [[44, -25], [47, -25], [50, -15], [49, -12], [44, -16]],
  // Japan, Taiwan, Philippines, Sri Lanka
  [[130, 31], [132, 34], [136, 36], [140, 41], [142, 44], [145, 44], [141, 39], [140, 35], [135, 33]],
  [[120, 22], [122, 25], [121.5, 22]],
  [[120, 18], [122, 18], [126, 7], [122, 7]],
  [[80, 6], [82, 7.5], [80, 9.5]],
  // Indonesia, New Guinea
  [[95, 5], [98, 4], [106, -6], [102, -5]], [[109, 2], [117, 7], [119, 1], [116, -4], [110, -3]], [[105, -6], [115, -8], [106, -7.5]],
  [[131, -1], [141, -3], [150, -10], [143, -9], [138, -8]],
  // Australia, New Zealand
  [[114, -22], [114, -34], [118, -35], [124, -34], [131, -31], [138, -35], [140, -38], [146, -39], [150, -37], [153, -32], [153, -25], [146, -19], [145, -15], [142, -11], [141, -17], [136, -12], [131, -11], [126, -14], [122, -18]],
  [[172, -34], [178, -38], [175, -42], [171, -46], [167, -46], [172, -41]],
  // Antarctica
  [[-180, -66], [-120, -72], [-60, -64], [0, -70], [60, -67], [120, -66], [180, -66], [180, -90], [-180, -90]],
];
// deserts / dry areas painted over the land (lon, lat, radius°)
const EARTH_DRY = [[5, 23, 14], [20, 22, 13], [30, 24, 9], [45, 22, 10], [55, 30, 7], [62, 32, 6], [133, -25, 13], [-112, 32, 6], [-70, -24, 5], [105, 42, 10], [20, -24, 6]];
// big night-time metro areas [lon, lat, weight]
const EARTH_CITIES = [
  [-0.1, 51.5, 1.4], [2.35, 48.85, 1.3], [-3.7, 40.4, 1], [2.17, 41.4, 0.8], [-9.1, 38.7, 0.6], [12.5, 41.9, 0.9], [9.2, 45.5, 1], [13.4, 52.5, 1], [10, 53.55, 0.7], [11.6, 48.1, 0.7], [8.7, 50.1, 0.8], [4.9, 52.4, 1], [4.35, 50.85, 0.8],
  [16.4, 48.2, 0.7], [21, 52.2, 0.8], [14.4, 50.1, 0.6], [19, 47.5, 0.7], [26.1, 44.4, 0.7], [23.7, 38, 0.7], [29, 41, 1.3], [30.5, 50.45, 0.9], [37.6, 55.75, 1.4], [30.3, 59.9, 0.8], [18.1, 59.3, 0.5], [10.75, 59.9, 0.4], [12.6, 55.7, 0.5],
  [-6.26, 53.35, 0.5], [-2.2, 53.5, 0.8], [14.25, 40.85, 0.6], [5.4, 43.3, 0.5], [4.8, 45.75, 0.5], [-6, 37.4, 0.4], [8.5, 47.4, 0.5], [20.5, 44.8, 0.5], [23.3, 42.7, 0.5], [27.6, 53.9, 0.5],
  [31.2, 30.05, 1.5], [29.9, 31.2, 0.7], [3.4, 6.5, 1.3], [7.5, 9.05, 0.5], [8.5, 12, 0.6], [-0.2, 5.6, 0.6], [-4, 5.35, 0.6], [-17.45, 14.7, 0.4], [-7.6, 33.6, 0.7], [3.05, 36.75, 0.6], [10.2, 36.8, 0.5], [32.5, 15.6, 0.6], [38.75, 9.0, 0.6],
  [36.8, -1.3, 0.6], [15.3, -4.3, 0.7], [13.2, -8.8, 0.5], [28, -26.2, 1], [18.4, -33.9, 0.6], [31, -29.85, 0.5], [39.3, -6.8, 0.5],
  [46.7, 24.7, 1], [39.2, 21.5, 0.7], [55.3, 25.2, 1], [51.5, 25.3, 0.6], [48, 29.4, 0.6], [44.4, 33.3, 0.8], [51.4, 35.7, 1.2], [34.8, 32.1, 0.8], [35.9, 31.95, 0.5], [35.5, 33.9, 0.5], [32.85, 39.9, 0.7], [27.1, 38.4, 0.5],
  [67, 24.9, 1.2], [74.3, 31.5, 1], [77.2, 28.6, 1.5], [72.9, 19.1, 1.4], [88.4, 22.6, 1.2], [80.3, 13.1, 0.9], [77.6, 12.97, 0.9], [78.5, 17.4, 0.8], [90.4, 23.8, 1.1], [85.3, 27.7, 0.4], [79.85, 6.9, 0.4],
  [116.4, 39.9, 1.4], [121.5, 31.2, 1.5], [113.3, 23.1, 1.3], [114.1, 22.5, 1], [106.5, 29.6, 1], [104.1, 30.7, 0.9], [114.3, 30.6, 0.9], [108.9, 34.3, 0.8], [117.2, 39.1, 0.9], [123.4, 41.8, 0.7], [126.6, 45.75, 0.6],
  [127, 37.55, 1.3], [129, 35.1, 0.7], [139.7, 35.7, 1.6], [135.5, 34.7, 1.2], [136.9, 35.2, 0.8], [141.35, 43.06, 0.5], [130.4, 33.6, 0.6], [121.5, 25.03, 0.9], [121, 14.6, 1.1], [100.5, 13.75, 1.1], [105.85, 21.03, 0.8],
  [106.7, 10.8, 0.9], [101.7, 3.14, 0.8], [103.8, 1.35, 0.8], [106.85, -6.2, 1.2], [112.75, -7.25, 0.7], [96.2, 16.8, 0.6], [76.9, 43.25, 0.5], [69.25, 41.3, 0.6], [82.9, 55.0, 0.5], [60.6, 56.85, 0.5],
  [-74, 40.7, 1.6], [-71.06, 42.36, 0.9], [-75.17, 39.95, 0.9], [-77, 38.9, 0.9], [-84.4, 33.75, 0.9], [-80.2, 25.76, 1], [-81.4, 28.5, 0.6], [-87.6, 41.9, 1.3], [-83, 42.3, 0.7], [-79.4, 43.65, 1], [-73.6, 45.5, 0.7],
  [-95.4, 29.76, 1], [-96.8, 32.8, 1], [-98.5, 29.4, 0.6], [-105, 39.74, 0.7], [-112.07, 33.45, 0.8], [-118.24, 34.05, 1.5], [-117.16, 32.7, 0.7], [-122.4, 37.77, 1], [-122.33, 47.6, 0.8], [-123.1, 49.28, 0.6],
  [-93.27, 44.98, 0.6], [-90.2, 38.63, 0.6], [-94.58, 39.1, 0.5], [-90.07, 29.95, 0.5], [-99.13, 19.43, 1.5], [-103.35, 20.67, 0.7], [-100.3, 25.67, 0.7], [-82.37, 23.13, 0.5], [-74.07, 4.71, 1], [-66.9, 10.5, 0.7],
  [-77.04, -12.05, 1], [-78.5, -0.22, 0.5], [-70.65, -33.45, 1], [-58.4, -34.6, 1.3], [-56.2, -34.9, 0.5], [-46.63, -23.55, 1.6], [-43.2, -22.9, 1.2], [-47.9, -15.8, 0.6], [-43.94, -19.92, 0.8], [-38.5, -12.97, 0.6],
  [-34.9, -8.05, 0.6], [-38.5, -3.73, 0.6], [-51.2, -30.03, 0.6], [-49.27, -25.43, 0.5], [-60, -3.1, 0.4],
  [151.2, -33.87, 1], [144.96, -37.81, 0.9], [153, -27.47, 0.6], [115.86, -31.95, 0.5], [138.6, -34.93, 0.4], [174.76, -36.85, 0.4],
];

class EarthScene {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#020306');
    this.camera = new THREE.PerspectiveCamera(36, 9 / 16, 0.01, 200);
    const W = 2048, H = 1024;
    const xy = (lon, lat) => [((lon + 180) / 360) * W, ((90 - lat) / 180) * H];
    const rng = new RNG(4242);

    // ---- day colour (RGB) + land mask (A)
    const day = Tex.canvas(W, H), d = day.getContext('2d');
    const og = d.createLinearGradient(0, 0, 0, H);
    og.addColorStop(0, '#1d3550'); og.addColorStop(0.5, '#1f4766'); og.addColorStop(1, '#1d3550');
    d.fillStyle = og; d.fillRect(0, 0, W, H);
    const landPath = (ctx) => { ctx.beginPath(); for (const poly of EARTH_LAND) { poly.forEach(([lo, la], i) => { const [x, y] = xy(lo, la); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); } };
    // shallow shelf around coasts
    landPath(d); d.strokeStyle = 'rgba(60,104,124,0.35)'; d.lineWidth = 8; d.lineJoin = 'round'; d.stroke();
    landPath(d); d.fillStyle = '#4a5e3a'; d.fill();
    d.save(); landPath(d); d.clip();
    Tex.blotches(d, W, H, 260, 12, 70, (r) => `rgba(${r.next() < 0.5 ? '40,62,34' : '96,104,70'},${r.range(0.15, 0.4)})`, rng);
    for (const [lo, la, r] of EARTH_DRY) { const [x, y] = xy(lo, la), rr = (r / 360) * W; const gr = d.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(176,150,104,0.95)'); gr.addColorStop(1, 'rgba(176,150,104,0)'); d.fillStyle = gr; d.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    // ice caps
    d.fillStyle = 'rgba(232,236,240,0.95)'; d.fillRect(0, xy(0, -66)[1], W, H);
    const [gx, gy] = xy(-42, 72); const gg = d.createRadialGradient(gx, gy, 0, gx, gy, 90); gg.addColorStop(0, 'rgba(236,240,244,0.95)'); gg.addColorStop(1, 'rgba(236,240,244,0)'); d.fillStyle = gg; d.fillRect(gx - 90, gy - 90, 180, 180);
    d.restore();
    d.fillStyle = 'rgba(230,236,240,0.9)'; d.fillRect(0, 0, W, xy(0, 82)[1]);
    // land mask in alpha (for the ocean glint)
    const mask = Tex.canvas(W, H), mx = mask.getContext('2d');
    mx.fillStyle = '#000'; mx.fillRect(0, 0, W, H); landPath(mx); mx.fillStyle = '#fff'; mx.fill();
    // ---- night lights
    const night = Tex.canvas(W, H), n = night.getContext('2d');
    n.fillStyle = '#000'; n.fillRect(0, 0, W, H);
    n.globalCompositeOperation = 'lighter';
    for (const [lo, la, w] of EARTH_CITIES) {
      const [x, y] = xy(lo, la);
      const R = 4 + 7 * w;
      const gr = n.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, `rgba(255,214,150,${0.55 + 0.3 * Math.min(1, w)})`); gr.addColorStop(1, 'rgba(255,190,120,0)');
      n.fillStyle = gr; n.fillRect(x - R, y - R, R * 2, R * 2);
      for (let k = 0; k < 14 * w; k++) {
        const a = rng.next() * 6.283, dd = rng.range(2, 26) * Math.sqrt(w);
        n.fillStyle = `rgba(255,200,130,${rng.range(0.25, 0.6)})`; n.fillRect(x + Math.cos(a) * dd, y + Math.sin(a) * dd * 0.8, 1.6, 1.6);
      }
    }
    n.globalCompositeOperation = 'destination-in'; landPath(n); n.fillStyle = '#fff'; n.fill();   // lights only on land
    // ---- clouds
    const cl = Tex.canvas(1024, 512), c = cl.getContext('2d');
    c.fillStyle = '#000'; c.fillRect(0, 0, 1024, 512);
    // clouds follow the wind belts: long, flat streaks of soft puffs (trade winds, storm tracks, ITCZ)
    const cr = new RNG(99);
    for (let k = 0; k < 520; k++) {
      const band = cr.pick([[-45, 10], [-30, 8], [-8, 5], [5, 4], [30, 8], [48, 10], [60, 6]]);
      const lat = band[0] + (cr.next() - 0.5) * 2 * band[1], lon = cr.range(-180, 180);
      const x = ((lon + 180) / 360) * 1024, y = ((90 - lat) / 180) * 512, rx = cr.range(10, 42), ry = rx * cr.range(0.18, 0.4);
      c.save(); c.translate(x, y); c.rotate(cr.range(-0.25, 0.25)); c.scale(1, ry / rx);
      const g2 = c.createRadialGradient(0, 0, 0, 0, 0, rx); g2.addColorStop(0, `rgba(255,255,255,${cr.range(0.25, 0.55)})`); g2.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g2; c.fillRect(-rx, -rx, rx * 2, rx * 2); c.restore();
    }

    const texOpt = { repeat: false };
    const dayT = Tex.tex(day, texOpt), maskT = Tex.tex(mask, { srgb: false, repeat: false }), nightT = Tex.tex(night, texOpt), cloudT = Tex.tex(cl, { srgb: false, repeat: true });

    // sun: subsolar point ~lon -82°, lat -5° (early October); the terminator crosses Europe and Africa
    this.sunDir = EarthScene.dirFromLonLat(-82, -5);
    this.uniforms = {
      uDay: { value: dayT }, uMask: { value: maskT }, uNight: { value: nightT }, uSun: { value: this.sunDir.clone() },
      uLights: { value: 1 }, uTime: { value: 0 },
    };
    const earthMat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /* glsl */`
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        uniform sampler2D uDay, uMask, uNight; uniform vec3 uSun; uniform float uLights, uTime;
        varying vec2 vUv; varying vec3 vN; varying vec3 vW;
        float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
        void main(){
          vec3 n = normalize(vN), v = normalize(cameraPosition - vW);
          float ndl = dot(n, uSun);
          vec3 albedo = texture2D(uDay, vUv).rgb;
          float land = texture2D(uMask, vUv).r;
          vec3 col = albedo * (0.025 + 1.15 * max(ndl, 0.0));
          // sun glint on the oceans
          vec3 hv = normalize(uSun + v);
          col += vec3(1.0, 0.95, 0.85) * pow(max(dot(n, hv), 0.0), 220.0) * 0.55 * (1.0 - land) * step(0.0, ndl);
          // atmosphere haze toward the limb on the day side
          float rim = pow(1.0 - max(dot(n, v), 0.0), 2.5);
          col = mix(col, vec3(0.45, 0.66, 0.95) * max(ndl + 0.15, 0.0), rim * 0.65);
          // night-side lights; patches go dark in waves as backup power runs out
          float night = smoothstep(0.06, -0.18, ndl);
          float patchv = h(floor(vUv * vec2(90.0, 45.0)));
          float on = step(1.0 - uLights, patchv);
          col += texture2D(uNight, vUv).rgb * night * on * 1.6;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    this.earth = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), earthMat);
    this.scene.add(this.earth);
    // clouds
    const cloudMat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: cloudT }, uSun: this.uniforms.uSun, uOff: { value: 0 } },
      transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; varying vec3 vN; void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D uMap; uniform vec3 uSun; uniform float uOff; varying vec2 vUv; varying vec3 vN;
        void main(){ float a = texture2D(uMap, vUv + vec2(uOff, 0.0)).r; float l = max(dot(normalize(vN), uSun), 0.0);
          gl_FragColor = vec4(vec3(0.03 + 1.05 * l), a * 0.85); }`,
    });
    this.clouds = new THREE.Mesh(new THREE.SphereGeometry(1.012, 96, 48), cloudMat);
    this.scene.add(this.clouds);
    // atmosphere glow (back side, additive)
    const atmo = new THREE.ShaderMaterial({
      uniforms: { uSun: this.uniforms.uSun },
      side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `uniform vec3 uSun; varying vec3 vN; varying vec3 vW;
        void main(){ vec3 v = normalize(cameraPosition - vW); float f = pow(max(0.0, 1.0 - abs(dot(normalize(vN), v)) * 1.05), 3.0);
          float lit = smoothstep(-0.35, 0.4, dot(normalize(vN), uSun));
          gl_FragColor = vec4(vec3(0.32, 0.55, 1.0) * f * (0.15 + 1.2 * lit), 1.0); }`,
    });
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.07, 96, 48), atmo));
    // stars
    const sp = [], sr = new RNG(7);
    for (let i = 0; i < 1600; i++) {
      const u = sr.next() * 2 - 1, a = sr.next() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      sp.push(Math.cos(a) * r * 80, u * 80, Math.sin(a) * r * 80);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    this.scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: '#cfd6e6', size: 0.6, sizeAttenuation: false })));
    // view: centred over the Atlantic so the Americas are in daylight and Europe/Africa/Middle East reach into night
    this.viewDir = EarthScene.dirFromLonLat(-12, 22);
  }

  // unit vector on the sphere for a longitude/latitude (matches THREE.SphereGeometry's UV layout)
  static dirFromLonLat(lon, lat) {
    const phi = ((lon + 180) * Math.PI) / 180, th = ((90 - lat) * Math.PI) / 180;
    return new THREE.Vector3(-Math.cos(phi) * Math.sin(th), Math.cos(th), Math.sin(phi) * Math.sin(th)).normalize();
  }

  update(t) {
    const T = t - SCRIPT.earth.from;
    // the planet turns a little; the camera eases back and drifts
    const spin = T * 0.004;
    this.earth.rotation.y = spin; this.clouds.rotation.y = spin * 1.15;
    this.clouds.material.uniforms.uOff.value = T * 0.0006;
    this.uniforms.uLights.value = SCRIPT_TRACKS.earthLights.value(t);
    const dist = 6.1 + 1.0 * Ease.outCubic(MathX.clamp(T / 22, 0, 1));   // the whole planet fits the 9:16 frame
    const side = new THREE.Vector3(0, 1, 0).cross(this.viewDir).normalize();
    const pos = this.viewDir.clone().multiplyScalar(dist).addScaledVector(side, -0.3 + T * 0.02).add(new THREE.Vector3(0, 0.2, 0));
    this.camera.position.copy(pos);
    this.camera.lookAt(0, 0.05, 0);
    this.camera.updateMatrixWorld(true);
  }
}
