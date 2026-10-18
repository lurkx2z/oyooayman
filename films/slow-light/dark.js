/* =====================================================================
   DARK — nothing reaches you: a black frame (the large diagram over it is the HUD's: the light stopped inside your
   eye; the sound carries the scene). No specks: in a stopped world the eye gets nothing new at all.
     eye   the next light you'd see, a hair from your retina
   ===================================================================== */

SL_SETS.dark = (app) => {
  const S = slSet(app, { sky: '#000000', fov: 50, hemi: ['#000000', '#000000', 0] });
  slCam(S.camera, [0, 0, 0], [0, 0, -1], 50);
  return {
    scene: S.scene, camera: S.camera,
    frame(t) { SL_U.uSlFade.value = 1; SL_U.uSlDop.value = 0; SL_U.uSlFrontOn.value = 0; },
    grade(t, p) { p.grain = 0.03; p.vignette = 0.7; p.bloom = 0; },
  };
};
