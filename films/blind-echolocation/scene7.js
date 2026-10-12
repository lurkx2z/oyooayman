/* =====================================================================
   SCENE 7 — "The brain starts changing" (the science space; brain.js). Colour code: amber = hearing (auditory
   cortex), cyan = regions normally associated with vision (the occipital lobe). An illustration of brain-imaging
   (fMRI) findings, not a picture of what a brain looks like or "shows".
     G1  her profile, close; the camera pushes in toward her ear (a soft white flash)
     G2  "Your brain isn't a fixed machine. It can adapt through learning.": the brain turns; its pathways quicken
     G3  "…increased responses to echoes in regions normally associated with vision.": a click reaches the ear, the
         auditory cortex answers, then the back of the brain answers too
     G4  "…not limited to people who were blind. Sighted participants showed changes too.": two brains, both answer
     G5  "That doesn't mean hearing has turned into eyesight…": a dive through the pathways from hearing toward the back
     G6  (no narration) one click: a pulse runs through the whole network; the camera flies on into white
   ===================================================================== */

BE.s8 = BN_SC[8].start;
BE.g2 = bnE(7, 'your').start - 0.15;
BE.g3 = bnE(7, 'in').start - 0.17;
BE.g4 = bnE(7, 'and', 10).start - 0.18;
BE.g5 = bnE(7, 'that').start - 0.19;
BE.g6 = BN_CLIP[7].speechEnd + 0.25;
BE.gEar = bnE(7, 'echoes').start - 0.25;                // the click reaches her ear
BE.gVis = bnE(7, 'regions').start - 0.05;              // the back of the brain answers (on "regions")
BE.gBlind = bnE(7, 'blind').start - 0.2;
BE.gSighted = bnE(7, 'sighted').start - 0.1;
BE.gClicks = [BE.g6 + 0.6, BE.g6 + 2.4];
const BE_BRAIN_P = new THREE.Vector3(0, 12, -30);

BE_SET_BUILDERS.push((app) => {
  const vd = app.sets.void;
  vd.brainA = new BeBrain(vd.scene, 7); vd.brainB = new BeBrain(vd.scene, 8);
  vd.brainA.root.visible = vd.brainB.root.visible = false;
  const f0 = vd.frame, x0 = vd.fx;
  vd.frame = function (app, t, shot) { f0.call(this, app, t, shot); beBrainFrame.call(this, app, t, shot); };
  vd.fx = function (app, t, shot) { x0.call(this, app, t, shot); beBrainFx.call(this, app, t, shot); };
});

function beBrainFrame(app, t, shot) {
  const A = this.brainA, Bb = this.brainB, B = BE, id = shot.id;
  const on = /^G[2-6]$/.test(id);
  A.root.visible = on; Bb.root.visible = id === 'G4';
  if (!on) return;
  A.mat.side = /^G[56]$/.test(id) ? THREE.DoubleSide : THREE.FrontSide;
  const H = app.renderer.getDrawingBufferSize(new THREE.Vector2()).y;
  A.pts.material.uniforms.uH.value = Bb.pts.material.uniforms.uH.value = H;
  A.root.position.copy(BE_BRAIN_P); A.root.scale.setScalar(1); A.root.rotation.set(0, 0, 0);
  const T = t - B.s7;
  if (id === 'G2') {
    A.root.rotation.y = MathX.lerp(-0.45, -1.15, Ease.inOutSine(MathX.ramp(t, B.g2, B.g3)));
    A.set({ uT: T, uNet: MathX.lerp(0.2, 0.9, MathX.smooth(t, bnE(7, 'adapt').start - 0.3, bnE(7, 'learning').start + 0.6)), uAud: 0, uVis: 0, uFlow: 0, uPulse: -10, uGlass: MathX.smooth(t, B.g2 - 0.1, B.g2 + 0.8) });
  } else if (id === 'G3') {
    A.root.rotation.y = MathX.lerp(-0.2, -0.75, Ease.inOutSine(MathX.ramp(t, B.g3, B.g4)));
    A.set({ uT: T, uNet: 0.45, uAud: MathX.smooth(t, B.gEar + 0.15, B.gEar + 0.7), uFlow: MathX.smooth(t, B.gEar + 0.6, B.gVis + 0.2), uVis: MathX.smooth(t, B.gVis, B.gVis + 0.9), uPulse: -10, uGlass: 1 });
  } else if (id === 'G4') {
    A.root.position.copy(BE_BRAIN_P).add(new THREE.Vector3(-1.05, 0, 0)); Bb.root.position.copy(BE_BRAIN_P).add(new THREE.Vector3(1.05, 0, 0));
    A.root.rotation.y = Bb.root.rotation.y = -0.6; A.root.scale.setScalar(0.85); Bb.root.scale.setScalar(0.85);
    const pulse = (t0) => 0.55 + 0.45 * Math.cos((t - t0) * 2.4);
    A.set({ uT: T, uNet: 0.4, uAud: 0.9 * MathX.smooth(t, B.gBlind - 0.2, B.gBlind + 0.4), uFlow: 0.8 * MathX.smooth(t, B.gBlind, B.gBlind + 0.6), uVis: pulse(B.gBlind) * MathX.smooth(t, B.gBlind + 0.2, B.gBlind + 0.8), uPulse: -10, uGlass: 1 });
    Bb.set({ uT: T + 3, uNet: 0.4, uAud: 0.9 * MathX.smooth(t, B.gSighted - 0.2, B.gSighted + 0.4), uFlow: 0.8 * MathX.smooth(t, B.gSighted, B.gSighted + 0.6), uVis: pulse(B.gSighted) * MathX.smooth(t, B.gSighted + 0.2, B.gSighted + 0.8), uPulse: -10, uGlass: 1 });
  } else {
    // G5–G6: a model four times larger; the camera travels inside it
    A.root.scale.setScalar(4); A.root.rotation.y = 0;
    const pulse = B.gClicks.reduce((m, c) => (t > c && t < c + 1.6 ? (t - c) * 0.75 : m), -10);
    A.set({ uT: T, uNet: 0.6, uAud: 0.45, uFlow: 0.8, uVis: 0.4 + 0.1 * Math.sin(T * 3), uPulse: pulse, uGlass: 0.55 * (id === 'G6' ? 1 - MathX.smooth(t, B.s8 - 1.4, B.s8 - 0.4) : 1) });
  }
}
function beBrainFx(app, t, shot) {
  if (shot.id !== 'G3') return;
  const A = this.brainA, ear = A.root.localToWorld(new THREE.Vector3(0.62, -0.05, 0.05));
  this.rings.source(ear, [B_EAR()], t, { r: 0.18, a: 0.9, dur: 0.8, col: '#ffb05a', th: 0.06 });
}
function B_EAR() { return BE.gEar; }

// ---- the shots
(function () {
  const V = (x, y, z) => new THREE.Vector3(x, y, z), B = BE, P = BE_BRAIN_P;
  const vd = () => FILM._app.sets.void;
  const head = () => vd().hero.worldOf('hc');
  const wl = (b, x, y, z) => vd()[b].root.localToWorld(V(x, y, z));
  const lab = (p, html, a, cls) => ({ p, html, a, cls });
  const S = [
    // G1: her right profile; the camera pushes in toward the ear
    { id: 'G1', t0: B.s7, t1: B.g2, set: 'void', look: () => BE_REAL, flash: (t) => 0.85 * MathX.smooth(t, B.g2 - 0.45, B.g2),
      cam: (t) => { const h = head(), k = Ease.inCubic(MathX.ramp(t, B.s7, B.g2)), d = MathX.lerp(1.0, 0.3, k); return { pos: V(h.x + 0.32 * (1 - k) + 0.04, h.y + 0.03, h.z + d), at: V(h.x + 0.03, h.y - 0.01, h.z), fov: 34, focus: d, dof: 0.6 }; } },
    { id: 'G2', t0: B.g2, t1: B.g3, set: 'void', look: () => BE_DARK, flash: (t) => 0.85 * (1 - MathX.smooth(t, B.g2, B.g2 + 0.6)),
      cam: (t) => { const k = Ease.inOutSine(MathX.ramp(t, B.g2, B.g3)); return { pos: V(P.x + 1.2, P.y + 0.75 - 0.15 * k, P.z + 2.8 - 0.5 * k), at: V(P.x, P.y - 0.05, P.z), fov: 42, focus: 3, dof: 0 }; } },
    { id: 'G3', t0: B.g3, t1: B.g4, set: 'void', look: () => BE_DARK,
      cam: (t) => { const k = Ease.inOutSine(MathX.ramp(t, B.g3, B.g4)); return { pos: V(P.x + 2.7 - 0.2 * k, P.y + 0.6, P.z - 0.2 * k), at: V(P.x, P.y - 0.05, P.z - 0.1), fov: 44, focus: 3, dof: 0 }; },
      labels: (t) => [
        lab(null, '<div class="k">ILLUSTRATION OF BRAIN-IMAGING (fMRI) FINDINGS</div>', MathX.smooth(t, B.g3 + 0.3, B.g3 + 0.8) * (1 - MathX.smooth(t, B.g4 - 0.4, B.g4)), 'small', 0, -38),
        lab(wl('brainA', 0.55, 0.32, 0.25), '<div class="k" style="color:#ffd39a">HEARING</div><div class="s">AUDITORY CORTEX</div>', MathX.smooth(t, B.gEar + 0.4, B.gEar + 0.8)),
        lab(wl('brainA', 0.1, 0.5, -0.75), '<div class="k">REGIONS ASSOCIATED WITH VISION</div><div class="s" style="color:#9ff6ff">OCCIPITAL LOBE</div>', MathX.smooth(t, B.gVis + 0.3, B.gVis + 0.7)),
      ] },
    { id: 'G4', t0: B.g4, t1: B.g5, set: 'void', look: () => BE_DARK,
      cam: beMove(B.g4, B.g5, [V(P.x + 0.4, P.y + 1.2, P.z + 3.9), V(P.x, P.y - 0.1, P.z), 44], [V(P.x - 0.3, P.y + 1.1, P.z + 3.6), V(P.x, P.y - 0.1, P.z), 44], { dof: 0 }),
      labels: (t) => [
        lab(V(P.x - 1.05, P.y + 0.85, P.z), '<div class="k">TRAINED · BLIND</div>', MathX.smooth(t, B.gBlind - 0.1, B.gBlind + 0.3)),
        lab(V(P.x + 1.05, P.y + 0.85, P.z), '<div class="k">TRAINED · SIGHTED</div>', MathX.smooth(t, B.gSighted - 0.1, B.gSighted + 0.3)),
      ] },
    // G5: inside (×4): from beside the auditory region, along the pathway, toward the back
    { id: 'G5', t0: B.g5, t1: B.g6, set: 'void', look: () => BE_DARK,
      cam: (t) => { const k = Ease.inOutSine(MathX.ramp(t, B.g5, B.g6 + 4)), a = V(2.6, 0.9, 1.8), b = V(1.2, 0.5, -1.4);
        const p = a.clone().lerp(b, k); return { pos: p.add(P), at: V(0.2, 0.2, -3.0).add(P), fov: 62, focus: 2, dof: 0 }; } },
    { id: 'G6', t0: B.g6, t1: B.s8, set: 'void', look: () => BE_DARK, flash: (t) => 0.95 * MathX.smooth(t, B.s8 - 0.9, B.s8),
      cam: (t) => { const k = Ease.inOutSine(MathX.ramp(t, B.g5, B.g6 + 4)), k2 = Ease.inQuad(MathX.ramp(t, B.g6, B.s8)), a = V(2.6, 0.9, 1.8), b = V(1.2, 0.5, -1.4);
        const p = a.clone().lerp(b, k).lerp(V(0.1, 0.25, -2.6), k2); return { pos: p.add(P), at: V(0.0, 0.2, -4.5).add(P), fov: 62 + 18 * k2, focus: 2, dof: 0 }; } },
  ];
  const i = BE_SHOTS.findIndex((s) => s.id === 'X');
  BE_SHOTS.splice(i, 0, ...S);
  BE_SHOTS[BE_SHOTS.length - 1].t0 = B.s8;
})();
