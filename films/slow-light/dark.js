/* =====================================================================
   DARK — nothing reaches you: a black frame. (The diagrams over it are the HUD's; the sound carries the scene.)
     eye   the last light, a millimetre from your eye
     text  Mum's text, stopped on its way
   A few faint motes of the eye's own noise (what you "see" in total darkness) so the black is not a dead frame.
   ===================================================================== */

SL_SETS.dark = (app) => {
  const S = slSet(app, { sky: '#000000', fov: 50, hemi: ['#000000', '#000000', 0] });
  const puffs = slPuffs(S.scene, 400, { additive: true, soft: 2.2 });
  slCam(S.camera, [0, 0, 0], [0, 0, -1], 50);
  return {
    scene: S.scene, camera: S.camera,
    frame(t) {
      // the eye's own dark noise: faint, slow, grey-violet specks that come and go
      puffs.begin();
      for (let i = 0; i < 90; i++) {
        const ph = slR(i, 41) * 6.283, life = 2.5 + 2 * slR(i, 42), u = ((t / life + slR(i, 43)) % 1), a = Math.sin(u * Math.PI) * 0.06;
        puffs.add((slR(i, 44) - 0.5) * 2.4, (slR(i, 45) - 0.5) * 1.4, -1.4, 0.03 + 0.04 * slR(i, 46), a, 0.55, 0.5, 0.7);
      }
      puffs.end();
      SL_U.uSlFade.value = 1; SL_U.uSlDop.value = 0; SL_U.uSlFrontOn.value = 0;
    },
    grade(t, p) { p.grain = 0.03; p.vignette = 0.7; p.bloom = 0; },
  };
};
