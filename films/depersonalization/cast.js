/* =====================================================================
   CAST — two ordinary friends on the shared people rig (the cast system
   from films/before-screens/children.js, with adult looks), and you
   (seen only in reflections). They stay kind and normal throughout:
   the strangeness is in how they are perceived, never in them.
   ===================================================================== */

Object.assign(LOOKS, {
  // Jay: navy hoodie, jeans, white sneakers
  jay: { adult: true, h: 0.98, skin: 2, build: 'avg', top: '#34404e', sweater: true, bottom: 'trousers', bottomColor: '#3d4a62', shoes: '#e4e2dc', hair: '#1a120c', hairStyle: 'short' },
  // Mia: dusty-rose jumper, black trousers, hair up
  mia: { adult: true, h: 0.93, skin: 0, build: 'woman', top: '#a8746a', sweater: true, bottom: 'trousers', bottomColor: '#24262c', shoes: '#d8d4cc', hair: '#3a2418', hairStyle: 'bun' },
  // you: grey hoodie (the same sleeves as your first-person arms), dark trousers
  self: { adult: true, h: 0.97, skin: 1, build: 'avg', top: '#5f6267', sweater: true, bottom: 'trousers', bottomColor: '#30343c', shoes: '#ddd9d0', hair: '#2a1c14', hairStyle: 'messy' },
});

Object.assign(ACTIONS, {
  // telling a story in the armchair: leaning in, one hand drawing it in the air, the other arm on the armrest
  sitTalk(τ, c) {
    const p = ACTIONS.sit(τ, c), g = noise1(τ * 1.6, c.seedI), g2 = noise1(τ * 2.1, c.seedI + 4);
    p.spine = 0.2 + 0.04 * Math.sin(τ * 1.1); p.neck = -0.02 + 0.05 * Math.sin(τ * 2.3);
    p.rSh = [0.85 + 0.5 * g, 0.22 + 0.18 * g2]; p.rEl = 1.1 + 0.45 * g2;
    p.lSh = [0.45, 0.28]; p.lEl = 1.25;
    p.headYaw = 0.2 * Math.sin(τ * 0.7); p.spineYaw = 0.06 * g;
    return p;
  },
  // laughing: rocking back, shoulders shaking, a hand to the chest
  sitLaugh(τ, c) {
    const p = ACTIONS.sit(τ, c), k = MathX.smooth(τ, 0, 0.25) * (1 - MathX.smooth(τ, 0.9, 1.2)), sh = Math.sin(τ * 22) * 0.035 * k;
    p.spine = 0.15 - 0.28 * k + sh; p.neck = -0.3 * k;
    p.rSh = [0.7 + 0.2 * k, 0.15]; p.rEl = 1.6; p.lSh = [0.45, 0.28]; p.lEl = 1.25;
    p.headYaw = 0.1;
    return p;
  },
  // turning to you with a question: leaning in, an open hand
  sitTalkTo(τ, c) {
    const p = ACTIONS.sit(τ, c), g = noise1(τ * 1.3, c.seedI + 9);
    p.spine = 0.26; p.neck = 0.0; p.headYaw = 0;
    p.rSh = [1.05 + 0.15 * g, 0.18]; p.rEl = 0.9 + 0.15 * g;
    p.lSh = [0.45, 0.28]; p.lEl = 1.25;
    return p;
  },
  // low on a beanbag, legs out, phone in both hands
  beanbagPhone(τ, c) {
    const p = basePose();
    p.hipY = c.seat ? c.seat + 0.02 : 0.3; p.lHip = [1.25, 0.18]; p.rHip = [1.25, 0.12]; p.lKnee = 0.9; p.rKnee = 1.05;
    p.spine = -0.12; p.neck = 0.45 + 0.03 * Math.sin(τ * 0.6);
    p.lSh = [0.6, 0.05]; p.rSh = [0.62, 0.05]; p.lEl = 1.75; p.rEl = 1.72;
    p.headYaw = 0.05 * Math.sin(τ * 0.4);
    return p;
  },
  beanbagLaugh(τ, c) {
    const p = ACTIONS.beanbagPhone(τ, c), k = MathX.smooth(τ, 0, 0.3) * (1 - MathX.smooth(τ, 1.4, 1.9)), sh = Math.sin(τ * 20) * 0.03 * k;
    p.spine = -0.12 + 0.18 * k + sh; p.neck = 0.45 - 0.55 * k;
    p.rSh = [0.62 + 0.5 * k, 0.05]; p.rEl = 1.72 + 0.3 * k;      // phone hand comes up toward her face
    return p;
  },
});
Object.assign(BLEND, { sitTalk: 0.45, sitLaugh: 0.25, sitTalkTo: 0.4, beanbagPhone: 0.5, beanbagLaugh: 0.3 });

// a person's own clock can lag behind the room's: a stutter (a moment that hangs, then catches up) or a slowdown.
// warp(t) = the time the person is posed at.
const DP_WARP = {
  // 2.2 s: Mia's laugh hangs for a beat, then catches up
  mia: (t) => (t < 2.2 ? t : t < 2.6 ? 2.2 + (t - 2.2) * 0.25 : t < 2.75 ? 2.3 + (t - 2.6) * 3 : t),
  // 4.6 s: Jay goes slightly slow and stays that way
  jay: (t) => (t < 4.6 ? t : 4.6 + (t - 4.6) * 0.6),
};
