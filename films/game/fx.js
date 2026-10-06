/* =====================================================================
   FX — effects that happen INSIDE the picture (world effects):
     GmBurst      deterministic particles (glass motes, sparks, steam):
                  every position is a closed-form function of time
     GmGlassTouch the first touch: a glow under the palm, rings running
                  out through the glass, motes, the room's light answering
     GmBlast      the left route erupts: steam and sparks out of the door
     GmDrone      the security drone: drops, scans, charges, fires at you
   (Effects on the screen itself — the full-frame ripple, the crack — are
   in screen.js.)
   ===================================================================== */

class GmBurst {
  // spec: n, t0, spread (spawn window), life [a, b], size [a, b] (metres), color, blending, spawn(i, r) → { p, v }, g (gravity), drag, grow
  constructor(scene, spec) {
    this.s = spec; const n = spec.n, r = new RNG(spec.seed || 1);
    this.P = []; for (let i = 0; i < n; i++) { const o = spec.spawn(i, r); o.t = spec.t0 + r.range(0, spec.spread || 0); o.life = r.range(...spec.life); o.size = r.range(...spec.size); o.k = r.next(); this.P.push(o); }
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 3); this.a = new Float32Array(n); this.sz = new Float32Array(n);
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('aA', new THREE.BufferAttribute(this.a, 1)); g.setAttribute('aS', new THREE.BufferAttribute(this.sz, 1));
    this.u = { uColor: { value: new THREE.Color(spec.color) }, uScale: { value: 1000 }, uSoft: { value: spec.soft ?? 0.5 } };
    const m = new THREE.ShaderMaterial({
      uniforms: this.u, transparent: true, depthWrite: false, blending: spec.blending ?? THREE.AdditiveBlending, fog: false,
      vertexShader: 'attribute float aA, aS; uniform float uScale; varying float vA; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.0, aS * uScale / max(0.05, -mv.z)); vA = aA; }',
      fragmentShader: 'uniform vec3 uColor; uniform float uSoft; varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c) * 2.0; float a = (1.0 - smoothstep(1.0 - uSoft, 1.0, d)) * vA; if (a < 0.003) discard; gl_FragColor = vec4(uColor * a, a); }',
    });
    if ((spec.blending ?? THREE.AdditiveBlending) !== THREE.AdditiveBlending) m.fragmentShader = 'uniform vec3 uColor; uniform float uSoft; varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c) * 2.0; float a = (1.0 - smoothstep(1.0 - uSoft, 1.0, d)) * vA; if (a < 0.003) discard; gl_FragColor = vec4(uColor, a); }';
    this.pts = new THREE.Points(g, m); this.pts.frustumCulled = false; this.pts.renderOrder = 6; scene.add(this.pts);
  }
  update(t, cam, renderer) {
    const S = this.s, g = S.g || 0, dr = S.drag || 0;
    const H = renderer.getDrawingBufferSize(this._v2 || (this._v2 = new THREE.Vector2())).y;
    this.u.uScale.value = H / (2 * Math.tan(MathX.deg(cam.fov) / 2));
    let any = false;
    this.P.forEach((o, i) => {
      const u = t - o.t;
      if (u < 0 || u > o.life) { this.a[i] = 0; this.pos[i * 3 + 1] = -100; return; }
      any = true;
      const d = dr > 0 ? (1 - Math.exp(-dr * u)) / dr : u;          // distance factor with drag
      this.pos[i * 3] = o.p.x + o.v.x * d; this.pos[i * 3 + 1] = o.p.y + o.v.y * d - 0.5 * g * u * u; this.pos[i * 3 + 2] = o.p.z + o.v.z * d;
      const k = u / o.life;
      this.a[i] = (S.alpha || 1) * MathX.smooth(k, 0, 0.08) * (1 - MathX.smooth(k, S.fade ?? 0.5, 1)) * (S.twinkle ? 0.6 + 0.4 * Math.sin(u * 40 + o.k * 20) : 1);
      this.sz[i] = o.size * (1 + (S.grow || 0) * k);
    });
    this.pts.visible = any;
    if (any) { const G = this.pts.geometry; G.attributes.position.needsUpdate = true; G.attributes.aA.needsUpdate = true; G.attributes.aS.needsUpdate = true; }
  }
}

/* ---------------- the first touch, on the glass ---------------- */
class GmGlassTouch {
  constructor(app) {
    this.app = app;
    const cam = app.camera;
    // where the contact lands on the glass (the camera does not move during the touch window)
    app.cam.update(GM.touch.contact); cam.updateMatrixWorld(true);
    this.P = GmScreen.onZ(cam, GM_TARGETS.palm.x, GM_TARGETS.palm.y, GF.glassZ + 0.006, new THREE.Vector3());
    // rings that run out through the glass, and a glow under the contact (a plane on the glass, additive)
    this.u = { uT: { value: -1 }, uA: { value: 0 } };
    const m = new THREE.ShaderMaterial({
      uniforms: this.u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */`
        uniform float uT, uA; varying vec2 vP;
        void main(){
          float r = length(vP), a = 0.0;
          // three ring fronts, each a thin bright edge with a soft wake
          for (int i = 0; i < 3; i++) {
            float u = uT - float(i) * 0.12; if (u < 0.0) continue;
            float R = 0.03 + 0.42 * (1.0 - exp(-u * 2.6)), w = 0.004 + 0.012 * u;
            float edge = exp(-pow((r - R) / w, 2.0)), wake = smoothstep(R, R - 0.12, r) * step(r, R) * 0.18;
            a += (edge * 0.6 + wake) * exp(-u * 2.4) * (1.0 - float(i) * 0.3);
          }
          float glow = exp(-r * r / 0.0035) * (0.6 + 0.4 * exp(-uT * 1.4)) * smoothstep(0.0, 0.06, uT) + exp(-r * r / 0.03) * 0.25 * exp(-uT * 1.2);
          float c = (a + glow * 1.6) * uA;
          gl_FragColor = vec4(vec3(0.72, 0.92, 1.0) * c, c);
        }`,
    });
    this.plane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), m); this.plane.position.copy(this.P); this.plane.renderOrder = 5; this.plane.frustumCulled = false; app.scene.add(this.plane);
    // motes that run outward along the glass
    const P = this.P;
    this.motes = new GmBurst(app.scene, { n: 70, seed: 61, t0: GM.touch.contact, spread: 0.18, life: [0.5, 1.1], size: [0.004, 0.009], color: '#bfeaff', drag: 2.2, fade: 0.4, twinkle: true,
      spawn: (i, r) => { const a = r.range(0, Math.PI * 2), s = r.range(0.25, 0.9); return { p: new THREE.Vector3(P.x + Math.cos(a) * 0.02, P.y + Math.sin(a) * 0.02, P.z + 0.002), v: new THREE.Vector3(Math.cos(a) * s, Math.sin(a) * s, r.range(0.0, 0.05)) }; } });
  }
  update(t) {
    const u = t - GM.touch.contact;
    this.u.uT.value = Math.max(0, u); this.u.uA.value = u < -0.02 ? 0 : 1 - MathX.smooth(u, 1.6, 2.4);
    this.plane.visible = u > -0.02 && u < 2.4;
    // before the contact: a faint pulse under the waiting palm (the glass is "listening")
    if (u < 0 && t > GM.touch.prompt) { this.plane.visible = true; this.u.uT.value = 0.02; this.u.uA.value = 0.18 + 0.1 * Math.sin(t * 6); }
    this.motes.update(t, this.app.camera, this.app.renderer);
  }
}

/* ---------------- the left route erupts ---------------- */
class GmBlast {
  constructor(app) {
    this.app = app;
    const D = GF.doorL, z = GF.cell.z0, t0 = GM.choice.blast;
    this.steam = new GmBurst(app.scene, { n: 90, seed: 17, t0, spread: 0.9, life: [0.9, 1.8], size: [0.35, 0.8], color: '#d9dcdf', blending: THREE.NormalBlending, alpha: 0.42, drag: 1.6, grow: 1.8, fade: 0.35, soft: 0.95,
      spawn: (i, r) => ({ p: new THREE.Vector3(D.x + r.range(-0.3, 0.3), r.range(0.4, 2.0), z - r.range(0.6, 2.2)), v: new THREE.Vector3(r.range(-0.6, 0.9), r.range(-0.1, 0.6), r.range(2.5, 6.5)) }) });
    this.sparks = new GmBurst(app.scene, { n: 120, seed: 23, t0: t0 - 0.02, spread: 0.45, life: [0.35, 0.9], size: [0.008, 0.02], color: '#ffb35a', g: 9.8, drag: 0.6, fade: 0.55,
      spawn: (i, r) => ({ p: new THREE.Vector3(D.x + r.range(-0.4, 0.4), r.range(1.4, 2.4), z - r.range(0.3, 1.5)), v: new THREE.Vector3(r.range(-2.5, 2.5), r.range(-0.5, 3.0), r.range(1.0, 5.0)) }) });
    this.flash = new GmBurst(app.scene, { n: 6, seed: 29, t0, spread: 0.12, life: [0.12, 0.3], size: [0.9, 1.6], color: '#ff9a4a', fade: 0.2, soft: 1.0,
      spawn: (i, r) => ({ p: new THREE.Vector3(D.x + r.range(-0.2, 0.2), r.range(1.0, 1.8), z - r.range(0.2, 0.8)), v: new THREE.Vector3(0, 0, 0) }) });
  }
  update(t) { for (const b of [this.steam, this.sparks, this.flash]) b.update(t, this.app.camera, this.app.renderer); }
}

/* ---------------- the security drone ---------------- */
class GmDrone {
  constructor(app) {
    this.app = app;
    const g = new THREE.Group(); app.scene.add(g); this.g = g;
    const body = Mat.std('#2f3338', { roughness: 0.35, metalness: 0.6 }), dark = Mat.std('#16181b', { roughness: 0.5, metalness: 0.4 }), stripe = Mat.std('#d4a20e', { roughness: 0.5 });
    const add = (geo, m, x = 0, y = 0, z = 0, p = g) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; p.add(o); return o; };
    const hull = add(new THREE.SphereGeometry(0.2, 24, 14), body); hull.scale.set(1.25, 0.55, 1.25);
    add(new THREE.CylinderGeometry(0.27, 0.27, 0.035, 28), dark, 0, 0, 0);
    add(new THREE.CylinderGeometry(0.275, 0.275, 0.012, 28), stripe, 0, 0.02, 0);
    this.rotors = [];
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2 + Math.PI / 4, x = Math.cos(a) * 0.36, z = Math.sin(a) * 0.36;
      add(new THREE.BoxGeometry(0.2, 0.025, 0.04), dark, Math.cos(a) * 0.24, 0, Math.sin(a) * 0.24).rotation.y = -a;
      const duct = add(new THREE.TorusGeometry(0.12, 0.018, 8, 22), body, x, 0.01, z); duct.rotation.x = Math.PI / 2;
      const blur = add(new THREE.CircleGeometry(0.11, 20), new THREE.MeshBasicMaterial({ color: '#9aa2aa', transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide }), x, 0.012, z); blur.rotation.x = -Math.PI / 2; blur.castShadow = false;
      this.rotors.push(blur);
    }
    // the eye: a lens under the nose, red
    this.mEye = new THREE.MeshStandardMaterial({ color: '#200404', emissive: '#ff2a1a', emissiveIntensity: 1.2, roughness: 0.1 });
    const eyeR = add(new THREE.CylinderGeometry(0.06, 0.07, 0.05, 20), dark, 0, -0.07, 0.12);
    eyeR.rotation.x = 0.5;
    this.eye = add(new THREE.SphereGeometry(0.045, 18, 12), this.mEye, 0, -0.085, 0.14);
    // a scanning cone and the charge glow (additive)
    this.cone = new THREE.Mesh(new THREE.ConeGeometry(0.5, 3.2, 28, 1, true), new THREE.MeshBasicMaterial({ color: '#ff3020', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    this.cone.geometry.translate(0, -1.6, 0); this.cone.geometry.rotateX(-Math.PI / 2); this.cone.frustumCulled = false;
    this.coneP = new THREE.Group(); this.coneP.add(this.cone); app.scene.add(this.coneP);
    this.glow = new GmBurst(app.scene, { n: 1, seed: 3, t0: GM.drone.charge, spread: 0, life: [1.2, 1.2], size: [0.5, 0.5], color: '#ff5a3a', fade: 0.9, soft: 1.0, spawn: () => ({ p: new THREE.Vector3(), v: new THREE.Vector3() }) });
    // the bolt: a bright streak from the eye to the lens
    this.bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1, 10), new THREE.MeshBasicMaterial({ color: '#ffd0c0', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    this.bolt.geometry.rotateX(Math.PI / 2); this.bolt.frustumCulled = false; app.scene.add(this.bolt);
    this.boltGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 12), new THREE.MeshBasicMaterial({ color: '#ff3a24', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    this.boltGlow.geometry.rotateX(Math.PI / 2); this.boltGlow.frustumCulled = false; app.scene.add(this.boltGlow);
    this.p = new THREE.Vector3(); this._a = new THREE.Vector3(); this._b = new THREE.Vector3();
    // the default item at work: a hex shield flares in front of you and takes the shot
    this.uS = { uT: { value: -1 }, uP: { value: new THREE.Vector2(0.06, -0.02) } };
    const sm = new THREE.ShaderMaterial({ uniforms: this.uS, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uT; uniform vec2 uP; varying vec2 vP;
        float hexd(vec2 p){ p = abs(p); return max(dot(p, vec2(0.866, 0.5)), p.y); }
        void main(){
          if (uT < 0.0) discard;
          vec2 q = vP * 9.0, a = mod(q, vec2(1.732, 1.0)) - vec2(0.866, 0.5), b = mod(q - vec2(0.866, 0.5), vec2(1.732, 1.0)) - vec2(0.866, 0.5);
          vec2 c = dot(a, a) < dot(b, b) ? a : b; float e = smoothstep(0.42, 0.5, hexd(c));
          float r = length(vP - uP), wave = exp(-pow((r - uT * 1.2) / 0.05, 2.0)), core = exp(-r * r / 0.004) * exp(-uT * 9.0);
          float fade = exp(-uT * 5.0) * smoothstep(0.55, 0.05, r);
          float k = (e * (0.18 + 0.9 * wave) + core * 1.2 + wave * 0.25) * fade;
          gl_FragColor = vec4(vec3(0.55, 0.85, 1.0) * k, k);
        }` });
    this.shield = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), sm); this.shield.position.set(0, 0, -0.6); this.shield.renderOrder = 20; this.shield.frustumCulled = false;
    app.camera.add(this.shield);
  }
  update(t, cam, aware) {
    const D = GM.drone, dock = GF.dock, show = t > D.drop - 0.1 && t < GM.reset.n5 + 0.6;
    this.g.visible = show; this.coneP.visible = show;
    if (!show) { this.bolt.visible = this.boltGlow.visible = false; this.shield.visible = false; this.uS.uT.value = -1; this.glow.update(-1, cam, this.app.renderer); return; }
    const k = Ease.outCubic(MathX.clamp((t - D.drop) / 0.8, 0, 1)), bob = Math.sin(t * 3.1) * 0.03 + Math.sin(t * 5.3) * 0.012;
    const hover = [1.5, 2.45, -16.9];
    this.g.position.set(MathX.lerp(dock[0], hover[0], k), MathX.lerp(dock[1] - 0.25, hover[1], k) + bob - 0.12 * Math.sin(k * Math.PI), MathX.lerp(dock[2], hover[2], k));
    const lens = this._a.setFromMatrixPosition(cam.matrixWorld);
    // it watches him, then you
    const target = t < 35.0 ? aware.headWorld(this._b) : lens;
    const yaw = Math.atan2(target.x - this.g.position.x, target.z - this.g.position.z);
    this.g.rotation.set(0.12 * Math.sin(t * 2.3) + 0.15, yaw, 0.08 * Math.sin(t * 1.7));
    this.rotors.forEach((r, i) => { r.rotation.z = t * 50 + i; });
    this.p.copy(this.g.position);
    // the scan cone sweeps him, then you
    this.coneP.position.copy(this.eye.getWorldPosition(this._b));
    const sweep = aware.headWorld(new THREE.Vector3()).add(new THREE.Vector3(0.3 * Math.sin(t * 6), -0.7 + 0.7 * Math.sin(t * 2.5), 0));
    this.coneP.lookAt(sweep);
    this.cone.material.opacity = (t > D.drop + 0.8 && t < D.fire) ? 0.06 + 0.03 * Math.sin(t * 30) : 0;
    // charge, fire
    const ch = MathX.smooth(t, D.charge, D.fire);
    this.mEye.emissiveIntensity = 1.2 + 6 * ch + 2 * ch * Math.sin(t * 40);
    this.glow.P[0].p.copy(this.coneP.position); this.glow.s.size = [0.2 + 0.6 * ch, 0.2 + 0.6 * ch]; this.glow.P[0].size = 0.15 + 0.7 * ch;
    this.glow.update(t, cam, this.app.renderer);
    const su = t - (D.fire + 0.15); this.uS.uT.value = su >= 0 && su < 0.7 ? su : -1; this.shield.visible = su >= 0 && su < 0.7;
    const u = (t - D.fire) / 0.16;
    this.bolt.visible = this.boltGlow.visible = u >= 0 && u < 1.25;
    if (this.bolt.visible) {
      const a = this.coneP.position, b = lens.clone().add(this._b.set(0, -0.05, 0)), tip = a.clone().lerp(b, MathX.clamp(u, 0, 1)), tail = a.clone().lerp(b, MathX.clamp(u - 0.45, 0, 1));
      const mid = tip.clone().add(tail).multiplyScalar(0.5), len = Math.max(0.01, tip.distanceTo(tail));
      for (const m of [this.bolt, this.boltGlow]) { m.position.copy(mid); m.lookAt(tip); m.scale.set(1, 1, len); }
    }
  }
}
