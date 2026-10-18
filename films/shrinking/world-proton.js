/* =====================================================================
   WORLD · PROTON (346.6 → 393.5 s, femtometres) — one proton of the nucleus, then one of its quarks.
     a proton from outside · inside: a storm (three quarks, the gluon field binding them, quark pairs flickering in and
     out) · the quark you fall towards: everything else keeps growing past you, it stays a point · beyond experiment
   Origin = that quark (red, in false colour). The proton's centre drifts nearby.
   ===================================================================== */

// your distance from the quark (log10 fm) until 371 s; after that you stay four of your heights from it
const SH_PR_D = [[346.6, 0.74], [349, 0.6], [352, 0.24], [356, -0.12], [361, -0.3], [366, -0.45], [371, -0.58]];
const SH_PR_V = [[346.6, 0.12, 0.1, 1], [356, 0.3, 0.22, 1], [366, -0.25, 0.3, 1], [376, -0.4, 0.2, 1], [393.5, -0.5, 0.15, 1]];
const SH_PR_P0 = [0.34, 0.07, -0.24];

function shProtonP(t) { return [SH_PR_P0[0] + noise1(t * 0.9, 1) * 0.05, SH_PR_P0[1] + noise1(t * 0.8, 2) * 0.05, SH_PR_P0[2] + noise1(t * 0.85, 3) * 0.05]; }
// the other two quarks race round the proton's centre; the junction of the gluon 'Y' sits between all three
function shQuarks(t) {
  const P = shProtonP(t), q = [[0, 0, 0]];
  for (let k = 0; k < 2; k++) {
    const a = t * (2.1 + k * 0.7) + k * 2.6, b = t * (1.3 + k * 0.5) + k;
    q.push([P[0] + Math.cos(a) * Math.cos(b * 0.6) * 0.42, P[1] + Math.sin(b) * 0.3, P[2] + Math.sin(a) * Math.cos(b * 0.6) * 0.42]);
  }
  const J = [(q[0][0] + q[1][0] + q[2][0]) / 3 + noise1(t * 2, 7) * 0.05, (q[0][1] + q[1][1] + q[2][1]) / 3 + noise1(t * 2, 8) * 0.05, (q[0][2] + q[1][2] + q[2][2]) / 3 + noise1(t * 2, 9) * 0.05];
  return { P, q, J };
}
function shProtonCam(t, h) {
  const d = t < 371 ? Math.pow(10, shSpline(SH_PR_D, t)[0]) : 0, v = shN3(shKey(SH_PR_V, t));
  const dd = t < 371 ? d : 4.2 * h;
  // blend into the 4-heights rule smoothly
  const k = shE(t, 368, 372), D = t < 368 ? dd : Math.exp(shLerp(Math.log(Math.pow(10, shSpline(SH_PR_D, Math.min(t, 371))[0])), Math.log(4.2 * h), k));
  const p = [v[0] * D, v[1] * D, v[2] * D];
  return { p, D };
}

SH_WORLDS.proton = (app) => {
  const W = shMakeWorld(60), R = W.root;
  W.scene.background = new THREE.Color('#030206');
  const QC = [new THREE.Color('#ff3b2e'), new THREE.Color('#2eff6a'), new THREE.Color('#3a6bff')];

  // ---- the storm: a ray-marched glow inside a sphere round the proton (from outside or from within)
  const U = {
    uS: { value: 1 }, uCam: { value: new THREE.Vector3() }, uP: { value: new THREE.Vector3() }, uJ: { value: new THREE.Vector3() },
    uQ: { value: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()] }, uQC: { value: QC }, uT: { value: 0 }, uH: { value: 1 }, uK: { value: 1 }, uTube: { value: 1 }, uOut: { value: 1 }, uHalo: { value: 1 },
  };
  const stormM = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    vertexShader: /* glsl */`uniform float uS; varying vec3 vF; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vF = w.xyz / uS; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCam, uP, uJ, uQ[3], uQC[3]; uniform float uT, uH, uK, uTube, uOut, uHalo; varying vec3 vF;
      float hh(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
      float vn(vec3 p){ vec3 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hh(i), hh(i + vec3(1,0,0)), u.x), mix(hh(i + vec3(0,1,0)), hh(i + vec3(1,1,0)), u.x), u.y),
                   mix(mix(hh(i + vec3(0,0,1)), hh(i + vec3(1,0,1)), u.x), mix(hh(i + vec3(0,1,1)), hh(i + vec3(1,1,1)), u.x), u.y), u.z); }
      float segD(vec3 p, vec3 a, vec3 b){ vec3 ab = b - a; float k = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0); return length(p - a - ab * k); }
      void main(){
        vec3 o = uCam, d = normalize(vF - o), oc = o - uP; float R = 0.95;
        float b = dot(oc, d), c = dot(oc, oc) - R * R, disc = b * b - c; if (disc < 0.0) discard;
        float sq = sqrt(disc), t0 = max(-b - sq, 0.0), t1 = -b + sq; if (t1 <= 0.0) discard;
        // steps spaced geometrically from just in front of you (so detail near you is sampled when you are tiny)
        float e = max(uH * 0.25, 1e-7), L = t1 - t0; vec3 acc = vec3(0.0); float prev = 0.0;
        for (int i = 1; i <= 34; i++) {
          float u = float(i) / 34.0, s = (e * (pow(1.0 + L / e, u) - 1.0)); float ds = s - prev; prev = s;
          vec3 p = o + d * (t0 + s);
          float rr = length(p - uP), edge = smoothstep(R, R * 0.55, rr);
          vec3 w = p * 2.6 + vec3(0.0, uT * 1.6, uT * 0.7);
          float n = vn(w) * 0.5 + vn(w * 2.1 + 3.1 + uT * 0.4) * 0.27 + vn(w * 4.3 + 7.7 - uT * 0.6) * 0.15 + vn(w * 8.9 + 1.3) * 0.08 + vn(w * 18.0 + 5.0 + uT) * 0.05;
          float vein = 1.0 - abs(2.0 * vn(w * 1.7 + 19.0 + uT * 0.8) - 1.0); vein = pow(vein, 7.0);
          float storm = (pow(max(n - 0.4, 0.0) * 1.9, 2.0) * 0.6 + vein * 1.1) * edge;
          // the gluon 'Y': flux tubes from each quark to the junction, writhing
          float tube = 0.0; vec3 tc = vec3(0.0);
          for (int k = 0; k < 3; k++) {
            vec3 wig = vec3(sin(p.y * 9.0 + uT * 5.0 + float(k)), sin(p.z * 8.0 + uT * 4.3 + float(k) * 2.0), sin(p.x * 8.5 + uT * 4.7)) * 0.025;
            float dd = segD(p + wig, uQ[k], uJ); float g = exp(-dd * dd / 0.0016) * uTube * 1.6; tube += g; tc += uQC[k] * g;
          }
          // colour: the field takes the colour of the nearest quark, white where they mix
          vec3 wq = vec3(exp(-dot(p - uQ[0], p - uQ[0]) / 0.09), exp(-dot(p - uQ[1], p - uQ[1]) / 0.09), exp(-dot(p - uQ[2], p - uQ[2]) / 0.09)) + 0.18;
          vec3 fc = (uQC[0] * wq.x + uQC[1] * wq.y + uQC[2] * wq.z) / (wq.x + wq.y + wq.z);
          fc = mix(fc, vec3(1.0, 0.9, 0.8), 0.1 + 0.22 * vn(w * 0.7 + 11.0));
          fc = mix(fc, vec3(1.0, 0.5, 0.3), uOut);   // seen from outside it still looks like the nucleus's proton
          float halo = 0.0; vec3 hc = vec3(0.0);
          for (int k = 0; k < 3; k++) { float g = min(exp(-length(p - uQ[k]) / 0.05) * 1.4, 1.2) * uHalo; halo += g; hc += uQC[k] * g; }
          acc += (fc * storm * 1.2 + (tc * 0.7 + vec3(0.3) * tube) * 1.4 + hc) * ds;
        }
        gl_FragColor = vec4(acc * uK * 0.8, 1.0);
      }`,
  });
  const storm = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), stormM); storm.frustumCulled = false; R.add(storm);

  // ---- the quarks themselves: points that never grow (a quark has no size anyone has measured)
  const qg = new THREE.BufferGeometry(); qg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3)); qg.setAttribute('color', new THREE.BufferAttribute(new Float32Array([1, 0.35, 0.28, 0.3, 1, 0.45, 0.35, 0.5, 1]), 3));
  const qm = new THREE.ShaderMaterial({
    uniforms: { uPx: { value: 1 }, uOp: { value: 1 } }, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, vertexColors: true,
    vertexShader: 'uniform float uPx; varying vec3 vC; void main(){ vC = color; gl_PointSize = 96.0 * uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uOp; varying vec3 vC; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = length(q); if (r > 1.0) discard; float core = smoothstep(0.13, 0.03, r), halo = exp(-r * 5.0); gl_FragColor = vec4((vec3(1.0) * core * 2.0 + vC * halo * 1.4) * uOp, 1.0); }',
  });
  const quarks = new THREE.Points(qg, qm); quarks.frustumCulled = false; quarks.renderOrder = 8; R.add(quarks);

  // ---- quark–antiquark pairs: born from the field, fly apart, meet again and vanish (a flash)
  const NP = 260, pp = new Float32Array(NP * 2 * 3), pc = new Float32Array(NP * 2 * 3), pa = new Float32Array(NP * 2);
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pp, 3)); pg.setAttribute('color', new THREE.BufferAttribute(pc, 3)); pg.setAttribute('a', new THREE.BufferAttribute(pa, 1));
  const pm = new THREE.ShaderMaterial({
    uniforms: { uPx: { value: 1 } }, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, vertexColors: true,
    vertexShader: 'attribute float a; uniform float uPx; varying vec3 vC; varying float vA; void main(){ vC = color; vA = a; gl_PointSize = (10.0 + 26.0 * max(a - 1.0, 0.0)) * uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec3 vC; varying float vA; void main(){ vec2 q = gl_PointCoord * 2.0 - 1.0; float r = length(q); if (r > 1.0) discard; gl_FragColor = vec4(vC * exp(-r * 4.0) * min(vA, 1.0) * 1.3 + vec3(1.0) * max(vA - 1.0, 0.0) * exp(-r * 3.0), 1.0); }',
  });
  const pairs = new THREE.Points(pg, pm); pairs.frustumCulled = false; pairs.renderOrder = 7; R.add(pairs);
  const anti = [[0, 1, 1], [1, 0, 1], [1, 1, 0]], cols = [[1, 0.3, 0.25], [0.3, 1, 0.4], [0.35, 0.5, 1]];

  const _v = new THREE.Vector2();
  const api = {
    scene: W.scene, camera: W.camera, W, storm, quarks, pairs,
    frame(t, h, app) {
      const hF = h * 1e15, s = W.setH(hF), cam = shProtonCam(t, hF), Qs = shQuarks(t);
      // look: at the proton's centre, then at the quark
      const tgt = shMix3(Qs.P, [0, 0, 0], shE(t, 362, 371.5));
      let dir = shN3([tgt[0] - cam.p[0], tgt[1] - cam.p[1], tgt[2] - cam.p[2]]);
      const [yw, pt] = shYP(dir);
      dir = shDir(yw + 0.35 * Math.sin(t * 0.21) * shWin(t, 353, 368, 2, 2), pt + 0.12 * Math.sin(t * 0.17) * shWin(t, 353, 368, 2, 2));
      W.lookDir(cam.p, dir, noise1(t * 0.3, 4) * 0.06);
      W.camera.fov = 60; shClip(W.camera, 0.04, 1e7);
      const px = app.renderer.getDrawingBufferSize(_v).y / 1080;
      // the storm
      U.uS.value = s; U.uCam.value.set(...cam.p); U.uP.value.set(...Qs.P); U.uJ.value.set(...Qs.J); Qs.q.forEach((q, i) => U.uQ.value[i].set(...q));
      U.uT.value = t; U.uH.value = hF;
      U.uK.value = 1.0 * (1 + 0.35 * shWin(t, 361, 366, 1.0, 1.5)) * (1 - 0.6 * shE(t, 371, 377)) * (1 - 0.9 * shE(t, 386, 391));
      U.uOut.value = 0.75 * (1 - shE(t, 349.5, 354)); U.uHalo.value = 1 - 0.85 * shE(t, 369, 374);
      storm.position.set(...Qs.P); storm.scale.setScalar(0.95);
      // the quarks
      const qp = qg.attributes.position; Qs.q.forEach((q, i) => qp.setXYZ(i, ...q)); qp.needsUpdate = true;
      qm.uniforms.uPx.value = px; qm.uniforms.uOp.value = 1;
      // the pairs (each lives ~0.5 s: born together, apart, together again, a flash)
      const life = 0.55;
      for (let i = 0; i < NP; i++) {
        const ph0 = hash1(i * 3 + 1) * life, k = Math.floor((t + ph0) / life), u = (t + ph0) / life - k, sd = i * 131 + k * 7919;
        const r = Math.cbrt(hash1(sd + 1)) * 0.85, th = hash1(sd + 2) * 6.283, ct = hash1(sd + 3) * 2 - 1, st = Math.sqrt(1 - ct * ct);
        const c = [Qs.P[0] + st * Math.cos(th) * r, Qs.P[1] + ct * r, Qs.P[2] + st * Math.sin(th) * r];
        const dth = hash1(sd + 4) * 6.283, dct = hash1(sd + 5) * 2 - 1, dst = Math.sqrt(1 - dct * dct), sep = Math.sin(u * Math.PI) * 0.09 * (0.5 + hash1(sd + 6));
        const dv = [dst * Math.cos(dth) * sep, dct * sep, dst * Math.sin(dth) * sep], ci = Math.floor(hash1(sd + 7) * 3);
        const a = Math.min(1, u * 8) * (u < 0.9 ? 1 : 1 + (u - 0.9) * 10 * (1 - (u - 0.9) * 10) * 4);
        pp.set([c[0] + dv[0], c[1] + dv[1], c[2] + dv[2], c[0] - dv[0], c[1] - dv[1], c[2] - dv[2]], i * 6);
        pc.set([...cols[ci], ...anti[ci]], i * 6); pa[i * 2] = pa[i * 2 + 1] = a * (1 - shE(t, 384, 389));
      }
      pg.attributes.position.needsUpdate = true; pg.attributes.color.needsUpdate = true; pg.attributes.a.needsUpdate = true; pm.uniforms.uPx.value = px;
      if (window.SH_DBG && SH_DBG.proton) SH_DBG.proton(api, t, h);
    },
    grade(t, p) {
      p.saturation = 1.08; p.contrast = 1.06; p.bloom = 0.75; p.bloomThreshold = 0.7; p.grain = 0.03; p.vignette = 0.65; p.soft = 0.04;
      p.warmth = 0.0; p.exposure = 1.0; p.ao = 0; p.blackLift = 0.004;
    },
  };
  return api;
};
