# Episode report — *What if Earth stopped spinning for 1 second?*

**Format.** 16:9 long-form, 1920×1080, 30 fps, 4:09 (248.6 s). Voiceless, in the Gravity tilts 90° / Friction 10 s /
Magnets 1,000× formula, built to the owner's YouTube lessons of 28 October 2026 (an everyday place, action in the first
seconds, a real-physics nod in the first minute, tension to the last frame), the rule of 29 October 2026 (**the story
clock only runs forward**), "more new scenery" (4 November) and the note on the film before this one (15 November: it
was boring), so this one is meant to be big, loud and spectacular. The place is new: a small railway station on the
equator beside a harbour, its town, the line east to a hill with a tunnel, a depot with six fuel wagons.

**Length, said plainly.** The owner's lesson asks for five to six minutes. This film is 4:09. It was 4:55, then 4:23;
each review marked the slow stretches as the places where a viewer would leave, so they were cut instead of padded
(§ Reviews).

Page `earth-stop.html`, code `films/earth-stop/`. Every number is in `PLAN.md` § 2 (computed in `physics.js`);
captions are in `CAPTIONS.md`.

**The rule.** On Sunday at 5:42:00.000 PM the solid ground stops turning for exactly one second. Everything that is not
ground (buildings, trains, people, the air, the sea) keeps the 465 m/s (1,674 km/h) it always had, to the east. At
5:42:01.000 the ground turns again.

**The one impossible part**, said on screen at 0:08 to 0:15: stopping the spin takes the Sun's whole output for
9 minutes; where it goes is not said.

**Generous and approximate, said on screen:** your train stays on its rails and the rails stay put; the harbour is 10 m
deep; the sea's wall is drawn climbing at ¾ of its speed (349 m high at 5:42:01); the fire's size and shape are drawn,
not simulated; the shock wave that would stand ahead of the hill is not drawn. **Generous and not said on screen:**
buildings and cars slide whole until they reach the rock (real ones would be coming apart on the way).

## The clock (`ES_CLOCK`, `script.js`)

After the title the whole film is one second of story and the 0.32 s after it, and the clock never goes back. Most
shots open in a burst (things visibly travel) and settle while their caption is read.

| film | 5:42 PM clock | how much slower than life |
|---|---|---|
| 0:00–0:01.5 | 5:41:58.5–5:42:00.000 | real speed, under the title |
| 0:01.5–0:07.8 | :00.000–.040 | the stop: 25×, then 90×, settling |
| 0:07.8–0:15.1 | .040–.095 | the hill: a house reaches the rock at 0:09.3 (about 90×), then the palms (70–350×) |
| 0:15.1–0:26.8 | .095–.141 | the station glides; the Sun (150–800×) |
| 0:26.8–0:42.0 | .141–.176 | the bolts (840×); the building off its floor (350×) |
| 0:42.0–1:14.0 | .176–.277 | the town, the cars, the people (210–720×) |
| 1:14.0–1:44.3 | .277–.356 | your train and its energy (150–760×) |
| 1:44.3–1:54.3 | .356–.405 | the hill: a second house at 1:45.4, the depot's shed at 1:50.95 |
| 1:54.3–2:07.8 | .405–.505 | the wagons: the first reaches the rock at 2:02.85 (31× just after), the second at 2:05.6 |
| 2:07.8–2:25.2 | .505–.582 | the wind: the third wagon at 2:09.0, the fourth at 2:15.7, the fifth at 2:23.7 |
| 2:25.2–2:46.2 | .582–.675 | the sea (540–790×); the ferry reaches the quay at 2:42.2 (42×) |
| 2:46.2–2:56.6 | .675–.800 | the wall of water against the Eiffel Tower's outline, then the coast (about 85×) |
| 2:56.6–3:07.5 | .800–.845 | the roof and the woman, falling (190–300×) |
| 3:07.5–3:13.9 | .845–.851 | the airliner (about 1,070×) |
| 3:13.9–3:30.4 | .852–1.000 | the last 0.15 s: 110–170×, then a rush at 29× that stops dead |
| 3:30.4–3:45.9 | 5:42:01.000–.030 | the ground turns again (about 520×), in silence |
| 3:45.9–4:01.8 | :01.030–.260 | the fire the hill stopped comes west (139×, then 40×, then 72×) |
| 4:01.8–4:04.95 | :01.260–.322 | your seat: from 120× down to 32×; an orange glare, white in the last four frames; it arrives; black to 4:08.6 |

`script.js` throws if the clock runs backwards or jumps anywhere but on a cut, if a blow doesn't sit on its caption,
or if a caption number drifts from `physics.js`.

The film is told by:
- 44 short second-person captions;
- the HUD: THE GROUND: STOPPED / TURNING, the time until it turns again, and the clock to the millisecond;
- one context box per beat (how far everything loose has gone, the palms in the rock, the people's distance to the
  platform's end, your train's speed and energy, its distance to the hill, the water's weight and height…);
- one strip of honest labels, top centre (the rule, the impossible part, what is generous, what is approximate);
- labels pinned in the scene (THE HILL; THE PLATFORM'S END; the Eiffel Tower's outline against the wall of water);
- big digits for the last 0.15 s and for the metres between the fire and your train;
- the sound.

## Shot list (43 shots)

| time | shots | clock |
|---|---|---|
| 0:00–0:07.8 | the title over platform 1; at 0:01.5 the ground stops and the train comes past you; the camera turns across the sliding town to look east down the line | 5:41:58 PM |
| 0:07.8–0:15.1 | the hill from the road: a house runs into the rock; along the rock face, palm after palm shatters ("Nothing else did.") | :00.040 |
| 0:15.1–0:26.8 | travelling with the station from above (only the ground is going by); a long lens at the Sun: the sea's wall crosses it | .095 |
| 0:26.8–0:42.0 | a base plate, its four bolts sheared, the column leaving; the station building sliding off its own floor | .141 |
| 0:42.0–0:54.2 | a street, the buildings coming down it; the car park's cars coming at you | .176 |
| 0:54.2–1:14.0 | the people on the platform; its end; past it, toppling, in the air | .212 |
| 1:14.0–1:32.5 | the wheels skidding; your seat, your coffee, the window; the train passing | .277 |
| 1:32.5–1:44.3 | your train from the air; down the line, over the signals, to the hill | .332 |
| 1:44.3–1:54.3 | the hill: a second house; the depot's shed runs into the rock | .356 |
| 1:54.3–2:01.6 | travelling with the six wagons; from the rock, they are coming | .405 |
| 2:01.6–2:07.8 | the first wagon (a third of a second of nothing, white-out, fireball, debris); the second from down the line | .442 |
| 2:07.8–2:25.2 | the third from the foot of the rock; the fourth from the north; from the air, the fire driven over the top | .505 |
| 2:25.2–2:46.2 | from the platform, tilting up the wall of water; flying along its foot; the ferry breaks on the quay | .582 |
| 2:46.2–2:56.6 | the wall against the Eiffel Tower's outline, pulling back along the whole coast | .675 |
| 2:56.6–3:07.5 | the station's roof, still in the air; the woman from the footbridge | .800 |
| 3:07.5–3:13.9 | an airliner at 10 km | .845 |
| 3:13.9–3:32.5 | your train from behind, the hill ahead; from the tunnel's mouth with a long lens; the driver's view: the rush, 0.00, a dead stop | .852 |
| 3:32.5–3:45.9 | silence: your train at rest, the town under the wall of water; the wheels gripping; 150 m short of the hill | :01.004 |
| 3:45.9–4:01.8 | the fire leaving the hill; from the air, it sweeps west along the line toward your train; from beside the train, the metres counting down | :01.030 |
| 4:01.8–4:08.6 | your seat, your window, the fire filling it, its glare flooding the carriage; white at 4:04.95; a hard cut to black, and only then the question | :01.260 |

## How it follows the owner's lessons

- Everyday place, bizarre physics: a train about to leave a small station on a Sunday afternoon.
- Action in the first 5 s: the ground stops at 0:01.5 under the title and the train comes past you; a house hits the
  rock at 0:09.3.
- A real-physics nod in minute one: the station always moves east at 1,670 km/h and you never feel it (0:16); steel
  would have to be 50 times stronger than steel is (0:32).
- No filler; the clock never replays a moment. **Not followed:** the length (4:09 instead of five to six minutes).
- Escalation to the last frame, no recap: the station, the town, the people, your train, the hill, the fuel, the wind,
  the sea, then 5:42:01 and the twist; the fire reaches your seat, and the film ends on a question.
- Music leads, beds and effects under it, measured stem by stem (§ Sound).
- New scenery only. The two z-fighting and flicker glitches of the second cut are fixed (§ Reviews).

## Reviews

Three cuts, each shown to independent reviewers who had not seen the film (contact sheets of a full low-resolution
render, stills, the captions and the mix measurements; they cannot hear the sound). Scores are as given.

**Round 1, the first cut (4:55).** Retention: hook 5, clarity 6, spectacle 4, pacing 4, ending 5, **overall 4.5/10**.
"The captions claim 1,670 km/h; the picture is mostly stills." The explosion was small and flat, the HUD cluttered, the
ending soft. The film was recut to 4:23: one clock that bursts and settles, moving cameras, palms into the rock at
0:09, a bigger blast, a slimmer HUD, true silence at 5:42:01.

**Round 2, the second cut (4:23).**
- Retention: hook 5.5, clarity 6.5, spectacle 5.5, pacing 4.5, ending 5.5, **overall 5.5/10**. A frozen title for
  2.9 s; palms reaching the rock upright and whole; 64 s of the film in stretches where almost nothing moved; one real
  fireball, with tanks that stayed pristine; the wall of water "a picture, not an event"; a 30 s lull before 5:42:01;
  5:42:01 itself invisible; the fire never arrived (white for one frame).
- Physics and script: numerical accuracy 9, logic within the premise 7, honesty about simplifications 5.5, caption
  wording 7.5, **overall 7.5/10**. Every caption number reproduced except "it ends in 20 metres" (the box read 10.9 m).
  The honest labels were cut off or hidden under captions; "4,800 tonnes" needed "a second"; "it reaches your train"
  read as all of it, though the sea goes west, away from you; a shock wave would run ahead of the hill.
- Picture: image 6, text and HUD 6, effects 5.5, glitches 4.5, **overall 5.5/10, "not publishable yet"**: a foam strip
  at the quay that flickered, the station clock's face z-fighting through the carriage window, a flat red slab of fire
  on the rock, a washed-out aerial of the town, a static shot of pigeons.

**What changed for this cut (4:09).**
- The ground stops at 0:01.5 (was 0:02.9); a house runs into the hill at 0:09.3; the palms shatter.
- Cut: seven captions and, net, eight shots (among them the pigeons, the town from the air, the column feet, the
  second airliner shot, "every west-facing shore" and the calm second half of the twist).
- A second house at 1:45; every wagon bursts and glows; the fire's light on the rock is lower, the cliff's top ragged.
- The sea: first from the platform, tilting up the wall; then flying along its foot; the ferry's upper decks pitch
  over the quay as its hull is crushed.
- The run into 5:42:01 is slow and then a rush that stops dead in the driver's view; the score, the beds and the
  effects are all cut there (1.5 s of true silence).
- The ending: the fire arrives at your seat at 4:04.95 (as round 3 saw it: white for a third of a second, then black
  with the question and two low piano notes; reworked after that round, see below).
- Physics: "12 metres ahead"; "4,800 tonnes of water a second"; the twist now says only the fire and the air come
  west at you; new honest labels (the train on its rails, the harbour's depth, the water drawn at ¾ speed, the shock
  wave not drawn); the people's box reads 1,670 like the captions (your train's box shows its own speed, 1,672 km/h and
  falling).
- Glitches: the foam strip was one 9 km triangle that the renderer dropped on some frames (now tessellated); the
  clock's face was coplanar with its case (now 3 cm proud). Both were re-checked frame by frame in a full
  low-resolution render of this cut: steady.
- HUD: the "N× SLOWER" line and the bottom tickers are gone; one label strip, top centre.
- Not adopted: the physics reviewer's 20 to 34° forward lean for the people. A rigid-rod check gives about 11° at the
  moment they are shown (3.0·t² radians), so the film's 8 to 12° stays.

**Round 3, the third cut (4:09).** One independent reviewer for retention and picture, on contact sheets of a full
low-resolution render (3,730 frames at 15 a second). It saw the cut before the changes listed under it.
- Retention: hook 6, clarity 6.5, spectacle 6.5, pacing 5, ending 6, **overall 6/10**.
- Picture: image 6.5, text and HUD 6, effects 6, glitches 6.5, **overall 6/10**.
- Its verdict: "Publishable, but only just": "two good set-pieces inside a slow physics lecture".
- Measured: 52.8 s of the film (21%) is in stretches of 2 s or longer where fewer than 6% of the pixels change.
- Its five problems:
  1. no blow for 90 s, from 0:15 to 1:45 (the bolt plate and the bar chart at 0:27 to 0:38, the people standing at 0:54
     to 1:01, the coffee cup at 1:20 to 1:27);
  2. no escalation from 2:46 to 3:46; 5:42:01 is nearly invisible; 13 s of "at rest" shots after it;
  3. the hook: 1.5 s frozen under the title, then a man slowly raising an arm from 0:03.5 to 0:07.8; the first house
     looks parked when it reaches the rock and is still whole 2.4 s later;
  4. the arrival: the fire did not grow in the window, the white was a cream wash, the question came before the hit;
  5. the wall of water is "still a picture": static from 2:31.3 to 2:34.5, and its crest does not move.
- Where a viewer would leave: 0:27 to 0:42, 1:14 to 1:27, 3:07 to 3:14, 3:31 to 3:46.
- What it would keep: the debris burst at 0:12 to 0:15, the people going off the platform's end, the wagon chain in the
  wide shot, the Eiffel Tower, the countdown digits, the twist and the fire's sweep, the writing of the captions.
- Glitches it proved frame by frame: a label on the wrong side for one frame (0:17.2); a dark wedge at the quay's foot
  for one frame, twice (2:36.1 and 2:37.2); a flat orange slab on the tunnel portal as the first wagon hits (2:02.9 to
  2:03.3); a blocky round puff of smoke after it (2:03.3 to 2:04.1); teal and navy blotches in the fire's smoke; the
  signal gantry through the bottom of the frame for four frames (1:40.9).

**What changed after round 3 (not scored again).**
- The opening: from 0:02 the camera turns with the train, across the sliding town, and looks east down the line after
  it (the man raising his arm is gone).
- The ending: the fire grows in the window while an orange glare floods the carriage (from 4:03.6); white in the last
  four frames; two white frames at 4:04.95; a hard cut to black; the question appears only on the black (4:05.3).
- The teal and navy in the fire: a smoke puff's opacity could go over 100%, which takes light away from the fire
  behind it and leaves its opposite colour. A puff now stops at 100%; smoke in the sea's shadow is also lit warm by
  the fire, not cool by the sky.
- The label: its width is now measured before its side is chosen. It was on the wrong side on the first frame it was
  drawn, which also happens wherever a render starts a new segment.
- The quay: the sea and the quay wall were drawn as triangles kilometres long, whose depth the renderer does not work
  out exactly; on some frames the sea cut through the foot of its own wall (the dark wedge) and the wall's cap showed
  through the water as a thin golden line. Both are now built in short lengths (100 m and 25 m), the two sheets of
  water in front stand clear of the cap, and the sun's shadow box moves in whole texels. Re-rendered at both sizes:
  27 consecutive low-resolution frames and six stills across the two moments are steady.
- Not adopted: cutting another 35 s of near-stills, as the reviewer proposed. That takes the film to about 3:35,
  further from the owner's five to six minutes, and every sound cue after the first cut would have to move. The
  stretches are listed below instead.
- Not fixed: the orange slab and the blocky puff at the first wagon, the gantry at 1:40.9 (below).

## What is still weak

In the order a viewer would feel them:
- **Pacing, the lowest score (5/10).** No blow between 0:15 and 1:45; no escalation between 2:46 and 3:46; a fifth of
  the film is nearly still. The four places a viewer would leave are listed above. Curing it means cutting about 35 s
  or building new action for those stretches.
- **Length.** 4:09, not the five to six minutes asked for. Every stretch that was cut was one a reviewer marked as a
  place to leave; filling the time back up was not done.
- **5:42:01 is heard more than it is seen.** The rush stops dead and the sound is cut, but nothing in the picture marks
  the moment; the 15 s after it are close to silent, on purpose, and may read as the end with the sound low.
- **Things slide whole.** The first house looks parked at the rock and breaks late; buildings and cars keep their shape.
  The people are simple figures and lean 8 to 12°.
- **The wall of water** stands still from 2:31 to 2:34.5 and its crest does not move; its mist is soft cloud; the ferry
  is a simple model.
- **The hill and the fire.** The rock face is flat, with a moiré in the wide shots; the tunnel portal is a flat brick
  front, and an orange slab shows on it for about 0.4 s as the first wagon hits (2:02.9), followed by one blocky round
  puff of smoke (0.8 s). The gantry pokes through the bottom of the frame for four frames at 1:40.9.
- **Text.** The label strip at the top is small on a phone; up to seven text items are on screen at 2:47 to 2:52 and
  3:53 to 3:57.
- **Physics, said on screen:** the train stays on its rails, the harbour is 10 m deep, the water is drawn at ¾ of its
  speed, the shock wave ahead of the hill is not drawn. Where the energy to stop the Earth goes is not said.
- **Sound.** The score leads the beds by 7.0 dB at its closest (3:00 to 3:10), under the 10 dB aimed for. No reviewer
  can hear the film: the sound was judged by measurement only.
- **Not reviewed again.** The third round's scores are for the cut before the new opening and the new ending. Those,
  and the fixes to the label, the quay and the smoke, were checked in stills and short low-resolution stretches (about
  60 frames across the film), not by a reviewer.
- **The final render has been scanned, not watched.** The reviews were of low-resolution software renders in the
  cloud. The PC render's 720p copy was checked frame by frame for one-frame faults (none found at the label, the quay
  or in the fire) and on a contact sheet, but nobody has watched it in motion with its sound: watch it once before
  upload.

## Sound

No narrator: the captions are silent and the sound carries the film. Three stems, everything synthesised from seeded
code (`sound-*.js`), so the soundtrack is a pure function of the film:
- **the score**, in D minor at 120 beats a minute: a driving ostinato of short strings over a low pulse, big drums,
  low brass, a sub drop on every blow and a five-note motif. A blow on the stop and on the first house; it thins for
  the people, the fall and the airliner; a slow march under the hill; a third of a second of nothing before the first
  wagon; everything for the wind and the fire; slow and huge for the sea; an endless rise into 5:42:01, cut dead; the
  five notes once, alone, in the silence; the pulse back under the twist, climbing a step with every caption; one blow
  when it arrives, then two low piano notes over the black;
- **the beds**: the slowed world per place (the platform, your train, inside it, the hill, the harbour, high up, the
  cabin): low wind, rumble and groaning steel;
- **the effects**, on their story moments: the stop, the houses, each palm and the shed at the rock, the bolts,
  masonry, the skid, each wagon, the water climbing, the ferry, the seat-belt chime in the airliner, the rush, the
  wheels gripping, and what comes back west.

**Mix.** −14.0 LUFS integrated, −2.3 dBTP, loudness range 8.3 LU (the baked WAV). The mastered `final-soundtrack.m4a`
(AAC 256k, through a limiter at −3 dB) measures −14.2 LUFS and −2.4 dBTP; `small-soundtrack.m4a` (AAC 128k, for the
phone-size copy) measures −14.2 LUFS and −1.7 dBTP.

**The score leads** (the owner's rule of 31 October 2026), measured stem by stem (solo renders, ebur128) in 10-second
windows across the whole film, with the stem trims added in:
- over the beds: 7.0 to 18.4 dB (median 10.5 dB). The closest are 3:00 to 3:10 (the fall, where the score is cut to
  almost nothing on purpose: 7.0 dB) and 0:50 to 1:10 (the people: 8.0 to 8.4 dB).
- over the effects: median 10.5 dB. The effects come within 3.4 to 5.5 dB of the score on the blows, as intended: the
  stop (0:01.5), the wagons (2:02 to 2:10), the water climbing (2:50) and the arrival (4:05). In one window,
  3:30 to 3:40, the effects measure 2.4 dB over the score: both stems are silent there after 5:42:01, and what the
  meter hears is the last 0.4 s of the rush before it.
- 5:42:01 itself: the mix falls from −11.7 dBFS to about −57 dBFS at once and stays below −65 dBFS for the next
  1.2 s; then only a hush (about −33 dBFS) until the five-note motif at 3:35.5.
- stem trims: music 0, beds +4, effects +5 dB (`mix.js`); a limiter at −2.5 dB.
- The baked soundtrack (`soundtrack.js`, MP3 160k) carries the code's fingerprint; `tools/check-page.cjs` reports
  SOUND READY at once, so the baked copy is accepted.

## Delivery

- **Runnable ZIP** `earth-stop-film.zip` (in the project files): extract it, open `earth-stop.html` in Chrome or Edge on
  a computer, wait for SOUND READY, press Space. The soundtrack is baked in and checked against the code's fingerprint
  (`tools/check-page.cjs`: SOUND READY at once, no console errors).
- **Final 1080p MP4**, rendered on the owner's PC (graphics card) on 15 November 2026 from commit 1f7b621, in 5
  minutes: `node films/earth-stop/render-gpu.cjs --channel chrome --workers 2 --out D:\renders\earth-stop --small`.
  - `D:\renders\earth-stop\earth-stop_final_1080p.mp4`: 1920×1080, 30 fps, H.264 CRF 18, 248.63 s (7,459 frames),
    673 MiB, with the mastered soundtrack `final-soundtrack.m4a` copied in: −14.2 LUFS, −2.4 dBTP. **This is the file
    to upload.**
  - `earth-stop_final_small.mp4`: 1280×720, 26.5 MiB (a preview copy, also in the project files).
  - The command is resumable: run it again and finished segments are kept.
- **Thumbnails** (house style) in the project files: `thumb-fire.jpg` (the six wagons at the hill), `thumb-wave.jpg`
  (the wall of water against the Eiffel Tower's outline), `thumb-train.jpg` (your train and the fire coming west).

## Files

`earth-stop.html` and `films/earth-stop/`: `CAPTIONS.md` (the story), `build-timing.cjs` → `timing.js`, `layout.js`
(where everything is), `physics.js` (every number), `script.js` (the clock and the caption checks), `shots.js`,
`film.js`, `kit.js`, `cast.js`, `world.js`, `station.js`, `train.js`, `fx.js` (dust, debris, fire, the sea's wall),
`coastset.js` (cameras, grade, labels), `skyset.js` (the airliner), `hud.js`, `audiokit.js`, `audio.js`, `mix.js`,
`sound-lib.js`, `sound-music.js`, `sound-amb.js`, `sound-sfx.js`, `soundtrack.js` (baked), `final-soundtrack.m4a`,
`small-soundtrack.m4a`, `render-gpu.cjs`, `PLAN.md`, this report.
