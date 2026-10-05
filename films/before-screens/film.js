/* =====================================================================
   FILM — "How did kids have fun before screens?"
   The film-specific half of the engine (see js/main.js): builds the sets
   (modern bedroom inside the 1905 house, the town street), the children,
   toys, first-person child hands, HUD and soundtrack; switches lighting
   between the evening room and the sunlit past; grades the picture.
   ===================================================================== */

// warm, soft atmospheric perspective (not gloomy war fog): light ground haze, gentle banks
installFog({ bankScale: 0.018, bankAmount: 0.3, lowHeight: 7, lowAmount: 0.45, cap: 0.82 });

// first-person child hands: poses in camera space (wrist position p, finger direction F, palm normal N)
const BS_HAND_POSES = {
  // phone in the right hand: palm toward you, fingers wrapping its left edge, thumb over the screen
  phone:  { p: [0.05, -0.15, -0.285], F: [-0.9, 0.22, -0.18], N: [0.02, 0.28, 1], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.95, 0.42] },
  swipe:  { p: [0.05, -0.146, -0.285], F: [-0.9, 0.22, -0.18], N: [0.02, 0.28, 1], curl: [0.62, 0.68, 0.72, 0.78], thumb: [1.18, 0.08] },
  tap:    { p: [0.05, -0.152, -0.286], F: [-0.9, 0.22, -0.18], N: [0.02, 0.28, 1], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.9, 0.78] },
  lower:  { p: [0.16, -0.5, -0.26], F: [-0.8, 0.3, -0.3], N: [0.1, 0.5, 0.9], curl: [0.62, 0.68, 0.72, 0.78], thumb: [0.9, 0.4] },
  // the door lever: palm down over the handle, then a push
  handle: { p: [0.07, -0.3, -0.42], F: [-0.25, -0.12, -1], N: [0.05, -1, -0.15], curl: [0.95, 1.0, 1.0, 1.05], thumb: [0.55, 0.65] },
  push:   { p: [0.06, -0.27, -0.6], F: [-0.25, -0.1, -1], N: [0.05, -1, -0.15], curl: [0.85, 0.9, 0.95, 1.0], thumb: [0.55, 0.6] },
};
Object.assign(BS_HAND_POSES, {
  // marbles: kneeling, knuckles on the dirt behind your shooter, thumb cocked behind the index finger → flick
  // (fist on its knuckles, thumb side up, palm facing left; looking down ~60° that is fingers 'up' the frame)
  knuckle: { p: [0.012, -0.17, -0.6], F: [0.05, 0.85, -0.53], N: [-1, 0.05, 0.05], curl: [1.25, 1.45, 1.5, 1.5], thumb: [0.3, 1.05] },
  flick:   { p: [0.012, -0.168, -0.602], F: [0.05, 0.85, -0.53], N: [-1, 0.05, 0.05], curl: [1.15, 1.45, 1.5, 1.5], thumb: [0.95, -0.05] },
  // the top: held point-up in the palm with the string wound, wound back, thrown down hard
  topHold:  { p: [0.06, -0.15, -0.36], F: [-0.1, 0.35, -1], N: [0.1, 1, 0.25], curl: [0.75, 0.8, 0.85, 0.9], thumb: [0.7, 0.45] },
  topWind:  { p: [0.13, -0.02, -0.24], F: [0.1, 0.8, -0.6], N: [0.2, 0.4, 0.9], curl: [0.8, 0.85, 0.9, 0.95], thumb: [0.7, 0.45] },
  topThrow: { p: [0.04, -0.34, -0.5], F: [-0.1, -0.7, -0.75], N: [0.1, -0.6, 0.8], curl: [0.25, 0.3, 0.35, 0.4], thumb: [0.6, 0.15] },
});
Object.assign(BS_HAND_POSES, {
  // the kite string in your fist: low while you run, up in front while you watch it climb
  stringRun:  { p: [0.11, -0.25, -0.36], F: [-0.55, 0.15, -0.8], N: [-0.4, 0.75, 0.5], curl: [1.3, 1.4, 1.45, 1.5], thumb: [0.4, 1.0] },
  stringHold: { p: [0.09, -0.2, -0.4], F: [-0.75, 0.25, -0.6], N: [-0.3, 0.6, 0.75], curl: [1.3, 1.4, 1.45, 1.5], thumb: [0.4, 1.0] },
  // the stick: reach down, grab, hold it up like a sword (it lies along the thumb side of the fist)
  reachDown:  { p: [0.03, -0.24, -0.48], F: [-0.2, -0.3, -1], N: [-0.6, -0.7, 0.2], curl: [0.35, 0.4, 0.45, 0.5], thumb: [0.7, 0.2] },
  grab:       { p: [0.03, -0.25, -0.5], F: [-0.2, -0.3, -1], N: [-0.6, -0.7, 0.2], curl: [1.25, 1.35, 1.4, 1.45], thumb: [0.5, 0.95] },
  stickHold:  { p: [0.12, -0.25, -0.36], F: [-0.75, -0.55, -0.3], N: [0.35, 0.25, 1], curl: [1.25, 1.35, 1.4, 1.45], thumb: [0.5, 0.95] },   // stick leans up and across to the left
  swordReady: { p: [0.1, -0.2, -0.4], F: [-0.9, -0.15, -0.45], N: [0.25, 0.3, 0.95], curl: [1.25, 1.35, 1.4, 1.45], thumb: [0.5, 0.95] },
  swingBack:  { p: [0.24, -0.04, -0.3], F: [-0.25, 0.65, -0.6], N: [0.85, 0.2, 0.45], curl: [1.25, 1.35, 1.4, 1.45], thumb: [0.5, 0.95] },
  swingHit:   { p: [-0.07, -0.24, -0.5], F: [-0.85, -0.35, -0.35], N: [0.15, -0.35, 0.92], curl: [1.25, 1.35, 1.4, 1.45], thumb: [0.5, 0.95] },
  block:      { p: [0.05, -0.03, -0.42], F: [-0.1, 1, -0.2], N: [0.05, 0.15, 1], curl: [1.25, 1.35, 1.4, 1.45], thumb: [0.5, 0.95] },
});
Object.assign(BS_HAND_POSES, {
  // both hands up, palms out, for the ball; then cupped round it
  catchReady: { p: [0.11, -0.13, -0.42], F: [-0.1, 1, 0.15], N: [-0.25, 0.05, -1], curl: [0.25, 0.25, 0.3, 0.35], thumb: [0.9, 0.1] },
  catchHold:  { p: [0.075, -0.17, -0.38], F: [-0.35, 0.9, 0.1], N: [-0.8, 0.1, -0.5], curl: [0.65, 0.7, 0.75, 0.8], thumb: [0.7, 0.4] },
});
const BS_HAND_BLEND = { phone: 0.25, swipe: 0.18, tap: 0.1, lower: 0.5, handle: 0.42, push: 0.4, hidden: 0.45, knuckle: 0.45, flick: 0.06, topHold: 0.3, topWind: 0.32, topThrow: 0.14,
  stringRun: 0.3, stringHold: 0.6, reachDown: 0.4, grab: 0.15, stickHold: 0.45, swordReady: 0.3, swingBack: 0.22, swingHit: 0.1, block: 0.14, catchReady: 0.3, catchHold: 0.08 };

// where the viewer's head and hands are at any moment (for toys that leave your hand mid-shot)
class POVProbe {
  constructor() { this.cam = new THREE.PerspectiveCamera(62, 9 / 16, 0.03, 100); this.cc = new CameraController(this.cam, CONFIG.camera); }
  handWorld(t, pose, side, out) {
    this.cc.update(t);
    const P = BS_HAND_POSES[pose] || HAND_POSES[pose] || HAND_POSES.hidden;
    return out.set(P.p[0] * side, P.p[1], P.p[2]).applyMatrix4(this.cam.matrixWorld);
  }
}

const FILM = {
  build(app) {
    const { scene, camera, renderer } = app;
    camera.near = 0.03; camera.updateProjectionMatrix();
    app.town = new HistoricTown(scene, renderer);
    app.town.build();
    // the viewer's own (modern) hands: a 10-year-old's, grey-blue hoodie sleeves, no watch
    app.hands = new ViewerHands(camera, { scale: 0.84, skin: '#c9997c', nail: '#e2c2b2', sleeve: '#6b6d72', cuff: '#595b60', watch: false, poses: BS_HAND_POSES, blends: BS_HAND_BLEND });
    app.room = new ModernRoom(scene);
    app.room.build(app.hands);
    app.kids = new ChildrenSystem(scene);
    app.toys = new ToySystem(scene, app.kids);
    app.pov = new POVProbe();
    app.marbles = new MarbleGame(scene);
    app.top = new SpinningTop(scene, app.hands, app.pov);
    app.jacks = new JacksGame(scene, app.kids);
    app.workshop = new KiteWorkshop(scene, app.kids, app.hands);
    app.imagination = new ImaginationSet(scene, app.kids, app.hands);
    app.social = new SocialGames(scene, app.kids, app.hands, app.pov, app.town);
    // the shared material rule: matte environment, glossy glass and metal (no city grime in this film)
    const skip = new Set(); camera.traverse((o) => skip.add(o));
    scene.traverse((o) => { if (o.isMesh && !skip.has(o)) for (const m of [].concat(o.material)) if (m && m.isMeshStandardMaterial && !/person/.test(o.parent && o.parent.name || '')) Look.surface(m, false); });
    app.hud = new StoryHUD(document.getElementById('hud'), app.tl);
    app.audio = new BeforeScreensAudio(app.tl, app.kids, app);
  },

  update(app, t, tl) {
    const day = SCRIPT_TRACKS.day.value(t) > 0.5;
    app.hands.update(t);
    app.room.update(t, t < 9.2);
    app.town.update(t, app.camera, true);
    app.town.setTime(SCRIPT_TRACKS.sunT.value(t), app.camera);
    app.social.update(t);
    app.kids.update(t, t > 5.6);
    app.toys.update(t, t > 5.6 && t < 15.2);
    for (const k of app.kids.people) if (k.stick) k.stick.visible = t < 15.2;    // hoop sticks belong to the street race
    app.marbles.update(t, t >= 14.9 && t < 20.4);
    app.top.update(t, t >= 20.3 && t < 24.4);
    app.jacks.update(t, true);
    app.workshop.update(t, t > 25.5 && t < 35);
    app.imagination.update(t, app.camera);
    // imagination: a golden, dramatic haze
    const wash = SCRIPT_TRACKS.wash.value(t);
    if (day) { app.scene.fog.density = MathX.lerp(0.0042, 0.012, wash); app.scene.fog.color.copy(app.town.fogColor).lerp(new THREE.Color('#d6ae76'), wash); }
    // light: inside the evening room only the lamp, the dusk window and the phone; outside, the sun and the sky
    app.town.hemi.intensity = day ? (app.town.hemiBase || 0.72) : 0.3;
    app.scene.environmentIntensity = day ? 0.5 : 0.05;
    app.room.lamp.visible = app.room.dusk.visible = !day;
    app.scene.fog.density = day ? 0.0042 : 0.0;
    if (day) app.scene.fog.color.copy(app.town.fogColor);
  },

  grade(t, p) {
    const day = SCRIPT_TRACKS.day.value(t), adapt = SCRIPT_TRACKS.adapt.value(t);
    const imag = SCRIPT_TRACKS.imagFlash.value(t), wash = SCRIPT_TRACKS.wash.value(t);
    p.flash = Math.max(SCRIPT_TRACKS.flash.value(t), imag);
    p.flashColor.setRGB(1.0, imag > 0.01 ? 0.86 : 0.95, imag > 0.01 ? 0.6 : 0.84);
    p.fade = 0; p.tunnel = 1.2; p.tunnelSoft = 0.5; p.tunnelDark = 0; p.edgeBlur = 0; p.chroma = 0; p.grain = 0.018;
    if (day < 0.5) {   // evening bedroom: lamp-warm against dusk blue
      p.exposure = 1.5; p.saturation = 1.04; p.warmth = 0.02; p.contrast = 1.06; p.soft = 0.12; p.bloom = 0.26; p.vignette = 1.1;
    } else {           // the past: warm late-morning sun; the eyes adjust after the doorway's glare
      p.exposure = 0.98 * (1 + 0.8 * adapt); p.saturation = 1.3; p.warmth = 0.1; p.contrast = 1.12; p.soft = 0.08; p.bloom = 0.24; p.vignette = 0.95;
      // sunset: warmer and a touch brighter to hold the faces; dusk cools a little
      const sunT = SCRIPT_TRACKS.sunT.value(t), low = MathX.smooth(sunT, 0.55, 1.0), dusk = MathX.clamp((sunT - 1) / 0.12, 0, 1);
      p.warmth += 0.22 * low - 0.1 * dusk; p.exposure *= 1 + 0.22 * low + 0.3 * dusk; p.saturation += 0.06 * low;
      // imagination: richer, warmer, more contrast, a heavier vignette
      p.saturation = MathX.lerp(p.saturation, 1.55, wash); p.warmth = MathX.lerp(p.warmth, 0.3, wash); p.contrast = MathX.lerp(p.contrast, 1.2, wash);
      p.exposure *= 1 - 0.08 * wash; p.vignette = MathX.lerp(p.vignette, 1.35, wash); p.bloom = MathX.lerp(p.bloom, 0.4, wash);
    }
  },

  debug(app, t) { const c = app.camera.position; return `room ${t < 9.2 ? 'on' : 'off'} · kids ${app.kids.people.length}`; },
};
