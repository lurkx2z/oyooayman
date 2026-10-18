/* =====================================================================
   GLOBE — light as it really is: the Earth from space (the engine's EarthScene), and a pulse of light lapping it,
   7.5 times a second. At that speed a frame would only catch it as a flicker, so the shot shows it 40 times slower
   (and says so on screen).
   ===================================================================== */

const SL_GLOBE = { slow: 40, laps: SL_C0 / 40075e3 };          // laps a second at the real speed of light (≈ 7.48)

SL_SETS.globe = (app) => {
  const E = new EarthScene(), scene = E.scene;
  const cam = new THREE.PerspectiveCamera(30, 16 / 9, 0.01, 200); scene.add(cam);
  const puffs = slPuffs(scene, 900, { additive: true, soft: 1.5 });
  // the pulse's path: a great circle just above the air, tilted a little off the equator
  // (the ring faces you, tipped back a little: it runs round the planet's outline, in front of it at the bottom)
  const n = E.viewDir.clone().multiplyScalar(Math.cos(0.45)).addScaledVector(new THREE.Vector3(0, 1, 0), Math.sin(0.45)).normalize();
  const u = new THREE.Vector3(0, 1, 0).cross(n).normalize(), v = new THREE.Vector3().crossVectors(n, u);
  const R = 1.09, P = new THREE.Vector3();
  const at = (th) => P.copy(u).multiplyScalar(Math.cos(th) * R).addScaledVector(v, Math.sin(th) * R);
  const side = new THREE.Vector3(0, 1, 0).cross(E.viewDir).normalize();
  return {
    scene, camera: cam,
    frame(t) {
      const T = t - SL.fast;
      E.earth.rotation.y = 0.35 + T * 0.006; E.clouds.rotation.y = E.earth.rotation.y * 1.0; E.clouds.material.uniforms.uOff.value = T * 0.0004;
      // the camera: the planet a little right of centre, easing in
      const d = 5.5 - 0.3 * slK(T, 0, 8);
      cam.position.copy(E.viewDir).multiplyScalar(d).addScaledVector(side, -0.55 + 0.05 * T).add(new THREE.Vector3(0, 0.22, 0));
      cam.lookAt(side.x * -0.5, 0.05, side.z * -0.5); cam.updateMatrixWorld(true);
      // the pulse: a bright head, a fading tail, its faint track
      puffs.begin();
      const th = 2 * Math.PI * SL_GLOBE.laps * T / SL_GLOBE.slow + 2.4, on = MathX.smooth(T, 0.3, 1.0);
      for (let k = 0; k < 120; k++) {
        const f = k / 120, p = at(th - f * 1.3);
        puffs.add(p.x, p.y, p.z, 0.02 + 0.07 * Math.pow(1 - f, 1.6), 0.95 * Math.pow(1 - f, 1.5) * on, 1, 0.96, 0.88);
      }
      { const p = at(th); puffs.add(p.x, p.y, p.z, 0.5, 0.45 * on, 1, 0.92, 0.8); puffs.add(p.x, p.y, p.z, 0.14, 1.0 * on, 1, 1, 1); puffs.add(p.x, p.y, p.z, 0.05, 1.0 * on, 1, 1, 1); }
      for (let k = 0; k < 360; k++) { const p = at(k / 360 * 2 * Math.PI); puffs.add(p.x, p.y, p.z, 0.012, 0.12 * on, 0.9, 0.9, 1); }
      puffs.end();
      SL_U.uSlFade.value = 1; SL_U.uSlDop.value = 0; SL_U.uSlFrontOn.value = 0;
    },
    grade(t, p) { p.bloom = 0.7; p.bloomThreshold = 0.6; p.vignette = 0.45; p.grain = 0.02; p.exposure = 1.05; },
  };
};
