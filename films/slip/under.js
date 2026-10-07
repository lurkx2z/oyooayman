/* =====================================================================
   UNDERGROUND — two documentary cut-aways, each its own scene and camera.

   SlUnder (metres): the ground under the place where you fell, cut open
   along a plane: paving, sand bedding, crushed stone, fill with pipes,
   clay, a gravel aquifer, weathered rock, granite. The street and you sit on
   top. A pale ring spreads from the impact point and fades with distance;
   30 m down it reaches a pebble wedged in a crack, beside a millimetre
   scale. The pebble shivers, moves 1.4 mm, then slips into the crack.

   SlFault (kilometres): the crust under the coast: soft sediments, upper
   crust, lower crust, a fault dipping under the city with its locked patch
   glowing with stress. The fault slips at its tip (where the pebble was),
   the rupture runs down and along it, the blocks lurch, seismic rings run up
   to the city and the coast.
   ===================================================================== */

const SL_GLSL_NOISE = /* glsl */`
  float uh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec2 uh2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
  float un(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(uh(i), uh(i + vec2(1, 0)), f.x), mix(uh(i + vec2(0, 1)), uh(i + vec2(1, 1)), f.x), f.y); }
  float ufbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a * un(p); p = p * 2.03 + 7.1; a *= 0.5; } return v; }
  // cells: x = distance to the nearest centre, y = to the second, z = the cell's id
  vec3 ucell(vec2 p){ vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0, id = 0.0;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)), o = uh2(i + g); float d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; id = uh(i + g); } else if (d < d2) d2 = d; }
    return vec3(d1, d2, id); }`;

// a camera that orbits a target: keys [t, tx, ty, tz, dist, yaw°, pitch°, fov] (dist interpolates in log)
class SlOrbit {
  constructor(keys, ease = 'inOutSine') {
    const col = (i) => new Track(keys.map((k) => [k[0], k[i], k[8] || ease]));
    this.tx = col(1); this.ty = col(2); this.tz = col(3); this.ld = new Track(keys.map((k) => [k[0], Math.log(k[4]), k[8] || ease]));
    this.yaw = col(5); this.pitch = col(6); this.fov = col(7);
    this._t = new THREE.Vector3();
  }
  apply(cam, t) {
    const T = this._t.set(this.tx.value(t), this.ty.value(t), this.tz.value(t)), d = Math.exp(this.ld.value(t));
    const y = MathX.deg(this.yaw.value(t)), p = MathX.deg(this.pitch.value(t));
    cam.position.set(T.x + Math.sin(y) * Math.cos(p) * d, T.y - Math.sin(p) * d, T.z + Math.cos(y) * Math.cos(p) * d);
    cam.lookAt(T);
    const f = this.fov.value(t); if (Math.abs(cam.fov - f) > 1e-3) { cam.fov = f; cam.updateProjectionMatrix(); }
    cam.updateMatrixWorld(true);
    return d;
  }
}

// the pebble's spot (m) and the vibration ring's radius over time
const SL_PEB = new THREE.Vector2(2.0, -30.0);
const slRingR = slCurve([[6.9, 0.05], [7.4, 0.3], [8.6, 1.9], [10.0, 9.0], [11.2, 20.0], [12.75, SL_PEB.length()], [13.6, 34.5]]);

class SlUnder {
  constructor(app) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#06080b');
    this.scene.fog = null;   // (the shared uneven fog thickens toward the ground: no fog down here)
    this.camera = new THREE.PerspectiveCamera(50, 9 / 16, 0.002, 400);
    this.scene.add(new THREE.HemisphereLight('#9fb2c4', '#2a2420', 0.9));
    const key = new THREE.DirectionalLight('#e8eef2', 1.4); key.position.set(-6, 8, 12); this.scene.add(key);
    this.U = {
      uTime: { value: 0 }, uRingR: { value: 0 }, uRingA: { value: 0 }, uImpact: { value: new THREE.Vector2(0, 0) }, uPeb: { value: SL_PEB.clone() },
      uDrop: { value: 0 }, uLight: { value: new THREE.Vector3(-0.4, 0.5, 0.8).normalize() },
    };
    // the cut face: everything procedural from the world position (m)
    const face = new THREE.Mesh(new THREE.PlaneGeometry(70, 52, 1, 1), new THREE.ShaderMaterial({
      uniforms: this.U, fog: false,
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: /* glsl */`
        uniform float uTime, uRingR, uRingA, uDrop; uniform vec2 uImpact, uPeb;
        varying vec3 vW;
        ${SL_GLSL_NOISE}
        // a boundary at depth d (m, negative) that wanders with x
        float bnd(float d, float amp, float fr, float sd, float x){ return d + amp * (ufbm(vec2(x * fr, sd)) - 0.5) * 2.0; }
        void main(){
          vec2 p = vW.xy; float x = p.x, y = p.y;
          if (y > 0.0) discard;
          // the ring passing shakes the grains a little (a tiny displacement of the pattern inside the band)
          float d = length(p - uImpact), band = exp(-pow((d - uRingR) / (0.18 + uRingR * 0.035), 2.0));
          vec2 q = p + band * uRingA * 0.004 * vec2(sin(uTime * 90.0), cos(uTime * 83.0));
          float b0 = -0.12, b1 = bnd(-0.3, 0.02, 0.8, 1.0, x), b2 = bnd(-0.8, 0.06, 0.4, 2.0, x), b3 = bnd(-4.5, 0.6, 0.12, 3.0, x),
                b4 = bnd(-11.0, 0.9, 0.08, 4.0, x), b5 = bnd(-17.0, 1.2, 0.07, 5.0, x), b6 = bnd(-24.0, 1.6, 0.06, 6.0, x);
          vec3 col; float edge = 1.0;
          if (y > b0) {                         // paving slabs with joints
            col = vec3(0.6, 0.59, 0.56) * (0.9 + 0.12 * un(q * 30.0)); edge = smoothstep(0.0, 0.012, abs(fract(x / 0.6 + 0.5) - 0.5) * 0.6);
          } else if (y > b1) {                  // sand bedding
            col = vec3(0.64, 0.55, 0.4) * (0.85 + 0.25 * uh(floor(q * 400.0)));
          } else if (y > b2) {                  // crushed stone
            vec3 c = ucell(q * 38.0); col = mix(vec3(0.3, 0.29, 0.28), vec3(0.55, 0.53, 0.5) * (0.65 + 0.5 * c.z), smoothstep(0.04, 0.14, c.y - c.x));
          } else if (y > b3) {                  // fill: dark soil, a few stones, roots near the top
            col = vec3(0.3, 0.22, 0.15) * (0.75 + 0.45 * ufbm(q * 3.0)) * (0.9 + 0.2 * uh(floor(q * 260.0)));
            vec3 c = ucell(q * 5.0); col = mix(col, vec3(0.45, 0.42, 0.38) * (0.8 + 0.3 * c.z), step(c.x, 0.13) * step(0.7, c.z));
          } else if (y > b4) {                  // clay: smooth, laminated
            col = vec3(0.5, 0.44, 0.33) * (0.88 + 0.12 * sin(y * 9.0 + 3.0 * ufbm(q * 0.5))) * (0.92 + 0.12 * un(q * 6.0));
          } else if (y > b5) {                  // gravel and sand with water in it
            vec3 c = ucell(q * 3.2); col = mix(vec3(0.24, 0.25, 0.25), vec3(0.47, 0.45, 0.4) * (0.75 + 0.4 * c.z), smoothstep(0.04, 0.1, c.y - c.x));
            col *= vec3(0.9, 0.95, 1.02);
          } else if (y > b6) {                  // weathered rock: blocks with dark joints
            vec3 c = ucell(q * vec2(0.55, 0.9)); col = vec3(0.42, 0.39, 0.36) * (0.75 + 0.4 * c.z) * (0.8 + 0.3 * un(q * 9.0)); edge = 0.6 + 0.4 * smoothstep(0.0, 0.05, c.y - c.x);
          } else {                              // granite: grey with pink feldspar, white quartz and black mica, down to the millimetre
            vec3 c1 = ucell(q * 1.6), c2 = ucell(q * 160.0), c3 = ucell(q * 520.0);
            col = vec3(0.5, 0.48, 0.47) * (0.85 + 0.2 * c1.z);
            col = mix(col, vec3(0.62, 0.48, 0.44), step(0.62, c2.z) * 0.8);
            col = mix(col, vec3(0.78, 0.77, 0.75), step(c2.z, 0.2) * 0.85);
            col *= 0.86 + 0.22 * smoothstep(0.0, 0.45, c2.x) * (0.5 + c2.z);      // each crystal catches the light a little differently
            col = mix(col, vec3(0.09, 0.09, 0.1), step(0.9, ucell(q * 900.0).z) * 0.9);
            col *= 0.9 + 0.15 * un(q * 1400.0);
            edge = smoothstep(0.0, 0.03, c1.y - c1.x) * 0.5 + 0.5;
          }
          // pipes in the fill: a water main, a sewer, cable ducts (cut through)
          vec3 P[4]; P[0] = vec3(-1.7, -1.6, 0.26); P[1] = vec3(3.1, -3.0, 0.55); P[2] = vec3(1.1, -1.05, 0.07); P[3] = vec3(1.32, -1.05, 0.07);
          for (int i = 0; i < 4; i++) { float r = length(p - P[i].xy) / P[i].z; if (r < 1.0) col = r > 0.82 ? vec3(0.28, 0.3, 0.32) * (i == 1 ? 1.6 : 1.0) : vec3(0.03); }
          // layer seams a little darker, the cut face darker with depth
          float seam = 1.0; for (int i = 0; i < 1; i++) {}
          col *= edge * (0.95 - 0.25 * smoothstep(0.0, -45.0, y));
          // the crack in the granite: a hair-thin dark line through the pebble's spot, wider below
          float cx = x - uPeb.x - (y - uPeb.y) * 0.18 - 0.0016 * sin(y * 260.0) - 0.0007 * sin(y * 1100.0) - 0.002 * (ufbm(vec2(y * 80.0, 2.0)) - 0.5);
          float cw = 0.0008 + max(0.0, uPeb.y - y) * 0.003 + 0.0026 * exp(-pow((y - uPeb.y - 0.0035) / 0.004, 2.0)) + uDrop * 0.0014 * smoothstep(0.03, -0.01, y - uPeb.y);
          if (y < -24.0) col *= mix(0.04, 1.0, smoothstep(cw * 0.6, cw, abs(cx)));
          // the vibration: a pale ring (and two fainter ones behind it), plus a soft glow where it started
          col *= 0.6;
          float w = 0.03 + uRingR * 0.008, A = uRingA / (1.0 + 0.25 * uRingR);
          float e1 = abs(d - uRingR), e2 = abs(d - uRingR + 0.5 + 0.06 * uRingR), e3 = abs(d - uRingR + 1.1 + 0.12 * uRingR);
          float ring = exp(-pow(e1 / w, 2.0)) + 0.4 * exp(-pow(e2 / w, 2.0)) + 0.18 * exp(-pow(e3 / w, 2.0));
          float glow = exp(-e1 / (0.12 + 0.04 * uRingR)) * step(d, uRingR + 0.6);
          col += vec3(0.45, 0.8, 1.0) * (ring * 0.9 + glow * 0.22) * A;
          col += vec3(0.5, 0.75, 1.0) * 0.5 * uRingA * exp(-d * 4.0) * smoothstep(1.0, 0.2, uRingR);
          gl_FragColor = vec4(col, 1.0);
        }`,
    }));
    face.position.set(0, -25, 0); this.scene.add(face); this.face = face;
    // the block behind the face: top (the street), the far side darker
    const pav = new THREE.MeshStandardMaterial({ map: Tex.sidewalk(12).map, roughness: 0.35, color: '#9b9a95' });
    const top = new THREE.Mesh(new THREE.PlaneGeometry(14, 30).rotateX(-Math.PI / 2), pav); top.position.set(-1, 0, -15); this.scene.add(top);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(26, 30).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#2a2c2e', roughness: 0.3 })); road.position.set(-21, -0.15, -15); this.scene.add(road);
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 30), new THREE.MeshStandardMaterial({ color: '#7c7a74', roughness: 0.6 })); curb.position.set(-7.85, -0.07, -15); this.scene.add(curb);
    const side = new THREE.MeshStandardMaterial({ color: '#2b2622', roughness: 1 });
    const right = new THREE.Mesh(new THREE.PlaneGeometry(30, 52).rotateY(Math.PI / 2), side); right.position.set(35, -25, -15); this.scene.add(right);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(14, 14, 0.4), new THREE.MeshStandardMaterial({ color: '#5a554e', roughness: 0.9 })); wall.position.set(9.5, 7, -8); wall.rotation.y = -Math.PI / 2; this.scene.add(wall);
    // you, on the pavement right where it happened (sitting up, just behind the cut)
    if (typeof Person !== 'undefined') {
      LOOKS.slYou = LOOKS.slYou || { skin: 1, build: 'avg', shirt: '#2b3038', sleeves: 'long', pants: '#2a3446', shoes: '#25211f', sole: '#d9d3c7', hair: '#3a2a1e', jacket: true, collar: true };
      this.you = new Person({ id: 'you', look: 'slYou', path: [[0, 0.1, -0.55]], states: [[0, 'sitGround']], face: 180 }, this.scene);
      this.you.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    }
    // a lamp post (the curb side) and rain over the street for context
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 8, 8), new THREE.MeshStandardMaterial({ color: '#2c3034', roughness: 0.5, metalness: 0.5 })); post.position.set(-6.9, 4, -2.5); this.scene.add(post);
    // the pebble (≈ 9 mm), slightly flattened and lumpy, warm grey; and the scale beside it
    const pg = new THREE.IcosahedronGeometry(0.0045, 3), pa = pg.attributes.position, r = new RNG(71);
    for (let i = 0; i < pa.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pa, i); const k = 1 + 0.12 * Math.sin(v.x * 900 + 1) * Math.cos(v.y * 700) + 0.06 * Math.sin(v.z * 1700); v.multiplyScalar(k); v.y *= 0.78; pa.setXYZ(i, v.x, v.y, v.z); }
    pg.computeVertexNormals();
    this.pebble = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ color: '#8a8178', roughness: 0.75 }));
    this.scene.add(this.pebble);
    const peb2 = new THREE.PointLight('#dfe8f0', 0.0, 0.2, 2); this.scene.add(peb2); this.pebLight = peb2;
    // the scale: 0–20 mm (1 px = 0.025 mm: the 0 and 20 marks are 800 px apart)
    const rc = Tex.canvas(1024, 192), x = rc.getContext('2d');
    x.fillStyle = 'rgba(8,10,12,0.72)'; x.fillRect(0, 0, 1024, 192);
    x.strokeStyle = '#f4f6f4'; x.fillStyle = '#f4f6f4'; x.lineWidth = 4; x.font = '600 46px "Inter", sans-serif'; x.textAlign = 'center';
    for (let i = 0; i <= 20; i++) { const px = 112 + i * 40, L = i % 10 === 0 ? 74 : i % 5 === 0 ? 52 : 30; x.beginPath(); x.moveTo(px, 10); x.lineTo(px, 10 + L); x.stroke(); if (i % 10 === 0) x.fillText(String(i), px, 150); }
    x.textAlign = 'left'; x.fillText('mm', 112 + 800 + 30, 150);
    const RW = 0.02 * 1024 / 800;
    this.ruler = new THREE.Mesh(new THREE.PlaneGeometry(RW, RW * 192 / 1024), new THREE.MeshBasicMaterial({ map: Tex.tex(rc, { repeat: false }), transparent: true, depthWrite: false, toneMapped: false }));
    this.ruler.position.set(SL_PEB.x + 0.0012 - 0.02 * 112 / 800 + RW / 2 - 0.01, SL_PEB.y - 0.0125, 0.0006); this.scene.add(this.ruler);
    // where the pebble was: a faint outline left behind after it moves
    const og = new THREE.RingGeometry(0.0044, 0.00465, 40);
    this.ghost = new THREE.Mesh(og, new THREE.MeshBasicMaterial({ color: '#dff2ff', transparent: true, opacity: 0, depthWrite: false })); this.ghost.scale.set(1, 0.8, 1);
    this.ghost.position.set(SL_PEB.x + 0.0012, SL_PEB.y + 0.0042, 0.0062); this.scene.add(this.ghost);
    // grit falling after the pebble
    this.grit = new XBill(this.scene, { n: 40, kind: 'soft', color: '#8f877d', seed: 72, alpha: 0.8, fadeIn: 0.05, fadeOut: 0.6, g: 0.25,
      spawn: (i, rr) => ({ p: new THREE.Vector3(SL_PEB.x + rr.range(-0.003, 0.003), SL_PEB.y + rr.range(-0.002, 0.003), 0.003), v: new THREE.Vector3(rr.range(-0.003, 0.003), rr.range(-0.02, 0), 0), t0: SL.drop + rr.next() * 0.5, life: rr.range(0.6, 1.2), s0: 0.0005, s1: 0.0008 }) });
    this.orbit = new SlOrbit([
      [SL.under, 0.25, -0.55, 0, 3.3, 12, -15, 54],
      [8.6, 0.1, -1.5, 0, 6.0, 6, -8, 54],
      [10.0, 0.7, -10.5, 0, 27, 0, 0, 52],
      [11.25, SL_PEB.x, SL_PEB.y + 1.2, 0, 6.5, -3, 2, 48],
      [11.8, SL_PEB.x, SL_PEB.y - 0.0012, 0, 0.11, -4, 1, 40, 'outCubic'],
      [12.9, SL_PEB.x + 0.0004, SL_PEB.y - 0.0016, 0, 0.095, -3, 1, 40],
      [15.3, SL_PEB.x + 0.0008, SL_PEB.y - 0.002, 0, 0.078, -1, 0, 40],
      [16.2, SL_PEB.x + 0.0008, SL_PEB.y - 0.0025, 0, 0.075, 0, 0, 40],
      [16.9, SL_PEB.x + 0.0004, SL_PEB.y - 0.006, 0, 0.09, 1, -2, 40],
      [17.4, SL_PEB.x, SL_PEB.y - 0.01, 0, 0.6, 2, -3, 46, 'inExpo'],
    ]);
  }

  // where the pebble is: it shivers as the ring passes, moves 1.4 mm (down and a little right), then slips into the crack
  pebbleAt(t, out) {
    const sh = MathX.smooth(t, 12.55, 12.8) * (1 - MathX.smooth(t, 13.1, 13.5));
    const mv = MathX.smooth(t, SL.nudge, SL.nudge + 0.22);
    out.set(SL_PEB.x + 0.0012 + 0.0004 * mv + sh * 0.00025 * Math.sin(t * 140), SL_PEB.y + 0.0042 - 0.0013 * mv + sh * 0.0002 * Math.cos(t * 120), 0.0025);
    const u = Math.max(0, t - SL.drop);
    if (u > 0) { const f = Math.min(u, 0.25) * 0.004 + Math.max(0, u - 0.25) * Math.max(0, u - 0.25) * 0.09; out.y -= f; out.x -= f * 0.18; out.z -= Math.min(0.006, f * 0.6); }
    return out;
  }

  update(t) {
    this.U.uTime.value = t;
    this.U.uRingR.value = slRingR(t);
    this.U.uRingA.value = 1.6 * MathX.smooth(t, 6.9, 7.6) * (1 - 0.65 * MathX.smooth(t, 9, 12.8));
    this.U.uDrop.value = MathX.smooth(t, SL.drop, SL.drop + 0.4);
    const p = this.pebbleAt(t, this.pebble.position);
    this.pebble.rotation.set(0.3 + MathX.smooth(t, SL.nudge, SL.nudge + 0.22) * 0.25 + Math.max(0, t - SL.drop) * 5, 0.6, Math.max(0, t - SL.drop) * 3);
    this.pebble.visible = t < SL.drop + 1.2;
    this.pebLight.position.set(p.x - 0.01, p.y + 0.015, 0.03); this.pebLight.intensity = 0.04 * MathX.smooth(t, 11.6, 12.0);
    this.ruler.material.opacity = 0.95 * MathX.smooth(t, 12.0, 12.4) * (1 - MathX.smooth(t, 16.8, 17.2));
    this.ghost.material.opacity = 0.55 * MathX.smooth(t, SL.nudge + 0.15, SL.nudge + 0.4) * (1 - MathX.smooth(t, 15.6, 16.1));
    this.grit.update(t);
    if (this.you) this.you.update(4);
    this.orbit.apply(this.camera, t);
  }
}

/* =====================================================================
   THE FAULT — kilometre scale (1 unit = 1 km). The front face is the
   section; the top is the land, the coast and the sea.
   ===================================================================== */
// the fault line on the section: from its tip near the surface under the city (where the pebble was) down at ~50°
const SL_FAULT = { tip: new THREE.Vector2(3.0, -0.03), dir: new THREE.Vector2(-0.64, -0.77).normalize(), hypo: new THREE.Vector2(-4.7, -9.3), coastX: -6 };
class SlFault {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#05070a');
    this.camera = new THREE.PerspectiveCamera(46, 9 / 16, 0.005, 600);
    this.scene.add(new THREE.HemisphereLight('#b2c2d0', '#262019', 1.0));
    const key = new THREE.DirectionalLight('#f2f0ea', 1.6); key.position.set(-10, 14, 8); this.scene.add(key);
    this.U = { uTime: { value: 0 }, uStress: { value: 0 }, uSlip: { value: 0 }, uRup: { value: 0 }, uRing: { value: 0 }, uRingA: { value: 0 },
      uTip: { value: SL_FAULT.tip.clone() }, uDir: { value: SL_FAULT.dir.clone() }, uHypo: { value: SL_FAULT.hypo.clone() } };
    const face = new THREE.Mesh(new THREE.PlaneGeometry(60, 24), new THREE.ShaderMaterial({
      uniforms: this.U,
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: /* glsl */`
        uniform float uTime, uStress, uSlip, uRup, uRing, uRingA; uniform vec2 uTip, uDir, uHypo;
        varying vec3 vW;
        ${SL_GLSL_NOISE}
        void main(){
          vec2 p = vW.xy;
          // which side of the fault (n > 0 = the hanging wall, toward the sea); distance along it
          vec2 nrm = vec2(-uDir.y, uDir.x);
          float s = dot(p - uTip, uDir), n = dot(p - uTip, nrm);
          float wig = 0.12 * (ufbm(vec2(s * 0.6, 3.0)) - 0.5);
          float nn = n - wig;
          // the hanging wall lurches up-dip by the slip (a few metres → exaggerated to read): offset the strata
          vec2 q = p - (nn > 0.0 ? -uDir * uSlip : vec2(0.0));
          float y = q.y + 0.25 * (ufbm(vec2(q.x * 0.15, 1.0)) - 0.5);
          vec3 col;
          if (y > -1.6) col = mix(vec3(0.55, 0.47, 0.36), vec3(0.42, 0.37, 0.3), smoothstep(-0.2, -1.5, y)) * (0.9 + 0.15 * sin(y * 30.0 + ufbm(q * 2.0) * 4.0));
          else if (y > -3.4) col = vec3(0.4, 0.37, 0.33) * (0.9 + 0.15 * sin(y * 14.0 + ufbm(q) * 3.0));
          else if (y > -14.0) { vec3 c = ucell(q * 0.9); col = vec3(0.43, 0.4, 0.4) * (0.85 + 0.25 * c.z) * (0.9 + 0.1 * smoothstep(0.0, 0.08, c.y - c.x)); }
          else col = vec3(0.3, 0.27, 0.28) * (0.85 + 0.2 * ufbm(q * 0.6));
          col *= 0.95 - 0.35 * smoothstep(0.0, -22.0, p.y);
          // stress: strain lines bunched around the locked patch, and its glow (red → hot)
          float lock = exp(-pow(length(p - uHypo) / 3.6, 2.0));
          float strain = 0.5 + 0.5 * sin((nn * 4.0 + lock * 2.5 * sign(nn)) * 6.2831);
          col = mix(col, col * (0.75 + 0.5 * strain), 0.35 * uStress * smoothstep(5.0, 0.0, abs(nn)));
          col += vec3(1.0, 0.25, 0.08) * lock * uStress * 0.55 * (0.85 + 0.15 * sin(uTime * 7.0)) * smoothstep(1.4, 0.0, abs(nn));
          // the fault itself: a dark seam
          float seam = smoothstep(0.06, 0.0, abs(nn)) * step(s, 15.5) * step(-0.2, s);
          col = mix(col, vec3(0.05, 0.04, 0.04), seam * 0.85);
          // the rupture: from the tip down the fault, a white-hot front with an orange wake
          float front = uRup * 16.0, along = clamp(s, 0.0, 16.0);
          float lit = step(along, front) * step(-0.2, s) * step(s, 15.5);
          float glowW = smoothstep(0.35, 0.0, abs(nn));
          col += lit * glowW * (vec3(1.0, 0.55, 0.2) * 0.9 * exp(-(front - along) * 0.25) + vec3(1.0, 0.95, 0.85) * 2.2 * exp(-pow((front - along) / 0.5, 2.0)));
          // seismic rings from the hypocentre
          float d = length(p - uHypo), R = uRing;
          float ring = exp(-pow((d - R) / 0.35, 2.0)) + 0.5 * exp(-pow((d - R + 2.2) / 0.5, 2.0)) + 0.25 * exp(-pow((d - R + 4.6) / 0.7, 2.0));
          col += vec3(0.6, 0.85, 1.0) * ring * uRingA * step(d, R + 1.0);
          // the tip, where the pebble was: a tiny bright point before the slip
          col += vec3(0.7, 0.9, 1.0) * exp(-length(p - uTip) * 60.0) * 1.5 * (1.0 - uRup);
          gl_FragColor = vec4(col, 1.0);
        }`,
    }));
    face.position.set(-4, -12, 0); this.scene.add(face); this.face = face;
    // the top: land (green-grey), the city (tiny light blocks), the beach, the sea (darker, slightly lower)
    const land = new THREE.Mesh(new THREE.PlaneGeometry(36, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#5d6650', roughness: 0.95 }));
    land.position.set(SL_FAULT.coastX + 18, 0, -20); this.scene.add(land);
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(30, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#203848', roughness: 0.2, metalness: 0.1 }));
    sea.position.set(SL_FAULT.coastX - 15, -0.04, -20); this.scene.add(sea); this.seaTop = sea;
    const beach = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#a59a80', roughness: 1 }));
    beach.position.set(SL_FAULT.coastX + 0.2, 0.002, -20); this.scene.add(beach);
    const rr = new RNG(73), city = new Batcher(), cm = [Mat.std('#b9b5ab', { roughness: 0.8 }), Mat.std('#8e8a82', { roughness: 0.8 }), Mat.std('#cfc8b8', { roughness: 0.8 })];
    for (let i = 0; i < 420; i++) {
      const x = SL_FAULT.coastX + 0.3 + Math.pow(rr.next(), 1.4) * 9, z = -rr.next() * 9 - 0.02, h = 0.01 + Math.pow(rr.next(), 3) * 0.12 * (x < 0 ? 1.4 : 0.7);
      city.box(0.05 + rr.next() * 0.08, h, 0.05 + rr.next() * 0.08, x, h / 2, z, rr.pick(cm));
    }
    const cg = new THREE.Group(); city.build(cg, 'city'); this.scene.add(cg); this.city = cg;
    // the far side and the bottom of the block
    const side = new THREE.Mesh(new THREE.PlaneGeometry(40, 24).rotateY(Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#221d19', roughness: 1 })); side.position.set(26, -12, -20); this.scene.add(side);
    this.orbit = new SlOrbit([
      [SL.fault, SL_FAULT.tip.x, SL_FAULT.tip.y - 0.002, 0, 0.012, 2, -2, 46],
      [18.4, SL_FAULT.tip.x - 0.4, -0.8, 0, 3.2, 4, -6, 46, 'outCubic'],
      [19.6, -1.5, -6.5, 0, 26, 8, -8, 46],
      [21.8, -2.5, -7.5, 0, 24, 14, -10, 44],
      [23.6, -1.0, -4.0, 0, 18, 18, -16, 44],
      [24.6, 0.5, -0.5, -1.5, 5.5, 22, -30, 50, 'inCubic'],
    ]);
  }
  update(t) {
    this.U.uTime.value = t;
    this.U.uStress.value = MathX.smooth(t, SL.fault + 0.2, 18.2) * (1 - 0.5 * MathX.smooth(t, 22.5, 24.0));
    this.U.uSlip.value = 0.05 * MathX.smooth(t, SL.slip, SL.slip + 0.3) + 0.55 * MathX.smooth(t, SL.rupture + 0.3, 23.6);
    this.U.uRup.value = Math.pow(MathX.clamp((t - SL.rupture) / 3.2, 0, 1), 0.85);
    this.U.uRing.value = Math.max(0, t - 20.9) * 6.0;
    this.U.uRingA.value = MathX.smooth(t, 20.9, 21.3) * (1 - MathX.smooth(t, 24.0, 24.6)) * 1.4;
    // the surface shudders when the waves arrive
    const sh = MathX.smooth(t, 22.4, 23.0) * 0.012;
    this.city.position.set(sh * Math.sin(t * 61), sh * Math.cos(t * 47), 0);
    this.orbit.apply(this.camera, t);
  }
}
