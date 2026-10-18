/* =====================================================================
   SCRIPT — "What if you kept shrinking and couldn't stop?" (16:9, 1920×1080, 30 fps, ≈ 7:38, no narration)
   A voiceless long-form film: one continuous first-person journey down the scale, from a bedroom to the Planck
   length. Everything is a pure function of film time t (seconds). Plan and physics: films/shrinking/PLAN.md

   SH_KEYS  your height over time (log-interpolated, monotone)  → shH(t) in metres (scale.js)
   SH       the beat times every other file keys off
   SH_CAPS  the captions, one at a time (second person, short)
   SH_MSGS  the phone notifications from Mum (the human thread)
   ===================================================================== */

// ---------------------------------------------------------------------------------------------------------------------
// your height (metres) at film time t: keyframes, interpolated in log10 with a monotone cubic (no rate jumps)
// ---------------------------------------------------------------------------------------------------------------------
const SH_KEYS = [
  [0, 1.75], [3.0, 1.75], [10, 1.35], [16, 1.0], [22, 0.68], [28, 0.45], [34, 0.29], [40, 0.18], [46, 0.11],
  [52, 0.055], [58, 0.024], [63, 0.0125], [70, 0.0095], [76, 0.0072], [82, 0.0056], [90, 0.0028], [98, 0.0013],
  [106, 6.2e-4], [114, 3.8e-4], [120, 3.1e-4], [126, 2.5e-4],
  [134, 2.0e-4], [146, 1.5e-4], [160, 1.2e-4], [175, 1.0e-4], [182, 7.5e-5], [190, 3.6e-5], [196, 2.4e-5],
  [202, 1.1e-5], [208, 4.5e-6], [216, 1.9e-6], [224, 9.0e-7], [229, 4.8e-7], [236, 3.0e-7], [242, 2.4e-7],
  [248, 1.9e-7], [256, 1.0e-7], [262, 3.8e-8], [268, 1.5e-8], [276, 4.0e-9], [282, 2.0e-9], [288, 9.0e-10],
  [294, 3.8e-10], [300, 1.6e-10], [307, 9.0e-11], [312, 5.5e-11], [318, 2.5e-11], [324, 6.0e-12], [330, 1.2e-12],
  [336, 1.8e-13], [342, 3.2e-14], [348, 7.0e-15], [353, 2.0e-15], [358, 8.0e-16], [364, 2.8e-16], [370, 8.0e-17],
  [376, 1.6e-17], [382, 2.5e-18], [388, 1.0e-19], [400, 2.0e-24], [412, 3.0e-29], [422, 1.0e-33], [428, 1.6e-35],
  [500, 1.6e-35],
];

// ---------------------------------------------------------------------------------------------------------------------
// THE BEATS (film seconds)
// ---------------------------------------------------------------------------------------------------------------------
const SH = {
  title: [0, 4.6],          // the centred question over the bedroom
  shrink: 3.0,              // the shrinking starts (under the title)
  // the bedroom
  catLook: 23.5,            // the cat on the bedside table turns its head to you
  catJump: 32.4,            // ★ it jumps down; the glass and the phone go over
  catLand: 33.25,
  glassHit: 33.05, phoneHit: 33.2,
  catSniff: 37.0,           // its nose comes down to you
  buzz1: 43.0,              // the phone buzzes on the floor (Mum: dinner's ready) — the cat bolts
  catGone: 47.5,
  brick: 58.0,              // the toy brick
  grab: 66.0, lift: 67.6, drop: 72.6,
  // the phone
  run: 74.0,                // you run to the phone
  jump: 79.4, apex: 81.4, land: 83.6,
  letters: 90.0, pixels: 95.0, subpix: 100.0,
  call: 110.8,              // incoming call: the screen changes under you
  quake: 113.2,             // ★ the vibration: an earthquake at your size
  thrown: 117.6,            // thrown off the edge
  floor: 124.4,             // landing in the dust (world change)
  // the dust
  lookUp: 129.0, roomCounter: 130.0,
  mite: 147.0, water: 161.0, miteStuck: 166.0,
  hair: 174.0, syrup: 180.0, pollen: 189.0, flake: 194.0, bacteria: 200.0,
  brown: 214.0,             // Brownian shoves
  fade: 223.0,              // the colours fade (smaller than light)
  sem: 233.0,               // electron-microscope grey (world change)
  hands: 240.0, phage: 245.0, inject: 252.0, grit: 260.0, dna: 274.0,
  // the atom
  balls: 288.0, atomWorld: 291.0, atoms: 292.0, haze: 306.0, inside: 310.0, empty: 320.0, pea: 329.0,
  nucleus: 334.0, proton: 348.0, storm: 352.0,
  // beyond
  quark: 371.0, limit: 384.0, unknown: 389.0, foam: 413.0, planck: 426.0, bh: 433.0, flash: 444.0,
  buzzEnd: 451.0,
  end: 458.0,
};

// ---------------------------------------------------------------------------------------------------------------------
// THE CAPTIONS [time, text] — each shows until the next one (max ~3.6 s), with short gaps between lines
// ---------------------------------------------------------------------------------------------------------------------
const SH_CAPS = [
  // the bedroom
  [5.0, 'The ceiling is getting higher.'],
  [9.5, 'No. You are getting smaller.'],
  [14.0, 'You’re the height of a six-year-old now.'],
  [19.0, 'And it isn’t stopping.'],
  [24.0, 'Your cat has noticed.'],
  [28.5, 'It has never looked down at you before.'],
  [35.0, 'Don’t move.'],
  [39.0, 'To you, it’s the size of a horse.'],
  [45.0, 'Saved by a text from your mum.'],
  [51.0, 'You’re as tall as your thumb.'],
  [55.0, 'The cracks in the floor are ditches now.'],
  [58.5, 'A toy brick. You’ve stepped on these.'],
  [63.0, 'It weighs a hundred times more than you do.'],
  [67.5, 'You lift it anyway.'],
  [71.5, 'Small bodies are strong for their weight.'],
  // the phone
  [75.5, 'Your phone is still glowing.'],
  [79.4, 'You jump.'],
  [82.0, 'Fifty times your own height.'],
  [86.0, 'Small jumpers go just as high. Ask a flea.'],
  [90.5, 'Her message. Every letter is as tall as you.'],
  [95.5, 'The letters are made of tiny squares.'],
  [100.0, 'Each square is three lights. Red, green, blue.'],
  [104.5, 'Every colour a screen has ever shown you. Just these three.'],
  [110.6, 'Your mum is calling.'],
  [114.2, 'At your size, the buzz is an earthquake.'],
  [118.4, 'It throws you off the edge.'],
  [121.6, 'A fall thirty times your height.'],
  [125.6, 'It doesn’t hurt. The air catches small things.'],
  // the dust
  [130.0, 'Look up.'],
  [134.0, 'Your bedroom, to you, is now the size of a city.'],
  [139.0, 'This is the dust on your floor.'],
  [143.0, 'A lot of it is your own skin.'],
  [147.5, 'Something is coming.'],
  [152.0, 'A dust mite. It lives on the skin you shed.'],
  [156.5, 'It has been eating yours for years.'],
  [161.5, 'The spilled water has reached you.'],
  [166.0, 'The mite walks into it.'],
  [170.0, 'At this size, water grabs like glue. It won’t let go.'],
  [175.0, 'A single hair. Wider than a tree trunk.'],
  [180.0, 'The air feels thick now. Like syrup.'],
  [184.5, 'Stop moving, and you stop dead. No gliding.'],
  [189.5, 'A grain of pollen, blown in from outside.'],
  [194.5, 'You’re standing on a flake of your own skin.'],
  [200.0, 'Something is living on it.'],
  [204.5, 'Bacteria. Millions in every pinch of dust.'],
  [209.0, 'Most are harmless. Most.'],
  // where light stops
  [214.5, 'Something keeps shoving you.'],
  [218.5, 'Nothing is there. It’s the air, hitting you unevenly.'],
  [223.5, 'The colours are fading.'],
  [227.5, 'You’re smaller than a wave of light now.'],
  [231.5, 'Light can’t show you anything this small.'],
  [235.5, 'Only electron microscopes see down here. In grey.'],
  [240.5, 'Look at your hands.'],
  [245.5, 'A virus is landing on the bacterium.'],
  [250.0, 'It only hunts bacteria.'],
  [254.5, 'There are more of these on Earth than stars in the universe.'],
  [260.5, 'The air is turning to grit.'],
  [264.5, 'Each speck is a molecule, moving at 1,700 km/h.'],
  [269.5, 'They hit you like hail.'],
  [274.5, 'A strand of DNA.'],
  [278.5, 'The same four letters build every living thing.'],
  [283.5, 'To you, your bedroom is now bigger than the Sun.'],
  // the atom
  [288.5, 'The DNA is made of balls.'],
  [292.5, 'Atoms.'],
  [296.5, 'You’re smaller than the atoms you were made of.'],
  [301.5, 'Don’t ask what you’re made of now.'],
  [306.5, 'An atom has no surface. Just a haze.'],
  [310.5, 'You’re inside it.'],
  [315.0, 'The electrons aren’t dots. They’re a blur of maybe.'],
  [320.5, 'And then: nothing.'],
  [324.5, 'An atom is almost entirely empty.'],
  [329.0, 'If this atom were a stadium, its centre would be a pea.'],
  [334.5, 'There it is.'],
  [338.5, 'The nucleus. Six protons, six neutrons.'],
  [343.0, 'Almost all of an atom’s weight is in here.'],
  [348.5, 'A proton.'],
  [352.5, 'It isn’t solid. It’s a storm.'],
  [356.5, 'Three quarks, held together by pure energy.'],
  [361.0, 'Almost none of its weight is the quarks. It’s that energy.'],
  [366.0, 'So most of what you weighed was never stuff at all.'],
  // beyond
  [371.5, 'A quark.'],
  [375.5, 'Everything else grew as you shrank. It doesn’t.'],
  [380.0, 'As far as anyone knows, it has no size at all.'],
  [384.5, 'No experiment has ever seen anything smaller than this.'],
  [389.5, 'From here, nobody knows.'],
  [393.5, 'Your bedroom, to you, is now wider than a hundred galaxies.'],
  [398.5, 'You’re getting ten times smaller every few seconds.'],
  [403.5, 'Up there, she’s still calling.'],
  [408.5, 'Your bedroom is now wider than the whole visible universe.'],
  [413.5, 'Space itself is starting to flicker.'],
  [417.5, 'Down here, even empty space boils.'],
  [422.0, 'Physics says there is a limit.'],
  [426.5, 'The Planck length.'],
  [430.5, 'To make anything this small takes so much energy…'],
  [434.5, '…that it becomes a black hole.'],
  [438.5, 'The smallest possible thing is a black hole.'],
  [442.2, 'And it doesn’t last.'],
];

// the phone's notifications (the human thread): [time, sender, text]
const SH_MSGS = [
  [43.0, 'Mum', 'Dinner’s ready!'],
  [207.0, 'Mum', 'Where are you??'],
  [327.0, 'Mum', '3 missed calls'],
  [403.0, 'Mum', 'Please call me back'],
  [451.0, 'Mum', 'Where are you?'],
];

// honest labels (top left, under the readout): [from, to, text]
const SH_TAGS = [
  [79.6, 83.8, 'SLOW MOTION'],
  [117.8, 124.6, 'SLOW MOTION'],
  [233.5, 334.0, 'ILLUSTRATION · TOO SMALL FOR LIGHT'],
  [334.0, 389.0, 'ILLUSTRATION · FALSE COLOUR'],
  [389.0, 446.0, 'THEORY · BEYOND ANY EXPERIMENT'],
];

CONFIG.duration = SH.end;
CONFIG.seed = 20261018;
Object.assign(CONFIG.camera, { cameraHeight: 1.62, walkSpeed: 1.2, bobStrength: 0.0, bobFrequency: 1.7, breathingStrength: 0.0, breathRate: 15, fov: 60, shakeStrength: 1.0 });
CONFIG.render.shadowMapSize = 2048;

const SCRIPT = {
  meta: { title: 'What if you kept shrinking and couldn’t stop?', wav: 'shrinking-soundtrack.wav' },
  events: [
    { id: 'a1', time: 0, label: '1 · the bedroom' }, { id: 'cat', time: SH.catJump, label: 'cat' }, { id: 'brick', time: SH.brick, label: 'brick' },
    { id: 'a2', time: SH.run, label: '2 · the phone' }, { id: 'jump', time: SH.jump, label: '★ jump' }, { id: 'subpix', time: SH.subpix, label: 'subpixels' }, { id: 'quake', time: SH.quake, label: '★ quake' },
    { id: 'a3', time: SH.floor, label: '3 · the dust' }, { id: 'mite', time: SH.mite, label: 'mite' }, { id: 'water', time: SH.water, label: 'water' }, { id: 'bact', time: SH.bacteria, label: 'bacteria' },
    { id: 'a4', time: SH.fade, label: '4 · light stops' }, { id: 'phage', time: SH.phage, label: 'virus' }, { id: 'dna', time: SH.dna, label: 'DNA' },
    { id: 'a5', time: SH.atoms, label: '5 · the atom' }, { id: 'nuc', time: SH.nucleus, label: 'nucleus' }, { id: 'proton', time: SH.proton, label: 'proton' },
    { id: 'a6', time: SH.quark, label: '6 · beyond' }, { id: 'planck', time: SH.planck, label: 'Planck' }, { id: 'bh', time: SH.bh, label: '★ black hole' },
  ],
  camera: { baseY: 0, x: [[0, 0]], z: [[0, 0]], height: [[0, 1.62]], yaw: [[0, 0]], pitch: [[0, 0]], fov: [[0, 60]], startles: [], shakes: [] },
  hands: { right: [[0, 'hidden']], left: [[0, 'hidden']] },
  tracks: {},
  hud: {
    title: { in: SH.title[0], out: SH.title[1], fi: 0.01, fo: 0.6, cls: 'big center', html: '<span class="kick">WHAT IF YOU KEPT</span><span class="hero">SHRINKING</span><span class="kick">AND COULDN’T STOP?</span>' },
    captions: [],
    readouts: [],
  },
};
const SCRIPT_TRACKS = {};
