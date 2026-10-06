/* =====================================================================
   FX — the power effects and the battlefield's atmosphere.
     XBill     instanced camera-facing quads (smoke, steam, dust, fire,
               flashes); each particle's motion is closed-form in time
     XRibbon   camera-facing ribbons along polylines (lightning, arcs,
               tracers, afterimage streaks), additive
     XSpark    branching electric arcs: blue-white, thin, localized,
               re-drawn every frame from the frame number (deterministic)
     XDebris   instanced chunks on ballistic arcs that tumble
   Killua = cold blue-white electricity. Eren = warm orange-white flash,
   steam, dust, embers, firelight. The two never share a colour.
   ===================================================================== */

const XCOL = { ice: new THREE.Color('#bfe6ff'), iceCore: new THREE.Color('#ffffff'), warm: new THREE.Color('#ffb46a'), steam: new THREE.Color('#e9e2d6'), dust: new THREE.Color('#7a6a54'), smoke: new THREE.Color('#3a3632'), fire: new THREE.Color('#ff8a2a') };

/* ---------------- billboards ---------------- */
// soft round sprite textures: 'soft' (smoke, steam, dust), 'flash' (a bright core with rays)
const XSPR = {
  get(kind) {
    if (this[kind]) return this[kind];
    const S = 128, c = Tex.canvas(S, S), x = c.getContext('2d'), r = new RNG(kind.length * 31);
    if (kind === 'soft') {
      for (let i = 0; i < 18; i++) { const px = S / 2 + r.range(-22, 22), py = S / 2 + r.range(-22, 22), rr = r.range(20, 44), g = x.createRadialGradient(px, py, 0, px, py, rr); g.addColorStop(0, 'rgba(255,255,255,0.32)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S); }
    } else {
      const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.15, 'rgba(255,255,255,0.8)'); g.addColorStop(0.45, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S);
      x.strokeStyle = 'rgba(255,255,255,0.5)'; x.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; x.beginPath(); x.moveTo(S / 2, S / 2); x.lineTo(S / 2 + Math.cos(a) * S * 0.48, S / 2 + Math.sin(a) * S * 0.48); x.stroke(); }
    }
    this[kind] = Tex.tex(c, { repeat: false }); return this[kind];
  },
};
class XBill {
  // spec: n, kind ('soft' | 'flash'), color, additive, spawn(i, r) → { p, v, t0, life, s0, s1, rot, a }, g (gravity), drag, fadeIn, fadeOut, alpha
  constructor(scene, spec) {
    this.s = spec; const n = spec.n, r = new RNG(spec.seed || 1);
    this.P = []; for (let i = 0; i < n; i++) this.P.push(spec.spawn(i, r));
    const g = new THREE.PlaneGeometry(1, 1);
    this.mesh = new THREE.InstancedMesh(g, null, n); this.mesh.frustumCulled = false; this.mesh.renderOrder = spec.order || 7;
    this.aA = new Float32Array(n); this.aR = new Float32Array(n);
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(this.aA, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aR', new THREE.InstancedBufferAttribute(this.aR, 1).setUsage(THREE.DynamicDrawUsage));
    this.u = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { tMap: { value: XSPR.get(spec.kind || 'soft') }, uColor: { value: new THREE.Color(spec.color || '#ffffff') } });
    this.mesh.material = new THREE.ShaderMaterial({
      uniforms: this.u, transparent: true, depthWrite: false, blending: spec.additive ? THREE.AdditiveBlending : THREE.NormalBlending, fog: !spec.additive,
      vertexShader: `attribute float aA, aR; varying float vA; varying vec2 vUv; ${THREE.ShaderChunk.fog_pars_vertex}
        void main(){ vUv = uv; vA = aA; vec3 c = vec3(instanceMatrix[3]); float s = length(vec3(instanceMatrix[0]));
          vec4 mvPosition = modelViewMatrix * vec4(c, 1.0); float cr = cos(aR), sr = sin(aR); vec2 q = vec2(position.x * cr - position.y * sr, position.x * sr + position.y * cr);
          mvPosition.xy += q * s; gl_Position = projectionMatrix * mvPosition; ${THREE.ShaderChunk.fog_vertex} }`,
      fragmentShader: `uniform sampler2D tMap; uniform vec3 uColor; varying float vA; varying vec2 vUv; ${THREE.ShaderChunk.fog_pars_fragment}
        void main(){ vec4 t = texture2D(tMap, vUv); float a = t.a * vA; if (a < 0.002) discard; gl_FragColor = vec4(uColor * (${spec.additive ? 'a' : '1.0'}), a); ${spec.additive ? '' : THREE.ShaderChunk.fog_fragment} }`,
    });
    if (!spec.additive) this.mesh.material.fog = true;
    scene.add(this.mesh);
    this._m = new THREE.Matrix4(); this._v = new THREE.Vector3(); this._q = new THREE.Quaternion(); this._s = new THREE.Vector3();
  }
  update(t) {
    const S = this.s, g = S.g || 0, dr = S.drag || 0; let any = false;
    this.P.forEach((o, i) => {
      const u = t - o.t0;
      if (u < 0 || u > o.life) { this.aA[i] = 0; this._m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, this._m); return; }
      any = true;
      const d = dr > 0 ? (1 - Math.exp(-dr * u)) / dr : u, k = u / o.life;
      this._v.set(o.p.x + o.v.x * d, o.p.y + o.v.y * d - 0.5 * g * u * u + (o.rise || 0) * u, o.p.z + o.v.z * d);
      const sz = MathX.lerp(o.s0, o.s1, 1 - Math.pow(1 - k, 2));
      this._m.compose(this._v, this._q, this._s.set(sz, sz, sz)); this.mesh.setMatrixAt(i, this._m);
      this.aA[i] = (o.a ?? S.alpha ?? 1) * MathX.smooth(k, 0, S.fadeIn ?? 0.08) * (1 - MathX.smooth(k, S.fadeOut ?? 0.5, 1)) * (S.flicker ? 0.7 + 0.3 * Math.sin(u * 37 + i) : 1);
      this.aR[i] = (o.rot || 0) + (o.spin || 0) * u;
    });
    this.mesh.visible = any;
    if (any) { this.mesh.instanceMatrix.needsUpdate = true; this.mesh.geometry.attributes.aA.needsUpdate = true; this.mesh.geometry.attributes.aR.needsUpdate = true; }
  }
}

/* ---------------- ribbons (lightning, arcs, streaks) ---------------- */
class XRibbon {
  constructor(scene, maxPts = 4000, color = '#ffffff') {
    this.max = maxPts;
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(maxPts * 6 * 3); this.al = new Float32Array(maxPts * 6);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aA', new THREE.BufferAttribute(this.al, 1).setUsage(THREE.DynamicDrawUsage));
    this.mat = new THREE.ShaderMaterial({ uniforms: { uColor: { value: new THREE.Color(color) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute float aA; varying float vA; void main(){ vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uColor; varying float vA; void main(){ gl_FragColor = vec4(uColor * vA, vA); }' });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = 9; scene.add(this.mesh);
    this.n = 0; this._a = new THREE.Vector3(); this._b = new THREE.Vector3(); this._s = new THREE.Vector3(); this._c = new THREE.Vector3();
  }
  begin(cam) { this.n = 0; this.cam = cam.position; }
  // one segment, camera-facing, width w (m), brightness a
  seg(p, q, w, a) {
    if (this.n >= this.max) return;
    const d = this._a.subVectors(q, p), v = this._b.subVectors(p, this.cam), s = this._s.crossVectors(d, v);
    if (s.lengthSq() < 1e-10) return; s.normalize().multiplyScalar(w / 2);
    const o = this.n * 18, P = this.pos, A = this.al, k = this.n * 6;
    const put = (i, x, y, z) => { P[o + i * 3] = x; P[o + i * 3 + 1] = y; P[o + i * 3 + 2] = z; A[k + i] = a; };
    put(0, p.x - s.x, p.y - s.y, p.z - s.z); put(1, p.x + s.x, p.y + s.y, p.z + s.z); put(2, q.x + s.x, q.y + s.y, q.z + s.z);
    put(3, p.x - s.x, p.y - s.y, p.z - s.z); put(4, q.x + s.x, q.y + s.y, q.z + s.z); put(5, q.x - s.x, q.y - s.y, q.z - s.z);
    this.n++;
  }
  poly(pts, w, a, taper = true) { for (let i = 1; i < pts.length; i++) { const k = taper ? 1 - (i / pts.length) * 0.7 : 1; this.seg(pts[i - 1], pts[i], w * k, a * k); } }
  end() { const g = this.mesh.geometry; g.setDrawRange(0, this.n * 6); g.attributes.position.needsUpdate = true; g.attributes.aA.needsUpdate = true; this.mesh.visible = this.n > 0; }
}
// a jagged bolt from a to b with branches; seed fixes its shape
function xBolt(a, b, seed, jag = 0.12, branches = 3, depth = 0) {
  const r = new RNG(seed), L = a.distanceTo(b), n = Math.max(4, Math.min(28, Math.round(L / (jag * 4 + 0.02)))), pts = [a.clone()], out = [];
  const dir = b.clone().sub(a), side1 = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0.3, 1, 0.2)).normalize(), side2 = new THREE.Vector3().crossVectors(dir, side1).normalize();
  for (let i = 1; i < n; i++) { const t = i / n, env = Math.sin(t * Math.PI); pts.push(a.clone().lerp(b, t).addScaledVector(side1, r.range(-1, 1) * jag * L * env * 0.35).addScaledVector(side2, r.range(-1, 1) * jag * L * env * 0.35)); }
  pts.push(b.clone()); out.push(pts);
  if (depth < 2) for (let k = 0; k < branches; k++) {
    const i = Math.floor(r.range(1, n - 1)), p = pts[i], len = L * r.range(0.15, 0.4) / (depth + 1);
    const d2 = dir.clone().normalize().multiplyScalar(len * 0.6).addScaledVector(side1, r.range(-1, 1) * len).addScaledVector(side2, r.range(-1, 1) * len);
    for (const br of xBolt(p, p.clone().add(d2), seed * 7 + k + 1, jag * 1.2, 1, depth + 1)) out.push(br);
  }
  return out;
}

/* ---------------- Killua's sparks ---------------- */
class XSpark {
  constructor(scene) { this.rib = new XRibbon(scene, 3000, '#cfeeff'); this.core = new XRibbon(scene, 1500, '#ffffff'); }
  begin(cam) { this.rib.begin(cam); this.core.begin(cam); }
  // tiny arcs crawling around a point (fingers, shoulders): k = intensity, rad = spread
  crawl(p, t, k, rad = 0.15, n = 3, seed = 1) {
    if (k <= 0.02) return;
    const fr = Math.floor(t * 30);
    for (let i = 0; i < n; i++) {
      const r = new RNG(fr * 97 + i * 13 + seed); if (r.next() > 0.55 + 0.45 * k) continue;
      const a = p.clone().add(new THREE.Vector3(r.range(-1, 1), r.range(-1, 1), r.range(-1, 1)).multiplyScalar(rad * 0.5));
      const b = a.clone().add(new THREE.Vector3(r.range(-1, 1), r.range(-1, 1), r.range(-1, 1)).multiplyScalar(rad));
      for (const pl of xBolt(a, b, fr * 31 + i + seed, 0.25, 1)) { this.rib.poly(pl, 0.012 * (0.6 + k), 0.9 * k); this.core.poly(pl, 0.004, k); }
    }
  }
  // an arc between two points (the hull, a jump), w in metres
  arc(a, b, t, k, w = 0.03, seed = 1, branches = 2) {
    if (k <= 0.02) return; const fr = Math.floor(t * 30);
    for (const pl of xBolt(a, b, fr * 53 + seed, 0.1, branches)) { this.rib.poly(pl, w, k); this.core.poly(pl, w * 0.3, k); }
  }
  // a speed streak: the path he just took, fading (the afterimage)
  streak(pts, k, w = 0.12) { if (k <= 0.02) return; for (let i = 1; i < pts.length; i++) { const f = i / pts.length; this.rib.seg(pts[i - 1], pts[i], w * f, 0.55 * k * f); this.core.seg(pts[i - 1], pts[i], w * 0.25 * f, 0.8 * k * f); } }
  end() { this.rib.end(); this.core.end(); }
}

/* ---------------- debris ---------------- */
class XDebris {
  // pieces: [{ p, v, t0, life, size, spin, mat }] — tumbling boxes on ballistic arcs (they stop on the ground)
  constructor(scene, n, mat, seed, spawn) {
    this.r = new RNG(seed); this.P = []; for (let i = 0; i < n; i++) this.P.push(spawn(i, this.r));
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, n); this.mesh.castShadow = true; this.mesh.frustumCulled = false; scene.add(this.mesh);
    this._m = new THREE.Matrix4(); this._q = new THREE.Quaternion(); this._e = new THREE.Euler(); this._p = new THREE.Vector3(); this._s = new THREE.Vector3();
  }
  update(t) {
    let any = false;
    this.P.forEach((o, i) => {
      let u = t - o.t0;
      if (u < 0) { this._m.makeScale(0, 0, 0); this.mesh.setMatrixAt(i, this._m); return; }
      any = true;
      const gy = xGround(o.p.x, o.p.z), tl = (o.v.y + Math.sqrt(o.v.y * o.v.y + 2 * 9.8 * Math.max(0, o.p.y - gy))) / 9.8;   // landing time
      const uu = Math.min(u, tl);
      this._p.set(o.p.x + o.v.x * uu, Math.max(gy + o.size * 0.3, o.p.y + o.v.y * uu - 4.9 * uu * uu), o.p.z + o.v.z * uu);
      this._e.set(o.spin.x * uu, o.spin.y * uu, o.spin.z * uu); this._q.setFromEuler(this._e);
      this._m.compose(this._p, this._q, this._s.set(o.size, o.size * (o.flat || 0.7), o.size * 0.85)); this.mesh.setMatrixAt(i, this._m);
    });
    this.mesh.visible = any; if (any) this.mesh.instanceMatrix.needsUpdate = true;
  }
}
