/* =====================================================================
   POST-PROCESSING — one lightweight custom chain:
   scene (HDR, MSAA) → small blur pyramid → composite
   (bloom, tone mapping, grade, vignette, hypoxia tunnel vision,
    edge blur, chromatic aberration, grain, fades).
   ===================================================================== */

class PostProcessing {
  constructor(renderer) {
    this.renderer = renderer;
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();
    const tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
    this.quad = new THREE.Mesh(tri, null);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);

    const vs = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
    this.downMat = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } },
      vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: /* glsl */`
        uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
        void main(){
          vec3 c = texture2D(tSrc, vUv + uTexel * vec2(-1.0, -1.0)).rgb + texture2D(tSrc, vUv + uTexel * vec2(1.0, -1.0)).rgb
                 + texture2D(tSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb + texture2D(tSrc, vUv + uTexel * vec2(1.0, 1.0)).rgb;
          gl_FragColor = vec4(min(c * 0.25, vec3(40.0)), 1.0);
        }`,
    });
    this.blurMat = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } },
      vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: /* glsl */`
        uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
        void main(){
          vec3 c = texture2D(tSrc, vUv).rgb * 0.2270270270;
          c += (texture2D(tSrc, vUv + uDir * 1.3846153846).rgb + texture2D(tSrc, vUv - uDir * 1.3846153846).rgb) * 0.3162162162;
          c += (texture2D(tSrc, vUv + uDir * 3.2307692308).rgb + texture2D(tSrc, vUv - uDir * 3.2307692308).rgb) * 0.0702702703;
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    this.params = {
      exposure: CONFIG.render.exposure, bloom: CONFIG.render.bloom ? 0.55 : 0, bloomThreshold: 1.15,
      saturation: 1.08, contrast: 1.04, warmth: 0.35, vignette: 1.0,
      tunnel: 1.2, tunnelSoft: 0.5, tunnelDark: 0.0, edgeBlur: 0.0, chroma: 0.0, grain: 0.022,
      fade: 0.0, flash: 0.0, time: 0,
    };
    this.compMat = new THREE.ShaderMaterial({
      uniforms: {
        tScene: { value: null }, tBlurQ: { value: null }, tBlurE: { value: null }, uRes: { value: new THREE.Vector2() },
        uExposure: { value: 1 }, uBloom: { value: 0.5 }, uBloomThreshold: { value: 1.1 }, uSaturation: { value: 1 }, uContrast: { value: 1 },
        uWarmth: { value: 0 }, uVignette: { value: 1 }, uTunnel: { value: 1.2 }, uTunnelSoft: { value: 0.5 }, uTunnelDark: { value: 0 },
        uEdgeBlur: { value: 0 }, uChroma: { value: 0 }, uGrain: { value: 0 }, uFade: { value: 0 }, uFlash: { value: 0 }, uTime: { value: 0 },
      },
      vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: /* glsl */`
        uniform sampler2D tScene, tBlurQ, tBlurE; uniform vec2 uRes;
        uniform float uExposure, uBloom, uBloomThreshold, uSaturation, uContrast, uWarmth, uVignette;
        uniform float uTunnel, uTunnelSoft, uTunnelDark, uEdgeBlur, uChroma, uGrain, uFade, uFlash, uTime;
        varying vec2 vUv;
        vec3 aces(vec3 x){ const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14; return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0); }
        vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){
          vec2 uv = vUv;
          vec2 cc = uv - 0.5;
          vec2 ct = cc; ct.x *= 0.78;                 // tunnel shape: slightly taller than wide
          float rt = length(ct) * 1.55;
          float rv = length(cc) * 1.35;               // frame vignette follows the 9:16 frame
          vec3 col;
          float ca = uChroma * rt;
          col.r = texture2D(tScene, uv - cc * ca).r;
          col.g = texture2D(tScene, uv).g;
          col.b = texture2D(tScene, uv + cc * ca).b;
          vec3 bq = texture2D(tBlurQ, uv).rgb, be = texture2D(tBlurE, uv).rgb;
          float edge = smoothstep(uTunnel * 0.6, uTunnel * 0.6 + 0.45, rt);
          col = mix(col, mix(bq, be, 0.35), clamp(edge * uEdgeBlur, 0.0, 1.0));
          vec3 bloom = max(bq - uBloomThreshold, 0.0) * 0.55 + max(be - uBloomThreshold * 0.9, 0.0) * 0.9;
          col += bloom * uBloom;
          col *= uExposure;
          col *= vec3(1.0 + uWarmth * 0.05, 1.0 + uWarmth * 0.01, 1.0 - uWarmth * 0.07);
          col = aces(col);
          float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
          col = mix(vec3(l), col, uSaturation);
          col = toSRGB(clamp(col, 0.0, 1.0));
          col = clamp((col - 0.5) * uContrast + 0.5, 0.0, 1.0);
          // frame vignette
          col *= mix(1.0, 0.74, smoothstep(0.42, 1.05, rv) * uVignette);
          // hypoxia tunnel vision
          float tun = smoothstep(uTunnel, uTunnel + uTunnelSoft, rt);
          col *= 1.0 - tun * uTunnelDark;
          col += (hash(uv * uRes + fract(uTime * 7.31)) - 0.5) * uGrain;
          col = mix(col, vec3(1.0), uFlash);
          col *= 1.0 - uFade;
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    this.w = 0; this.h = 0;
  }

  setSize(w, h) {
    if (w === this.w && h === this.h) return;
    this.w = w; this.h = h;
    const opts = { type: THREE.HalfFloatType, depthBuffer: false };
    for (const k of ['main', 'half', 'q1', 'q2', 'e1', 'e2']) if (this[k]) this[k].dispose();
    this.main = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: CONFIG.render.msaa, depthBuffer: true });
    this.half = new THREE.WebGLRenderTarget(Math.ceil(w / 2), Math.ceil(h / 2), opts);
    this.q1 = new THREE.WebGLRenderTarget(Math.ceil(w / 4), Math.ceil(h / 4), opts);
    this.q2 = this.q1.clone();
    this.e1 = new THREE.WebGLRenderTarget(Math.ceil(w / 8), Math.ceil(h / 8), opts);
    this.e2 = this.e1.clone();
    this.compMat.uniforms.uRes.value.set(w, h);
  }

  _pass(mat, target) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.cam);
  }

  render(scene, camera) {
    const r = this.renderer;
    r.setRenderTarget(this.main);
    r.render(scene, camera);
    // pyramid
    this.downMat.uniforms.tSrc.value = this.main.texture;
    this.downMat.uniforms.uTexel.value.set(0.5 / this.w, 0.5 / this.h);
    this._pass(this.downMat, this.half);
    this.downMat.uniforms.tSrc.value = this.half.texture;
    this.downMat.uniforms.uTexel.value.set(0.5 / this.half.width, 0.5 / this.half.height);
    this._pass(this.downMat, this.q1);
    this._blur(this.q1, this.q2);
    this.downMat.uniforms.tSrc.value = this.q1.texture;
    this.downMat.uniforms.uTexel.value.set(0.5 / this.q1.width, 0.5 / this.q1.height);
    this._pass(this.downMat, this.e1);
    this._blur(this.e1, this.e2);
    // composite
    const u = this.compMat.uniforms, p = this.params;
    u.tScene.value = this.main.texture; u.tBlurQ.value = this.q1.texture; u.tBlurE.value = this.e1.texture;
    u.uExposure.value = p.exposure; u.uBloom.value = p.bloom; u.uBloomThreshold.value = p.bloomThreshold;
    u.uSaturation.value = p.saturation; u.uContrast.value = p.contrast; u.uWarmth.value = p.warmth; u.uVignette.value = p.vignette;
    u.uTunnel.value = p.tunnel; u.uTunnelSoft.value = p.tunnelSoft; u.uTunnelDark.value = p.tunnelDark;
    u.uEdgeBlur.value = p.edgeBlur; u.uChroma.value = p.chroma; u.uGrain.value = p.grain;
    u.uFade.value = p.fade; u.uFlash.value = p.flash; u.uTime.value = p.time;
    this._pass(this.compMat, null);
  }

  _blur(a, b) {
    this.blurMat.uniforms.tSrc.value = a.texture;
    this.blurMat.uniforms.uDir.value.set(1 / a.width, 0);
    this._pass(this.blurMat, b);
    this.blurMat.uniforms.tSrc.value = b.texture;
    this.blurMat.uniforms.uDir.value.set(0, 1 / a.height);
    this._pass(this.blurMat, a);
  }

  // per-frame film look driven by the timeline
  updateFromTimeline(t, tl) {
    const p = this.params;
    const hyp = SCRIPT_TRACKS.hypoxia.value(t);
    p.time = t;
    p.tunnel = MathX.lerp(1.15, 0.42, hyp);
    p.tunnelSoft = MathX.lerp(0.55, 0.45, hyp);
    p.tunnelDark = MathX.lerp(0.0, 0.96, Math.min(1, hyp * 1.4));
    p.edgeBlur = Math.min(1, hyp * 1.6);
    p.saturation = MathX.lerp(1.08, 0.55, hyp);
    p.warmth = MathX.lerp(0.35, -0.2, Math.min(1, hyp * 1.5));
    // pressure-drop pulse at 0 % O2
    const pop = MathX.impulse(t, tl.at('o2_zero') + 0.02, 0.18);
    p.chroma = 0.004 * pop + hyp * 0.006 + 0.0006;
    p.exposure = CONFIG.render.exposure * (1 - 0.06 * pop) * (1 - 0.12 * hyp);
    p.contrast = 1.04 + 0.06 * hyp;
  }
}
