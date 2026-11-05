# What if light stopped bouncing for 10 seconds?

A voiceless 16:9 long-form film: 1920×1080, 30 fps, 5:01 (after the review round; the first cut ran 5:25). It follows the Gravity tilts 90° / Gravity keeps tilting /
Friction 10s formula and the owner's YouTube lessons (28 October 2026), in the eerie horror tone of Slower light:
- **an everyday place, and new scenery:** a hilltop funfair on a Saturday afternoon in November (a Fun House with wavy
  mirrors, a carousel with its band organ, a Ferris wheel, a rollercoaster, dodgems, a helter-skelter, a drop tower,
  stalls, a fire juggler, 400 people). From its fence the film looks down into a valley with a motorway and an airport
  across it, and it visits a car on the motorway, the verge, a flight deck on final approach, the control tower, the
  rollercoaster's front seat and the space station. No kitchen, flat, street, city, train or beach reused;
- **action on frame 1:** above the title, close up, you look at yourself in the Fun House's wavy mirror at 3:29:57 PM,
  the organ playing, and something in a bear suit walks up behind your right shoulder; at 2.85 s (3:30:00) light stops
  bouncing and your reflection is gone; "Your reflection is gone." at 0:04;
- **the real nuance in the first minute:** the Moon is still there, because its light is 1.2 seconds old (0:16–0:29);
  "A blue sky is sunlight bouncing off air. Blue bounces 4 times more than red" (0:39); and at 1:18 "Officially, this
  is impossible. The same electrons that bounce light also bend it into your eyes. Here, only the bouncing stops";
- **a stake by 1:40, kept alive:** "Something just passed between you and the lights" (a bear-eared shape over the lit
  DOUGHNUTS sign); "It hasn't moved." (2:23); "It's closer. Sound still bounces. You can hear it breathing." (3:15);
  60 million drivers can't see the road, and their cars' radar is blind too;
- **tension to the last frame:** the count ("Whatever is near you, you'll see it in 3 seconds"), a white-out at
  3:30:10 and the reveal (someone in a bear suit was standing right in front of you, its mouth a black hole, paws up),
  the crash on the motorway, +2 minutes, then 4:42 PM: Saturn's light from 3:30 should arrive now, and there is none
  ("Seen from Saturn, the Earth just went dark."). The last caption, "What would you have done?", is cut on the last
  frame. There is no recap.

The owner's rule of 29 October 2026: **the story clock only runs forward**. One clock (`NB_CLOCK`, script.js): real
speed under the title; the ten seconds 21 times slower to the Moon going out, 37 times slower through the middle, the
last three seconds about 3 times slower (the count); 9 times slower out of the return until the Moon comes back; then
real speed, jumping forward only at cuts (the HUD says by how much): +2 minutes, then to 4:42 PM.
`script.js` throws if a segment runs backwards; `shots.js` throws if the clock jumps anywhere but on a cut.

Page: `light-no-bounce.html`. Captions: `CAPTIONS.md` → `node build-timing.cjs` → `timing.js`. Every number on screen
comes from `physics.js` (§ 2).

## 1. The rule

From **Saturday 21 November 2026, 3:30:00.000 PM** to 3:30:10, nothing anywhere reflects or scatters light, of any
colour (radio to X-rays). A photon goes straight on (through air, glass, water, your eye's lens) or is absorbed.
Everything that makes light carries on: the Sun, stars, flames, filaments, LEDs, neon, screens.
- **The one impossible thing:** reflection, scattering, refraction and absorption are the same electrons shaking in
  step with the light; there is no switch for one of them. The film breaks that, and nothing else (the caption says so).
- **Where everything is:** the Sun, the Moon and Saturn at the times and distances an ephemeris gives for 21 November
  2026, 3:30 PM, 51.5° N (the physics review checked them): the Sun 3.9° up at azimuth 230°; the Moon 88% lit, 11.6° up
  at azimuth 88°, 372,500 km away (1.24 light-seconds; the average 384,400 km would say 1.28); Saturn 9° up, 8.77 AU
  (72.9 light-minutes).
- **Screens and lamps:** an OLED screen makes its own light (your phone); an LCD spreads its backlight with a light
  guide, by bouncing, so the sat-nav and the flight deck's displays go dark; a headlight is a bulb in a mirror, so it
  shrinks to a bare, dimmer bulb.
- **What you see:** only light sources. Everything else is pure black; things show only as shapes against sources (a
  person crossing a bulb, the hills cutting off the stars, the coaster train blotting out its track lights).

## 2. The physics (physics.js)

| Moment | Number | Story time | Film time |
|---|---|---|---|
| light stops bouncing | — | 0 (3:30:00.000) | 0:02.85 |
| the Moon's last bounced light arrives | 372,500 km ÷ c = 1.24 s | 1.24 s | 0:29.3 |
| the sky goes black, the Sun turns white | Rayleigh (650/450)⁴ = 4.35; the Sun 3.9° up through ~12 air masses (noon: ~3): 3× brighter in clean air, up to ~10× with haze | 0 on | 0:35 |
| your pupils open | 2.5 → 6.6 mm (τ 4 s): 7× the light by 3:30:10, stars down to magnitude ≈ 4 | 0–10 s | 3:50 |
| drivers moving | 1.45 billion cars × 4% ≈ 58 million; 110 km/h × 10 s = 306 m | — | 1:44 |
| undersea cables dark | ≈ 600 cables, ≈ 99% of traffic between continents (satellite links need dishes and lasers too: ≈ 0% left) | — | 2:48 |
| the extra heat | 0.30 × 1361 W/m² × πR² × 10 s = 5.2 × 10¹⁷ J ≈ 8,300 Hiroshima bombs (63 TJ); Earth absorbs ≈ 19,000 every 10 s anyway (+43%) | — | 3:24 |
| light bounces again; a white-out, then a dazzle while the pupils close (0.2 s) | — | 10 s (3:30:10) | 4:08.9 |
| the Moon comes back last | 1.24 s late | 11.24 s | 4:19.7 |
| Saturn's light from 3:30 should arrive (and, seen from Saturn, the Earth goes dark) | 8.77 AU = 4,375 light-seconds ≈ 72.9 min | 4:42:55 PM | 4:52.7 |

## 3. The beats (CAPTIONS.md: 29 beats after the title, 58 captions)

start · moon · moongone · sky · sun · sources · hands · real · crowd · near · road · plane · still · coaster · fire ·
net · space · closer · heat · saturn · pupils · count · back · reveal · moonback · crash · after · echo · question. Times: `timing.js` (reading pace); the clock and every cut key off them.

## 4. Sets and shots (shots.js: 39 shots)

- `fair` (fair.js, fair-world.js, fair-rides.js, fair-people.js, fairkit.js, sky.js, valley.js): the hilltop (a flat
  plateau falling into a bowl-shaped valley), the Fun House with three wavy mirrors, the carousel, the Ferris wheel,
  the rollercoaster (its train runs on its own), the dodgems arena (ceiling grid, sparks), the helter-skelter, the drop
  tower, six stalls, festoon bulbs, the juggler; 400 people (InstancedMesh crowds; phones as point lights); the person
  in the bear suit (`nbBearAt`: behind you in the mirror, then across the DOUGHNUTS stall's sign, still, closer, and a
  metre from you at 3:30:10); the sky (stars to the pupil's limiting magnitude, the Sun, the Moon, Saturn); the
  valley: the motorway (cars as pairs of headlights and tail lights, spaced 30–78 m), the town, the airport (runway and
  approach lights, the plane with its landing lights, a flight deck and a tower cab with a radar scope).
- `space` (space.js): the night side from the space station: city lights (640 clusters, 12,000 villages) as point
  lights, the airglow line, the Sun.
- Every light source is a lamp in `nbLamps` (points whose size grows with brightness); `nbSign` neon; mirrors reflect
  only before 3:30:00 and after 3:30:10. `hud.js`: the clock (with how slowly it runs), the countdown 3 · 2 · 1.

## 5. Sound (sound-lib.js, sound-music.js, sound-amb.js, sound-sfx.js; mix.js)

No narrator: the captions are silent and the sound carries the gaps. Three stems; everything synthesised from seeded
noise and maths.
- **music:** an original score in a cold A minor (string pads, a felt piano also played backwards, glass bells, a low
  drum, a heartbeat; a music box over the carousel's organ before 3:30; the endless rise under the count; a blinding A
  major chord at 3:30:10; the motif a note short at the end, cut on the last frame).
- **amb:** where the camera is; every bed runs at the world's own speed (`nbWorldRate`: a quarter in the dark, so the
  fair's murmur sinks two octaves and drags; rising through the count; real speed at 3:30:10).
- **sfx:** the carousel's band organ (a waltz, its clock at the world's speed: it runs down like tape at 3:30), the
  crowd's cries slowed, something passing you, horns and squeals on the motorway, the flight deck's chime, the tower's
  squelch, the coaster, the juggler's torches, your video not sending, its breathing as it comes closer (sound still
  bounces), metal roofs ticking in the heat, a breath in front of you in the count, the riser into 3:30:10, 400 people screaming, the person in the bear suit
  gasping, car alarms and a crash up the valley, your phone filling with messages, sirens, the crowd's "oh" at 4:42.
- **mix:** the music clearly leads, beds about 10 dB under it, measured stem by stem (the owner's rule of 31 October
  2026); −16 to −14 LUFS integrated, true peak ≤ −1 dBTP.

## 6. Checks and review log

See `EPISODE_REPORT.md` (reviews, scores as given, what is still weak).
