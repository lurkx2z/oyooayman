/* =====================================================================
   DARK — midnight: nothing. A black frame (the caption "Midnight." over it; the sound carries the moment).
   ===================================================================== */

UX_SETS.dark = (app) => {
  const S = uxSet(app, { sky: '#000000', fov: 50, hemi: ['#000000', '#000000', 0] });
  uxCam(S.camera, [0, 0, 0], [0, 0, -1], 50);
  return {
    scene: S.scene, camera: S.camera,
    frame(t) {},
    grade(t, p) { p.grain = 0.02; p.vignette = 0.7; p.bloom = 0; p.fade = Math.max(p.fade, 1 - MathX.smooth(t, UX.real - 0.6, UX.real)); },
  };
};
