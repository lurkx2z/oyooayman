/* =====================================================================
   BRAIN — a stylized, anatomically informed brain for scene 7 (built procedurally; no imported models).
     the cortex      two hemispheres (a longitudinal fissure between them), frontal / temporal / occipital shaping,
                     folds (gyri) drawn by the shader, a cerebellum and a brainstem; translucent, glass-like
     the regions     glows the scene drives: AUDITORY (upper temporal lobe, both sides) and VISUAL (occipital pole,
                     the back): the colours are a code, not "what the brain looks like"
     the network     nodes inside the volume and the pathways between neighbours; signals travel along them
                     (u.uFlow: where the signals go: 0 everywhere, 1 = from the auditory regions to the visual one)
   Brain axes (local): +z = front (frontal pole), +y = up, ±x = the two sides. Size ≈ 1.6 m long (a model).
   ===================================================================== */

class BeBrain {
  constructor(scene, seed = 7) {
    this.root = new THREE.Group(); scene.add(this.root);
    const r = this.r = new RNG(seed);
    this.u = {
      uT: { value: 0 }, uAud: { value: 0 }, uVis: { value: 0 }, uGlass: { value: 1 }, uFlow: { value: 0 }, uNet: { value: 0.4 }, uPulse: { value: -10 },
      uAudP: { value: new THREE.Vector3(0.6, -0.05, 0.05) }, uVisP: { value: new THREE.Vector3(0, 0.05, -0.78) },
    };
    this._cortex(); this._network();
    this.root.traverse((o) => { o.userData.beSkip = true; });
  }
  // shape of one hemisphere: a unit sphere, displaced into a brain half
  _hemi(side) {
    const g = new THREE.SphereGeometry(1, 96, 72), p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      let x = v.x, y = v.y, z = v.z;
      // elongate front-back, flatten the base, a temporal lobe bulging low on the side, the occipital pole narrowing
      x *= 0.5; y *= 0.62; z *= 0.82;
      if (y < -0.1) y = -0.1 + (y + 0.1) * 0.7;
      const tl = Math.exp(-Math.pow((z - 0.05) / 0.35, 2) - Math.pow((y + 0.28) / 0.18, 2));
      x *= 1 + 0.18 * tl * (x * side > 0 ? 1 : 0); y -= 0.06 * tl;
      if (z < -0.5) { const k = (z + 0.5) / -0.32; x *= 1 - 0.18 * k; y *= 1 - 0.1 * k; }
      // the medial face is flat (the fissure)
      if (x * side < 0.03) x = side * 0.03 + (x - side * 0.03) * 0.15;
      p.setXYZ(i, x + side * 0.02, y, z);
    }
    g.computeVertexNormals();
    return g;
  }
  _cortex() {
    const u = this.u;
    const mat = this.mat = new THREE.ShaderMaterial({
      uniforms: Object.assign({ uK: { value: 1 } }, u), transparent: true, depthWrite: false, side: THREE.FrontSide, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        varying vec3 vL, vN, vV; void main(){ vL = position; vec4 w = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal); vV = cameraPosition - w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        uniform float uT, uAud, uVis, uGlass, uPulse, uK; uniform vec3 uAudP, uVisP; varying vec3 vL, vN, vV;
        float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }
        void main(){
          float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
          // gyri: thin dark sulci lines from a warped noise field
          float w = n3(vL * 5.0) * 2.0 + n3(vL * 11.0);
          float sul = smoothstep(0.08, 0.0, abs(fract(w * 1.6) - 0.5) - 0.38);
          // the flat medial faces (the fissure) and the inner parts stay faint, or they read as bright discs
          float med = mix(0.25, 1.0, smoothstep(0.04, 0.12, abs(vL.x)));
          vec3 base = vec3(0.035, 0.065, 0.14) * (0.2 + 1.4 * fr) * uGlass;
          vec3 col = base * (1.0 - 0.6 * sul) + vec3(0.3, 0.5, 0.85) * sul * (0.05 + 0.2 * fr) * uGlass;
          col *= med * uK;
          vec3 pa = vec3(abs(vL.x), vL.y, vL.z);
          float ga = exp(-dot(pa - uAudP, pa - uAudP) / 0.045) * uAud;
          float gv = exp(-dot(vL - uVisP, vL - uVisP) / 0.06) * uVis;
          float ripple = 0.75 + 0.25 * sin(uT * 6.0 - length(vL - uVisP) * 30.0);
          col += vec3(1.0, 0.62, 0.25) * ga * (1.0 - 0.5 * sul) * 1.4 * uK;
          col += vec3(0.35, 0.95, 1.0) * gv * ripple * (1.0 - 0.5 * sul) * 1.5 * uK;
          // a click wave sweeping the whole cortex (uPulse = its radius)
          float pw = exp(-pow((length(vL) - uPulse) / 0.05, 2.0));
          col += vec3(0.6, 0.95, 1.0) * pw * 0.5;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const g = this.cortex = new THREE.Group(); this.root.add(g);
    for (const s of [-1, 1]) { const m = new THREE.Mesh(this._hemi(s), mat); m.renderOrder = 3; g.add(m); }
    // cerebellum and brainstem
    const dim = mat.clone(); dim.uniforms = Object.assign({ uK: { value: 0.35 } }, u);
    const cb = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), dim); cb.scale.set(0.36, 0.17, 0.2); cb.position.set(0, -0.3, -0.55); g.add(cb);
    const bs = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.5, 24), dim); bs.position.set(0, -0.48, -0.32); bs.rotation.x = 0.35; g.add(bs);
  }
  _network() {
    const r = this.r, N = 900, nodes = [];
    const inside = (p) => { const q = new THREE.Vector3(p.x / 0.5, (p.y + 0.02) / 0.55, p.z / 0.8); return q.length() < 0.92; };
    while (nodes.length < N) { const p = new THREE.Vector3(r.range(-0.5, 0.5), r.range(-0.4, 0.55), r.range(-0.82, 0.82)); if (inside(p)) nodes.push(p); }
    const pos = [], aA = [], aB = [];
    for (let i = 0; i < N; i++) {
      const a = nodes[i]; let k = 0;
      for (let j = i + 1; j < N && k < 3; j++) { const b = nodes[j]; if (a.distanceTo(b) < 0.14) { pos.push(a.x, a.y, a.z, b.x, b.y, b.z); const ph = r.next(); aA.push(0, ph, 1, ph); aB.push(a.x, a.y, a.z, a.x, a.y, a.z); k++; } }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aE', new THREE.Float32BufferAttribute(aA, 2));      // (0 at start / 1 at end, phase)
    const u = this.u;
    const lm = new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute vec2 aE; varying float vS; varying vec3 vP; varying float vPh; void main(){ vS = aE.x; vPh = aE.y; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uT, uNet, uAud, uVis, uFlow, uPulse; uniform vec3 uAudP, uVisP; varying float vS; varying vec3 vP; varying float vPh;
        void main(){
          // a signal runs along each pathway (its own phase); more of them where the regions are active
          float s = fract(uT * 0.9 + vPh * 7.0);
          float spark = exp(-pow((vS - s) / 0.08, 2.0));
          vec3 pa = vec3(abs(vP.x), vP.y, vP.z);
          float da = length(pa - uAudP), dv = length(vP - uVisP);
          // the path from hearing toward the back of the brain (uFlow): a tube around the segment between the regions
          vec3 ab = uVisP - uAudP; float hh = clamp(dot(pa - uAudP, ab) / dot(ab, ab), 0.0, 1.0);
          float dseg = length(pa - uAudP - ab * hh), band = exp(-dseg * dseg / 0.02);
          float act = uNet + uAud * exp(-da * da / 0.05) * 2.0 + uVis * exp(-dv * dv / 0.06) * 2.5 + uFlow * band * 2.0;
          float pw = exp(-pow((length(vP) - uPulse) / 0.06, 2.0));
          vec3 col = mix(vec3(0.45, 0.62, 1.0), mix(vec3(1.0, 0.65, 0.3), vec3(0.4, 0.95, 1.0), hh), clamp(uAud + uVis + uFlow, 0.0, 1.0) * clamp(band + exp(-da * da / 0.05) + exp(-dv * dv / 0.06), 0.0, 1.0));
          float a = (0.05 + 0.6 * spark) * act + pw * 0.8;
          gl_FragColor = vec4(col * a, 1.0);
        }`,
    });
    this.net = new THREE.LineSegments(g, lm); this.net.renderOrder = 4; this.root.add(this.net);
    // the nodes (soft points)
    const pg = new THREE.BufferGeometry().setFromPoints(nodes);
    const pm = new THREE.ShaderMaterial({
      uniforms: Object.assign({ uH: { value: 1080 } }, u), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`uniform float uH; varying vec3 vP; void main(){ vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = 0.012 * uH / -mv.z; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`uniform float uNet, uAud, uVis; uniform vec3 uAudP, uVisP; varying vec3 vP;
        void main(){ vec2 q = gl_PointCoord - 0.5; float d = length(q); if (d > 0.5) discard; vec3 pa = vec3(abs(vP.x), vP.y, vP.z);
          float act = 0.4 * uNet + uAud * exp(-dot(pa - uAudP, pa - uAudP) / 0.05) * 2.0 + uVis * exp(-dot(vP - uVisP, vP - uVisP) / 0.06) * 2.0;
          gl_FragColor = vec4(vec3(0.7, 0.9, 1.0) * act * smoothstep(0.5, 0.0, d), 1.0); }`,
    });
    this.pts = new THREE.Points(pg, pm); this.pts.renderOrder = 4; this.root.add(this.pts);
    this.nodes = nodes;
  }
  set(o) { for (const k in o) if (this.u[k]) this.u[k].value = o[k]; }
}
