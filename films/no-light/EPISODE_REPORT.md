# Episode report — *What if there was no light in the universe?*

**Format.** 16:9 long-form, 1920×1080, 30 fps, 4:46 (285.8 s). Voiceless, in the Gravity tilts 90° / Friction 10 s /
Gravity keeps tilting formula, built to the owner's YouTube lessons of 28 October 2026 (an everyday place, action in
the first seconds, a real-physics nod in the first minute, tension to the last frame), the rule of 29 October 2026
(**the story clock only runs forward**), "more new scenery" and "no z-fighting" (4 November), the audio rule of
31 October (the music clearly leads, measured stem by stem) and the notes on the two films before this one (shadow-lag
was boring, earth-stop's pacing weak), so one rescue drives the whole second half. The tone is the eerie, close-to-horror
feel of Slower light, the channel's best film. The place is new: a frozen lake near Lillehammer, Norway, on a Sunday
afternoon in January, 240 people skating, a bonfire by a kiosk, a shore road, a small town, spruce hills.

**Length, said plainly.** The owner's lesson asks for about six minutes. This film is 4:46. The first cut was 5:03;
review round 1 found the middle slow and the second half broken up, so it was rebuilt around one thread (the road, the
car, the ice, the driver, the rescue) instead of padded (§ Reviews).

Page `no-light.html`, code `films/no-light/`. Every number is in `PLAN.md` § 2 (computed in `physics.js`); captions are
in `CAPTIONS.md`.

**The rule.** At 2:40:00 PM on Sunday 10 January 2027 every photon between 380 and 750 nm stops existing: the light
eyes use. Everything else stays: infrared, radio, the Sun's warmth, fire's heat. Nobody can see anything at all, so the
film is shown the only way left: a heat camera (8–14 µm; white is warm, black is cold), labelled on screen
"A HEAT CAMERA · NOBODY HAS ONE". The black shots are what you actually see.

**The one impossible part**, said on screen at 0:41 to 0:55: light is one kind of electromagnetism, and taking all of
it away would take the force that holds atoms together too ("You wouldn't be in the dark. You'd come apart."), so the
film takes away only the band eyes use.

**Generous and approximate:** the crowd's paths, falls and calls are drawn, not simulated; the plane's path after it
passes over you is a guess (it comes down in the hills 4 km away, heard, not seen); the car's slide uses one friction
number (µ 0.07); the heat camera's palette is fixed from −24 to +12 °C, so anything hotter is white.

## The clock (`script.js`, `clock.js`)

The story clock only runs forward. It jumps ahead three times, at cuts, and the clock says so in big orange type for
3.5 s ("+40 s LATER", "+5.9 min LATER", "+2 min LATER"):

| film | story | what |
|---|---|---|
| 0:00–0:03.6 | before 2:40 PM | the title over a daylight skating POV |
| 0:03.6 | 2:40:00 PM | the light goes: black |
| 0:26.6 | 2:40:23 | you hit someone sitting on the ice |
| 1:52 | 2:41:48 | the bonfire; the man stops a metre short (2:02) |
| 2:11 | +40 s | the world: 8 billion blind, plants stop, planes still flying |
| 2:26 | 2:43:02 | the plane passes 630 m over you |
| 2:47.7 | 2:43:24 | the lorry hits a stopped car; the bang reaches you 1.5 s later |
| 3:09.4 / 3:15.4 | 2:43:46 / 2:43:52 | the crack; the car goes through |
| 3:35.7 | 2:44:12 | the plane's boom from the hills, while the ice sings |
| 3:42.6 | 2:44:19 | someone is in the water |
| 3:59.5 | +5 min 52 s | you crawl flat towards his voice, she holds your ankles |
| 4:15.1 | +2 min | the ice cracks under your hands |
| 4:30–4:42 | 2:52:59–2:53:10 | your fingers find his sleeve; the ice bends |
| 4:42.4–4:45.8 | | "Would you let go?" over black, to the end |

The driver's countdown ("HIS ARMS GIVE OUT IN ABOUT m:ss") is the big number in the HUD from the crawl to the end.

## Shot list (50 shots)

| shots | film | what |
|---|---|---|
| T1 | 0–3.6 | the title: skating POV in daylight, the crowd chatting |
| K0–K2 | 3.6–16.4 | black; the sky in heat view (9.4–13.6) |
| G1–G3 | 16.4–27.9 | the skaters still gliding blind; you hit someone; black |
| H1–H2, R1–R2 | 27.9–55.1 | down on the ice; the heat camera; the rule; the spectrum inset |
| B1 | 55.1–67.2 | your hand on the ice; its print glowing |
| C1–C2 | 67.2–80.4 | 240 people lost on the ice; −12 °C; far-off horns |
| D1–D2, P1–P2 | 80.4–101.8 | someone grabs your arm (black); her; her phone; the shore road |
| U1, U3 | 101.8–112.4 | your faces in the Sun's warmth (the sunlight inset); the Sun on the hills |
| F1–F3 | 112.4–131.0 | the bonfire at 800 °C; the man walks towards it, stops a metre short |
| W1–W3 | 131.0–145.8 | +40 s: the town, the forest, the sky |
| A1–A2 | 145.8–156.0 | the airliner overhead, 630 m up |
| O1–O3 | 156.0–173.5 | the shore road; the lorry creeping; the hit; the bang 1.5 s late |
| S1–S2 | 173.5–183.8 | the car shoved out onto the lake, its engine running |
| I1–I2 | 183.8–199.4 | the ice thickness inset; the crack; it goes through |
| M1–M2 | 199.4–211.7 | the hole glowing, the car's boot in it |
| Q1–Q2 | 211.7–222.6 | the ice sings (black); you two listening; the plane's boom |
| V1–V3 | 222.6–239.5 | someone in the water (black); the driver at the edge; the cold-water rule |
| X1–X3 | 239.5–255.1 | +5.9 min: the crawl, she holds your ankles; 40 m |
| Y1–Y3 | 255.1–270.1 | +2 min: the crack under your hands (black); the crack web; 3 m from the edge |
| Z1 | 270.1–281.8 | side-on, close: your fingers on his sleeve; the ice bends |
| Z2 | 281.8–285.8 | black: "Would you let go?" |

## How it follows the owner's lessons

- **Action in the first 5 s:** the title is already the lake, skating; at 0:03.6 the light goes and the screen is black.
- **Real physics in minute one:** the heat camera's picture and why everything still glows (0:30), the honest rule about
  electromagnetism (0:41), the visible band 380–750 nm with a spectrum inset (0:50), Wien's law on your own skin
  (9.5 µm, 0:56).
- **Everyday, human-scale, new scenery:** a frozen lake with skaters, a kiosk bonfire, a shore road, a town. None of the
  earlier films' sets.
- **The story clock only runs forward:** no replays; three forward jumps at cuts, each shown in the clock.
- **Tension to the last frame, no recap:** a goal for "you" from 2:36 ("You head for their engines"), the driver's
  countdown from the moment he is found (3:47) to the end, the crack under your hands, the ice bending, and the
  question over black.
- **The music clearly leads** (§ Sound).
- **No z-fighting**, and the picture-pitfalls list (no particle alpha over 1, no kilometre-long triangles).

## Reviews

Two rounds by independent reviewers who saw stills at 1 frame a second (they cannot hear) and read a brief of the story
and the sound. Scores as given.

**Round 1** (the first cut, 5:03).
- Story and retention: hook 6.5, clarity 7, pacing 5, tension 6, science payoff 8, ending 6, overall retention 6
  (predicted average view 36–39 %). Top problems: one idea ("it glows but makes no light") repeated about nine times;
  "you" had no goal from 1:20 to 4:02; the world/plane cutaway broke the car → driver thread at its peak.
- Picture: image 5, composition 5, phone readability 4, heat look 6, HUD and captions 6, overall 5. Weakest: the climax
  (the driver a grey dome, no contact), the plane a speck, the lorry hit at 500 m, the driver shots, the cone trees.
- **Fixed:** restructured so one thread runs unbroken through the second half (the road, the car, the ice, the driver,
  the rescue); the world/plane cutaway moved into the middle; the town beat cut; a goal for you ("You head for their
  engines"); the driver's countdown; the ending question "Would you let go?"; deeper blacks (tone curve); the lorry
  closer, the plane big from below; the hole glowing with frost smoke; a push-in on the driver; the climax side-on and
  close with your hand on his sleeve, cracks bending and water seeping up under you; the bonfire as flame tongues;
  narrower spruce; people sitting three different ways; a black shot after the crash.

**Round 2** (4:43).
- Story and retention: hook 7, clarity 7, pacing 5, tension 6, science payoff 8, ending 7, overall retention 6
  (predicted average view 34–37 %). Top problems: 1:07–2:35 is a tour of facts with no goal and the plane is never paid
  off; "Its driver is still inside" hangs for 44 s; the "+5.9 min" jump and the falling countdown were too small to see.
- Picture: image quality 6, composition 5, phone readability 5, heat look 7, HUD and captions 6, overall 5.5. Weakest:
  the climax (two featureless spheres at phone size), the edge shot (3 m looked like 30), the hole shot (the car's tail
  read as a crate), the Sun shot (her back filling the frame, the clock and inset over her), the lorry. Strongest: the
  plane from below, the car side-on with "ENGINE +75 °C", the crack web under your hands.
- **Fixed:**
  - the goal planted early: "Far off, car horns." at 1:14, with two horns in the sound, so "You head for their engines"
    pays off;
  - the plane paid off: flying on blind, it comes down in the hills; its boom reaches you while the ice sings (3:35.7),
    with a HUD line saying what it was;
  - the jumps in big orange type in the clock; "HIS ARMS GIVE OUT IN ABOUT m:ss" as the big HUD number from the crawl on;
  - "She's still holding your ankles." in the last caption; YOU / HIM labels at the climax, HIM at the crawl and the
    edge, THE LORRY, AN ENGINE on the plane;
  - "Would you let go?" held 3.4 s over black (it was 2.3 s); the second black card at the start trimmed by 2 s;
  - the edge shot tighter (field of view 52° → 36°), the lorry tighter, the man by the fire side-on;
  - the Sun shot reframed: your face and hers, lit, on the left, the inset on the right (the Sun itself is the next shot);
  - the car on the ice: a smaller hot bonnet (it was all white), framed left of the inset; the hole shots turned ¾ so
    the car reads as a car going down nose first;
  - the car hidden once it has sunk (white strips floated above the hole); the two-headed figure by the fire separated.

## What is still weak

- **The middle is still the slowest part.** From 1:07 to 2:35 the film is a run of facts (the count, the grab, the
  phone, the Sun, the fire, the world, the plane) while you sit still. The horns and the plane's boom now tie it to the
  second half, but the reviewers' predicted average view (34–37 %) is below Slower light's 42 %.
- **3:31–3:42** (you two standing and listening while the ice sings) is still about 11 s; the reviewer asked for 4.
- **People are simple low-poly figures**: at phone size, wide shots shrink them to glowing dots, and at the climax they
  read through the labels more than through their shapes.
- **The frost smoke** over the hole reads as soft round blobs, not rising wisps.
- **Small glitches seen in round 2 and not fixed:** two skaters overlapping at 0:19, a body through another at 1:25,
  the heat scale bar over people at 0:39–0:45, captions over light areas at 0:21, 2:05 and 3:29.
- No third review of this final cut.

## Sound

No narrator: the captions are silent and the sound carries the film. Three stems, everything synthesised from seeded
code (`sound-*.js`), so the soundtrack is a pure function of the film:
- **the score**, in E minor with Lydian turns: cold pads, a felt-piano motif, low pulses, Shepard rises and a heartbeat
  at the reach. The daylight title cue, with a chatting crowd, drains through a closing filter and stops dead as the
  light goes. It thins to a pulse by the fire and on the road and cuts to silence just before the lorry's hit, so the
  bang lands 1.5 s after the picture;
- **the beds**, by place: the wind over the snow, the town's murmur, the bonfire's roar, the road's idling engines, and
  the crowd: chatter in daylight that stops dead, screams, then people calling "hallo?" across the ice, thinning over
  the minutes; far-off horns; the ice singing;
- **the effects**, on their story moments and heard from where you are (sound takes 1.5 s across the ice): blades, the
  falls, your breathing in every black shot, her grab, the phone's five clicks and SOS, the man's steps squeaking in
  −12 °C snow, the plane 630 m over you with its pitch falling (Doppler), the lorry, the hit, the railing, the car's
  slide, crack, sink and drowning engine, the plane's far boom, the driver's splash, gasps and "hjelp!" calls, your
  crawl, the crack under your hands, his wet sleeve, and the ice groaning deeper under you to the last frame.

**Mix.** −14.7 LUFS integrated, −2.3 dBTP, loudness range 7.2 LU (the baked WAV). The mastered `final-soundtrack.m4a`
(AAC 256k, through a limiter at −3 dB) measures −14.8 LUFS and −2.3 dBTP; `small-soundtrack.m4a` (AAC 128k, for the
phone-size copy) measures −14.8 LUFS and −2.6 dBTP.

**The score leads** (the owner's rule of 31 October 2026), measured stem by stem (solo renders, ebur128) in 10-second
windows across the whole film, with the stem gains added in:
- over the beds: 7.8 to 19.6 dB (median 11.6 dB). The closest are 0:30–1:00 (the wind under a quiet stretch of the
  score, 7.8 to 8.1 dB), 1:50–2:00 (the fire's roar, 8.2 dB) and 2:30–2:40 (the plane and the road, 7.9 dB).
- over the effects: median 16 dB. The closest is 2:30–2:40 (5.0 dB): the airliner passing 630 m over you, as intended.
  The effects are silent in some heat-camera stretches (0:30–1:10), where the score and the beds carry it.
- stem gains: music +2.5, beds +0.5, effects −0.5 dB, master +7.5 dB, a limiter at −2.5 dB (`mix.js`). The score is
  lifted 2–3 dB by the fire, under the plane, on the road and by the glowing hole, and lowered 4 dB as the car sinks;
  these moves are keyed to the beats, not to film seconds.
- The baked soundtrack (`soundtrack.js`, MP3 160k) carries the code's fingerprint; `tools/check-page.cjs` reports
  SOUND READY at once with no console errors, so the baked copy is accepted (also from the ZIP).

## Delivery

- **Runnable ZIP** `no-light-film.zip` (in the project files, 8 MB): extract it, open `no-light.html` in Chrome or Edge
  on a computer, wait for SOUND READY, press Space. Tested from a fresh unzip with `tools/check-page.cjs`: SOUND READY
  at once, no console errors.
- **Final 1080p MP4**, to be rendered on the owner's PC (graphics card):
  `node films/no-light/render-gpu.cjs --channel chrome --workers 2 --out D:\renders\no-light --small`.
  - `D:\renders\no-light\no-light_final_1080p.mp4`: 1920×1080, 30 fps, H.264 CRF 18, 285.8 s, with the mastered
    soundtrack copied in. **This is the file to upload.**
  - `no-light_final_small.mp4`: 1280×720, under 30 MiB (a preview copy).
  - The command is resumable: run it again and finished segments are kept.
- **Thumbnails** (house style) in the project files: `thumb-fire.jpg` (800 °C, the man by the bonfire), `thumb-plane.jpg`
  (630 metres up, the airliner from below), `thumb-ice.jpg` (9 minutes, the crack web under your hands).

## Files

`no-light.html` and `films/no-light/`: `CAPTIONS.md` (the story), `build-timing.cjs` → `timing.js`, `layout.js` (where
everything is), `clock.js`, `physics.js` (every number), `script.js` (the clock and the caption checks), `shots.js`,
`film.js`, `kit.js`, `cast.js` (people and poses), `heat.js` (the heat camera), `world.js` (terrain, trees, the kiosk,
the road, the town), `fx.js` (fire, smoke, breath, exhaust, frost smoke), `lake.js` (cameras, labels, grade), `hud.js`,
`audiokit.js`, `audio.js`, `mix.js`, `sound-lib.js`, `sound-music.js`, `sound-amb.js`, `sound-sfx.js`, `soundtrack.js`
(baked), `final-soundtrack.m4a`, `small-soundtrack.m4a`, `render-gpu.cjs`, `PLAN.md`, this report.
