/* =====================================================================
   MIRROR — a planar reflection (the classic reflector technique): the
   scene is rendered from the camera mirrored in the glass into a texture that the mirror samples in
   screen-projective space. Rendered explicitly once per frame (render()),
   before the main pass. Output stays linear, so the post pass grades the
   reflection exactly like the room.
   Layers: the reflection camera sees layers `see` (default 0 and 1) —
   put a body that should exist only in reflections on layer 1, and things
   that must never reflect (first-person hands) on layer 2.
   ===================================================================== */

class Mirror {
  constructor(width, height, { resolution = 640, tint = '#e6eaec', see = [0, 1], clipBias = 0.003, smudge = 0.06, clip = false } = {}) {
    const rw = Math.round(resolution * Math.min(1, width / height)), rh = Math.round(resolution * Math.min(1, height / width));
    this.rt = new THREE.WebGLRenderTarget(rw, rh, { type: THREE.HalfFloatType });
    this.cam = new THREE.PerspectiveCamera();
    this.cam.layers.disableAll(); for (const l of see) this.cam.layers.enable(l);
    this.clipBias = clipBias; this.clip = clip;      // keep the wall behind a mirror back-facing and empty, and no clipping is needed
    this.textureMatrix = new THREE.Matrix4();
    this.material = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: this.rt.texture }, textureMatrix: { value: this.textureMatrix }, uTint: { value: new THREE.Color(tint) }, uSmudge: { value: smudge }, uDim: { value: 1 } },
      vertexShader: /* glsl */`
        uniform mat4 textureMatrix; varying vec4 vUvP; varying vec2 vUv;
        void main() { vUv = uv; vUvP = textureMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse; uniform vec3 uTint; uniform float uSmudge, uDim; varying vec4 vUvP; varying vec2 vUv;
        float h(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
        float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
        void main() {
          vec3 c = texture2DProj(tDiffuse, vUvP).rgb * uTint * uDim;
          // a lived-in mirror: faint smudges and slightly darker edges
          float s = n(vUv * vec2(9.0, 11.0)) * n(vUv * vec2(23.0, 19.0));
          c = mix(c, c * 0.9 + 0.012, uSmudge * s * 2.0);
          vec2 e = abs(vUv - 0.5) * 2.0; c *= 1.0 - 0.12 * pow(max(e.x, e.y), 6.0);
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), this.material);
    this.mesh.name = 'mirror';
    this._v = { rp: new THREE.Vector3(), cp: new THREE.Vector3(), rot: new THREE.Matrix4(), n: new THREE.Vector3(), view: new THREE.Vector3(), look: new THREE.Vector3(),
      tgt: new THREE.Vector3(), plane: new THREE.Plane(), clip: new THREE.Vector4(), q: new THREE.Vector4() };
  }

  // render the reflection for `camera` (call before the main render, after the camera and the scene are posed)
  render(renderer, scene, camera) {
    const V = this._v, m = this.mesh, vc = this.cam;
    if (!m.visible || !m.parent) return;
    m.updateMatrixWorld();
    V.rp.setFromMatrixPosition(m.matrixWorld); V.cp.setFromMatrixPosition(camera.matrixWorld);
    V.rot.extractRotation(m.matrixWorld); V.n.set(0, 0, 1).applyMatrix4(V.rot);
    V.view.subVectors(V.rp, V.cp);
    if (V.view.dot(V.n) > 0) return;                       // behind the mirror: nothing to see
    V.view.reflect(V.n).negate().add(V.rp);
    V.rot.extractRotation(camera.matrixWorld);
    V.look.set(0, 0, -1).applyMatrix4(V.rot).add(V.cp);
    V.tgt.subVectors(V.rp, V.look).reflect(V.n).negate().add(V.rp);
    vc.position.copy(V.view);
    vc.up.set(0, 1, 0).applyMatrix4(V.rot).reflect(V.n);
    vc.lookAt(V.tgt);
    vc.far = camera.far; vc.near = camera.near;
    vc.updateMatrixWorld();
    vc.projectionMatrix.copy(camera.projectionMatrix);
    this.textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
      .multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse).multiply(m.matrixWorld);
    // nothing behind the glass may leak into the reflection: a world clipping plane at the glass while we render
    // (more robust than an oblique near plane, which can tilt the far plane through the view)
    this._clip = this._clip || new THREE.Plane();
    this._clip.setFromNormalAndCoplanarPoint(V.n, V.rp).constant -= this.clipBias;
    // render
    m.visible = false;
    const prevRT = renderer.getRenderTarget(), prevShadow = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    const prevClip = renderer.clippingPlanes;
    if (this.clip) renderer.clippingPlanes = [this._clip];      // (only needed if something stands behind the glass)
    renderer.setRenderTarget(this.rt);
    renderer.clear();
    renderer.render(scene, vc);
    renderer.clippingPlanes = prevClip;
    renderer.shadowMap.autoUpdate = prevShadow;
    renderer.setRenderTarget(prevRT);
    m.visible = true;
  }
}
