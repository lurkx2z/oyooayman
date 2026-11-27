/* SPACE — (being written: a placeholder set so the page boots) */
TW_SETS.space = (app) => {
  const S = twSet(app, { sky: '#05070c', sun: [1, 1, 1], fov: 50, far: 1e5 });
  const ball = twMesh(new THREE.SphereGeometry(10, 32, 16), twStd('#4a7ab0', 0.8), 0, 0, -60, S.scene);
  return { scene: S.scene, camera: S.camera, frame(t) { twCam(S.camera, [0, 0, 0], [0, 0, -60], 50); ball.rotation.y = t * 0.2; } };
};
