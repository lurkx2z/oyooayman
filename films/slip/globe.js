/* =====================================================================
   THE PLANET — the shared Earth (js/world/earth.js), turning, with the
   quake's rings spreading from the city across the globe, a pulse at the
   city, and after the rotation ticks up, a swell running out across the
   oceans (the sea "shifting"). The camera rushes out from the city to the
   whole planet, drifts, then dives back to the coast.
   ===================================================================== */

const SL_CITY_LL = [-70.6, 42.1];     // the city on the coast (lon, lat)

class SlEarth extends EarthScene {
  constructor() {
    super();
    this.epiL = EarthScene.dirFromLonLat(SL_CITY_LL[0], SL_CITY_LL[1]);
    this.sunDir.copy(EarthScene.dirFromLonLat(-48, 8)); this.uniforms.uSun.value.copy(this.sunDir);   // (the city in daylight)
    this.uniforms.uLights.value = 1;
    this.earth.material.fragmentShader = this.earth.material.fragmentShader.replace('* 0.32 *', '* 0.07 *');   // (a softer sun glint)
    this.RU = { uEpi: { value: this.epiL.clone() }, uR: { value: 0 }, uA: { value: 0 }, uR2: { value: 0 }, uA2: { value: 0 }, uPulse: { value: 0 }, uMask: this.uniforms.uMask, uSun: this.uniforms.uSun };
    this.rings = new THREE.Mesh(new THREE.SphereGeometry(1.004, 128, 64), new THREE.ShaderMaterial({
      uniforms: this.RU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'varying vec3 vO; varying vec2 vUv; varying vec3 vN; void main(){ vO = normalize(position); vUv = uv; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */`
        uniform vec3 uEpi, uSun; uniform float uR, uA, uR2, uA2, uPulse; uniform sampler2D uMask;
        varying vec3 vO; varying vec2 vUv; varying vec3 vN;
        void main(){
          float a = acos(clamp(dot(normalize(vO), uEpi), -1.0, 1.0));
          // the seismic rings (thin, pale) racing out from the city
          float r = exp(-pow((a - uR) / 0.006, 2.0)) + 0.45 * exp(-pow((a - uR + 0.05) / 0.008, 2.0)) + 0.2 * exp(-pow((a - uR + 0.11) / 0.011, 2.0));
          vec3 col = vec3(0.6, 0.88, 1.0) * r * uA;
          // the city's pulse
          col += vec3(1.0, 0.8, 0.5) * (exp(-a * 110.0) * 1.2 + exp(-pow((a - 0.035 - 0.01 * uPulse) / 0.006, 2.0)) * 0.9) * step(0.0001, uA + uA2 + 0.01);
          // after the rotation changes: a broad swell running across the oceans only
          float ocean = 1.0 - texture2D(uMask, vUv).r;
          float sw = exp(-pow((a - uR2) / 0.12, 2.0)) * (0.75 + 0.25 * sin(a * 50.0)) * step(0.02, uR2);
          col += vec3(0.35, 0.7, 1.0) * sw * uA2 * ocean;
          // fade on the night side
          col *= 0.35 + 0.65 * smoothstep(-0.2, 0.2, dot(normalize(vN), uSun));
          gl_FragColor = vec4(col, 1.0);
        }`,
    }));
    this.earth.add(this.rings);
    // soften the hard edge of the arctic cap in the day texture
    { const cv = this.uniforms.uDay.value.image, x = cv.getContext('2d'), H = cv.height, y0 = (90 - 86) / 180 * H, y1 = (90 - 74) / 180 * H, g = x.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, 'rgba(222,228,234,0.95)'); g.addColorStop(1, 'rgba(222,228,234,0)'); x.fillStyle = g; x.fillRect(0, 0, cv.width, y1); this.uniforms.uDay.value.needsUpdate = true; }
    // a bold arrow drawn on the planet (below the city, along a parallel) showing which way it turns; it stays put
    // while the planet turns under it
    const am = new THREE.MeshBasicMaterial({ color: '#ffc24a', transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    const pts = []; for (let i = 0; i <= 24; i++) pts.push(EarthScene.dirFromLonLat(SL_CITY_LL[0] - 38 + i * 2.9, 24 + 3 * Math.sin(i / 24 * Math.PI)).multiplyScalar(1.03));
    const curve = new THREE.CatmullRomCurve3(pts);
    this.arrow = new THREE.Group(); this.arrowPivot = new THREE.Group(); this.arrowPivot.add(this.arrow); this.scene.add(this.arrowPivot);
    this.arrow.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.02, 6, false), am));
    const tip = curve.getPoint(1), dir = curve.getTangent(1), head = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 12), am);
    head.position.copy(tip).addScaledVector(dir, 0.06); head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); this.arrow.add(head);
    this.arrowMat = am;
    this._w = new THREE.Vector3(); this._side = new THREE.Vector3(); this._up = new THREE.Vector3(0, 1, 0);
  }

  spinAt(t) {
    const T = t - SL.earth, k = Math.max(0, t - SL.tick);
    return 2.15 + T * 0.15 + MathX.smooth(t, SL.tick, SL.tick + 0.25) * 0.02 + 0.004 * Math.sin(k * 18) * Math.exp(-k * 3) * (t > SL.tick ? 1 : 0);
  }

  update(t) {
    const T = t - SL.earth;
    // the planet turns under a still camera (about 9° a second, so you can see it), with a tiny lurch at the tick
    const spin = this.spinAt(t);
    this.earth.rotation.y = spin; this.clouds.rotation.y = spin * 1.02 + 0.02;
    this.clouds.material.uniforms.uOff.value = T * 0.0005;
    this.uniforms.uSun.value.copy(this.sunDir).applyAxisAngle(this._up, this.spinAt(SL.tick));   // (morning light on the city's half)
    // rings out from the city; after the shift a swell running in across the ocean toward the city's coast
    this.RU.uR.value = 0.02 + Math.max(0, T) * 0.32;
    this.RU.uA.value = 0.9 * MathX.smooth(T, 0.0, 0.4) * (1 - MathX.smooth(T, 5.6, 6.6));
    this.RU.uR2.value = Math.max(0.0, 0.62 - Math.max(0, t - SL.shift) * 0.42);
    this.RU.uA2.value = 1.6 * MathX.smooth(t, SL.shift, SL.shift + 0.3);
    this.RU.uPulse.value = 0.5 + 0.5 * Math.sin(t * 7);
    // the camera: out from above the city to a still view (the city drifts across it), then back in to the city
    this.earth.updateMatrixWorld(true);
    const epi = this._w.copy(this.epiL).applyMatrix4(this.earth.matrixWorld).normalize();
    const still = (this._still = this._still || new THREE.Vector3()).copy(this.epiL).applyAxisAngle(this._up, this.spinAt(SL.tick)).normalize();
    const kIn = 1 - Ease.inOutSine(MathX.clamp(T / 2.0, 0, 1)), kOut = Ease.inCubic(MathX.clamp((t - SL.shift - 0.6) / (SL.coast - SL.shift - 0.6), 0, 1));
    const dirC = (this._dc = this._dc || new THREE.Vector3()).copy(still).lerp(epi, Math.max(kIn, kOut)).normalize();
    const dist = T < 2.0 ? Math.exp(MathX.lerp(Math.log(1.15), Math.log(6.3), Ease.outCubic(MathX.clamp(T / 2.0, 0, 1))))
      : t < SL.shift + 0.6 ? 6.3 + 0.35 * MathX.smooth(T, 2.0, 5.5)
      : Math.exp(MathX.lerp(Math.log(6.65), Math.log(1.06), kOut));
    this.camera.position.copy(dirC).multiplyScalar(dist).addScaledVector(this._up, -0.25 * (1 - Math.max(kIn, kOut)));
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(dirC.x * 0.02, dirC.y * 0.02 - 0.12 * (1 - Math.max(kIn, kOut)), dirC.z * 0.02);
    this.camera.fov = 38; this.camera.updateProjectionMatrix();
    // the arrow stays where the city is at the tick; the planet turns under it
    this.arrowPivot.rotation.y = this.spinAt(SL.tick);
    this.arrowMat.opacity = 0.9 * MathX.smooth(T, 1.4, 2.0) * (1 - MathX.smooth(t, SL.shift + 0.4, SL.shift + 0.9));
    this.camera.updateMatrixWorld(true);
  }
}
