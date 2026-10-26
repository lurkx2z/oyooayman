/* =====================================================================
   RINGS — the film's one illustration device: where the sound is. Every sound is drawn as a thin glowing shell (a
   sphere seen edge-on, so it reads as a ring) centred where it was made, of radius = how far that sound has really
   travelled (physics.js ssDist, so the shells slow down with everything else). A moving source leaves a row of shells:
   squeezed in front and stretched behind (Doppler), and once it is faster than sound their edges line up into a cone
   (the sonic boom). Wind carries a shell's centre along with the air. Labelled ILLUSTRATION on screen.
     ssRings(scene, max)  → { begin(), add(x, y, z, r, alpha, col), end() }   (an instanced pool, rewritten every frame)
     ssShells(R, t, o)    adds the shells of one source: o = { src(te) → [x,y,z], every (s), from, to, life (s),
                          maxR (m), alpha, col, wind: [vx, vz] m/s, fadeR (m) }
   ===================================================================== */

function ssRings(scene, max = 900) {
  const geo = new THREE.InstancedBufferGeometry(), sg = new THREE.SphereGeometry(1, 40, 24);
  geo.index = sg.index; geo.setAttribute('position', sg.attributes.position); geo.setAttribute('normal', sg.attributes.normal);
  const C = new Float32Array(max * 4), A = new Float32Array(max * 4);
  const iC = new THREE.InstancedBufferAttribute(C, 4), iA = new THREE.InstancedBufferAttribute(A, 4);
  iC.setUsage(THREE.DynamicDrawUsage); iA.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('iCR', iC); geo.setAttribute('iCol', iA); geo.instanceCount = 0;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.NormalBlending,
    uniforms: { boost: { value: 1 } },
    vertexShader: `attribute vec4 iCR; attribute vec4 iCol; varying vec3 vN; varying vec3 vV; varying vec4 vC; varying float vY; varying float vR; varying float vDc;
      void main(){ vec3 w = iCR.xyz + position * iCR.w; vY = w.y; vC = iCol; vN = normalize(position); vR = iCR.w;
        vDc = abs(length(cameraPosition - iCR.xyz) - iCR.w);
        vec4 mv = viewMatrix * vec4(w, 1.0); vV = normalize(cameraPosition - w); gl_Position = projectionMatrix * mv; }`,
    // (the rim of the shell, plus a brighter line where it meets the ground; a shell you are standing at the edge of
    // fades out, so it never smears across the whole frame)
    fragmentShader: `uniform float boost; varying vec3 vN; varying vec3 vV; varying vec4 vC; varying float vY; varying float vR; varying float vDc;
      void main(){ if (vY < -0.02) discard; float f = 1.0 - abs(dot(normalize(vN), vV));
        float gw = 0.012 * vR + 0.008; float band = exp(-vY * vY / (gw * gw));
        float a = vC.a * (pow(f, 6.0) * 1.0 + 0.8 * band) * boost * smoothstep(0.0, 0.06 * vR + 0.05, vDc);
        if (a < 0.003) discard; gl_FragColor = vec4(vC.rgb, min(a, 0.85)); }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 6; scene.add(mesh);
  let n = 0;
  return {
    mesh, mat,
    begin() { n = 0; },
    add(x, y, z, r, alpha, col = SS_RING_COL) {
      if (n >= max || !(alpha > 0.004) || !(r > 1e-4) || !isFinite(x + y + z + r)) return;
      C[n * 4] = x; C[n * 4 + 1] = y; C[n * 4 + 2] = z; C[n * 4 + 3] = r;
      A[n * 4] = col[0]; A[n * 4 + 1] = col[1]; A[n * 4 + 2] = col[2]; A[n * 4 + 3] = alpha; n++;
    },
    end() { geo.instanceCount = n; iC.needsUpdate = true; iA.needsUpdate = true; },
  };
}
const SS_RING_COL = [1.0, 0.86, 0.68];
const SS_RING_BLUE = [0.62, 0.84, 1.0];

// the shells of one source made every o.every s from o.from to min(o.to, t): radius from the real distance travelled
function ssShells(R, t, o) {
  const every = o.every || 0.25, from = o.from, to = Math.min(o.to ?? t, t), ht = ssH(t), life = o.life || 1e9;
  if (to < from) return;
  const k0 = Math.max(0, Math.ceil((t - life - from) / every)), k1 = Math.floor((to - from) / every);
  for (let k = k0; k <= k1; k++) {
    const te = from + k * every, age = t - te; if (age < 0) continue;
    const r = ssDist(ssH(te), ht) * (o.scale || 1);
    if (o.maxR && r > o.maxR) continue;
    const p = o.src(te), w = o.wind || [0, 0];
    let a = (o.alpha ?? 0.6) * MathX.smooth(age, 0, 0.12) * (1 - MathX.smooth(age, life * 0.6, life));
    if (o.fadeR) a *= 1 - MathX.smooth(r, o.fadeR * 0.5, o.fadeR);
    if (o.gain) a *= o.gain(te);
    R.add(p[0] + w[0] * age, p[1], p[2] + w[1] * age, r, a, o.col);
  }
}
