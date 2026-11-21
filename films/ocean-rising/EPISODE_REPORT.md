# Episode report — *What if the ocean kept rising and couldn't stop?*

**Format.** 16:9 long-form, 1920×1080, 30 fps, 4:47 (287.3 s). Voiceless, in the house formula (Friction 10 s, Gravity
keeps tilting, Sound faster than light, Everything kept shrinking), built to the owner's YouTube lessons of 28 October
2026 (an everyday place, action in the first seconds, a real-physics nod in the first minute, tension to the last
frame), the rule of 29 October 2026 (**the story clock only runs forward**), "more new scenery" and "no z-fighting"
(4 November), the audio rule of 31 October (the music clearly leads, measured stem by stem), "no constant breathing"
(20 November) and the title data of 20 November ("kept … and couldn't stop" titles bring most of the channel's views).
The tone is the eerie, quiet feel of Slower light. The place is new: Harrow Rock, a granite islet 22 km off the coast
of Maine at sunset, a 47 m stone lighthouse, the keeper's house, a fog-signal house, a landing with your boat, a bell
buoy, the far coast with its towns and lighthouses, and Isla's hill over the harbour town of Port Ellery.

**Length, said plainly.** The owner's lesson asks for about six minutes. This film is 4:47, like the last five films.
The story runs 49 minutes of story time (6:42 to 7:31 PM) and ends while the sea is still rising past your boots.

Page `ocean-rising.html`, code `films/ocean-rising/`. Every number is in `PLAN.md` § 2 (computed in `physics.js`);
`script.js` refuses to run if a caption's number drifts from it. Captions are in `CAPTIONS.md`.

**The rule.** At 6:42 PM EDT on Thursday 9 September 2027, high water at Harrow Rock, the tide should turn. It doesn't.
From then on the sea everywhere on Earth rises 1 metre every minute and keeps rising. The real-physics nod in minute
one: 1 m of new sea is 361,000 km³ of water, and every river on Earth would take 10 years to bring that much (Dai &
Trenberth 2002: 37,300 km³ a year). It comes every minute.

**The one impossible part**, said on screen: the water comes from nowhere. Nothing else changes (the swell, the Moon,
the weight of water, the light). The keeper, the rock and the town are fictional (no US light has had a resident
keeper since 2023), and a tag in the first seconds says so; the sky and the tide are real: on the Gulf of Maine high
water comes about 11 hours after the Moon crosses the meridian, which puts it near 6:42 PM that evening, with a gibbous
Moon in the south-south-east and the Sun setting at 6:52.

**What follows from the rule** (all from `physics.js`): your boat's 1.15 m bow line won't let it rise, so the sea
pours in over the bow (taut at +0.57 m, under at +0.85 m); orange lichen, which only grows above the highest tides,
goes under at 6:45:36; the bell buoy's 26 m chain in 18 m of water runs out at +8 m; one person in ten on Earth lives
less than 10 m above the sea; the fog signal's compressor floods at +10.8 m; the house fills in 2.8 minutes; the tower
door (1 × 2 m) takes ρ·g·A·depth ≈ 9.8 tonnes-force with the sea 4 m over it and gives at +21.2 m (7:03 PM); the shaft
fills to the sea's height in about 16 s; the sea climbs one 0.188 m step every 11.3 s; the coast's substations flood at
+27 m (7:09 PM); all the ice on Earth would add about 66 m (IPCC AR6), which the sea passes 33 minutes after the ice
caption; a container ship 25 km out "just floats up" and needs 50.6 minutes at 16 knots to reach you; Isla sees your
light over the sea's curve from her 240 m hill 24 km away until the sea reaches the lamp, and her hill goes under at
10:42 PM; under water the lens can't focus, so the beam spreads into a glow, and no light gets out sideways through the
surface: from the hill your light has gone out.

## The clock (`clock.js`)

The story clock only runs forward. It runs at real speed inside a shot and jumps only at cuts, and the HUD says
"+N MIN LATER" for those. Each jump is set by an anchor that puts a caption's number exactly where the physics says it
is ("this caption comes up at that story second"), so a caption that says 6:42 is on screen at 6:42 whatever the timing
does, and the clock throws an error if an anchor would make it run backwards. In 4:47 the story runs from 6:42:00 to
7:31 PM.

## Beats (28 including the title and the question; 52 captions, 53 shots)

| film | beat | what |
|---|---|---|
| 0:00 | title | a fast low run over the swell to the rock; the title |
| 0:03 | start | 6:42 PM, high tide: it should turn; it doesn't (the tide board); 1 m a minute; you're the keeper |
| 0:19 | boat | the short rope won't let your boat rise; the sea pours in; the knot is already under water |
| 0:36 | phone | Isla's first texts (the sea over her harbour wall); you tell her to go up the hill |
| 0:48 | rule | 361,000 km³ a minute, 10 years of every river, from nowhere |
| 1:03 | height | the lamp is 47 m above high tide: 45 minutes |
| 1:12 | lichen | the orange band goes under |
| 1:19 | radio | every harbour calling for help; you call too; nobody answers |
| 1:30 | bell | the bell buoy's chain runs out |
| 1:36 | world | one person in ten under 10 m; the sea passes 10 m; Isla: "we are in the car going up" |
| 1:49 | fog | you sound the fog signal one last time; the sea drowns it |
| 2:00 | cottage | the sea under your door; the kitchen fills |
| 2:10 | island | no island any more; the swell breaks where it was |
| 2:22 | door | you bolt the tower door; 4 m over it, 10 tonnes; you run for the stairs |
| 2:36 | burst | it gives |
| 2:40 | dark | the power room floods; all but the lamp (its own sealed battery) |
| 2:52 | stairs | a step every 11 seconds; it never stops; 105 steps to go |
| 3:04 | town | Isla walking up the hill; every light in her town goes out |
| 3:16 | lights | the other lighthouses go dark (Owl Point last); yours is the last still lit |
| 3:27 | ship | a ship just floats up; yours is 31 m down; you call the ship on the radio: 50 minutes |
| 3:44 | ice | all the ice on Earth: 66 m; in 33 minutes the sea passes it |
| 3:51 | hill | Isla on the hill: "dad we can see your light!!"; her hill goes under at 10:42 PM |
| 4:02 | lie | "That's me. I'm fine. Up in the light." |
| 4:06 | watch | the watch room floods, the radio dies; you climb into the lamp |
| 4:16 | gallery | no rock, no island, just the light on the open sea |
| 4:22 | lamp | the sea reaches the lamp; it keeps turning under the water (a glow) |
| 4:32 | roof | on the roof, the sea at your boots; 4 % battery; the ship 31 minutes away; "dad? your light just went out" |
| 4:42 | question | "Would you tell her the truth?" |

## Sound

No narrator: the captions are silent and the sound carries the film. Three stems, all synthesised from seeded code
(`sound-*.js`), so the soundtrack is a pure function of the film:
- **the score**: string pads, felt piano, glass bells, a low drum, a synth pulse and an endless (Shepard) rise. Its
  theme is five notes rising a step at a time; each time it returns it starts a step higher, until on the roof it stops
  short. Isla has her own motif, which turns to D major on the hill;
- **the beds**, by place: the swell washing up the rock, gulls and the far bell buoy; the sea through the house's walls
  and a kitchen clock; the swell booming on the tower's stone, the lights' hum until the dark, the sea churning below;
  wind in the gallery railing; the lamp's motor; people and sirens on the hill. No constant breathing (two breaths at
  the top of the stairs, no more);
- **the effects** at their story moments: texts, the rope and the boat flooding, the radio's mayday calls and your own
  unanswered call, the bell buoy's last stroke, the fog signal's last blast choking, the door shut, bolted, straining
  and bursting, the power room's sparks, the stairs, your radio call to the ship (static, your key, a voice answering),
  the radio dying, the ladder, the lamp going under, the low battery. The ship's horn is left out: 25 km is too far to
  hear it.

**Mix.** −15.3 LUFS integrated, loudness range 10.7 LU, −2.0 dB peak (the rendered WAV, limiter at −2 dBTP). The
mastered `final-soundtrack.m4a` (AAC 256k, limiter at −3 dB) measures −15.4 LUFS, −2.8 dBTP; `small-soundtrack.m4a`
(AAC 128k) −15.5 LUFS, −2.7 dBTP.

**The score leads** (the owner's rule of 31 October 2026), measured stem by stem (solo renders, K-weighted) in
10-second windows across the whole film, with the stem gains added in:
- over the beds: 9.7 dB or more (median 12.2 dB); the closest window is 1:30–1:40 (the bell buoy, the swell on the
  rock). The first measurement had the beds only 1 to 7 dB under the score in seven windows (the dark, the coast going dark,
  the fog signal, the boat, the lichen, the bell); the score is now lifted 2–6 dB through its sparse stretches and the beds dip 2–6 dB under the boat,
  the lichen to the bell, the fog signal, the breakers and the door, and the flooded dark.
- over the effects: median 18.8 dB. Three moments are meant to cut through: the fog signal's last blast (1:50–2:00,
  2.4 dB over the score), the bell buoy's last stroke (6.7 dB under) and the door bursting (7.0 dB under). Elsewhere the
  effects sit 9 dB or more under the score, and they are silent in long stretches.
- stem gains: music +5, beds +1, effects −5 dB, master +5 dB (`mix.js`); every move is keyed to a beat, not to film
  seconds, so retiming a caption moves the mix with it.
- The baked soundtrack (`soundtrack.js`, MP3 160k) carries the code's fingerprint (`2661355d`), with every number
  rounded to 7 significant digits so the baked copy is accepted outside Chrome too, and the page asks for the
  'playback' audio session; `tools/check-page.cjs` reports SOUND READY after 2 s with no console errors, on the page and
  on a fresh unzip of the ZIP.

## Reviews

Three independent reviewers looked at every shot (one frame each, with the HUD and captions), `CAPTIONS.md`, `PLAN.md`
and `physics.js`. Scores as given:

| reviewer | score |
|---|---|
| story and retention | story 7/10, retention 6/10 |
| picture | 6/10 |
| physics | 7/10 ("the arithmetic is careful and correct all the way through") |

**Fixed after the reviews:**
- **the opening** (no motion until 0:10): the title now plays over a fast low run across the swell to the rock, and the
  first caption is "6:42 PM. High tide. It should turn now. It doesn't." over the tide board;
- **the human stakes come earlier:** Isla's first texts (the sea over her harbour wall) arrive at 0:36, before the
  361,000 km³ numbers, and her texts come back mid-film (in the car, going up);
- **the escape holes are closed:** the knot is already under water when the boat goes; you call for help on the radio
  and nobody answers ("They're all calling"); you call the ship and it turns for you, but it needs 50 minutes, and on
  the roof the HUD says it is still 31 minutes away;
- **the date and the sky:** a full-moon high tide at 6:42 PM in Maine was impossible (that day's high tides were near
  11 AM and 11 PM). The film moved to Thursday 9 September 2027, when high water falls near 6:42 PM; the Moon is now a
  gibbous Moon in the south-south-east, drawn with its real phase;
- **the ice:** "every glacier … about 70 m … 37 minutes" is now "all the ice on Earth … about 66 metres … In 33
  minutes" (IPCC AR6: 57.9 + 7.4 + 0.32 m), in one caption over the night drone;
- **the light logic:** "the last light left on the sea" is now "the last lighthouse still lit" (a ship's lights follow),
  the HUD counts "LIGHTHOUSES IN SIGHT STILL LIT", and after the lamp goes under its beams spread into a glow;
- **the lamp under water:** the tag now says "A SEALED LAMP, MOTOR AND BATTERY COULD RUN UNDER WATER · ITS BEAM SPREADS
  TO A GLOW", and the dark beat says the lamp runs on its own sealed battery at the top;
- **the door:** "built to stand up to storms" is now "built for waves that hit and fall back", and you run for the
  stairs before it gives;
- **the stairs:** "142 steps to the top" (the water was already 36 steps up) is now "It has 105 steps to go", after "It
  doesn't need to be fast. It never stops.";
- **the payoff of the title:** the hill's HUD says her hill goes under at 10:42 PM, so the truth is hers too;
- captions: "47 metres above high tide" (not "above the sea"), "Orange lichen only grows above the highest tides",
  "The rope won't let it rise, so the sea pours in", the fog signal sounded "one last time" (not because of fog), the
  boat's depth the same (31 m) in the caption and the section graphic;
- **cut sag:** the lichen and the bell buoy are one caption each;
- **pictures:** the long-lens shots (binoculars, the coast going dark, Owl Point, the ship, the bell buoy) have a
  quarter of the haze and darker exposure, so the town's lights, Owl Point's light and the buoy show; the ship has a
  dark hull with deck, bridge, masthead and side lights; the lichen shot shows the orange band going under; the sunk
  boat is seen under the water at its line; the door seep is filmed grazing the floor so the water sheet catches the
  light; the kitchen water is dark (it had reflected the sky outdoors and looked like a sandy rug); the roof is
  grey-green and its ventilator ball sits on a neck; a floating fixture in the watch room is gone; the burst's jet has
  soft edges and foam at its head; the phone is held higher, so its newest message sits above the captions (it was cut off by the frame); a new shot shows you
  calling the ship on the watch-room radio.

**Still weak, said plainly** (no second round of reviews was run after the fixes):
- the tide board in the first seconds is dark, and the binoculars and coast shots are still very orange (the sunset);
- a faint line still runs round the kitchen walls (a rail against the wall);
- the fog house meets the sea with no foam, and the keeper has light rim edges on the roof;
- the lichen shot is only adequate, and the radio shot is plain (a box on a desk);
- the five phone inserts look alike;
- 1:12–2:10 is still a run of "X goes under" moments, carried by the clock and Isla's texts more than by new threat.

## Delivery

- **Runnable ZIP** `ocean-rising-film.zip` (in the project files): extract it, open `ocean-rising.html` in Chrome or Edge
  on a computer, wait for SOUND READY, press Space.
- **Final 1080p MP4: the upload file** is `D:\renders\ocean-rising\ocean-rising_final_1080p.mp4` (and
  `ocean-rising_final_small.mp4` for a phone), rendered on the owner's PC on 2026-11-21 from commit 4a02d64 (RTX 3060
  Ti, Chrome, 2 workers, everything on D:):
  `node films/ocean-rising/render-gpu.cjs --channel chrome --workers 2 --out D:\renders\ocean-rising --small`.
  8,620 frames in 20 segments, about 25 minutes in all (one segment hung from the start; re-running the same resumable
  command rendered only that segment). 1080p: 1920×1080, 30 fps, 287.33 s, 1,237 MiB, −15.4 LUFS, −2.8 dBTP.
  Small: 1280×720, 287.30 s, 26.3 MiB, −15.5 LUFS, −2.7 dBTP.
- **Thumbnails** (house style) in the project files: `thumb-lamp.jpg` (+47 m, the lamp glowing under the sea),
  `thumb-gallery.jpg` (+45 m, the lantern alone on the open sea), `thumb-rock.jpg` (1 m a minute, the rock at 6:42).

## Files

`ocean-rising.html`; `films/ocean-rising/`: `CAPTIONS.md` → `build-timing.cjs` → `timing.js`; `layout.js`,
`physics.js`, `clock.js`, `script.js` (the checks); `kit.js`, `film.js`, `cast.js`, `world.js`, `island.js`,
`station.js`, `hill.js`, `set.js`, `shots.js`, `hud.js`; sound `audiokit.js`, `mix.js`, `audio.js`, `sound-lib.js`,
`sound-music.js`, `sound-amb.js`, `sound-sfx.js`, `soundtrack.js` (baked); `final-soundtrack.m4a`,
`small-soundtrack.m4a`, `render-gpu.cjs`.
