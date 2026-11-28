# What If Earthquakes Got 1 Magnitude Stronger Every Minute?

A narrated 16:9 long-form film (9:51, 1920×1080, 30 fps) in the channel's **new recipe** (agreed 27 November 2026):
a counted title, the craziest frame first and then "Minute 1" (no title card), short narration lines with gaps (Michael,
ElevenLabs, natural settings), "you" as a character with a face, a ladder of famous things (a new one every 5–8 s, a
labelled landmark every 20–30 s), bright daylight, crowds that react, minimal bold sans text (one big MAGNITUDE counter
and one status word), 6–10 shots a minute. The owner's brief (28 November 2026) added: show liquefaction, falling glass
and a tsunami; zoom out street → city → planet; a new picture every 2–3 s in the first 15 s; accurate, checked physics
(Haiti 2010, Japan 2011, Chile 1960, the dinosaur asteroid).

Page: `earthquakes-stronger.html`. Narration: `NARRATION.md` → GitHub Actions (ElevenLabs) → `narration/` +
`narration-timing.js` (`build-timing.cjs`). The edit is built on the narration: `quake.js` is the clock (every minute
starts on a tick), `shots.js` pins every cut to a word.

## 1. The rule, and the numbers (`quake.js`; `script.js` checks the numbers the narrator says)
- **The one made-up rule:** every minute, every earthquake on Earth gets one magnitude stronger, and none of them
  stops (real earthquakes peak and stop in seconds to a few minutes; the end card says so). The film runs in **real
  time**: one minute of film is one minute of the story. Yours is under San Francisco: magnitude 3 in minute 1,
  magnitude 12 in minute 10.
- **Energy:** log₁₀ E = 1.5 M + 4.8 (joules; USGS, Gutenberg–Richter). One magnitude is 31.6× ("thirty-two times"),
  two are 1,000×. A ton of TNT is 4.184 GJ.
- **The other earthquakes:** a new magnitude-2 one starts somewhere on Earth every 20 s (real: M2+ about 1.4 million a
  year, one every ~22 s), in the world's busiest zones, and each also gains a magnitude every minute. So Los Angeles
  (started at 1:23) is a 7 at 6:47, Mexico City a 6, Tokyo, Istanbul, Iran… two dozen by minute 9.
- **The crack** grows from the epicentre at 5 km/s (the fastest real, "supershear" ruptures) up to the length real
  quakes of that size break (Wells & Coppersmith 1994: log₁₀ L km = −3.55 + 0.74 M). From magnitude 10 there is no
  real length ("No fault on Earth is long enough to make a ten"), so it keeps going: Los Angeles to Oregon in minute 8.

| minute | M | energy | what it equals (said on screen) | check |
|---|---|---|---|---|
| 1 | 3 | 2.0 GJ | a bolt of lightning | lightning ~1–5 GJ |
| 2 | 4 | 63 GJ = 15 t TNT | more than MOAB (11 t), the biggest non-nuclear bomb used in a war (2017) | ✓ |
| 3 | 5 | 2.0 TJ = 477 t TNT | "five hundred tons of TNT" | ✓ |
| 4 | 6 | 63 TJ = 15 kt | Hiroshima (~15 kt) | ✓ |
| 5 | 7 | 2.0 PJ | Haiti, 12 January 2010 (M7.0); Loma Prieta 1989 was 6.9 and dropped 15 m of the Bay Bridge's upper deck | ✓ |
| 6 | 8 | 63 PJ = 15 Mt | San Francisco 1906 (7.9); Castle Bravo 1954 (15 Mt) | ✓ |
| 7 | 9 | 2.0 EJ = 477 Mt | Tōhoku 2011 (9.0–9.1); ~10× Tsar Bomba (50 Mt) | ✓ |
| 8 | 10 | 63 EJ | never recorded (Chile 1960: 9.5); a month of all human energy use (~620 EJ a year → 52 EJ) | ✓ |
| 9 | 11 | 2.0 ZJ | three years of human energy use (3.2) | ✓ |
| 10 | 12 | 63 ZJ | four days of all the sunlight reaching Earth (174 PW × 1 day = 15 ZJ → 4.2 days) | ✓ |
| 11 | 13 | 2.0 YJ | more than the Chicxulub asteroid (~4 × 10²³ J) | ✓ |
| 17 | 19 | 2.0 × 10³³ J | more than Earth's gravitational binding energy (2.2 × 10³² J; M18 is only 6.3 × 10³¹) | ✓ |

Other facts on screen: California gets several hundred M3+ quakes a year; the San Andreas and Hayward faults; the
Ferry Building (1898) came through 1906 and 1989; much of the waterfront is fill (sand, rubble, Gold Rush ships) that
liquefied in 1989; a turbine helicopter takes a minute or two to start; Mexico City sits on an old lake bed (1985,
2017); past 1 g of upward shaking, loose things leave the ground; fast fault slip can melt rock (pseudotachylyte).
Places that are made up (said on screen): your café, your pier, your helicopter tour.

## 2. The story, minute by minute (film time; the minute starts on its tick, 2.6 s + 60 s × (k − 1))
- **Cold open (0:00–0:02.7):** the globe at magnitude 12 (rings around California), the molten crack through the
  flattened city, your face in the helicopter, screaming. "This is magnitude twelve."
- **Minute 1, M3 (0:02.6):** Saturday morning at a café on the Embarcadero, waiting for a helicopter tour. Your coffee
  ripples. The rule; ×32 per step; "in real time".
- **Minute 2, M4:** a bus rumbles past ("like a truck"); the San Andreas and Hayward on a map; MOAB; the gulls leave; the helicopter
  at the end of the pier, your booking on your phone, the pilot waves and starts the engine.
- **Minute 3, M5:** everyone feels it; every phone's alert; 500 t of TNT under your feet; people pour out; drop, cover,
  hold on… "never going to stop"; you run down the pier; the Ferry Building's clock tower sways.
- **Minute 4, M6:** Hiroshima; windows burst, chimneys fall, every car alarm; the streetcar jumps its rails; you reach
  the helicopter, it takes two minutes to start; the fill turns to mud, cars sink.
- **Minute 5, M7:** Haiti; the old brick buildings go first; the road splits down the middle; the pier breaks up; lift
  off; the sky; the Bay Bridge.
- **Minute 6, M8:** 1906, the fires; Castle Bravo; the Transamerica Pyramid falls; the Golden Gate Bridge; your phone:
  Los Angeles, Tokyo, Mexico City, Istanbul; the world map of growing quakes.
- **Minute 7, M9:** Japan 2011; 10× Tsar Bomba; up here you only watch; the bay drains (a seiche) and comes back over
  your café; Los Angeles (Hollywood sign), Mexico City (jelly).
- **Minute 8, M10:** never recorded (Chile 1960 bars); no fault is long enough; past 1 g; a month of human energy; the
  Hoover Dam; the Space Needle; from space, the crack runs Los Angeles to Oregon.
- **Minute 9, M11:** three years of human energy; even the air shakes; Tokyo at 2 AM (the Skytree), Dubai (the Burj
  Khalifa), Istanbul (the Bosphorus Bridge); two dozen quakes; two hours of fuel, nowhere to land.
- **Minute 10, M12:** four days of sunlight; Earth cracking from space; the crack melts the rock; the dinosaur asteroid
  next minute; seven more minutes to blow the planet apart. "You have two hours of fuel. And seven minutes of planet."
  "Who would you call?" Then the honest note.

## 3. Sets (all procedural, pure functions of time)
- `sf-geo.js` San Francisco from the air: terrain, the bay, ~19,000 instanced buildings that sway and fail by kind
  (wood 8.1+, concrete 7.6+, steel towers 8.4+), roofs, dust, fires, the crack. `sf-marks.js` landmarks (Ferry
  Building, Salesforce Tower, Transamerica Pyramid, Coit Tower, the Bay Bridge, the Golden Gate, Alcatraz, Sutro Tower).
- `waterfront.js` the Embarcadero in detail: lanes, median palms and F-line, the café pavilion and terrace, your pier
  and helipad, the old brick building; liquefaction, sinking cars, the split road, the pier collapse, the seiche.
- `heli.js` your tour helicopter (rotor spin-up over 2.5 min), the cabin (grey inside), the panel (fuel page).
- `world.js` postcards: Los Angeles (Hollywood sign), Mexico City (Angel of Independence), Hoover Dam, Seattle (Space
  Needle, Rainier), Tokyo at night (Skytree), Dubai (Burj Khalifa), Istanbul (Bosphorus Bridge).
- `globe.js` the planet: the quakes as growing rings, labels, the crack along the coast, minute 10's cracking Earth.
- `hud.js` the MAGNITUDE counter, the status word, the clock, labels, the comparison panels, the end card.

## 4. Sound (`sound-*.js`, `mix.js`, `audio.js`)
- **Voice** −2 dB with a gentle compressor; never cut or sped up.
- **Score** (`sound-music.js`): the key climbs a semitone every minute (C at minute 1 … A at minute 10), like the
  quake; each tick lands with a hit and the "climb" motif (the old key's note, then a semitone up); strings, pulses,
  piano, bells, toms; a cold-open cue cut dead at "magnitude three". Synthesised in JS and summed into 8-s blocks
  (`EqFx.play`/`flush`): the first version made ~18,000 Web Audio nodes and took ~30 min to render; now 2 min.
- **Beds** (`sound-amb.js`): the street (traffic, the bay lapping, gulls, a ferry horn) thinning as the city fails; the
  cabin's muffled roar; wind in the air; the cities by day and night; almost nothing in space. **No breathing.**
- **Effects** (`sound-sfx.js`): the rumble and rattle at each magnitude's frequency, a jolt at every tick, cups,
  shelves, phone alerts, crowd, footsteps, glass, chimneys, car alarms, the streetcar, mud, bricks, the split, the
  pier, the rotor (blade slap from the rotor's own angle), every world shot's destruction.
- **Mix rule (owner, 31 October 2026):** the music clearly leads, beds about 10 dB under it, measured stem by stem
  (solo renders, K-weighted 10-s windows, gains added). Targets: −16 to −14 LUFS, ≤ −1 dBTP.

## 5. Review log
Three independent reviewers per round (pacing, picture, science), each looking at contact sheets of a full preview
render and the script. Scores as given, out of 10.

| Round | Pacing | Picture | Science |
|---|---|---|---|
| 1 (first preview) | 5 | 4 | 7 |
| 2 (after fix round 1) | 5 | 5 | 8 |

- **Round 1 → fix round 1:** the tsunami read as a fog band (now a dark wall of water with a foam crest, the bay
  floor showing as it drains); fires, haze, mud boils, the split road, the pier and the crack pit redone; cockpit angles;
  label caps; minute 1 reordered and minute 2 cut faster; the moving "postcard" city shots; the planet cracking.
- **Round 2 → fix round 2:** science wording on the tags (rupture length against Chile 1960 and Sumatra 2004, the crack
  still growing onto the Cascadia fault, the Golden Gate's retrofit, MOAB "used in war", Tsar Bomba "ever exploded",
  seismograph wave height, where the quake starts, oceans boiling at magnitude 15 to 16, log scale on the last chart);
  the wall of water now reaches the terrace on screen; the Bay Bridge's deck drop happens inside its shot; a bus for "a
  truck rumbling past"; gentler streetcar tilt; smoke and spray fade near the lens; labels that pointed at haze removed;
  text kept off faces and cards; a scrim under the counter; slow beats in minutes 1 and 2 split into more shots.
- **Still weak (honest):** minutes 1 and 2 are calm by design (magnitudes 3 and 4 are barely felt), so the pacing
  reviewers kept asking for more; the far city is low-detail from the air.

## 6. Status
Done on branch `claude/project-thread-4w7kq0` (2026-11-28): two review rounds and their fixes (scores in § 5),
sound baked (fingerprint 0bb10d20), mastered soundtracks `final-soundtrack.m4a` and `small-soundtrack.m4a`, runnable
ZIP, report and three thumbnails in the project folder (`EPISODE_REPORT.md`). The 1080p film renders on the owner's PC
with `render-gpu.cjs`.
