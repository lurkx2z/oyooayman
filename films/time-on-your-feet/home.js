/* home — stub (being built). */
TF_SETS.home = (app) => {
  const S = tfSet(app, { sky: '#20242c', hemi: ['#ffffff', '#444444', 1.0] });
  tfBox(2, 2, 2, tfStd('#888888'), 0, 1, -6);
  if ('home' !== 'lab') tfBuildPole(S.scene);
  return { scene: S.scene, camera: S.camera, frame(t, shot) { tfCam(S.camera, [0, 1.6, 2], [0, 1, -6], 55); } };
};
