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
          col += vec3(1.0, 0.85, 0.6) * exp(-a * 140.0) * (0.6 + 0.4 * uPulse) * 1.4 * step(0.0001, uA + uA2 + 0.01);
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
    // a thin arrow around the planet showing which way it turns
    const am = new THREE.MeshBasicMaterial({ color: '#e8f2ff', transparent: true, opacity: 0, depthWrite: false });
    this.arrow = new THREE.Group();
    const arc = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.006, 6, 80, 1.5), am); arc.rotation.x = -Math.PI / 2; this.arrow.add(arc);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.1, 10), am);
    head.position.set(1.32 * Math.cos(1.5), 0, -1.32 * Math.sin(1.5)); head.rotation.set(0, 0, 0); head.lookAt(new THREE.Vector3(1.32 * Math.cos(1.6), 0, -1.32 * Math.sin(1.6))); head.rotateX(Math.PI / 2); this.arrow.add(head);
    this.arrowMat = am; this.scene.add(this.arrow);
    this._w = new THREE.Vector3(); this._side = new THREE.Vector3(); this._up = new THREE.Vector3(0, 1, 0);
  }

  update(t) {
    const T = t - SL.earth;
    // the planet turns (sped up so you can see it), a tiny lurch when the rotation ticks up
    const tick = MathX.smooth(t, SL.tick, SL.tick + 0.25);
    const spin = 2.15 + T * 0.11 + tick * 0.02 + 0.004 * Math.sin(Math.max(0, t - SL.tick) * 18) * Math.exp(-Math.max(0, t - SL.tick) * 3) * (t > SL.tick ? 1 : 0);
    this.earth.rotation.y = spin; this.clouds.rotation.y = spin * 1.02 + 0.02;
    // the sun turns with the view so the city stays in the morning light (the sun is fixed relative to the city here)
    this.uniforms.uSun.value.copy(this.sunDir).applyAxisAngle(this._up, spin);
    this.clouds.material.uniforms.uOff.value = T * 0.0005;
    // rings out from the city; after the shift a swell over the oceans
    this.RU.uR.value = 0.02 + Math.max(0, T) * 0.32;
    this.RU.uA.value = 0.9 * MathX.smooth(T, 0.0, 0.4) * (1 - MathX.smooth(T, 5.6, 6.6));
    this.RU.uR2.value = Math.max(0, t - SL.shift) * 0.55;
    this.RU.uA2.value = 1.5 * MathX.smooth(t, SL.shift, SL.shift + 0.4);
    this.RU.uPulse.value = 0.5 + 0.5 * Math.sin(t * 7);
    // the camera: rushes out from above the city, drifts, then dives back in toward the coast
    this.earth.updateMatrixWorld(true);
    const epi = this._w.copy(this.epiL).applyMatrix4(this.earth.matrixWorld).normalize();
    const dist = T < 2.0 ? Math.exp(MathX.lerp(Math.log(1.15), Math.log(6.3), Ease.outCubic(MathX.clamp(T / 2.0, 0, 1))))
      : t < SL.shift + 0.6 ? 6.3 + 0.35 * MathX.smooth(T, 2.0, 5.5)
      : Math.exp(MathX.lerp(Math.log(6.65), Math.log(1.06), Ease.inCubic(MathX.clamp((t - SL.shift - 0.6) / (SL.coast - SL.shift - 0.6), 0, 1))));
    const side = this._side.crossVectors(this._up, epi).normalize();
    const off = 0.35 * MathX.smooth(T, 0.5, 2.5) * (1 - MathX.smooth(t, SL.shift + 0.6, SL.coast));
    this.camera.position.copy(epi).multiplyScalar(dist).addScaledVector(side, off).addScaledVector(this._up, off * 0.6);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(epi.x * 0.02, epi.y * 0.02 - 0.08 * MathX.smooth(T, 0.8, 2.5) * (1 - MathX.smooth(t, SL.shift + 0.6, SL.coast)), epi.z * 0.02);
    this.camera.fov = 38; this.camera.updateProjectionMatrix();
    // the arrow sits around the equator on the side facing you, turning with the planet a little
    this.arrow.rotation.set(0.32, Math.atan2(this.camera.position.x, this.camera.position.z) - 0.75 + T * 0.11, 0);
    this.arrowMat.opacity = 0.65 * MathX.smooth(T, 1.6, 2.2) * (1 - MathX.smooth(t, SL.shift + 0.6, SL.shift + 1.2));
    this.camera.updateMatrixWorld(true);
  }
}
