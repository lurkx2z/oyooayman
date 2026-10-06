/* =====================================================================
   THE SEA — one water surface for the harbour, the open sea and the flooded
   streets: wherever the ground is below the water level, there is water.
   No fluid solver: the big motion is scripted (the level, the surge fronts,
   the flow), the surface is a shader —
     · swell: a few directional waves (bigger as the tides grow), damped in
       shallow water and in the streets;
     · surge fronts (bores) running inland: a step in the surface with a
       foaming, tumbling face;
     · real reflections: the city, its lights and the Moon rendered mirrored
       in the water plane (js/fx/mirror.js), broken up by the waves;
     · depth from the known ground (the same height function as the city):
       murky and see-through when shallow (the street shows through), dark
       when deep; foam where it runs thin against the ground, at the fronts,
       and in streaks along fast currents;
   It draws after the opaque world, so walls, cars and people stand in it.
   ===================================================================== */

class MnWater {
  constructor(app) {
    this.app = app;
    const R = app.renderer, cap = CONFIG.captureMode;
    // a grid that is fine near the city and coarse to the horizon (built in XY, laid flat by the mesh's rotation)
    const N = cap ? 420 : 260, pos = new Float32Array((N + 1) * (N + 1) * 3), idx = [];
    const warpX = (u) => Math.sign(u) * (Math.abs(u) < 0.25 ? Math.abs(u) / 0.25 * 220 : 220 + Math.pow((Math.abs(u) - 0.25) / 0.75, 2.4) * 16000);
    const warpZ = (v) => v < 0.42 ? 380 - (v / 0.42) * 640 : -260 - Math.pow((v - 0.42) / 0.58, 2.4) * 22000;     // z from +380 (inland) to the far sea
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
      const u = i / N * 2 - 1, v = j / N, k = (j * (N + 1) + i) * 3;
      pos[k] = warpX(u); pos[k + 1] = -warpZ(v); pos[k + 2] = 0;      // local y = −world z
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    // reflections
    this.mirror = new Mirror(1, 1, { resolution: cap ? 900 : 480, see: [0, 1], clip: true, clipBias: 0.05 });
    this.texMat = new THREE.Matrix4();
    this.U = {
      tReflect: { value: this.mirror.rt.texture }, uTexMat: { value: this.texMat },
      uLevel: { value: 0 }, uTime: { value: 0 }, uRough: { value: 0.2 }, uFlow: { value: new THREE.Vector2() }, uChop: { value: 0 },
      uBore: { value: [new THREE.Vector4(), new THREE.Vector4(), new THREE.Vector4()] },
      uLight: { value: new THREE.Color(0.2, 0.22, 0.28) }, uMoonDir: { value: new THREE.Vector3(0, 0.3, -1) }, uMoonCol: { value: new THREE.Color(1, 1, 1) },
      uFogCol: { value: new THREE.Color('#0d1420') }, uFog: { value: 0.00018 }, uMurk: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.U,
      vertexShader: /* glsl */`
        uniform float uLevel, uTime, uRough; uniform vec4 uBore[3]; uniform mat4 uTexMat;
        varying vec3 vW; varying vec4 vUvP; varying float vFront; varying float vG; varying vec2 vSlope;
        ${MN_GROUND_GLSL}
        // a few directional waves: height and slope (x, z)
        vec3 swell(vec2 p, float t){
          vec3 s = vec3(0.0);
          vec4 W[4]; W[0] = vec4(0.12, 0.99, 0.11, 1.0); W[1] = vec4(-0.45, 0.89, 0.19, 0.6); W[2] = vec4(0.6, 0.8, 0.31, 0.35); W[3] = vec4(-0.2, 0.98, 0.07, 0.8);
          for (int i = 0; i < 4; i++) {
            vec2 d = normalize(W[i].xy); float k = W[i].z, a = W[i].w, ph = dot(d, p) * k + t * sqrt(9.8 * k);
            s.x += a * sin(ph); s.yz += a * k * cos(ph) * d;
          }
          return s;
        }
        void main(){
          vec4 w = modelMatrix * vec4(position, 1.0);
          float g = mnGround(w.xz); vG = g;
          float depth = uLevel - g;
          // the surge fronts: water raised behind each front (toward the sea), a crest and a foaming face at it
          float hb = 0.0, front = 0.0;
          for (int i = 0; i < 3; i++) {
            vec4 b = uBore[i];
            if (b.w > 0.0) {
              float wd = max(b.z, 1.0), dz = w.z - b.x;
              hb += b.y * b.w * (1.0 - smoothstep(-wd, 0.0, dz)) + 0.35 * b.y * b.w * exp(-pow((dz + wd * 0.4) / (wd * 0.6), 2.0));
              front += b.w * exp(-pow((dz + wd * 0.3) / (wd * 0.9), 2.0));
            }
          }
          vFront = front;
          // swell: damped in the shallows and the streets (the waves break and die on the way in)
          float damp = clamp((depth + hb) / 5.0, 0.05, 1.0) * (w.z < -20.0 ? 1.0 : 0.12);
          vec3 sw = swell(w.xz, uTime) * uRough * damp;
          w.y = uLevel + hb + sw.x;
          vSlope = sw.yz;
          vW = w.xyz;
          vUvP = uTexMat * w;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */`
        uniform sampler2D tReflect; uniform float uTime, uChop, uLevel, uFog, uMurk; uniform vec2 uFlow; uniform vec3 uLight, uMoonDir, uMoonCol, uFogCol;
        varying vec3 vW; varying vec4 vUvP; varying float vFront; varying float vG; varying vec2 vSlope;
        float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
        float fb(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * n2(p); p = p * 2.07 + 13.1; a *= 0.5; } return v; }
        void main(){
          vec3 V = normalize(cameraPosition - vW);
          float dist = length(cameraPosition - vW);
          float depth = vW.y - vG;
          // small waves: two layers of noise drifting with the current (more chop as the tides grow)
          vec2 fl = uFlow, p = vW.xz;
          float e = 0.35, k1 = 0.9, k2 = 2.6;
          vec2 q1 = p * k1 - fl * uTime * k1 * 0.9, q2 = p * k2 - fl * uTime * k2 * 1.3 + vec2(uTime * 0.3, -uTime * 0.2);
          float a1 = fb(q1), a2 = fb(q2);
          // ripple slopes in world units: amplitude (m) × frequency × the noise's own slope
          float A1 = 0.025 + 0.09 * uChop, A2 = 0.01 + 0.035 * uChop;
          vec2 gN = vec2(fb(q1 + vec2(e, 0.0)) - a1, fb(q1 + vec2(0.0, e)) - a1) / e * A1 * k1 + vec2(fb(q2 + vec2(e, 0.0)) - a2, fb(q2 + vec2(0.0, e)) - a2) / e * A2 * k2;
          float fade = 1.0 / (1.0 + dist * 0.012);
          vec3 N = normalize(vec3(-vSlope.x - gN.x * (0.4 + 0.6 * fade), 1.0, -vSlope.y - gN.y * (0.4 + 0.6 * fade)));
          float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
          // reflection (the mirrored scene), shifted by the waves
          vec4 uvp = vUvP; uvp.xy += N.xz * uvp.w * 0.09;
          vec3 refl = texture2DProj(tReflect, uvp).rgb;
          // the water's own colour: dark and green-blue at sea, brown and murky in the streets
          float street = smoothstep(-21.0, -18.0, vW.z);
          vec3 deep = mix(vec3(0.004, 0.011, 0.014), vec3(0.016, 0.014, 0.011), max(street, uMurk));
          vec3 body = deep + uLight * mix(0.05, 0.2, max(street, uMurk)) * vec3(1.0, 0.92, 0.8);   // (silty flood water scatters the light)
          // foam: thin water against the ground, the surge fronts, streaks in fast water
          // foam: a lip where the water runs out against the ground, the surge fronts, patches in fast water
          float spd = length(fl);
          vec2 fq = p * 1.4 - fl * uTime * 1.2;
          float cells = fb(fq * 1.6) * fb(fq * 5.3 + 7.0) * 1.15;
          float lip = 1.0 - smoothstep(0.0, 0.14, depth);
          float streak = smoothstep(0.42, 0.7, fb(vec2(dot(p, normalize(fl + 1e-4)) * 0.35, dot(p, normalize(vec2(-fl.y, fl.x) + 1e-4)) * 2.2) - vec2(spd * uTime * 0.25, 0.0)));
          float turb = smoothstep(0.62, 0.85, cells * 1.6) * smoothstep(1.2, 4.0, spd);
          // (foam as lace: bright threads where the noise crosses its middle, filled in where it is thickest)
          float lace = 1.0 - abs(fb(fq * 0.9 + 3.0) * 2.0 - 1.0), lace2 = 1.0 - abs(fb(fq * 2.7 + 9.0) * 2.0 - 1.0);
          float threads = smoothstep(0.82, 0.95, lace) * 0.8 + smoothstep(0.86, 0.97, lace2) * 0.5;
          float cover = clamp(lip * 0.8 + vFront * 0.9 + streak * smoothstep(1.0, 4.0, spd) * 0.3 + turb * 0.3 + uChop * 0.15 * smoothstep(0.62, 0.8, a2), 0.0, 1.0);
          float foam = clamp(cover * (threads + smoothstep(0.55, 0.9, cells) * cover * 0.9), 0.0, 1.0);
          foam *= smoothstep(-0.05, 0.05, depth + vFront);
          vec3 fcol = uLight * 1.5 + vec3(0.02);
          vec3 col = mix(body, refl, fres);
          col = mix(col, fcol, foam * 0.75);
          // fog
          col = mix(uFogCol, col, exp(-dist * uFog));
          // shallow water is see-through: the ground shows (murky)
          float a = clamp(1.0 - exp(-max(depth, 0.0) * mix(1.6, 3.2, max(street, uMurk))), 0.0, 1.0);
          a = max(a, max(fres * 0.9, foam));
          a *= smoothstep(-0.02, 0.06, depth + vFront * 0.5);
          gl_FragColor = vec4(col, a);
        }`,
      transparent: true, depthWrite: true, side: THREE.DoubleSide,   // (writes depth so the post's contact shading sees the surface, not the street under it)
    });
    this.mesh = new THREE.Mesh(g, mat);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 10;
    app.scene.add(this.mesh);
    this.mirror.mesh = this.mesh;              // (the mirror reflects in this plane: local +Z = world up)
  }

  // the level, the fronts and the flow for story time S; render the reflection for the camera
  update(t, S) {
    const U = this.U, lvl = mnSea(S);
    this.level = lvl;
    U.uLevel.value = lvl; U.uTime.value = t;
    // swell grows with the tides; chop with the currents
    const dl = (mnSea(S + 0.1) - mnSea(S - 0.1)) / 0.2;
    U.uRough.value = 0.12 + 0.5 * MathX.smooth(S, 13, 40) + 0.9 * MathX.smooth(S, 55, 72);
    U.uFlow.value.set(0, MathX.clamp(dl * 0.8, -6, 6));
    U.uChop.value = 0.1 + 0.25 * MathX.smooth(S, 20, 34) + 0.3 * MathX.smooth(S, 55, 70);
    MN_BORES.forEach((b, i) => {
      const v = U.uBore.value[i];
      if (S < b.s0 - 0.5 || S > b.s1 + 1.5) { v.set(0, 0, 1, 0); return; }
      const u = MathX.clamp((S - b.s0) / (b.s1 - b.s0), 0, 1), z = b.z0 + (b.z1 - b.z0) * (1 - (1 - u) * (1 - u));
      const env = MathX.smooth(S, b.s0 - 0.5, b.s0 + 0.3) * (1 - MathX.smooth(S, b.s1, b.s1 + 1.5));
      v.set(z, b.h, 4 + b.h * 2.5, env);
    });
    this.mesh.position.y = lvl;
  }

  // the reflection pass (after the camera and the world are posed, before the main render)
  render(renderer, scene, camera) {
    this.mesh.updateMatrixWorld(true);
    this.mirror.render(renderer, scene, camera);
    const c = this.mirror.cam;
    this.texMat.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
  }

  // water surface height at (x, z) (for floating things)
  heightAt(x, z, t) {
    let h = this.level;
    for (const v of this.U.uBore.value) if (v.w > 0) { const wd = Math.max(v.z, 1), dz = z - v.x; h += v.y * v.w * (1 - MathX.smooth(dz, -wd, 0)); }
    const r = this.U.uRough.value * (z < -20 ? 1 : 0.25) * 0.6;
    return h + r * (Math.sin(x * 0.11 + z * 0.99 * 0.11 + t * 1.04) + 0.6 * Math.sin(-x * 0.085 + z * 0.17 + t * 1.36));
  }
}
