# What if there was no light in the universe?

Voiceless 16:9 long-form, 4:43 (282.6 s), slug `no-light`, page `no-light.html`. Built like Gravity tilts 90°,
Friction 10 s and Gravity keeps tilting, to the owner's YouTube lessons of 2026-10-28, in the eerie horror tone of
Slower light (the channel's best):
- an everyday, human-scale place with new scenery: a frozen lake near Lillehammer, Norway, on a Sunday afternoon in January, 240
  people skating, a bonfire by a kiosk, a shore road, a small town;
- action in the first 5 s (the title is the lake in daylight; at 0:03.6 the light goes and the screen is black);
- the real physics in minute one (a heat camera's picture, why everything still glows, Wien's law on your own skin,
  and the honest rule: take away all electromagnetism and atoms come apart, so only the band eyes use is gone);
- under 5 minutes on purpose (the owner called the last two slow: one rescue drives the second half), no filler; the
  story clock only runs forward, jumping ahead three times at cuts (+40 s, +5 min 52 s, +2 min);
- tension to the last frame, no recap: your fingers on his sleeve, the ice bending under your chest, "Would you let go?";
- the music clearly leads, beds about 10 dB under it, measured stem by stem (2026-10-31);
- no z-fighting, and the picture pitfalls list (no particle alpha over 1, no kilometre-long triangles).

## 1. The rule

At 2:40:00 PM every photon between 380 and 750 nm stops existing: the light eyes use. Everything else stays: infrared,
radio, the Sun's warmth, fire's heat. Nobody can see anything at all, so the film is shown the only way left: a heat
camera (8–14 µm), white is warm, black is cold. The one impossible part, said on screen: real physics can't take away
"all light" (light is one kind of electromagnetism; without it atoms come apart), so the film takes away only the band
eyes use.

## 2. The physics (physics.js; every caption number is checked against it in script.js)

- Your skin at 33 °C glows brightest at 2897.8 µm·K / 306 K = 9.47 µm (caption 9.5), 12.6 times the reddest light an
  eye can see (caption 13).
- You glide at 24 km/h when it goes dark, slowing at 0.06 m/s² (about 20 km/h while the caption is read); you hit
  someone sitting on the ice 23 s later.
- The Sun at 61.1° N, 10.45° E on Sunday 10 January 2027: 2.6° up while the sun caption shows, sets at 3:29 PM
  (NOAA's formulas).
- −12 °C air; sound at 331.3·√(1 − 12/273.15) = 323.9 m/s, so the bang from the road (497 m) takes 1.53 s (caption 1.5).
- A plane 12 km from its runway on a 3° glide path is 629 m up (caption 630), at 72 m/s.
- Clear ice: 5 cm holds a person, 20 cm a car, 8 cm where the stream comes in (Norwegian rules of thumb).
- The car: shoved at 4.2 m/s, down the bank, sliding on ice (µ 0.07) 36 m to a stop over the thin ice by the inlet.
- Water at 0 °C under the ice, 12 degrees warmer than the air: the hole glows on a heat camera.
- Cold water: the 1-10 rule (1 minute to get your breath, about 10 of useful movement). The driver has been in for
  8.99 minutes when the caption says 9.
- Lying flat you crawl 0.28 m/s; 40 m from him at the caption (39.8), 3 m from the edge at the caption (2.8).

## 3. The beats (CAPTIONS.md: 22 beats after the title, 52 captions)

start (the light goes) · skaters (still gliding, nobody can see; you hit someone) · heat (the heat camera) · rule
(why only the eyes' band) · body (your skin glows; your palm print on the ice) · count (240 people, −12 °C) · grab
(someone grabs your arm) · help (five presses; nobody is coming) · sun (you can feel it; it sets unseen) · fire (800 °C,
no light; a man walks towards it and stops a metre short) · world (8 billion blind; plants stop; planes still flying) ·
plane (630 m up, its pilots can't read an instrument) · road (cars stopped, a lorry creeping, the bang 1.5 s late) ·
slide (a car shoved onto the lake, its driver inside) · ice (5 cm, 20 cm, 8 cm; it goes through) · steam (the hole
glows; a trap nobody can see) · sing (the ice sings; sound is all you have) · water (the driver is in the water; 1
minute, 10 minutes) · crawl (lying flat; she holds your ankles; 40 m) · edge (the ice cracks; 9 minutes; 3 m) · reach
(your fingers find his sleeve; the ice starts to bend) · question ("Would you let go?").

## 4. Sets and shots (shots.js: 50 shots)

- The lake (world.js, lake.js): a 2 km lake in a valley of spruce, the skating oval, the kiosk and its bonfire on the
  beach, the shore road with its railing, lamp posts and stopped cars, the town (houses, chimneys), the inlet where the
  stream keeps the ice thin. The heat camera (heat.js) gives every surface a temperature; people (cast.js) are warm
  faces and hands on cold clothes.
- What drifts and burns (fx.js): the bonfire's flame tongues and sparks, smoke, chimney smoke, every running engine's
  exhaust, everyone's breath, the frost smoke off the hole, the plane's hot exhaust.
- The black shots (what you see: nothing) carry the captions alone and the sound.

## 5. Sound (sound-lib.js, sound-music.js, sound-amb.js, sound-sfx.js; mix.js)

No narrator. Three stems, all synthesised from seeded code. The score (E minor, Lydian turns) is keyed to every beat;
its daylight cue drains away through a closing filter when the light goes. Beds by place (the wind over the snow, the
town's murmur, the bonfire's roar, the road's idling engines), and the crowd: chatter in daylight that stops dead, then
screams, then people calling out in the dark, thinning; far horns; the ice singing. Effects on their story moments,
heard from where you are (sound takes 1.5 s across the ice): blades, falls, breathing in the black, the phone's SOS,
the man's steps in squeaking snow, the plane overhead with its Doppler, the lorry, the hit, the railing, the car's
slide, crack, sink and drowning engine, the driver's splash, gasps and calls, your crawl, the cracks under your hands,
the ice bending to the last frame.

## 6. Checks and review log

- script.js throws if a caption's moment or number drifts from physics.js (11 caption moments, 24 caption numbers).
- Review round 1 (story; picture) and the fixes, review round 2: EPISODE_REPORT.md.
