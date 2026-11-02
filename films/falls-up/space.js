/* =====================================================================
   SPACE — the sky set: we ride up beside the things that fell up. The Earth below is a sphere drawn in the sky shader
   (ray-traced per pixel: land, sea and cloud from noise; the haze thickening to the horizon; the horizon dipping as you
   climb: 3.4° at 11 km, 10° at 100 km), the sky darkening from blue to black with height, the stars when it's dark,
   the sun where it is (south-west, 30° up). The camera rides with the thing (it stays in frame; the world drops away).
     height   3:06, your apple at 15.3 km: higher than Everest, higher than the airliners; −56 °C
     planes   3:07, a lost phone passing 11 km, where the airliners fly; one turns away
     space    3:09:39, your apple crosses 100 km
   ===================================================================== */

function fuSkyShader(scene) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(4000, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { h: { value: 15000 }, sd: { value: new THREE.Vector3(...FU_SUN) }, k: { value: 1 } },
    vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform float h, k; uniform vec3 sd; varying vec3 vD;
      float hash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float vnoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z); }
      float fbm(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 6; i++) { v += a * vnoise(p); p = p * 2.03 + 3.1; a *= 0.5; } return v; }
      void main(){
        vec3 d = normalize(vD);
        const float R = 6371000.0;
        vec3 o = vec3(0.0, R + h, 0.0);
        float b = dot(o, d), c = dot(o, o) - R * R, disc = b * b - c;
        float dip = acos(R / (R + h));
        float el = asin(clamp(d.y, -1.0, 1.0)), above = el + dip;                  // angle above the true horizon
        float thin = exp(-h / 7500.0);                                              // how much air is still above you
        vec3 zen = mix(vec3(0.0, 0.0, 0.004), vec3(0.16, 0.34, 0.72), pow(thin, 0.42));
        vec3 hor = mix(vec3(0.06, 0.16, 0.42), vec3(0.62, 0.76, 0.92), pow(thin, 0.3));
        float sunF = max(dot(d, sd), 0.0);
        vec3 col = mix(hor, zen, smoothstep(0.0, 0.5 + 0.4 * thin, above));
        // the limb: a thin bright band of air along the horizon (the higher you are, the thinner and bluer it is)
        float lw = mix(0.012, 0.06, pow(thin, 0.4));
        col += vec3(0.25, 0.5, 1.0) * exp(-max(above, 0.0) / lw) * mix(0.9, 0.35, thin);
        col += vec3(1.0, 0.9, 0.7) * (pow(sunF, 8.0) * 0.18 * (0.3 + thin) + pow(sunF, 400.0) * 1.5);
        float ang = length(cross(d, sd)); if (dot(d, sd) > 0.0) col = mix(col, vec3(1.8, 1.7, 1.5), 1.0 - smoothstep(0.0046, 0.0056, ang));
        float tHit = -b - sqrt(max(disc, 0.0));
        if (disc > 0.0 && tHit > 0.0) {
          vec3 p = o + d * tHit, n = normalize(p), q = n * 6371.0;                  // q: km on the surface
          float land = smoothstep(0.47, 0.53, fbm(q * 0.004 + 7.0));
          vec3 ground = mix(vec3(0.05, 0.12, 0.2), mix(vec3(0.24, 0.3, 0.17), vec3(0.42, 0.38, 0.28), fbm(q * 0.03)), land);
          ground *= 0.75 + 0.5 * fbm(q * 0.25);                                     // fields, towns
          float cl = smoothstep(0.52, 0.7, fbm(q * 0.012 + vec3(0.0, 3.0, 0.0)) * 0.8 + fbm(q * 0.08) * 0.35);
          float lit = max(dot(n, sd), 0.0) * 0.85 + 0.15;
          vec3 g = mix(ground, vec3(0.95, 0.96, 0.98), cl) * lit * 1.4;
          // haze: the further along the ray (and the more of it is in the low air), the more it's the horizon's colour
          float path = tHit / 1000.0, hz = 1.0 - exp(-path / mix(250.0, 40.0, thin));
          g = mix(g, mix(hor, vec3(0.75, 0.82, 0.92), 0.5) * 1.05, clamp(hz, 0.0, 0.92));
          col = g;
        }
        gl_FragColor = vec4(col * k, 1.0); }`,
  }));
  m.renderOrder = -10; m.frustumCulled = false; scene.add(m);
  return m;
}
// an airliner (twin-engine, ~38 m), its contrail; origin at its middle, nose +z
function fuBuildAirliner() {
  const g = new THREE.Group(), w = fuStd('#eef0f2', 0.35, 0.3), gr = fuStd('#9aa3ab', 0.45, 0.5), bl = fuStd('#2a4a8a', 0.5);
  fuMesh(new THREE.CylinderGeometry(1.95, 1.95, 30, 18).rotateX(Math.PI / 2), w, 0, 0, 0, g);
  fuMesh(new THREE.SphereGeometry(1.95, 18, 12).scale(1, 1, 2.2), w, 0, 0, 15, g); fuMesh(new THREE.ConeGeometry(1.95, 7, 18).rotateX(-Math.PI / 2), w, 0, 0.3, -18.5, g);
  const wing = new THREE.Shape(); wing.moveTo(0, 3); wing.lineTo(17, -4); wing.lineTo(17, -5.6); wing.lineTo(0, -3.5); wing.closePath();
  for (const sd of [-1, 1]) { const m = fuMesh(new THREE.ExtrudeGeometry(wing, { depth: 0.35, bevelEnabled: false }), gr, 0, -0.9, 1, g); m.rotation.set(Math.PI / 2, 0, 0); m.scale.set(sd, 1, 1);
    fuMesh(new THREE.CylinderGeometry(1.1, 1.0, 4.2, 14).rotateX(Math.PI / 2), gr, sd * 5.8, -1.9, 3.6, g); }
  const fin = new THREE.Shape(); fin.moveTo(0, 0); fin.lineTo(5, 0); fin.lineTo(8, 7); fin.lineTo(5.5, 7); fin.closePath();
  const f = fuMesh(new THREE.ExtrudeGeometry(fin, { depth: 0.3, bevelEnabled: false }), bl, -0.15, 1.6, -20, g); f.rotation.y = -Math.PI / 2;
  const st = new THREE.Shape(); st.moveTo(0, 1.5); st.lineTo(6, -1.2); st.lineTo(6, -2.4); st.lineTo(0, -1.6); st.closePath();
  for (const sd of [-1, 1]) { const m = fuMesh(new THREE.ExtrudeGeometry(st, { depth: 0.2, bevelEnabled: false }), gr, 0, 0.6, -18.5, g); m.rotation.set(Math.PI / 2, 0, 0); m.scale.set(sd, 1, 1); }
  // the contrail: two white streaks behind the engines, spreading and fading
  const alpha = fuTex(fuCanvas(256, 4, (c, w2, h) => { const gg = c.createLinearGradient(0, 0, w2, 0); gg.addColorStop(0, '#000'); gg.addColorStop(0.04, '#fff'); gg.addColorStop(0.5, '#888'); gg.addColorStop(1, '#000'); c.fillStyle = gg; c.fillRect(0, 0, w2, h); }), { repeat: false, srgb: false });
  const cm = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, alphaMap: alpha, depthWrite: false, side: THREE.DoubleSide, fog: false });
  for (const sd of [-1, 1]) { const geo = new THREE.CylinderGeometry(9, 1.1, 1400, 10, 1, true); geo.rotateX(Math.PI / 2); geo.translate(0, 0, -700 - 8);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, 1 - uv.getY(i), uv.getX(i)); const m = new THREE.Mesh(geo, cm); m.position.set(sd * 5.8, -1.9, 0); g.add(m); }
  return g;
}

FU_SETS.space = (app) => {
  const S = fuSet(app, { sky: '#000000', fov: 50, near: 0.02, far: 8000, hemi: ['#9ab8e0', '#3a4a5a', 0.25], sun: [FU_SUN[0] * 50, FU_SUN[1] * 50, FU_SUN[2] * 50], sunI: 3.6, sunColor: '#fff6ea', env: ['#203a6a', '#9ab0c8', '#506070'] });
  const scene = S.scene, cam = S.camera, sun = S.sun;
  const sky = fuSkyShader(scene);
  // stars (they show once the sky is dark enough)
  const stars = (() => { const N = 2600, r = new RNG(5), pos = new Float32Array(N * 3); for (let i = 0; i < N; i++) { const u = r.range(-0.15, 1), a = r.range(0, 6.283), q = Math.sqrt(1 - u * u), R = 3800; pos.set([q * Math.cos(a) * R, u * R, q * Math.sin(a) * R], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); const m = new THREE.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false });
    const p = new THREE.Points(g, m); p.renderOrder = -9; p.frustumCulled = false; scene.add(p); return p; })();
  const apple = fuBuildApple(); scene.add(apple);
  // the frost on it: a white skin that thickens
  const frost = new THREE.Mesh(new THREE.SphereGeometry(0.0425, 22, 16).scale(1.06, 0.95, 1.06), new THREE.MeshStandardMaterial({ color: '#f4f8ff', roughness: 0.95, transparent: true, opacity: 0, depthWrite: false })); apple.add(frost);
  const phone = fuBuildPhone(); scene.add(phone);
  const plane = fuBuildAirliner(); scene.add(plane);
  const set = {
    scene, camera: cam,
    cuts() { return []; },
    frame(t, shot) {
      const m = shot.mode, s = fuStoryAt(t), k = MathX.clamp((t - shot.t0) / (shot.t1 - shot.t0), 0, 1);
      this._s = s; this._shot = shot;
      // what we ride with, and its height
      const F = m === 'planes' ? FU_FLY.phone0 : FU_FLY.apple, h = F(s); this._h = h; this._what = m === 'planes' ? 'phone' : 'apple';
      sky.material.uniforms.h.value = h;
      const thin = Math.exp(-h / 7500); stars.material.opacity = MathX.clamp((0.25 - thin) * 6, 0, 1) * 0.22;   // (faint: a camera exposed for the sunlit apple barely sees them)
      apple.visible = m !== 'planes'; phone.visible = m === 'planes'; plane.visible = m === 'planes';
      const obj = m === 'planes' ? phone : apple, sp = s - F.s0;
      obj.position.set(0, 0, 0); obj.rotation.set(0.35 * sp, 0.6 * sp, 0.2 * sp);
      if (m === 'planes') obj.rotation.set(1.3 * sp, 0.7 * sp, 0.9 * sp);
      frost.material.opacity = m === 'space' ? 0.38 : m === 'height' ? 0.1 + 0.18 * k : 0;
      // the camera: close beside it, slowly circling, looking a little down towards the horizon
      const a = (m === 'space' ? 2.55 : m === 'height' ? 2.15 : 2.3) + 0.25 * k + 0.02 * Math.sin(t * 0.7), dist = m === 'planes' ? 0.42 : 0.3, el = m === 'space' ? 0.16 : 0.1;
      const p = [Math.sin(a) * dist, el * dist + 0.03, Math.cos(a) * dist];
      const lookDown = m === 'space' ? -0.42 : m === 'height' ? -0.2 : -0.08;
      const fw = [-Math.sin(a), 0, -Math.cos(a)], at = [p[0] + fw[0] * 3, p[1] + 3 * lookDown, p[2] + fw[2] * 3];
      const dr = fuDrift(t, 0.006, 0.4, 5);
      fuCam(cam, [p[0] + dr[0], p[1] + dr[1], p[2] + dr[2]], at, m === 'space' ? 54 : 50, m === 'height' ? -4 : 2);
      // the airliner: 2.4 km off, crossing, banking into a turn away from the city
      if (m === 'planes') { const u = (t - shot.t0) / (shot.t1 - shot.t0), bank = 0.45 * fuSm(u, 0.25, 0.7), hd = -1.1 + 0.9 * fuSm(u, 0.25, 1.0);
        const base = [-2600 + 520 * u * 6, -40 + 0 * u, -2300]; plane.position.set(base[0] * 0.5, base[1] * 0.5, base[2] * 0.5); plane.scale.setScalar(0.5); plane.rotation.set(0, hd, 0); plane.rotateZ(-bank); }
      sun.position.set(FU_SUN[0] * 50, FU_SUN[1] * 50, FU_SUN[2] * 50); sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld();
      S.hemi.intensity = 0.15 + 0.35 * thin; scene.environmentIntensity = 0.4 + 0.5 * thin;
    },
    labels(t) {
      const shot = fuShotAt(t), W = StoryHUD.win, out = [];
      if (this._what === 'apple') out.push({ p: [0.0, 0.05, 0.0], text: 'YOUR APPLE', sub: fuHt(this._h) + ' UP' + (this._h < 85000 ? ' · ' + Math.round(fuTempC(this._h)) + ' °C' : ''), a: W(t, shot.t0 + 0.5, shot.t1 - 0.2, 0.3, 0.3), side: 'l' });   // (to its right: the context line is on the left)
      else out.push({ p: [0.0, 0.03, 0.0], text: 'A PHONE LOST AT 3:00', sub: fuHt(this._h) + ' UP', a: W(t, shot.t0 + 0.5, shot.t1 - 0.2, 0.3, 0.3), side: 'r' });
      return out;
    },
    grade(t, p) { p.exposure = 1.0; p.saturation = 1.06; p.vignette = 0.6; p.bloom = 0.42; p.bloomThreshold = 0.86; p.warmth = -0.02; },
  };
  return set;
};
