/* =====================================================================
   RAIN — scene 10's weather on the city set (city.js). A pure function of time, like everything else:
     streaks    falling drops in two boxes (one around the camera, one around what it looks at). The boxes wrap but
                the drops are world-fixed (they do not slide with the camera); slanted by the wind; drawn at least a
                pixel wide (fainter, not thinner, with distance). In slow motion they shorten to round drops.
     splashes   a ripple ring and a few droplets thrown up from the crown, at hashed spots that change every cycle:
                on the ground (the road is 0.15 m lower; none inside buildings or under the arcade roof) or on any
                group's local rectangle (a rail, an umbrella, leaves). In the sound view they draw as small amber
                rings: every impact is a sound.
     the front  a sheet of heavier rain that sweeps the street (denser, brighter streaks and splashes in a band)
   BeRain.update(t, cam, o): o = { k (0…1 intensity), rt (rain time: slowed in slow-motion shots), rate (the slow-mo
   rate: shortens the streaks), wind: [x, z] m/s, front: [x, width, amount], ac (0…1 sound view), center }
   ===================================================================== */
const BE_RAIN_GLSL = /* glsl */`
  float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
  vec2 h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
  // the street's ground height: the road is 0.15 m below the pavements (the side street too, except her raised crossing)
  float groundY(vec2 p){ bool side = p.x > 30.0 && p.x < 40.0; bool road = abs(p.y) < 7.0 || (side && abs(p.y) > 12.0); bool table = side && p.y > 7.0 && p.y < 12.0; return (road && !table) ? -0.15 : 0.0; }
  // under a roof (inside the buildings, under the arcade): no rain below roof height
  bool covered(vec3 p){ bool gap = p.x > 27.0 && p.x < 43.0; return !gap && abs(p.z) > 11.9 && p.y < 12.0; }
`;

class BeRain {
  constructor(scene) {
    this.group = new THREE.Group(); this.group.name = 'beRain'; scene.add(this.group);
    this.near = this._streaks(16000, [6.5, 9, 6.5]);
    this.far = this._streaks(16000, [30, 26, 30]);
    this.ground = this._splashes(3200, 5, true);
    // drips off the arcade roof's edge (a thin slab of slower, sparser drops along z = 11.84, only where the arcade is)
    this.drip = this._streaks(700, [10, 4.35, 0.025]); this.drip.u.uClip.value.set(43.2, 160); this.drip.u.uSpeed.value = 6.5;
    this.curtain = this._curtain();
    this.layers = [this.near, this.far, this.ground, this.drip, this.curtain];
    this.local = [];
  }
  // ---- streaks
  _streaks(n, box) {
    const q = new THREE.InstancedBufferGeometry(), r = new RNG(5101 + n);
    q.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); q.setIndex([0, 1, 2, 0, 2, 3]);
    const s = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) s[i] = r.next();
    q.setAttribute('aS', new THREE.InstancedBufferAttribute(s, 4)); q.instanceCount = n;
    const u = { uT: { value: 0 }, uSpeed: { value: 8.5 }, uLen: { value: 0.3 }, uW: { value: 0.004 }, uDens: { value: 0 }, uAlpha: { value: 0.32 }, uPx: { value: 0.001 },
      uC: { value: new THREE.Vector3() }, uBox: { value: new THREE.Vector3(...box) }, uWind: { value: new THREE.Vector2(0.6, 0.25) }, uFront: { value: new THREE.Vector4(0, 10, 0, 0) },
      uCol: { value: new THREE.Color('#e9eff4').multiplyScalar(0.8) }, uFog: { value: 0.012 }, uClip: { value: new THREE.Vector2(-1e4, 1e4) } };
    // additive: a falling drop catches the light (it brightens what is behind it, it never darkens it)
    const m = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: BE_RAIN_GLSL + /* glsl */`
        attribute vec4 aS; uniform float uT, uSpeed, uLen, uW, uDens, uAlpha, uPx, uFog; uniform vec3 uC, uBox; uniform vec2 uWind, uClip; uniform vec4 uFront;
        varying float vA; varying vec2 vQ;
        void main(){
          float W = 2.0 * uBox.x, D = 2.0 * uBox.z, H = uBox.y;
          float x = uC.x - uBox.x + mod(aS.x * W - (uC.x - uBox.x), W), z = uC.z - uBox.z + mod(aS.z * D - (uC.z - uBox.z), D);
          float sp = uSpeed * (0.85 + 0.3 * aS.w), fall = mod(aS.y * H + sp * uT, H);
          vec3 head = vec3(x + uWind.x * (fall / sp - 0.5 * H / sp), -0.2 + H - fall, z + uWind.y * (fall / sp - 0.5 * H / sp));
          vec3 dir = normalize(vec3(uWind.x, -sp, uWind.y));
          float fr = uFront.w * exp(-((head.x - uFront.x) * (head.x - uFront.x)) / (uFront.y * uFront.y));
          float keep = step(fract(aS.w * 13.37 + aS.y * 7.13 + aS.x * 3.1), uDens + (1.0 - uDens) * fr);
          if (covered(head) || head.x < uClip.x || head.x > uClip.y) keep = 0.0;
          vec3 toC = cameraPosition - head; float dist = length(toC);
          vec3 side = normalize(cross(dir, toC / dist));
          float w = max(uW, dist * uPx * 1.1);
          vA = uAlpha * keep * (uW / w) * (1.0 + 1.2 * fr) * smoothstep(0.2, 0.7, dist) * exp(-dist * uFog);
          vQ = vec2(position.x * 2.0, position.y);
          vec3 p = head - dir * (position.y * uLen) + side * (position.x * w);
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uCol; varying float vA; varying vec2 vQ;
        void main(){ float a = vA * (1.0 - abs(vQ.x)) * mix(1.0, 0.25, vQ.y); if (a < 0.003) discard; gl_FragColor = vec4(uCol, a); }`,
    });
    const mesh = new THREE.Mesh(q, m); mesh.frustumCulled = false; mesh.renderOrder = 5; mesh.userData.beSkip = true; this.group.add(mesh);
    return { mesh, u, box };
  }
  // ---- splashes: n rings, each with `drops` droplets. ground: on the street; else on a local rectangle (uO + a uU + b uV)
  _splashes(n, drops, ground) {
    const q = new THREE.InstancedBufferGeometry(), r = new RNG(5203 + n), N = n * (1 + drops);
    q.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); q.setIndex([0, 1, 2, 0, 2, 3]);
    const s = new Float32Array(N * 4), d = new Float32Array(N * 4);
    for (let i = 0; i < n; i++) {
      const S = [r.next(), r.next(), r.next(), r.next()];
      for (let k = 0; k <= drops; k++) { const j = i * (1 + drops) + k; s.set(S, j * 4); d.set(k ? [k / drops, r.next(), r.next(), r.next()] : [-1, 0, 0, 0], j * 4); }
    }
    q.setAttribute('aS', new THREE.InstancedBufferAttribute(s, 4)); q.setAttribute('aD', new THREE.InstancedBufferAttribute(d, 4)); q.instanceCount = N;
    const u = { uT: { value: 0 }, uP: { value: 0.45 }, uLife: { value: 0.2 }, uDens: { value: 0 }, uSize: { value: 0.045 }, uAc: { value: 0 }, uPx: { value: 0.001 }, uAlpha: { value: 0.55 },
      uC: { value: new THREE.Vector3() }, uHalf: { value: new THREE.Vector2(16, 16) }, uFront: { value: new THREE.Vector4(0, 10, 0, 0) }, uGround: { value: ground ? 1 : 0 },
      uCone: { value: new THREE.Vector2() }, uO: { value: new THREE.Vector3() }, uU: { value: new THREE.Vector3(1, 0, 0) }, uV: { value: new THREE.Vector3(0, 0, 1) }, uN: { value: new THREE.Vector3(0, 1, 0) },
      uCol: { value: new THREE.Color('#e8f0f6') }, uAcCol: { value: new THREE.Color('#ffb05a') }, uFog: { value: 0.012 } };
    const m = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -4,
      vertexShader: BE_RAIN_GLSL + /* glsl */`
        attribute vec4 aS, aD; uniform vec2 uCone; uniform float uT, uP, uLife, uDens, uSize, uAc, uPx, uGround, uAlpha, uFog; uniform vec3 uC, uO, uU, uV, uN; uniform vec2 uHalf; uniform vec4 uFront;
        varying vec2 vQ; varying float vU, vA, vKind;
        void main(){
          float life = uLife * (1.0 + 2.5 * uAc);
          float k = uT / uP + aS.z, cyc = floor(k), age = fract(k) * uP, u = age / life;
          vec2 h = h21(vec2(cyc * 1.37 + aS.x * 113.1, aS.y * 71.7 + cyc * 0.113));
          vec3 base, N = uN;
          if (uGround > 0.5) {
            vec2 W = 2.0 * uHalf;
            float x = uC.x - uHalf.x + mod(h.x * W.x - (uC.x - uHalf.x), W.x), z = uC.z - uHalf.y + mod(h.y * W.y - (uC.z - uHalf.y), W.y);
            base = vec3(x, groundY(vec2(x, z)) + 0.004, z); N = vec3(0.0, 1.0, 0.0);
          } else { base = uO + uU * h.x + uV * h.y + uN * 0.002; base.y += uCone.x - uCone.y * length(base.xz); }   // uCone: an umbrella's canopy (apex height, slope)
          vec4 bw = modelMatrix * vec4(base, 1.0);
          float fr = uFront.w * exp(-((bw.x - uFront.x) * (bw.x - uFront.x)) / (uFront.y * uFront.y));
          float keep = step(h11(cyc * 3.71 + aS.w * 91.3), uDens + (1.0 - uDens) * fr) * step(u, 1.0);
          if (uGround > 0.5 && covered(vec3(base.x, 0.1, base.z))) keep = 0.0;
          vec3 T = normalize(abs(N.y) > 0.9 ? cross(N, vec3(1.0, 0.0, 0.0)) : cross(N, vec3(0.0, 1.0, 0.0))), B = cross(N, T);
          vec4 wp; float dist;
          vU = u; vQ = position.xy;
          if (aD.x < 0.0) {     // the ripple ring, flat on the surface
            float R = uSize * (1.0 + 4.0 * uAc) * (0.25 + 0.75 * sqrt(u));
            wp = modelMatrix * vec4(base + (T * position.x + B * position.y) * R, 1.0); vKind = 0.0;
            dist = length(cameraPosition - wp.xyz);
            vA = uAlpha * keep * min(1.0, R / (dist * uPx * 2.0)) * (1.0 + 0.8 * uAc);
          } else {              // a droplet thrown up from the crown (ballistic; seconds of rain time)
            float a = aD.y * 6.2832 + h.x * 2.0, vh = 0.35 + 0.5 * aD.z, vv = 0.7 + 0.6 * aD.w, ta = u * life;
            vec3 c = base + (T * cos(a) + B * sin(a)) * vh * ta + N * (vv * ta - 4.9 * ta * ta);
            vec4 cw = modelMatrix * vec4(c, 1.0);
            dist = length(cameraPosition - cw.xyz);
            float sz = uSize * 0.035 * (0.6 + aD.w), w = max(sz, dist * uPx * 0.8);
            vec3 cr = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), cu = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
            wp = vec4(cw.xyz + (cr * position.x + cu * position.y) * w, 1.0); vKind = 1.0;
            vA = uAlpha * keep * (sz / w) * (sz / w) * 1.6 * (1.0 - uAc) * step(0.0, vv * ta - 4.9 * ta * ta + 0.002);
          }
          vA *= exp(-dist * uFog);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uCol, uAcCol; uniform float uAc; varying vec2 vQ; varying float vU, vA, vKind;
        void main(){
          float r = length(vQ), a;
          if (vKind < 0.5) a = (smoothstep(0.2, 0.0, abs(r - 0.82)) * (1.0 - vU) + (1.0 - uAc) * smoothstep(1.0, 0.0, r) * smoothstep(0.3, 0.0, vU) * 0.6);
          else a = smoothstep(1.0, 0.35, r);
          a *= vA; if (a < 0.004) discard;
          gl_FragColor = vec4(mix(uCol, uAcCol, uAc), a);
        }`,
    });
    const mesh = new THREE.Mesh(q, m); mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.userData.beSkip = true; this.group.add(mesh);
    return { mesh, u };
  }
  // the sheet of heavier rain seen from above (J9a): a few horizontal veils of falling-streak speckle inside the front's band
  _curtain() {
    const g = new THREE.Group(), u = { uT: { value: 0 }, uFront: { value: new THREE.Vector4() }, uWind: { value: new THREE.Vector2(0.7, 0.3) }, uA: { value: 0 } };
    const m = new THREE.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: BE_RAIN_GLSL + /* glsl */`
        uniform float uT, uA; uniform vec4 uFront; uniform vec2 uWind; varying vec3 vW;
        void main(){
          float band = uFront.w * exp(-((vW.x - uFront.x) * (vW.x - uFront.x)) / (uFront.y * uFront.y));
          vec2 p = vW.xz + uWind * (vW.y / 8.5) * 3.0;
          vec2 cell = floor(p / 0.22), f = fract(p / 0.22); float tk = floor(uT * 12.0 + h11(dot(cell, vec2(3.1, 7.3))) * 12.0);
          vec2 h = h21(cell + tk * 0.731);
          vec2 d = f - (0.2 + 0.6 * h); vec2 wd = normalize(uWind + vec2(0.001));
          float along = dot(d, wd), across = dot(d, vec2(-wd.y, wd.x));
          float dash = step(h.x, 0.55) * smoothstep(0.05, 0.0, abs(across)) * smoothstep(0.22, 0.0, abs(along));
          float a = uA * band * (0.12 + 0.55 * dash);
          if (a < 0.004) discard;
          gl_FragColor = vec4(vec3(0.85, 0.88, 0.92), a);
        }`,
    });
    for (const y of [1.2, 4.5, 8.0, 11.5]) { const q = new THREE.Mesh(new THREE.PlaneGeometry(70, 40), m); q.rotation.x = -Math.PI / 2; q.position.y = y; q.userData.beSkip = true; q.renderOrder = 6; g.add(q); }
    g.visible = false; this.group.add(g);
    return { mesh: g, u };
  }
  // splashes on a surface of `parent` (local rectangle o + a u + b v, normal n)
  addSurface(parent, o, uu, vv, n, count = 120, o2 = {}) {
    const L = this._splashes(count, o2.drops ?? 5, false); this.group.remove(L.mesh); parent.add(L.mesh);
    L.u.uO.value.copy(o); L.u.uU.value.copy(uu); L.u.uV.value.copy(vv); L.u.uN.value.copy(n).normalize();
    L.u.uSize.value = o2.size ?? 0.035; if (o2.cone) L.u.uCone.value.set(...o2.cone); L.u.uP.value = o2.period ?? 0.5; L.rate = o2.rate ?? 1; L.only = o2.only;
    this.local.push(L); return L;
  }
  update(t, cam, o) {
    const k = o.k || 0, vis = k > 0.001;
    const px = 2 * Math.tan(cam.fov * Math.PI / 360) / Math.max(400, FILM._app ? FILM._app.renderer.domElement.height : 1080);
    const rt = o.rt ?? t, rate = o.rate ?? 1, ac = o.ac || 0, wind = o.wind || [0.6, 0.25], fr = o.front || [0, 10, 0];
    const at = o.center || cam.position;
    for (const [L, c] of [[this.near, cam.position], [this.far, at]]) {
      const u = L.u; L.mesh.visible = vis && ac < 0.5;
      u.uT.value = rt; u.uDens.value = k * (o.dens ?? 0.6); u.uC.value.copy(c); u.uPx.value = px; u.uWind.value.set(wind[0], wind[1]);
      u.uLen.value = Math.max(0.006, 0.42 * rate); u.uW.value = rate < 0.3 ? 0.003 : 0.004; u.uFront.value.set(fr[0], fr[1], 0, fr[2]); u.uFog.value = o.fog ?? 0.012;
      u.uAlpha.value = (o.alpha ?? 0.55) * (rate < 0.3 ? 1.6 : 1);
    }
    { const D = this.drip.u; this.drip.mesh.visible = vis && ac < 0.5 && (o.drip ?? true); D.uT.value = rt; D.uDens.value = Math.min(1, k * 1.2) * 0.5; D.uC.value.set(cam.position.x, 0, 11.84); D.uPx.value = px;
      D.uLen.value = Math.max(0.006, 0.18 * rate); D.uW.value = 0.007; D.uAlpha.value = 0.85; D.uFog.value = o.fog ?? 0.012; D.uWind.value.set(0, 0); }
    { const Cu = this.curtain.u; this.curtain.mesh.visible = vis && ac < 0.5 && fr[2] > 0.01 && !!o.curtain; Cu.uT.value = rt; Cu.uFront.value.set(fr[0], fr[1] * 1.3, 0, fr[2]); Cu.uA.value = o.curtain || 0;
      this.curtain.mesh.position.set(at.x, 0, at.z); }
    const G = this.ground.u; this.ground.mesh.visible = vis;
    G.uT.value = rt; G.uDens.value = k * (o.splash ?? 0.7); G.uC.value.copy(at); G.uPx.value = px; G.uAc.value = ac; G.uFront.value.set(fr[0], fr[1], 0, fr[2]); G.uFog.value = o.fog ?? 0.012;
    G.uHalf.value.set(o.half ?? 16, o.half ?? 16); G.uAlpha.value = ac > 0.5 ? 0.9 : (o.splashAlpha ?? 0.6); G.uSize.value = 0.045 * (o.splashSize ?? 1);
    this.ground.mesh.material.blending = ac > 0.5 ? THREE.AdditiveBlending : THREE.NormalBlending;
    for (const L of this.local) {
      const u = L.u; L.mesh.visible = vis && (!L.only || L.only(t));
      u.uT.value = rt * L.rate; u.uDens.value = k * 0.8; u.uPx.value = px; u.uAc.value = ac; u.uFog.value = o.fog ?? 0.012; u.uAlpha.value = o.splashAlpha ?? 0.6;
      L.mesh.material.blending = ac > 0.5 ? THREE.AdditiveBlending : THREE.NormalBlending;
    }
  }
  hide() { for (const L of this.layers.concat(this.local)) L.mesh.visible = false; }
}

// an umbrella (a ten-panel canopy, ribs, a shaft, a crook handle) whose handle is at the group's origin
function beUmbrella(col = '#2a3a52') {
  const g = new THREE.Group();
  const cm = new THREE.MeshStandardMaterial({ color: col, roughness: 0.55, side: THREE.DoubleSide, name: 'beCityUmbrellaCloth', flatShading: true });
  const can = new THREE.Mesh(new THREE.ConeGeometry(0.52, 0.2, 10, 1, true), cm); can.position.y = 0.86; can.castShadow = true; g.add(can);
  const mm = gbMat('#2a2b2e', { rough: 0.4, metal: 0.6, name: 'beCityUmbrellaMetal' });
  gbAdd(g, new THREE.CylinderGeometry(0.007, 0.007, 0.92, 6), mm, 0, 0.5, 0);
  gbAdd(g, new THREE.CylinderGeometry(0.012, 0.012, 0.06, 6), mm, 0, 0.98, 0);
  gbAdd(g, new THREE.TorusGeometry(0.035, 0.009, 6, 10, Math.PI), gbMat('#5a3a24', { rough: 0.6, name: 'beCityUmbrellaHandleWood' }), 0.035, 0.03, 0, { rz: Math.PI });
  g.userData.canopy = can;
  return g;
}
