/* =====================================================================
   ECHO PICTURES — in the dark under the trees you click your tongue and listen, the way some blind people see with
   echoes. The picture is drawn only from your clicks: each click's wave goes out from your head, and every surface it
   reaches lights up when its echo comes back, then fades. Real sound would cross 7 m in 20 thousandths of a second, so
   the wave is shown slowed down (labelled on screen). Each click listens a little further (you learn to listen).
   The whole set is drawn with one override material while it is on (scene.overrideMaterial).
   ===================================================================== */

const SO_ECHO_V = 5.0;                                       // m/s on screen (343 m/s slowed ~70×)
// how far each click is listened to (m), in the order of SO.tClicks
const SO_ECHO_RANGE = [3.6, 3.6, 3.6, 5.8, 7.8, 11.5, 18, 18, 18, 18, 18];

function soBuildEcho(scene) {
  const N = 12;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uL: { value: new THREE.Vector3() }, uT: { value: 0 }, uClick: { value: new Array(N).fill(-1e3) }, uRange: { value: new Array(N).fill(0) }, uV: { value: SO_ECHO_V } },
    vertexShader: `varying vec3 vW; varying vec3 vN;
      void main(){
        vec4 p = vec4(position, 1.0); vec3 n = normal;
        #ifdef USE_INSTANCING
          p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
        #endif
        vec4 w = modelMatrix * p; vW = w.xyz; vN = normalize(mat3(modelMatrix) * n);
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uL; uniform float uT, uV; uniform float uClick[${N}]; uniform float uRange[${N}];
      varying vec3 vW; varying vec3 vN;
      void main(){
        float d = distance(vW, uL);
        vec3 V = normalize(cameraPosition - vW), Nn = normalize(vN);
        float facing = abs(dot(Nn, V)), rim = pow(1.0 - facing, 3.0);
        float e = 0.0, b = 0.0;
        for (int i = 0; i < ${N}; i++) {
          float age = uT - uClick[i]; if (age < 0.0 || age > 6.0) continue;
          float front = uV * age, m = smoothstep(uRange[i] + 1.2, uRange[i] - 0.3, d);
          float band = exp(-pow((d - front) / 0.22, 2.0));
          float glow = front > d ? exp(-(age - d / uV) / 1.5) : 0.0;
          e = max(e, (0.35 * glow + 0.9 * band) * m); b = max(b, band * m);
        }
        float near = 1.0 / (1.0 + 0.05 * d * d);
        float shade = (0.22 + 0.78 * facing + 0.9 * rim) * (0.55 + 0.45 * near);
        // a fine contour from the distance (rings of equal distance: like a sonar picture)
        float iso = 0.75 + 0.25 * smoothstep(0.35, 0.5, abs(fract(d * 2.0) - 0.5));
        vec3 col = mix(vec3(0.45, 0.72, 1.0), vec3(1.0), 0.6 * b) * e * shade * iso;
        gl_FragColor = vec4(col * 1.6, 1.0); }`,
  });
  return {
    mat,
    set(on, t, you) {
      scene.overrideMaterial = on ? mat : null;
      if (!on) return;
      const U = mat.uniforms; U.uT.value = t; U.uL.value.set(you[0], you[1], you[2]);
      SO.tClicks.forEach((c, i) => { if (i < N) { U.uClick.value[i] = c; U.uRange.value[i] = SO_ECHO_RANGE[i] ?? 18; } });
      scene.background = null;
    },
  };
}
