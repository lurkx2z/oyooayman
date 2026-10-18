/* =====================================================================
   WORLD · VOID (390.5 → 458 s) — below anything ever measured. No objects, only the scale itself:
     rings that each mark ten times smaller rush past (they stop when you reach the limit) · space starts to flicker and
     boil (the foam) · the Planck length · a black hole forms, bends the foam round it, flares and is gone · black
   Everything is one shader on a sky round you; the tunnel's axis is −z.
   ===================================================================== */

SH_WORLDS.void = (app) => {
  const W = shMakeWorld(60);
  W.scene.background = new THREE.Color('#000000');
  const U = { uZoom: { value: 0 }, uFoam: { value: 0 }, uBH: { value: 0 }, uHawk: { value: 0 }, uT: { value: 0 }, uQuark: { value: 0 }, uK: { value: 1 }, uFwd: { value: new THREE.Vector3(0, 0, -1) } };
  const skyM = new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
    fragmentShader: /* glsl */`
      uniform float uZoom, uFoam, uBH, uHawk, uT, uQuark, uK; uniform vec3 uFwd; varying vec3 vD;
      float h2(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), u.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), u.x), u.y); }
      vec2 cell(vec2 p, float fl){ vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0; float id = 0.0;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 o = vec2(h2(i + g + fl), h2(i + g + 17.3 + fl));
          o = 0.5 + 0.45 * sin(6.283 * o + uT * 1.7); float d = length(g + o - f); if (d < d1) { d2 = d1; d1 = d; id = h2(i + g + 3.7); } else if (d < d2) d2 = d; }
        return vec2(d2 - d1, id); }
      // the pattern on the sky at an angle th from the axis (azimuth ph): rings every factor of ten, finer ones between
      vec3 scene(float th, float ph){
        float u = log(max(th, 1e-5)) - uZoom, L10 = 2.302585;
        float wob = uFoam * (vn(vec2(u * 2.0, ph * 3.0) + uT * 2.0) - 0.5) * 0.9;
        float uu = u + wob;
        float r10 = abs(fract(uu / L10) - 0.5), r2 = abs(fract(uu / 0.6931) - 0.5);
        float ring = exp(-pow(r10 * 70.0, 2.0)) + 0.28 * exp(-pow(r2 * 60.0, 2.0));
        float spokes = 0.12 * exp(-pow(abs(fract(ph * 12.0 / 6.283 + wob * 0.3) - 0.5) * 40.0, 2.0)) * smoothstep(-6.0, -3.0, u + uZoom);
        vec2 sc = vec2(uu * 3.0, ph * 9.0 / 6.283 * 3.0); float star = smoothstep(0.93, 1.0, h2(floor(sc * 3.0))) * smoothstep(0.35, 0.0, length(fract(sc * 3.0) - 0.5));
        vec3 col = vec3(0.025, 0.015, 0.05) + vec3(1.0, 0.72, 0.42) * ring * 0.55 * (1.0 - 0.6 * uFoam) + vec3(0.55, 0.5, 1.0) * spokes * (1.0 - uFoam) + vec3(0.8, 0.85, 1.0) * star * 0.5;
        // the foam: cells that flicker in and out, everywhere, at your own size
        if (uFoam > 0.0) {
          float fl = floor(uT * 9.0);
          vec2 c1 = cell(vec2(uu * 2.2, ph * 7.0 / 6.283 * 2.2), fl * 0.0), c2 = cell(vec2(uu * 5.0 + 4.0, ph * 16.0 / 6.283 * 2.2), fl);
          float e1 = smoothstep(0.08, 0.0, c1.x) * (0.4 + 0.6 * step(0.45, h2(vec2(c1.y * 91.0, fl)))), e2 = smoothstep(0.06, 0.0, c2.x) * step(0.55, h2(vec2(c2.y * 53.0, fl + 1.0)));
          float bub = smoothstep(0.92, 1.0, h2(vec2(floor(uu * 3.0), floor(ph * 5.0) + fl)));
          col += uFoam * (vec3(0.55, 0.45, 1.0) * e1 * 0.55 + vec3(1.0, 0.75, 0.5) * e2 * 0.5 + vec3(0.7, 0.6, 1.0) * bub * 0.12);
        }
        return col;
      }
      void main(){
        vec3 d = normalize(vD), a = normalize(uFwd);
        vec3 x = normalize(cross(a, vec3(0.0, 1.0, 0.0))), y = cross(x, a);
        float th = acos(clamp(dot(d, a), -1.0, 1.0)), ph = atan(dot(d, y), dot(d, x));
        vec3 col;
        if (uBH > 0.0) {
          float rs = uBH;
          if (th < rs) col = vec3(0.0);
          else {
            // light bends round it: what is behind appears pulled out into a ring
            float th2 = th - rs * rs * 1.6 / th; float ph2 = ph;
            if (th2 < 0.0) { th2 = -th2; ph2 = ph + 3.14159; }
            col = scene(max(th2, 1e-4), ph2);
            float ringW = rs * 0.06;
            col += vec3(1.0, 0.8, 0.6) * exp(-pow((th - rs * 1.04) / ringW, 2.0)) * 1.6;
            col += vec3(1.0, 0.85, 0.7) * uHawk * exp(-(th - rs) / (rs * 0.6)) * 2.5;
          }
          col *= 1.0;
        } else col = scene(th, ph);
        // the quark you came from: a point that never grows, fading
        col += vec3(1.0, 0.45, 0.35) * uQuark * (exp(-pow(th / 0.004, 2.0)) * 3.0 + exp(-th / 0.03) * 0.4);
        gl_FragColor = vec4(col * uK, 1.0);
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), skyM); sky.frustumCulled = false; W.scene.add(sky);
  const H0 = shH(SH.unknown);

  const api = {
    scene: W.scene, camera: W.camera, W,
    frame(t, h, app) {
      // you float; the view drifts a little round the axis
      const yw = 0.05 * Math.sin(t * 0.13) + noise1(t * 0.4, 2) * 0.02, pt = 0.035 * Math.sin(t * 0.11 + 1) + noise1(t * 0.4, 5) * 0.015;
      W.camera.position.set(0, 0, 0); W.camera.up.set(0, 1, 0);
      const d = shDir(yw, pt); W.camera.lookAt(d[0], d[1], d[2]); W.camera.rotateZ(noise1(t * 0.25, 9) * 0.04);
      W.camera.fov = 60; shClip(W.camera, 0.1, 10);
      sky.position.copy(W.camera.position); sky.scale.setScalar(5);
      U.uT.value = t;
      U.uZoom.value = Math.log(H0 / h);
      U.uFoam.value = shE(t, SH.foam - 1.5, SH.planck + 1);
      U.uQuark.value = 1 - shE(t, SH.unknown + 2, SH.unknown + 8);
      // the black hole: forms at its beat, holds, then flares as it evaporates
      const form = shE(t, SH.bh - 0.4, SH.bh + 1.6, Ease.outCubic), gone = shE(t, SH.flash - 1.6, SH.flash);
      U.uBH.value = 0.2 * form * (1 - 0.92 * gone);
      U.uHawk.value = 0.15 * form + 2.5 * shE(t, SH.flash - 2.2, SH.flash);
      U.uK.value = 1 - shE(t, SH.flash, SH.flash + 0.3);
      if (window.SH_DBG && SH_DBG.void) SH_DBG.void(api, t, h);
    },
    grade(t, p) {
      p.saturation = 1.0; p.contrast = 1.08; p.bloom = 0.7; p.bloomThreshold = 0.7; p.grain = 0.035; p.vignette = 0.7; p.soft = 0.05; p.ao = 0; p.warmth = 0;
      // the flash as it goes, then black (the phone buzzes in the dark)
      const fl = shWin(t, SH.flash - 0.15, SH.flash + 0.25, 0.15, 1.3);
      p.flash = Math.max(p.flash, fl); p.flashColor.setRGB(1, 0.92, 0.85);
      p.fade = Math.max(p.fade, shE(t, SH.flash + 0.6, SH.flash + 2.4));
    },
  };
  return api;
};
