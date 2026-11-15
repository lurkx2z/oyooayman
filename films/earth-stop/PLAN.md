# What if Earth stopped spinning for 1 second?

Voiceless 16:9 long-form, 4:09 (248.6 s), slug `earth-stop`, page `earth-stop.html`. Built the way of Gravity tilts
90°, Gravity keeps tilting, Friction 10 s and Magnets 1,000×, to the owner's YouTube lessons of 2026-10-28 and the note
on the film before this one (it was boring): this one has to be big, loud and spectacular.
- an everyday, human-scale place nobody has seen in these films: a small railway station on the equator, by a harbour;
- action in the first 5 s (the title is over the platform; at 0:01.5 the ground stops and the whole station slides
  east; at 0:09.3 a house runs into the hill);
- the real physics in minute one (the ground always moves at 1,670 km/h and you never feel it; why no bolt can hold);
- no filler; the story clock only runs forward (no replays, 2026-10-29): the whole film after the title is one second
  and the 0.32 s after it;
- escalation to the last frame, no recap: the station, the town, the people, your train, the hill, six wagons of fuel,
  the wind, the sea, and then the twist at 5:42:01;
- the music clearly leads, beds about 10 dB under it, measured stem by stem (2026-10-31);
- new scenery only, no z-fighting.

Three cuts were made. The first (4:55, 56 captions, a clock that ran at one steady rate per shot) was reviewed at
4.5/10: the captions claimed 1,670 km/h and the picture was mostly stills. The second (4:23, 51 captions, 51 shots, one
clock that bursts and settles) was reviewed at 5.5/10 for retention, 7.5/10 for physics and script and 5.5/10 for
picture: the slow stretches were where a viewer would leave, and two glitches were on screen. This is the third (4:09,
44 captions, 43 shots): it is shorter than the owner's five to six minutes on purpose, because every stretch that was
cut was one a reviewer marked as a place to leave (§ 6). It was reviewed at 6/10 for retention and 6/10 for picture
("publishable, but only just": pacing is still the weak point); after that round the opening got its turn of the
camera and the ending its glare, and neither was scored again.

## 1. The rule

On Sunday at 5:42:00.000 PM the solid Earth stops turning: rock, soil, the ground everything stands on. At 5:42:01.000
it turns again as before. Nothing else is touched: every loose thing, the air and the sea keep the motion they had,
465.1 m/s to the east at the equator. The one impossible thing, said on screen while the first house hits the hill:
stopping the spin takes the Sun's whole output for 9 minutes; where it goes is not said.

## 2. The physics (physics.js; every caption number is checked against it in script.js)

- Speed at the equator: 2πR / one sidereal day = 465.1 m/s = 1,674 km/h (captions round to 1,670).
- Nothing is bolted down hard enough: to stop dead from 465 m/s steel would have to carry ρ·c·v ≈ 18 GPa; structural
  steel yields at 0.355 GPa, about 50 times too weak. Every bolt shears; buildings slide off their floors.
- Friction is a weak brake: a person on the platform loses about 25 km/h in the second (μ 0.7); the platform ends 12 m
  ahead of them, and from its edge (1.1 m high) they touch the ground about 220 m later. Your train (180 t, steel
  skidding on steel, μ 0.2) loses about 7 km/h. GENEROUS, said on screen: the train stays on its rails and the rails
  stay put. 575 km/h is the record on steel wheels.
- Energy: ½v² = 108 kJ per kilogram = 26 g of TNT per kilogram. Your train: 4.7 tonnes of TNT ("almost 5"). A fuel
  wagon (80 t): 2 tonnes, before its fuel.
- Gravity: in one second a thing falls 4.9 m. The station's roof was 5.6 m up and is in free fall from s 0.224; the
  woman on the footbridge from s 0.017. Both are still in the air at 5:42:01.
- The hill, 600 m east of the station, is ground: it stopped. Whatever started within 465 m west of its rock reaches it
  during the second: a house on the road under it (s 0.052), the palms at its foot (about 100 by 5:42:01), a second
  house (s 0.361), the depot's shed (s 0.387), six fuel wagons parked 210 m from it (the first at s 0.449, then one
  every 0.032 s), the signal box, a lorry, the water tower.
- The air keeps going: against the rock a wind at Mach 1.33 (30 °C air); where the rock stops it, it heats by 108 °C.
  The hill arrives faster than its own sound: nobody on the train hears any of it. APPROX., said on screen: the shock
  wave standing ahead of the hill is not drawn.
- The sea keeps going: 465 m of water, 10 m deep, onto every metre of quay: 4,800 t per metre. It can only go up.
  APPROX., said on screen: drawn climbing at ¾ of its speed (1,256 km/h): 349 m high at 5:42:01. The ferry (290 m out,
  2,000 t) reaches the quay at s 0.624.
- The low Sun (azimuth 251.5°, 6.5° up) is behind the harbour: the sea's wall covers it from about s 0.08 at the station, and its
  shadow crosses the station and then the hill. The second half of the film is in that shade, lit by the fire.
- Your train has slid 410 m by s 0.88; at 5:42:01 it is 150 m short of the hill.
- 5:42:01: the ground turns again. What is still moving east at 465 m/s is suddenly at rest on it. What the ground
  stopped during the second (the wagons, the fire, the air against the hill) stands still while the ground leaves: seen
  from your seat it comes west at 1,670 km/h and reaches your train 0.32 s later (s 1.322, film 4:04.95). The picture
  fills with an orange glare, goes white there, then black, and only then comes the question.

## 3. The beats (CAPTIONS.md: 19 beats after the title, 44 captions)

start · first (the hill stopped too; nothing else did: a house and the palms into the rock) · speed (and something gets
in front of the Sun) · bolts · town · people (they leave the platform's end already toppling) · train · energy · hill
(a second house; the depot's shed) · depot (the first wagon) · wind · sea (this is what got in front of the Sun; the
ferry) · up · fall (the roof, the woman) · sky (the safest place on Earth) · count (faster than its own sound) · back
(5:42:01: silence) · twist · question.

## 4. Sets, shots and the clock (shots.js: 43 shots; script.js: one clock)

- The coast (world.js, station.js, train.js, fx.js; cameras and labels coastset.js): the harbour with its quay, ferry
  and boats; the station (two platforms, canopies on bolted columns, a footbridge, people); the town; your three-car
  train; the line east to the hill and its tunnel; two houses on the road under the hill; the depot with its shed and
  six tank wagons; palms.
- The effects (fx.js): dust and scour where things slide; debris off the rock (a palm, a house, a shed and a wagon each
  break up their own way); the fire (a sheet that follows the hill, with tongues at the scale of the rock face, a
  fireball per wagon, smoke above); the sea's wall (three sheets, a ragged crest, a real shadow); what comes back west.
- The sky (skyset.js): an airliner at 10 km, the one calm shot.
- The clock (`ES_CLOCK`): one monotonic story clock for the whole film. Most shots open in a burst (45 to 250 times
  slower than life: things visibly travel) and settle to a near-freeze while their caption is read; every camera moves.
  The blows (the first house, the shed, each wagon, the ferry, 5:42:01) sit on their captions and are checked. The run
  into 5:42:01 is the other way round: slow, then a rush that stops dead. The last three shots run about 40 and 72
  times slower than life and then, into the last frame, from 120 down to 32 times: the film accelerates into its end.

## 5. Sound (sound-lib.js, sound-music.js, sound-amb.js, sound-sfx.js; mix.js)

No narrator. Three stems, all synthesised from seeded code. The score is in D minor at 120 beats a minute: a driving
ostinato of short strings over a low pulse, big drums, low brass, a sub drop on every blow, a five-note motif; it is
cut to almost nothing where the picture holds its breath (the people, the fall, the airliner), drops out for a third of
a second before the first wagon, and everything is cut dead at 5:42:01.000 (true silence, no hit, not even an echo).
The beds are the slowed world, per place (the platform, your train, inside it, the hill, the harbour, high up, the
cabin). The effects land on their story moments: the stop, the house, each palm and the shed at the rock, steel
groaning and scraping, the skid, each wagon, the ferry, the water climbing, the seat-belt chime, the wheels gripping,
and what comes back west. At 4:04.95 it arrives: one blow, then two low piano notes over the black.

## 6. Checks and review log

- script.js throws if a caption's moment or number drifts from physics.js; shots.js throws if the clock jumps anywhere
  but on a cut, or ever runs backwards.
- Review rounds, scores as given, fixes and what is still weak: EPISODE_REPORT.md.
