/* (placeholder while the set is built) */
SB_SETS.house = (app) => {
  const S = sbSet(app, { sky: '#202530', fov: 55 });
  sbBox(4, 0.1, 4, sbStd('#556070'), 0, 0, -3);
  sbBox(1, 1, 1, sbStd('#c98a50'), 0, 0.5, -3);
  return { scene: S.scene, camera: S.camera, frame(t) { sbCam(S.camera, [0, 1.6, 0], [0, 0.8, -3], 55); } };
};
