# Episode report — *What if everything kept shrinking and couldn't stop?*

**Format.** 16:9 long-form, 1920×1080, 30 fps, 4:47 (286.9 s). Voiceless, in the house formula (Friction 10 s, Gravity
keeps tilting, No light, Sound faster than light), built to the owner's YouTube lessons of 28 October 2026 (an
everyday place, action in the first seconds, a real-physics nod in the first minute, tension to the last frame), the
rule of 29 October 2026 (**the story clock only runs forward**), "more new scenery" and "no z-fighting" (4 November),
the audio rule of 31 October (the music clearly leads, measured stem by stem) and the title data of 20 November ("kept
… and couldn't stop" titles bring most of the channel's views). The tone is the eerie, quiet feel of Slower light.
The place is new: a lake campsite in the Canadian Rockies at dawn, a tent, your six-year-old son Leo, the neighbours'
camper van, spruce forest, a turquoise lake and a ring of peaks.

**Length, said plainly.** The owner's lesson asks for about six minutes. This film is 4:47, like the last four films.
The story runs 13 minutes of story time (6:49 to 7:02 AM) and ends while the Earth is still shrinking in your hands.

Page `everything-shrinking.html`, code `films/everything-shrinking/`. Every number is in `PLAN.md` § 2 (computed in
`physics.js`); `script.js` refuses to run if a caption's number drifts from it. Captions are in `CAPTIONS.md`.

**The rule.** At 6:49:00 AM on Saturday 28 August 2027 everything except you starts shrinking towards your tent, atoms
and all (so shapes, materials and density stay the same), halving in size every 30 seconds: s = 2^(−τ/30). You don't
shrink. The real-physics nod in minute one is Henri Poincaré's question (1908): if everything changed size overnight,
would anyone notice? (No: every ruler and every eye would change with it. Unless one thing didn't.)

**The one impossible part**, said on screen ("THE FILM'S ONE CHEAT: THE AIR STAYS, AND YOU CAN STILL BREATHE"): a
world with a thousandth of its gravity could not keep its air, and you could not breathe air shrunk below your eyes.

**What follows from the rule** (all from `physics.js`): gravity at the surface of a smaller ball of the same density
scales with its size (you weigh 9 kg at 1:12, 14 g at 3:16, and a jump would leave the Earth for good); everything that
rings goes an octave up per halving (Leo's voice is two octaves up at 1:02, a bird at 1:52, a whistle at 1:57, gone
past 17 kHz at 2:00; your voice reaches them below 20 Hz, felt as a quake); your eyes are higher over the world every
second, so you see the Sun rise first (its top edge clears the skyline for your eye at 6:53:27, from a horizon map plus
the Earth's curve and refraction) while the valley stays in the mountains' shadow; the peaks (1,500 m) reach your waist;
the airliner at 11 km passes your kneeling face, 5 mm long; the Earth is 800 m across at 3:35, a house, a car, smaller
than you, then 30 cm across with your own mass (75 kg); the Moon shrinks and comes closer by the same factor, so it
looks exactly the same size.

## The clock (`clock.js`)

The story clock only runs forward. It runs at real speed inside a shot and jumps only at cuts, and the clock box says
"+N s LATER" for those. Each jump is set by an anchor that puts a caption's number exactly where the physics says it
is (at the caption, or about a second into it for the numbers that change fastest: 800 m, 14 g, 30 cm / 75 kg).
'Soft' anchors (the voice, the bird, the escape speed, the peaks) never pull the clock back: if the clock is already
later, it runs on. In 4:47 the story runs from 6:49:00 to 7:02 AM.

## Beats (25 including the title and the question; 51 captions, 51 shots)

| film | beat | what |
|---|---|---|
| 0:00 | title | the title over a slow gold swirl; a music box plays Leo's lullaby |
| 0:04 | start | in the tent at 6:49 AM: it starts; every 30 s it halves; the tent closes in on you, Leo asleep beside you |
| 0:21 | out | your hands push up through the roof; the campsite shrinks in towards you |
| 0:32 | rule | Poincaré's question (an inset: a house and its ruler shrink together); "Unless one thing didn't." |
| 0:48 | leo | Leo climbs out; to him you're growing |
| 0:56 | voice | his voice two octaves up (a pitch ladder inset) |
| 1:07 | weight | 9 kg; you pick him up |
| 1:25 | neighbours | the people at the next campsite scream; you're 30 m tall to them; you stand still |
| 1:39 | rumble | your call reaches them below 20 Hz: they feel it as an earthquake |
| 1:52 | hush | Leo's voice: a bird, a whistle, nothing |
| 2:07 | quiet | the valley is silent; all you hear is you (your heartbeat, the blood in your ears) |
| 2:21 | sunrise | the Sun comes up for you first; the valley is still dark |
| 2:29 | shadow | the gold peaks; seen from them, you stand between them and the Sun |
| 2:41 | peaks | the lake a puddle; the peaks at your waist |
| 2:52 | air | your hand 3 km up to Leo, −15 °C; you kneel and put him down; he walks off; gone |
| 3:16 | escape | 14 g; you hold on to two mountains |
| 3:27 | plane | an airliner crawls past your face, 5 mm long |
| 3:35 | curve | the Earth 800 m across; you see it curve |
| 3:42 | sky | its air is all below your eyes; black sky and stars at 6:57 AM |
| 3:55 | lift | it can barely hold you; you hold on to it |
| 4:02 | moon | the Moon, shrinking and coming closer, the same size |
| 4:09 | house | the Earth the size of a house, a car, smaller than you (you hold on to it, for scale) |
| 4:21 | ball | 30 cm across, 75 kg, in your hands |
| 4:28 | end | Leo is on it (a shot from his size: to them nothing is shrinking); a grain of sand in 4 minutes, too small for light in 10 |
| 4:42 | question | "Would you watch it until it's gone?" (the Earth keeps shrinking in your hands to the last frame) |

## Sound

No narrator: the captions are silent and the sound carries the film. Three stems, all synthesised from seeded code
(`sound-*.js`), so the soundtrack is a pure function of the film:
- **the score**: Leo's lullaby (five falling notes that end a semitone off home) on a music box that belongs to the
  world, so it plays an octave higher every 30 s until it is out of hearing (gone by 2:05); your own score (strings,
  piano, drums, an endless rise from the airliner on) never changes pitch;
- **the beds**: the river, the wind in the spruce and the dawn chorus, all at the world's pitch, climbing and thinning
  out of hearing; then only you: your heartbeat from the quiet on, the blood in your ears (no breathing: v2);
- **the effects**, at the world's pitch (×1/s, faded past 17 kHz) or your own: Leo asleep, the tent creaking and
  tearing, Leo's calls (a voice, then a bird, a whistle, nothing), the neighbours' screams, your own deep call, the
  quake as a far crackle, your knuckles on the meadow, your grip, your palms on the Earth.

**v2 (2026-11-20): no breathing.** After watching the 1080p film the owner found the breathing that ran under almost
the whole film annoying. Your breathing track is gone, and so are your four one-off breaths (at the rip, as your boots
lift, as you hold on, at the lift). The only breathing left is Leo asleep in the tent in the first seconds.

**Mix (v2).** −15.8 LUFS integrated, loudness range 8.4 LU, −1.9 dB peak (the rendered WAV, limiter at −2 dBTP). The
mastered `final-soundtrack.m4a` (AAC 256k, limiter at −3 dB) measures −15.9 LUFS, −2.4 dBTP; `small-soundtrack.m4a`
(AAC 128k) −16.0 LUFS, −3.1 dBTP.

**The score leads** (the owner's rule of 31 October 2026), measured stem by stem (solo renders, ebur128) in 10-second
windows across the whole film, with the stem gains added in:
- over the beds (v2, without the breathing): 9.3 dB or more (median 15.9 dB); the closest window is 0:30–0:40 (the
  valley as you rise through the roof). v1 had the beds at 7.5 dB (median 12.5), the closest two being your breath.
- over the effects: median 13.4 dB, closest 8.0 dB (Leo's calls at 1:10 and 1:50). The effects are silent in long
  stretches of the second half, where the score and your heartbeat carry it.
- stem gains: music +5, beds −14, effects −8 dB, master +4 dB (`mix.js`). The score is lifted 3–5 dB through its
  sparse stretches (the rule, the weight, the hush and quiet, the air, the escape, the sky, the ball, the end), and the
  beds are lowered 5 dB under Poincaré and 3 dB as you kneel; these moves are keyed to the beats, not to film seconds.
- The first measurement had the beds only ~2 dB under the score and Leo's bird and whistle calls silent (a frequency
  check cut them as if they still had a child's formants); both were fixed before the bake.
- The baked soundtrack (`soundtrack.js`, MP3 160k) carries the code's fingerprint (`ccbcaa0a`, v2); `tools/check-page.cjs`
  reports SOUND READY after 3 s with no console errors, so the baked copy is accepted.

## Reviews

Two independent reviewers looked at all 51 shots (one frame each, with the HUD and captions), `CAPTIONS.md`,
`PLAN.md` and `physics.js`. Scores as given:

| reviewer | score |
|---|---|
| story and retention | retention 6.5/10, clarity 7/10 |
| picture | 6/10 |
| physics | 7/10 (every HUD number agreed with the story clock) |

**Fixed after the reviews:**
- caption numbers that only matched the HUD on a shot's first frame (800 m, 14 g, 30 cm / 75 kg) now land about a
  second into the caption, and the mass line says "Its mass is now 75 kg: the same as yours" (not "weighs");
- Poincaré imagined everything growing, not shrinking: the caption now says "changed size";
- the shadow beat: the picture (from the gold peaks, you stand up between them and the Sun) now says what it shows:
  "Now you're blocking their sunrise";
- "A red speck climbs off into the grass" over a full-size Leo is now "Down there, he walks off into the grass";
- "To them, nothing has changed" (the neighbours screamed) is now "To them, nothing is shrinking at all", a callback;
- "It can't hold you any more" (the escape speed is still 9 cm/s) is now "It can barely hold you now", and the HUD's
  "a breath out could push you off it" (1000× too weak) is now "a flick of your toes";
- "You bend down, and your boots lift off the grass" is now "…and standing back up lifts you off the grass";
- the Sun's disc was drawn at its geometric height, under the skyline, while the physics used the refracted one: it
  now shows on the skyline at sunrise;
- a second ring round the Earth in the last shots (the sky's own horizon line) is gone;
- the label rings for the airliner and the Moon sit on them; the "1.6 km UP" label that disagreed with the 3 km
  caption is gone; the Moon is shown at a wider lens so it doesn't look bigger than the Moon looks;
- the last shot holds the same camera as the one before, so the Earth visibly shrinks in your hands under the question;
- the air footnote says "half as thick every 5.8 km" (the model's own number).

Fixed before the reviews (first picture pass): the shadow shot rebuilt from the peaks; the quake rebuilt low behind the
two neighbours with the giant over them; the airliner (it was drawn in the wrong place); the grip on two mountains (the
arms now come from outside the frame and the hands land on the two ridges); your boots over the neighbours' van; the
Earth as big as a house, a car and smaller than you (you hold on to its side, for scale); the whole-Earth shots without
the land patch's mismatched colours; a grading line that had switched off the bloom, vignette and grain.

**Still weak, said plainly:**
- **the first 17 seconds in the tent** (red sleeping bags, Leo's head reads like a grey lump): the text carries the
  hook until your hands come through the roof at 0:21. Both reviewers named this the weakest stretch.
- the giant seen from below, centred, recurs about ten times, and Leo on your palm six times;
- 2:07–2:40 (quiet, sunrise, shadow) is slow, quiet scenery after the strongest beat;
- the lake is a rounded rectangle; a faint seam can show on the cloud plain in two late shots; the arms in the grip shot
  are plain dark sleeves;
- the HUD's pitch ladder labels crowd each other in the hush beat.

## Delivery

- **Runnable ZIP** `everything-shrinking-film.zip` (in the project files): extract it, open `everything-shrinking.html`
  in Chrome or Edge on a computer, wait for SOUND READY, press Space.
- **Final 1080p MP4, v2 (no breathing): the upload file** is
  `D:\renders\everything-shrinking-v2\everything-shrinking_final_1080p.mp4` (and `everything-shrinking_final_small.mp4`
  for a phone). The picture is unchanged, so v2 reused all 20 of v1's video segments (0 frames rendered) and added the
  new soundtrack, from commit 27b9bc2 on 2026-11-20:
  `node films/everything-shrinking/render-gpu.cjs --channel chrome --workers 2 --out D:\renders\everything-shrinking-v2 --small`.
  1080p: 1920×1080, 286.93 s, 1,078 MiB, −15.9 LUFS, −2.4 dBTP. Small: 1280×720, 26.3 MiB, −16.0 LUFS, −3.1 dBTP.
- v1 (with the breathing; don't upload): rendered 2026-11-20 on the owner's PC from commit 283c1bb, 8,608 frames in
  8 min at about 17 fps, `D:\renders\everything-shrinking\`: 1920×1080, 286.93 s, 1,078 MiB, −15.8 LUFS, −2.3 dBTP;
  small copy 26.3 MiB.
- **Thumbnails** (house style) in the project files: `thumb-earth.jpg` (30 cm, the Earth in your hands),
  `thumb-giant.jpg` (30 m tall, over the neighbours), `thumb-house.jpg` (11 m across, the size of a house).

## Files

`everything-shrinking.html`; `films/everything-shrinking/`: `CAPTIONS.md` → `build-timing.cjs` → `timing.js`;
`physics.js`, `clock.js`, `script.js` (the checks); `layout.js`, `kit.js`, `worldfx.js`, `ground.js`, `sky.js`,
`camp.js`, `cast.js`, `world.js`, `shots.js`, `modes.js`, `hud.js`, `film.js`; sound `audiokit.js`, `audio.js`,
`mix.js`, `sound-lib.js`, `sound-music.js`, `sound-amb.js`, `sound-sfx.js`, `soundtrack.js` (baked);
`final-soundtrack.m4a`, `small-soundtrack.m4a`, `render-gpu.cjs`.
