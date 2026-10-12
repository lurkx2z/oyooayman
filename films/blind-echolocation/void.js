/* =====================================================================
   VOID — the science space (scenes 4 and 7): a deep blue-black stage with a faint floor grid, where the film explains.
   Reality here is "the diagram look": her figure lit by a soft key and a cool rim, simple matte objects (a hard wall
   panel, a heavy curtain, an empty door frame, a metre ruler). The same acoustic shader works on all of it.
   ===================================================================== */
class BeVoid {
  constructor() { this.scene = new THREE.Scene(); this.scene.name = 'void'; this.root = new THREE.Group(); this.scene.add(this.root); }
  build() {
    const S = this.scene, R = this.root;
    S.background = new THREE.Color('#05070c');
    S.fog = new THREE.FogExp2('#05070c', 0.06);
    S.add(new THREE.HemisphereLight('#4a5a80', '#0a0a10', 0.6));
    const key = new THREE.DirectionalLight('#ffe2c4', 2.6); key.position.set(2.5, 3.6, -2.4); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); const c = key.shadow.camera; c.left = -3; c.right = 3; c.top = 3; c.bottom = -3; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02; key.shadow.radius = 3;
    S.add(key); S.add(key.target);
    const rim = new THREE.DirectionalLight('#7fdcff', 2.2); rim.position.set(-3, 2.4, 2.6); S.add(rim);
    const fill = new THREE.DirectionalLight('#ffd9bd', 1.1); fill.position.set(3, 1.0, -0.6); S.add(fill);   // a soft front fill: the face reads in close-up
    this.lights = [key, rim, fill];
    // the floor: matte dark with a fine metre grid (drawn in a canvas texture)
    const grid = beCanvasTex(1024, 1024, (x, w, h) => {
      x.fillStyle = '#10141c'; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(120, 170, 220, 0.22)'; x.lineWidth = 2;
      for (let i = 0; i <= 8; i++) { const p = (i / 8) * w; x.beginPath(); x.moveTo(p, 0); x.lineTo(p, h); x.stroke(); x.beginPath(); x.moveTo(0, p); x.lineTo(w, p); x.stroke(); }
    }, [10, 10]);
    this.floor = gbAdd(R, new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ map: grid, color: '#9aa6b8', roughness: 0.85, name: 'beVoidFloorConcrete' }), 0, 0, 0, { rx: -Math.PI / 2, cast: false });
    // the experiment objects
    const wallM = gbMat('#c9ccd2', { rough: 0.6, name: 'beVoidWallPlaster', rim: 0.1 });
    this.wall = gbAdd(R, gbRoundBox(0.08, 2.4, 2.4, 0.01, 1), wallM, 2.1, 1.2, 0);
    // a heavy curtain (absorbs), an empty door frame (an opening), placed for the three-surface test (D7)
    this.curtain = new THREE.Group(); R.add(this.curtain); this.curtain.visible = false;
    gbAdd(this.curtain, beCurtain(1.6, 2.4, 9, 0.6, 21), gbMat('#5a3b52', { rough: 1, name: 'beVoidCurtainFabric', side: THREE.DoubleSide }), 0, 1.22, 0);
    gbAdd(this.curtain, new THREE.CylinderGeometry(0.015, 0.015, 1.3, 8), gbMat('#3a3a40', { rough: 0.4, metal: 0.6, name: 'beVoidRailMetal' }), 0, 2.44, 0, { rz: Math.PI / 2 });
    this.door = new THREE.Group(); R.add(this.door); this.door.visible = false; this.door.rotation.y = Math.PI / 2;
    const fr = gbMat('#b9b2a6', { rough: 0.5, name: 'beVoidDoorFrameWood' });
    for (const s of [-1, 1]) gbAdd(this.door, new THREE.BoxGeometry(0.12, 2.15, 0.14), fr, 0, 1.075, s * 0.5);
    gbAdd(this.door, new THREE.BoxGeometry(0.12, 0.12, 1.12), fr, 0, 2.2, 0);
    for (const s of [-1, 1]) gbAdd(this.door, new THREE.BoxGeometry(0.1, 2.4, 0.6), wallM, 0, 1.2, s * 0.86);
    // a ruler along the floor from her to the wall: metre marks
    this.ruler = new THREE.Group(); R.add(this.ruler);
    const rm = new THREE.MeshBasicMaterial({ color: '#bfefff', transparent: true, opacity: 0.7, name: 'beRulerGlow' });
    gbAdd(this.ruler, new THREE.BoxGeometry(2.0, 0.006, 0.012), rm, 1.05, 0.004, 0.0, { cast: false });
    for (let i = 0; i <= 8; i++) gbAdd(this.ruler, new THREE.BoxGeometry(0.008, 0.006, i % 4 ? 0.05 : 0.12), rm, 0.05 + i * 0.25, 0.004, 0, { cast: false });
    this.ruler.traverse((o) => { o.userData.beSkip = true; });
    beAcousticScene(R);
    this.walls = [{ p: new THREE.Vector3(2.06, 0, 0), n: new THREE.Vector3(-1, 0, 0), refl: 0.85 }];
    return this;
  }
  update(t, lit) { for (const l of this.lights) l.intensity = l === this.lights[0] ? 2.6 * lit : 2.2 * lit; }
}

// AIR: thousands of tiny particles standing for the air between her and the wall. A passing pressure front pushes them
// outward and brightens them (outgoing: cyan; the reflected front from the wall's image source: teal/violet).
// u.uM origin, u.uI image source, u.uWx the wall plane (x), u.uR front radius (m), u.uA strength
class BeAir {
  constructor(scene, box, n = 7000, seed = 5) {
    const r = new RNG(seed), pos = new Float32Array(n * 3), rnd = new Float32Array(n);
    for (let i = 0; i < n; i++) { pos[i * 3] = r.range(box[0], box[1]); pos[i * 3 + 1] = r.range(box[2], box[3]); pos[i * 3 + 2] = r.range(box[4], box[5]); rnd[i] = r.next(); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aR', new THREE.BufferAttribute(rnd, 1));
    this.u = { uM: { value: new THREE.Vector3() }, uI: { value: new THREE.Vector3() }, uWx: { value: 2 }, uR: { value: -1 }, uW: { value: 0.09 }, uA: { value: 0 },
      uBase: { value: 0.1 }, uH: { value: 1080 }, uSize: { value: 0.011 }, uRefl: { value: 0.85 } };
    const m = new THREE.ShaderMaterial({
      uniforms: this.u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        uniform vec3 uM, uI; uniform float uWx, uR, uW, uA, uBase, uH, uSize, uRefl; attribute float aR; varying vec3 vC;
        void main(){
          vec3 p = position; vec3 d = p - uM; float r = length(d) + 1e-4;
          float side = step(p.x, uWx);
          float f1 = exp(-pow((r - uR) / uW, 2.0)) * side;
          float r2 = length(p - uI); float f2 = exp(-pow((r2 - uR) / uW, 2.0)) * side * uRefl * step(uWx - uM.x, uR);
          // compression: the particles are pushed along the front's travel, then fall back
          float push = (exp(-pow((r - uR + uW * 0.6) / uW, 2.0)) * side) * 0.035;
          p += d / r * push;
          p -= normalize(p - uI) * exp(-pow((r2 - uR + uW * 0.6) / uW, 2.0)) * side * 0.03 * uRefl;
          float tw = 0.75 + 0.25 * sin(aR * 40.0);
          vC = (vec3(0.45, 0.62, 0.8) * uBase * tw + vec3(0.38, 0.95, 1.0) * f1 * 1.6 + vec3(0.48, 0.42, 1.0) * f2 * 1.5) * uA;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uSize * uH / -mv.z * (1.0 + 1.2 * (f1 + f2));
          gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        varying vec3 vC; void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q); if (d > 0.5) discard; gl_FragColor = vec4(vC * smoothstep(0.5, 0.15, d), 1.0); }`,
    });
    this.pts = new THREE.Points(g, m); this.pts.frustumCulled = false; this.pts.renderOrder = 5; this.pts.userData.beSkip = true; this.pts.visible = false;
    scene.add(this.pts);
  }
}
