# What if sound travelled faster than light?

Voiceless 16:9 long-form, 4:57 (296.85 s), slug `sound-faster-light`, page `sound-faster-light.html`. Built like
Friction 10 s and Gravity keeps tilting, to the owner's YouTube lessons of 2026-10-28, in the eerie horror tone of
Slower light (the channel's best):
- an everyday, human-scale place with new scenery: a corn farm in Iowa on a Saturday evening in late July, a
  thunderstorm coming in from the west, the corn 2.4 m tall; your 9-year-old daughter has just run into it after the dog;
- action in the first 5 s (the title is her running across the lawn into the corn; at 0:03.6, 8:52:00 PM, nine
  thunders land at once);
- the real physics in minute one (thunder at 343 m/s, 3 seconds a kilometre; from 3 km the thunder now beats the
  light by 7 millionths of a second; why nothing real can do it: air 7 million times stiffer than steel);
- under 5 minutes, no filler; the story clock only runs forward (one jump, +25 s, at the cut into the corn);
- tension to the last frame, no recap: found, the tornado under a kilometre away, the cellar 130 m behind you, and you
  can't hear which way it's moving: "Which way would you run?";
- the music clearly leads, beds about 10 dB under it, measured stem by stem (2026-10-31);
- no z-fighting, and the picture pitfalls list (no particle alpha over 1, no kilometre-long triangles).

## 1. The rule

At 8:52:00 PM sound starts travelling at 1,000,000 km/s (3.3 times light). Only its speed changes: how loud things
are and how far they carry stay the same (said on screen). Everything that follows comes from that one change:
- thunder lands with its flash (strictly 7 µs before it from 3 km), and a 6 km bolt's 13 s of rumble lands in one blow;
- echoes arrive with the sound that made them, so you can't hear a room, a barn, a field;
- the gap between your ears (0.66 thousandths of a second) becomes 0.2 billionths: your brain can't find where a
  sound comes from, and every sound seems to be inside your head; louder means closer, nothing else is left;
- distance no longer makes a sound late: a horn 11 km away and dogs 1.4 km away at the same instant;
- a bat's echoes come back at once: every bat (and dolphin) is blind;
- a siren doesn't drop in pitch as it passes (no Doppler shift): you can't tell coming from going;
- through the air her voice now beats the phone (which still lags 0.25 s).

## 2. The physics (physics.js; every caption number is checked against it in script.js)

- Sound at 20 °C: 331.3·√(1 + 20/273.15) = 343.2 m/s (caption 343), 2.91 s a kilometre (caption 3).
- Strike 3 km away: light takes 10.0 µs, sound now 3.0 µs: 7.0 µs ahead (caption 7 millionths).
- Air (1.204 kg/m³) would need a bulk modulus ρc² = 1.2 × 10¹⁸ Pa, 7.5 million times steel's 160 GPa (caption 7 million).
- The long bolt: 1.3 km down, then a 4.3 km spider along the cloud base, 6.0 km of channel (caption 6); nearest point
  1.6 km, farthest 6.0 km: 13.0 s of rumble at 343 m/s (caption 13).
- Interaural time difference (Woodworth, head radius 8.75 cm): 0.656 ms before (caption 0.66), 0.22 ns now (caption
  0.2); the smallest gap a brain uses, about 10 µs, is 44,000 times longer (caption 44,000).
- Her voice at 300 Hz: wavelength 3,333 km now (caption 3,300).
- A bat's echo: 17 cm for every thousandth of a second (c0/2; caption 17).
- The railway crossing 11.0 km, the Hansen farm 1.42 km (captions 11, 1.4); the town 6.1 km (caption 6).
- The tornado when first seen: 3.1 km west (caption 3); 60 km/h; the inflow near it 90 km/h (caption 90).
- Her phone 120 m into the corn (caption 120); the corn 2.4 m (caption 2.4); you to her as you run in 93 m (caption 90);
  the yard light 87 m behind you when hit (caption 90); the Hansen farm 1.33 km when hit (caption 1.3); found at 5.7 m
  (caption 6); the storm cellar 130.2 m (caption 130).
- The Sun at 41.9° N, 93.9° W, 8:52 PM CDT on 24 July 2027: 2.3° below the horizon at azimuth 299° (NOAA's
  formulas): the twilight slot under the storm.

## 3. The beats (CAPTIONS.md: 21 beats after the title, 54 captions)

start (8:52 PM; she ran into the corn; sound at a million km/s; nine thunders at once) · flash (3 s a km; now with the
flash; 7 µs before it) · rule (air 7 million times stiffer than steel; only the speed changes) · rumble (the 6 km bolt;
13 s of rumble lands at once) · call (no echo) · answer (she's calling back; you can't tell where she is) · ears (0.66
ms; 0.2 billionths; 3,300 km waves) · head (inside your head; louder means closer; you walk the wrong way) · far (the
train 11 km, the dogs 1.4 km, at once) · bats (blind) · siren (the town's sirens; the sheriff's siren doesn't drop in
pitch) · tornado (lit for a fraction of a second, 3 km west) · phone (rings as if in your pocket; her voice beats the
phone; 120 m, west) · corn (2.4 m; you run; she sounds beside you, 90 m) · strike (the yard light, 90 m behind you; the
bang is the flash) · wind (90 km/h; the corn lies down) · neighbour (the Hansen farm comes apart at the instant it
happens) · found (a yellow raincoat, 6 m) · back (the cellar 130 m behind you; you can't hear which way it's moving) ·
question ("Which way would you run?").

## 4. Sets and shots (shots.js: 51 shots)

- The farm (world.js): a white clapboard house with a porch light, a red barn with a loft door and a lamp, a steel
  windmill, a 9 m yard light, grain bins, a pickup, a tyre swing, maples and a spruce windbreak, a gravel road with power
  poles; the Hansen farm 1.4 km west; the town 6 km south-east (street lamps, a water tower with a red light).
- The corn (corn.js): instanced plants in 30-inch rows, built lazily in 8 m cells, bending in the wind and lying down
  in the inflow; the paths you, she and the dog push through it.
- The storm (sky.js, tornado.js): a cloud base 1.3 km up over a twilight slot in the west-north-west, rain shafts, up to
  six flash patches, lightning channels drawn as ribbons, rain round the camera; the tornado (a funnel, a wall cloud,
  debris) hidden in the rain until the flash that shows it.
- Glows (fx.js): far yard lights over the plain, the town, the freight train, the porch, the barn, the torch, phones,
  the sheriff's light bar, the yard light's sparks and smoke, the tornado's dust, grit in the wind.

## 5. Sound (sound-lib.js, sound-music.js, sound-amb.js, sound-sfx.js; mix.js)

No narrator. Three stems, all synthesised from seeded code. The score (D minor) is the only thing left with a left
and a right: before 8:52 its theme is played one note after another with echoes; from 8:52 its notes land at once, as
one chord. Before 8:52 the world is in stereo with the yard's echo and its thunder late and rolling; from the boom on,
every world sound is mono, dry and instant, in the middle of your head: every thunder lands with its flash as one blow,
your call has no echo, her voice is as loud as if she were beside you, the train's horn and the dogs at once, the
bats, the town's sirens, the sheriff's siren with no change of pitch, her ringtone as if in your pocket and her voice
twice (the air, then the phone), the run, the yard light (the loudest sound in the film), the Hansen farm coming apart,
the tornado's roar growing as it comes closer.

## 6. Checks and review log

- script.js throws if a caption's moment or number drifts from physics.js (11 caption moments, 26 caption numbers).
- Reviews and the fixes: EPISODE_REPORT.md § Reviews.
