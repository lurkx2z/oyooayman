/* =====================================================================
   POST-PROCESSING — one lightweight custom chain:
   scene (HDR, MSAA, depth) → contact-shading AO (half res) + small blur pyramid → composite
   (AO, tone mapping, grade, vignette, hypoxia tunnel vision,
    edge blur, grain, fades).
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
        // clamp each tap and drop NaN/Inf, so a single specular "firefly" pixel can't be smeared into a disc
        vec3 tap(vec2 o){ vec3 c = texture2D(tSrc, vUv + uTexel * o).rgb; return (c.r + c.g + c.b < 1e6) ? min(max(c, 0.0), vec3(16.0)) : vec3(0.0); }
        void main(){
          vec3 c = tap(vec2(-1.0, -1.0)) + tap(vec2(1.0, -1.0)) + tap(vec2(-1.0, 1.0)) + tap(vec2(1.0, 1.0));
          gl_FragColor = vec4(c * 0.25, 1.0);
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
    // ---- contact shading: scalable ambient obscurance from the depth buffer (half resolution).
    // Grounds people, cars, the cart and props; darkens recesses. Faded out with fog distance.
    this.aoMat = new THREE.ShaderMaterial({
      uniforms: {
        tDepth: { value: null }, uTexel: { value: new THREE.Vector2() }, uNear: { value: 0.05 }, uFar: { value: 3000 },
        uTanHalf: { value: 0.75 }, uAspect: { value: 0.5625 }, uRadius: { value: 0.6 }, uIntensity: { value: 1.25 }, uBias: { value: 0.012 },
      },
      vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: /* glsl */`
        uniform sampler2D tDepth; uniform vec2 uTexel; uniform float uNear, uFar, uTanHalf, uAspect, uRadius, uIntensity, uBias;
        varying vec2 vUv;
        #define NS 14
        float viewZ(float d){ return (uNear * uFar) / ((uFar - uNear) * d - uFar); }
        vec3 viewPos(vec2 uv, float d){ float z = viewZ(d); return vec3((uv * 2.0 - 1.0) * vec2(uTanHalf * uAspect, uTanHalf) * (-z), z); }
        vec3 posAt(vec2 uv){ return viewPos(uv, texture2D(tDepth, uv).x); }
        void main(){
          float d = texture2D(tDepth, vUv).x;
          if (d >= 0.99999) { gl_FragColor = vec4(1.0, -10000.0, 0.0, 1.0); return; }
          vec3 P = viewPos(vUv, d);
          vec2 tx = uTexel * 2.0;
          vec3 pr = posAt(vUv + vec2(tx.x, 0.0)), pl = posAt(vUv - vec2(tx.x, 0.0));
          vec3 pu = posAt(vUv + vec2(0.0, tx.y)), pd = posAt(vUv - vec2(0.0, tx.y));
          vec3 dx = abs(pr.z - P.z) < abs(P.z - pl.z) ? pr - P : P - pl;
          vec3 dy = abs(pu.z - P.z) < abs(P.z - pd.z) ? pu - P : P - pd;
          vec3 N = normalize(cross(dx, dy));
          if (dot(N, P) > 0.0) N = -N;
          float radUV = min(uRadius / (-P.z * 2.0 * uTanHalf), 0.12);
          float rot = 6.2831853 * fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
          float bias = uBias + 0.0015 * (-P.z);
          float r2 = uRadius * uRadius, sum = 0.0;
          for (int i = 0; i < NS; i++) {
            float a = (float(i) + 0.5) / float(NS);
            float ang = a * 6.2831853 * 7.0 + rot;
            vec2 o = vec2(cos(ang) / uAspect, sin(ang)) * a * radUV;
            vec2 suv = vUv + o;
            if (suv.x < 0.0 || suv.y < 0.0 || suv.x > 1.0 || suv.y > 1.0) continue;
            vec3 v = posAt(suv) - P;
            float vv = dot(v, v), vn = dot(v, N);
            float f = max(r2 - vv, 0.0);
            sum += f * f * f * max((vn - bias) / (0.01 + vv), 0.0);
          }
          float ao = max(0.0, 1.0 - sum * uIntensity / (r2 * r2 * r2) * (5.0 / float(NS)));
          gl_FragColor = vec4(ao, P.z, 0.0, 1.0);
        }`,
    });
    this.aoBlurMat = new THREE.ShaderMaterial({
      uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } },
      vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: /* glsl */`
        uniform sampler2D tSrc; uniform vec2 uDir; varying vec2 vUv;
        void main(){
          vec2 c = texture2D(tSrc, vUv).rg;
          float tol = 0.04 * -c.y + 0.03, s = 0.0, ws = 0.0;
          for (int i = -4; i <= 4; i++) {
            vec2 t = texture2D(tSrc, vUv + uDir * float(i)).rg;
            float w = exp(-float(i * i) / 10.0) * exp(-abs(t.y - c.y) / tol);
            s += t.x * w; ws += w;
          }
          gl_FragColor = vec4(s / ws, c.y, 0.0, 1.0);
        }`,
    });
    this.params = {
      exposure: CONFIG.render.exposure, bloom: CONFIG.render.bloom ? 0.22 : 0, bloomThreshold: 1.6,
      saturation: 1.22, contrast: 1.06, warmth: 0.0, vignette: 1.0, soft: 0.1, blackLift: 0.008, keepWarm: 1.0,
      tunnel: 1.2, tunnelSoft: 0.5, tunnelDark: 0.0, edgeBlur: 0.0, chroma: 0.0, grain: 0.022, uneven: 0.04,
      fade: 0.0, flash: 0.0, flashColor: new THREE.Color(0.86, 0.89, 0.88), time: 0,
      ao: 1.0, aoDebug: 0, fogDensity: 0,
      smear: new THREE.Vector2(0, 0),     // screen-space trail (uv) — the picture lagging behind a head turn
    };
    this.compMat = new THREE.ShaderMaterial({
      uniforms: {
        tScene: { value: null }, tBlurQ: { value: null }, tBlurE: { value: null }, uRes: { value: new THREE.Vector2() },
        uExposure: { value: 1 }, uBloom: { value: 0.5 }, uBloomThreshold: { value: 1.1 }, uSaturation: { value: 1 }, uContrast: { value: 1 },
        uWarmth: { value: 0 }, uVignette: { value: 1 }, uTunnel: { value: 1.2 }, uTunnelSoft: { value: 0.5 }, uTunnelDark: { value: 0 },
        uEdgeBlur: { value: 0 }, uChroma: { value: 0 }, uGrain: { value: 0 }, uFade: { value: 0 }, uFlash: { value: 0 }, uFlashColor: { value: new THREE.Color() }, uTime: { value: 0 },
        uSoft: { value: 0 }, uBlackLift: { value: 0 }, uKeepWarm: { value: 1 },
        tAO: { value: null }, uSmear: { value: new THREE.Vector2() }, uAO: { value: 0 }, uAODebug: { value: 0 }, uFogDensity: { value: 0 }, uUneven: { value: 0 },
      },
      vertexShader: vs, depthTest: false, depthWrite: false,
      fragmentShader: /* glsl */`
        uniform sampler2D tScene, tBlurQ, tBlurE, tAO; uniform vec2 uRes;
        uniform float uAO, uAODebug, uFogDensity, uUneven;
        uniform float uExposure, uBloom, uBloomThreshold, uSaturation, uContrast, uWarmth, uVignette;
        uniform float uTunnel, uTunnelSoft, uTunnelDark, uEdgeBlur, uChroma, uGrain, uFade, uFlash, uTime;
        uniform vec3 uFlashColor;
        uniform float uSoft, uBlackLift, uKeepWarm; uniform vec2 uSmear;
        varying vec2 vUv;
        vec3 aces(vec3 x){ const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14; return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0); }
        vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y); }
        void main(){
          vec2 uv = vUv;
          vec2 cc = uv - 0.5;
          vec2 ct = cc; ct.x *= 0.78;                 // tunnel shape: slightly taller than wide
          float rt = length(ct) * 1.55;
          vec3 col = texture2D(tScene, uv).rgb;
          col = (col.r + col.g + col.b < 1e6) ? min(max(col, 0.0), vec3(16.0)) : vec3(0.0);
          if (uChroma > 0.0) {
            float ca = uChroma * rt;
            col.r = texture2D(tScene, uv - cc * ca).r;
            col.b = texture2D(tScene, uv + cc * ca).b;
          }
          if (dot(uSmear, uSmear) > 1e-8) {   // the image trails where it just was
            vec3 acc = col; float wsum = 1.0;
            for (int i = 1; i <= 7; i++) { float k = float(i) / 7.0, w = 1.0 - k * 0.75; acc += min(texture2D(tScene, uv - uSmear * k).rgb, vec3(16.0)) * w; wsum += w; }
            col = acc / wsum;
          }
          vec3 bq = texture2D(tBlurQ, uv).rgb, be = texture2D(tBlurE, uv).rgb;
          // slight filmic softness everywhere, heavier at the edges when hypoxic
          col = mix(col, bq, uSoft);
          float edge = smoothstep(uTunnel * 0.6, uTunnel * 0.6 + 0.45, rt);
          col = mix(col, mix(bq, be, 0.35), clamp(edge * uEdgeBlur, 0.0, 1.0));
          { vec2 vq0 = abs(cc) * 2.0; col = mix(col, bq, 0.55 * smoothstep(0.8, 1.15, pow(pow(vq0.x, 5.0) + pow(vq0.y, 5.0), 0.2))); }   // soft optical edges
          vec2 aoz = texture2D(tAO, uv).rg;
          // distance swallows detail before silhouette: far surfaces soften a little
          col = mix(col, bq, smoothstep(30.0, 150.0, -aoz.y) * 0.35);
          // contact shading, only on the part of the colour the fog hasn't replaced yet
          float aoK = (1.0 - aoz.x) * uAO * exp(-uFogDensity * -aoz.y);
          col *= 1.0 - aoK;
          if (uAODebug > 0.5) { gl_FragColor = vec4(vec3(1.0 - aoK), 1.0); return; }
          vec3 bloom = max(bq - uBloomThreshold, 0.0) * 0.55 + max(be - uBloomThreshold * 0.9, 0.0) * 0.9;
          col += bloom * uBloom;
          col *= uExposure;
          // fire stays warm and alive while everything else is muted: protect bright warm pixels
          float mx = max(col.r, max(col.g, col.b));
          float warm = clamp((col.r - col.b) / (mx + 1e-3), 0.0, 1.0);
          float keep = smoothstep(0.4, 0.85, warm) * smoothstep(0.9, 2.6, mx) * uKeepWarm;   // only HDR-bright: flames, coals, sparks
          col *= vec3(1.0 + uWarmth * 0.05, 1.0 + uWarmth * 0.01, 1.0 - uWarmth * 0.07);
          col = aces(col);
          float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
          col = mix(vec3(l), col, mix(uSaturation, 1.35, keep));
          col = toSRGB(clamp(col, 0.0, 1.0));
          // split tone: cool shadows, faintly warm highlights
          float ls = dot(col, vec3(0.2126, 0.7152, 0.0722));
          col += vec3(-0.012, -0.002, 0.016) * (1.0 - ls) + vec3(0.01, 0.004, -0.008) * ls;
          col = clamp((col - 0.42) * uContrast + 0.42, 0.0, 1.0);   // pivot low: darks deepen, highlights hold
          col = uBlackLift + col * (1.0 - uBlackLift);   // never fully crushed
          // recorded footage is never perfectly even: a very slow, faint exposure drift across the frame
          col *= 1.0 + (vnoise(uv * vec2(1.6, 2.8) + vec2(uTime * 0.021, -uTime * 0.013)) - 0.5) * uUneven;
          // optical framing: a rounded-rectangle vignette that follows the 9:16 frame (visor-like, not binoculars)
          vec2 vq = abs(cc) * 2.0;
          float sq = pow(pow(vq.x, 5.0) + pow(vq.y, 5.0), 0.2);
          float vig = smoothstep(0.7, 1.13, sq) * uVignette;
          col *= 1.0 - 0.62 * vig;
          // hypoxia tunnel vision
          float tun = smoothstep(uTunnel, uTunnel + uTunnelSoft, rt);
          col *= 1.0 - tun * uTunnelDark;
          // grain: stronger in the shadows, with a coarser second layer so it doesn't read as digital noise
          float lg = dot(col, vec3(0.2126, 0.7152, 0.0722));
          float gn = (hash(uv * uRes + fract(uTime * 7.31)) - 0.5) + 0.6 * (hash(floor(uv * uRes * 0.5) + fract(uTime * 3.71)) - 0.5);
          col += gn * uGrain * (0.55 + 0.9 * (1.0 - lg));
          col = mix(col, uFlashColor, uFlash);   // white-out (into haze, or into light through a door)
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
    for (const k of ['ao1', 'ao2']) if (this[k]) this[k].dispose();
    const depth = new THREE.DepthTexture(w, h);
    depth.type = THREE.UnsignedIntType;
    this.main = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: CONFIG.render.msaa, depthBuffer: true, depthTexture: depth });
    this.ao1 = new THREE.WebGLRenderTarget(Math.ceil(w / 2), Math.ceil(h / 2), opts);
    this.ao2 = this.ao1.clone();
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
    // contact shading
    const am = this.aoMat.uniforms;
    am.tDepth.value = this.main.depthTexture;
    am.uTexel.value.set(1 / this.w, 1 / this.h);
    am.uNear.value = camera.near; am.uFar.value = camera.far;
    am.uTanHalf.value = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2); am.uAspect.value = camera.aspect;
    this._pass(this.aoMat, this.ao1);
    this.aoBlurMat.uniforms.tSrc.value = this.ao1.texture;
    this.aoBlurMat.uniforms.uDir.value.set(1 / this.ao1.width, 0);
    this._pass(this.aoBlurMat, this.ao2);
    this.aoBlurMat.uniforms.tSrc.value = this.ao2.texture;
    this.aoBlurMat.uniforms.uDir.value.set(0, 1 / this.ao1.height);
    this._pass(this.aoBlurMat, this.ao1);
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
    u.uFade.value = p.fade; u.uFlash.value = p.flash; u.uFlashColor.value.copy(p.flashColor); u.uTime.value = p.time;
    u.uSoft.value = p.soft; u.uBlackLift.value = p.blackLift; u.uKeepWarm.value = p.keepWarm; u.uSmear.value.copy(p.smear);
    u.tAO.value = this.ao1.texture; u.uAO.value = p.ao; u.uAODebug.value = p.aoDebug; u.uUneven.value = p.uneven;
    u.uFogDensity.value = scene.fog ? scene.fog.density : 0;
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

  // per-frame look: each film grades its own picture (FILM.grade(t, params, tl), see the film's film.js)
  updateFromTimeline(t, tl) {
    this.params.time = t;
    if (typeof FILM !== 'undefined' && FILM.grade) FILM.grade(t, this.params, tl);
  }
}
