/* =====================================================================
   SKY — the storm: its cloud base (1.3 km up, lit from inside by every flash), the last of the twilight in a slot low
   in the west-north-west, the lightning channels, the rain. All pure functions of t and s.
     sfStormSky(scene)  the dome (a shader: the cloud base in perspective, the slot, the flashes)
     sfBolts(scene)     the lightning channels: thin bright ribbons (added light), each strike's shape from its seed
     sfRain(scene)      streaks round the camera (lit by the flashes, sparkling in the torch beam)
   ===================================================================== */

const SF_NOISE_GLSL = `
  float sfH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float sfN(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(sfH(i), sfH(i + vec2(1.0, 0.0)), u.x), mix(sfH(i + vec2(0.0, 1.0)), sfH(i + vec2(1.0, 1.0)), u.x), u.y); }
  float sfF(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * sfN(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return v; }`;

function sfStormSky(scene) {
  const NF = 6;
  const U = { uCam: { value: new THREE.Vector3() }, uT: { value: 0 }, uSlot: { value: 1 }, uSlotDir: { value: new THREE.Vector2(SF_SUN[0], SF_SUN[2]).normalize() },
    uFl: { value: Array.from({ length: NF }, () => new THREE.Vector4()) }, uFlK: { value: Array.from({ length: NF }, () => 0) }, uAmb: { value: 0 }, uDark: { value: 1 }, uFunnel: { value: new THREE.Vector3(0, 0, -1e6) }, uGreen: { value: 0 } };
  const m = new THREE.Mesh(new THREE.SphereGeometry(5000, 64, 32), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: U,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: `uniform vec3 uCam; uniform float uT, uSlot, uAmb, uDark, uGreen; uniform vec2 uSlotDir; uniform vec4 uFl[${NF}]; uniform float uFlK[${NF}]; uniform vec3 uFunnel; varying vec3 vD;
      ${SF_NOISE_GLSL}
      void main(){
        vec3 D = normalize(vD); float e = D.y;
        vec2 h = normalize(D.xz + vec2(1e-5, 0.0));
        // the horizon: dark blue-grey; the slot of twilight under the storm, low in the west-north-west
        float sd = dot(h, uSlotDir), slot = smoothstep(0.55, 0.98, sd) * smoothstep(0.075, 0.0, e) * smoothstep(-0.02, 0.004, e);
        float slotN = 0.6 + 0.4 * sfF(vec2(atan(h.x, -h.y) * 9.0, e * 60.0));
        vec3 hor = vec3(0.045, 0.05, 0.068);
        hor += uSlot * slot * slotN * mix(vec3(0.95, 0.36, 0.12), vec3(1.0, 0.62, 0.3), smoothstep(0.02, 0.0, e)) * 0.9;
        vec3 col = hor;
        if (e > 0.0) {
          float t = (1300.0 - uCam.y) / max(e, 0.012); vec2 P = uCam.xz + D.xz * t; float dist = t * length(D.xz);
          float n = sfF(P * 0.00055 + vec2(uT * 0.0025, -uT * 0.0012)), n2 = sfF(P * 0.0021 + vec2(5.2, 1.3) + vec2(uT * 0.006, 0.0)), n3 = sfF(P * 0.008 + 3.1);
          // the cloud base: lumpy, darkest overhead, scud lower and lighter
          float lum = 0.3 + 1.15 * n + 0.55 * (n2 - 0.5) + 0.22 * (n3 - 0.5);
          lum *= 0.75 + 0.5 * smoothstep(0.35, 0.75, sfF(P * 0.00018 + vec2(-uT * 0.001, 3.3)));   // the storm's big rolls
          vec3 cl = vec3(0.052, 0.06, 0.078) * lum;
          cl = mix(cl, cl * vec3(0.85, 1.1, 0.95), uGreen);
          // the twilight's underglow on the base, towards the slot
          cl += uSlot * vec3(0.32, 0.12, 0.05) * pow(max(sd, 0.0), 6.0) * smoothstep(1500.0, 12000.0, dist) * (0.4 + 0.8 * n2);
          // each flash lights the base round it (wider for those inside the cloud), brightest in its thin parts
          for (int i = 0; i < ${NF}; i++) { float k = uFlK[i]; if (k <= 0.0) continue; vec4 f = uFl[i]; float d = length(P - f.xy);
            float th = pow(clamp(n2 * 1.25 - 0.1, 0.0, 1.0), 2.6) * (0.6 + 0.8 * n3);
            cl += k * vec3(0.66, 0.7, 1.0) * (exp(-d * d / (f.z * f.z)) * (0.06 + 1.25 * th) * 0.75 + 0.05 * exp(-d / (f.z * 5.0)) * (0.5 + n)); }
          cl += uAmb * vec3(0.42, 0.44, 0.6) * (0.5 + 0.7 * n);
          // far off the base meets the horizon haze
          col = mix(cl, hor + uAmb * vec3(0.2, 0.21, 0.28), smoothstep(5000.0, 26000.0, dist) * 0.85 + smoothstep(0.03, 0.0, e) * 0.15);
          // rain shafts hanging under the base far off: grey veils, darker where the rain is heaviest
          float az = atan(h.x, -h.y), sh = sfF(vec2(az * 14.0, uT * 0.01)) * sfF(vec2(az * 41.0 + 7.0, 2.0));
          col = mix(col, col * 0.55 + vec3(0.012, 0.013, 0.017) * (1.0 + 6.0 * uAmb), smoothstep(0.22, 0.42, sh) * smoothstep(0.1, 0.01, e) * 0.8);
        } else col = mix(hor, vec3(0.02, 0.022, 0.03), smoothstep(0.0, -0.08, e));
        gl_FragColor = vec4(col * uDark, 1.0);
      }`,
  }));
  m.renderOrder = -10; m.frustumCulled = false; scene.add(m);
  return { mesh: m, U, NF };
}

// ---------------------------------------------------------------------------------------------------------------------
// THE CHANNELS: per strike, a jagged channel (and branches; in-cloud crawlers along the base) from its seed; drawn as
// ribbons a fixed few pixels wide or wider (near), added light (HDR: the bloom makes their glow)
// ---------------------------------------------------------------------------------------------------------------------
function sfBoltPath(k) {
  const r = new RNG(k.seed + 17), segs = [];   // [ax, ay, az, bx, by, bz, w]
  const gy = sfGroundY(k.x, k.z);
  const walk = (p, dir, n, step, jit, w, down) => { const pts = [p.slice()]; let dx = dir[0], dz = dir[2], q = p.slice();
    for (let i = 0; i < n; i++) { dx += r.range(-jit, jit); dz += r.range(-jit, jit); dx *= 0.82; dz *= 0.82; q = [q[0] + (dir[0] * step + dx * step), q[1] + dir[1] * step * r.range(0.6, 1.3), q[2] + (dir[2] * step + dz * step)]; if (down && q[1] < gy) q[1] = gy; pts.push(q.slice()); }
    for (let i = 1; i < pts.length; i++) segs.push([...pts[i - 1], ...pts[i], w * (1 - 0.5 * i / pts.length)]); return pts; };
  if (k.key === 'long') {
    const P = SFP.longBolt.pts, pts = P.map((p, i) => [p[0] + (i < 61 ? r.range(-14, 14) * Math.sin(i * 0.4) : r.range(-30, 30)), p[1] + (i < 61 ? 0 : r.range(-20, 20)), p[2] + (i < 61 ? r.range(-14, 14) : r.range(-30, 30))]);
    pts[0] = [k.x, gy, k.z];
    for (let i = 1; i < pts.length; i++) { if (i % 2 && i > 61) continue; segs.push([...pts[i - 1], ...pts[i], i < 61 ? 1 : 0.7]); }
    for (let b = 0; b < 9; b++) { const i = 70 + b * 20, p = pts[Math.min(i, pts.length - 1)]; walk(p, [r.range(-1, 1), -0.25, r.range(-1, 1)], 10, 40, 0.5, 0.4, true); }
    return segs;
  }
  if (k.kind === 'ic') {   // crawlers along the cloud base
    for (let b = 0; b < 5; b++) { const a = r.range(0, 6.283); walk([k.x + r.range(-300, 300), k.top - 15, k.z + r.range(-300, 300)], [Math.cos(a), 0, Math.sin(a)], 14 + r.int(0, 10), 55, 0.6, 0.45, false); }
    return segs;
  }
  const top = [k.x + r.range(-120, 120), k.top, k.z + r.range(-120, 120)], end = k.key === 'yard' ? [SF_F.yardLight.x, SF_F.yardLight.h + 0.2, SF_F.yardLight.z + 1.4] : [k.x, gy, k.z];
  // the main channel: a random walk down, pulled so it ends exactly on its ground point
  const n = 46, pts = [top]; let ox = 0, oz = 0;
  for (let i = 1; i <= n; i++) { ox += r.range(-1, 1) * 22; oz += r.range(-1, 1) * 22; ox *= 0.9; oz *= 0.9; const u = i / n, w = Math.sin(Math.PI * u); pts.push([top[0] + (end[0] - top[0]) * u + ox * w, top[1] + (end[1] - top[1]) * u + r.range(-6, 6) * w, top[2] + (end[2] - top[2]) * u + oz * w]); }
  pts[n] = end;
  for (let i = 1; i <= n; i++) segs.push([...pts[i - 1], ...pts[i], 1]);
  const nb = 3 + r.int(0, 4);
  for (let b = 0; b < nb; b++) { const i = r.int(3, Math.floor(n * 0.7)), p = pts[i], a = r.range(0, 6.283); walk(p, [Math.cos(a) * 0.7, -0.8, Math.sin(a) * 0.7], 6 + r.int(0, 10), 26, 0.5, 0.45, true); }
  for (let b = 0; b < 3; b++) { const a = r.range(0, 6.283); walk([top[0], k.top - 10, top[2]], [Math.cos(a), 0.02, Math.sin(a)], 8 + r.int(0, 6), 60, 0.6, 0.3, false); }
  return segs;
}
function sfBolts(scene) {
  const meshes = new Map();
  const vs = `attribute vec3 aB; attribute vec3 aS; uniform vec2 uRes; uniform float uMinPx; varying float vS; varying float vW;
    void main(){ vec4 pa = projectionMatrix * viewMatrix * vec4(position, 1.0), pb = projectionMatrix * viewMatrix * vec4(aB, 1.0);
      if (pa.w < 0.5 && pb.w < 0.5) { gl_Position = vec4(0.0, 0.0, -2.0, 1.0); return; }
      if (pa.w < 0.5) pa = mix(pb, pa, (pb.w - 0.5) / (pb.w - pa.w)); if (pb.w < 0.5) pb = mix(pa, pb, (pa.w - 0.5) / (pa.w - pb.w));
      vec4 p = aS.y < 0.5 ? pa : pb; vec2 sa = pa.xy / pa.w * uRes, sb = pb.xy / pb.w * uRes; vec2 d = sb - sa; float L = length(d); vec2 dir = L > 1e-4 ? d / L : vec2(1.0, 0.0), nrm = vec2(-dir.y, dir.x);
      float focal = projectionMatrix[1][1] * uRes.y; float px = max(uMinPx, aS.z * 2.2 * focal / p.w) * 3.0;
      vec2 off = nrm * aS.x * px + dir * (aS.y < 0.5 ? -1.0 : 1.0) * px * 0.3; p.xy += off / uRes * p.w; vS = aS.x; vW = aS.z; gl_Position = p; }`;
  const fs = `uniform float uI; uniform vec3 uCol; varying float vS; varying float vW;
    void main(){ float a = abs(vS); float core = exp(-a * a * 30.0), glow = exp(-a * 4.0) * 0.22; gl_FragColor = vec4(uCol * uI * (core * 1.6 + glow) * (0.45 + 0.55 * vW), 1.0); }`;
  const res = new THREE.Vector2(1920, 1080);
  function get(k) {
    if (meshes.has(k)) return meshes.get(k);
    const segs = sfBoltPath(k), P = [], B = [], Sx = [], idx = [];
    segs.forEach((g, i) => { for (const [sx, e] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { P.push(g[0], g[1], g[2]); B.push(g[3], g[4], g[5]); Sx.push(sx, e, g[6]); } const b = i * 4; idx.push(b, b + 1, b + 2, b, b + 2, b + 3); });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('aB', new THREE.Float32BufferAttribute(B, 3)); geo.setAttribute('aS', new THREE.Float32BufferAttribute(Sx, 3)); geo.setIndex(idx);
    const mat = new THREE.ShaderMaterial({ uniforms: { uI: { value: 0 }, uCol: { value: new THREE.Color(0.85, 0.86, 1.0) }, uRes: { value: res }, uMinPx: { value: 1.3 } }, vertexShader: vs, fragmentShader: fs, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = 4; m.visible = false; scene.add(m);
    meshes.set(k, m); return m;
  }
  return {
    res,
    // the channel's own brightness: each stroke, then a slower afterglow (it reads for a few frames at 30 fps)
    update(s, rh) {
      res.set(rh * 16 / 9, rh);
      for (const m of meshes.values()) m.visible = false;
      for (const k of SF_STRIKES) {
        if (k.s > s + 0.01) break; const u = s - k.s; if (u > k.dur + 0.25) continue;
        let v = 0; for (const [dt, a] of k.pulses) { const w = u - dt; if (w >= -0.005) v = Math.max(v, a * Math.exp(-Math.max(0, w) / 0.075)); }
        v = Math.max(v, 0.2 * (1 - MathX.smooth(u, k.dur - 0.1, k.dur + 0.2)));
        if (v < 0.01) continue;
        const m = get(k); m.visible = true; m.material.uniforms.uI.value = v * (k.kind === 'ic' ? 0.7 : 2.4) * Math.min(1.5, k.amp);
      }
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// RAIN: streaks in a box round the camera, falling and blown (a pure function of t); lit by the scene's light, the
// flashes and the torch
// ---------------------------------------------------------------------------------------------------------------------
function sfRain(scene, N = 3000) {
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1);
  g.index = q.index; g.setAttribute('position', q.attributes.position);
  const seed = new Float32Array(N * 4), r = new RNG(909); for (let i = 0; i < N * 4; i++) seed[i] = r.next();
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4)); g.instanceCount = N;
  const U = { uT: { value: 0 }, uCam: { value: new THREE.Vector3() }, uV: { value: new THREE.Vector3(0, -9, 0) }, uBox: { value: new THREE.Vector3(26, 18, 26) }, uLight: { value: new THREE.Color(0.05, 0.055, 0.07) },
    uFlash: { value: 0 }, uTP: { value: new THREE.Vector3() }, uTD: { value: new THREE.Vector3(0, 0, -1) }, uTI: { value: 0 }, uA: { value: 0.5 }, uRes: { value: new THREE.Vector2(1920, 1080) }, uN: { value: 1 } };
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `attribute vec4 aSeed; uniform float uT, uN; uniform vec3 uCam, uV, uBox; uniform vec2 uRes; uniform vec3 uTP, uTD; uniform float uTI; varying float vA; varying float vS; varying float vL;
      void main(){ if (aSeed.w > uN) { gl_Position = vec4(0.0, 0.0, -2.0, 1.0); return; }
        vec3 o = uCam - uBox * 0.5; vec3 p = mod(aSeed.xyz * uBox + uV * (uT + aSeed.w * 7.0) - o, uBox) + o;
        vec3 b = p - uV * 0.04;
        vec4 pa = projectionMatrix * viewMatrix * vec4(p, 1.0), pb = projectionMatrix * viewMatrix * vec4(b, 1.0);
        if (pa.w < 0.2 || pb.w < 0.2) { gl_Position = vec4(0.0, 0.0, -2.0, 1.0); return; }
        vec4 P = position.y > 0.0 ? pa : pb; vec2 d = (pb.xy / pb.w - pa.xy / pa.w) * uRes; float L = length(d); vec2 n = L > 1e-4 ? vec2(-d.y, d.x) / L : vec2(1.0, 0.0);
        float focal = projectionMatrix[1][1] * uRes.y * 0.5, px = max(0.9, 0.004 * focal / P.w);
        P.xy += n * position.x * px * 2.0 / uRes * P.w; gl_Position = P;
        vec3 tv = p - uTP; float tl = length(tv), tc = dot(tv / max(tl, 1e-3), uTD);
        vL = uTI * smoothstep(0.93, 0.985, tc) / (1.0 + tl * tl * 0.02);
        vA = smoothstep(0.3, 1.5, P.w) * (1.0 - smoothstep(10.0, 13.0, P.w)); vS = position.x; }`,
    fragmentShader: `uniform vec3 uLight; uniform float uFlash, uA; varying float vA; varying float vS; varying float vL;
      void main(){ float a = 1.0 - abs(vS) * 2.0; gl_FragColor = vec4((uLight * 3.0 + vec3(0.6, 0.62, 0.8) * uFlash + vec3(1.0, 0.92, 0.75) * vL) * uA * vA * a, 1.0); }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 6; scene.add(m);
  return { mesh: m, U };
}
