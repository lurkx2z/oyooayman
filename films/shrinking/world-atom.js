/* WORLD · ATOM — (stub, being built) */
SH_WORLDS.atom = (app) => {
  const W = shMakeWorld(60);
  W.scene.background = new THREE.Color('#101014');
  W.root.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), shStd('#888888', 0.6)));
  W.scene.add(new THREE.HemisphereLight('#ffffff', '#333333', 1.5));
  return { scene: W.scene, camera: W.camera, W, frame(t, h) { W.setH(1); W.look([0, 0.3, 4], [0, 0, 0]); } };
};
