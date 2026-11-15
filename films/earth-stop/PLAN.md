# What if Earth stopped spinning for 1 second?

Voiceless 16:9 long-form, 4:55 (295.2 s), slug `earth-stop`, page `earth-stop.html`. Built the way of Gravity tilts
90°, Gravity keeps tilting, Friction 10 s and Magnets 1,000×, to the owner's YouTube lessons of 2026-10-28 and the note
on the film before this one (it was boring): this one has to be big, loud and spectacular.
- an everyday, human-scale place nobody has seen in these films: a small railway station on the equator, by a harbour;
- action in the first 5 s (the title is over the platform; at 0:02.9 the ground stops and the whole station slides east);
- the real physics in minute one (the ground always moves at 1,670 km/h and you never feel it; what it would take to
  stop it; why no bolt can hold);
- about 5 minutes, no filler; the story clock only runs forward (no replays, 2026-10-29): the whole film after the title
  is one second and the 0.31 s after it;
- escalation to the last frame, no recap: the station, the town, the people, your train, the hill, six wagons of fuel,
  the wind, the sea, and then the twist at 5:42:01;
- the music clearly leads, beds about 10 dB under it, measured stem by stem (2026-10-31);
- new scenery only, no z-fighting.

## 1. The rule

On Sunday at 5:42:00.000 PM the solid Earth stops turning: rock, soil, the ground everything stands on. At 5:42:01.000
it turns again as before. Nothing else is touched: every loose thing, the air and the sea keep the motion they had,
465.1 m/s to the east at the equator. The one impossible thing, said on screen: stopping the Earth takes its whole spin
energy, as much as the Sun gives off in 9 minutes; where it goes is not said.

## 2. The physics (physics.js; every caption number is checked against it in script.js)

- Speed at the equator: 2πR / one sidereal day = 465.1 m/s = 1,674 km/h (captions round to 1,670).
- Nothing is bolted down hard enough: to stop dead from 465 m/s steel would have to carry ρ·c·v ≈ 18 GPa; structural
  steel yields at 0.355 GPa, about 50 times too weak. Every bolt shears; buildings slide off their floors.
- Friction is a weak brake: a person on the platform loses about 25 km/h in the second (μ 0.7); the platform ends in
  20 m. Your train (180 t, steel skidding on steel, μ 0.2) loses about 7 km/h. GENEROUS, said in the plan and the
  report: the train stays on its rails and the rails in their clips. 575 km/h is the record on steel wheels.
- Energy: ½v² = 108 kJ per kilogram = 26 g of TNT per kilogram. Your train: 4.6 tonnes of TNT. A fuel wagon (80 t):
  2 tonnes, before its fuel.
- Gravity: in one second a thing falls 4.9 m. The station's roof was 5.6 m up and is in free fall from s 0.224; the
  woman on the footbridge from s 0.017. Both are still in the air at 5:42:01.
- The hill, 600 m east of the station, is ground: it stopped. Whatever started within 465 m west of its rock reaches it
  during the second: the palms at its foot, the depot's shed (s 0.387), six fuel wagons parked 210 m from it (the first
  at s 0.449, then one every 0.032 s), the signal box, the water tower.
- The air keeps going: against the rock a wind at Mach 1.33 (30 °C air); where the rock stops it, it heats by 108 °C.
- The sea keeps going: 465 m of water, 10 m deep, onto every metre of quay: 4,800 t per metre, the energy of 120 t of
  TNT. It can only go up. APPROX.: drawn climbing at ¾ of its speed (over 1,000 km/h): 349 m high at 5:42:01. The ferry
  (290 m out) reaches the quay at s 0.624.
- The low Sun (azimuth 251.5°, 6.5° up) is behind the harbour: the sea's wall covers it from about s 0.09, and its
  shadow crosses the station and then the hill. The second half of the film is in that shade, lit by the fire.
- Your train has slid 410 m by s 0.88; at 5:42:01 it is 150 m short of the hill.
- 5:42:01: the ground turns again. What is still moving east at 465 m/s is suddenly at rest on it. What the ground
  stopped during the second (the wagons, the fire, the air against the hill, the sea against the quay) stands still
  while the ground leaves: seen from your seat it is thrown west at 1,670 km/h and reaches your train 0.32 s later
  (s 1.322). The film ends at s 1.311.

## 3. The beats (CAPTIONS.md: 19 beats after the title, 56 captions)

start · speed (and something gets in front of the Sun) · bolts · town · people (the pigeons are fine) · train · energy ·
hill · depot (the first wagon) · wind · sea (this is what got in front of the Sun; the ferry) · up · fall (the roof,
the woman) · sky (the safest place on Earth) · count · back (5:42:01: stillness) · twist · second · question.

## 4. Sets and shots (shots.js: 43 shots; one clock, 150 to 900 times slower than life, bursts of 30 to 50)

- The coast (world.js, station.js, train.js, fx.js; cameras and labels coastset.js): the harbour with its quay, ferry
  and boats; the station (two platforms, canopies on bolted columns, a footbridge, people, pigeons); the town; your
  three-car train; the line east to the hill and its tunnel; the depot with six tank wagons; palms everywhere.
- The effects (fx.js): dust and scour where things slide, the fire (a sheet that follows the hill, smoke above it), the
  sea's wall (three sheets, a ragged crest, a real shadow), the blast coming back west.
- The sky (skyset.js): an airliner at 10 km, the one calm shot.

## 5. Sound (sound-lib.js, sound-music.js, sound-amb.js, sound-sfx.js; mix.js)

No narrator. Three stems, all synthesised from seeded code. The score is in D minor at 120 beats a minute: a driving
ostinato of short strings over a low pulse, big drums, low brass, a sub drop on every blow, a five-note motif; it is
cut to almost nothing where the picture holds its breath (the people, the fall, the airliner) and cut dead at
5:42:01.000. The beds are the slowed world, per place (the platform, your train, inside it, the hill, the harbour,
high up, the cabin). The effects land on their story moments: the stop, steel groaning and scraping, masonry, the
skid, each palm and each wagon at the rock, the ferry, the water climbing, the seat-belt chime, the wheels gripping,
and what comes back west.

## 6. Checks and review log

- script.js throws if a caption's moment or number drifts from physics.js; shots.js throws if the clock jumps anywhere
  but on a cut, or ever runs backwards.
- Review rounds and fixes: EPISODE_REPORT.md.
