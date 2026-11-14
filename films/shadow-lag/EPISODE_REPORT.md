# Episode report — *What if your shadow lagged 1 second behind you?*

**Format.** 16:9 long-form, 1920×1080, 30 fps, 4:50 (289.9 s). Voiceless, in the Gravity tilts 90° / Friction 10 s /
Light stopped bouncing / Magnets 1,000× formula, built to the owner's YouTube lessons of 28 October 2026 (an everyday
place, action in the first seconds, a real-physics nod in the first minute, about five minutes, tension to the last
frame), the rule of 29 October 2026 (**the story clock only runs forward**), the eerie tone of Slower light, and "more
new scenery" (4 November): a multi-storey car park at midnight (level 4's deck and its open edge over the town,
level 2 seen by a CCTV camera, the exit lane at street level). No kitchen, flat, street or city set reused.

Page `shadow-lag.html`, code `films/shadow-lag/`. Every number is in `PLAN.md` § 2 (computed in `physics.js`);
captions are in `CAPTIONS.md`.

**The rule.** From 11:58 PM on Friday 13 November, your shadow is your body as it was exactly 1 second ago. Light,
reflections and everyone else's shadows are on time.

**The one impossible part**, said at 1:48: where your shadow should be, light lands as if you weren't there; where you
were a second ago, it never lands at all.

## The clock (`SH_CLOCK`, `clock.js`)

Mostly real speed (it's a night in a car park, not an explosion); the tests are slowed so you can see the second.

| film | clock | speed |
|---|---|---|
| 0:00–0:03 | 11:57:58.6–11:58:01.6 PM | real speed, under the title |
| 0:03–0:11 | 11:58:01.6–04.3 | 4× then 2× slower (your shadow stays in the doorway, then follows) |
| 0:11–0:42.6 | 11:58:04–11:58:36 | real speed (8 billion shadows; the warning; what a shadow is; 5 billionths) |
| 0:42.6–0:51 | 11:58:36–38 | 3.5× slower (your hand; its shadow waits) |
| 0:51–1:09 | 11:58:38–56 | real speed (your phone sees it too; the walk) |
| 1:09–1:27.5 | 11:58:56–11:59:04 | 3× slower for the stop, the turn and the jump |
| 1:27.5–2:39.5 | 11:59:04–12:00:16 AM | real speed (the mirror, four lamps, impossible, compared to what?, midnight, footsteps) |
| 2:39.5–2:45 | 12:00:16–18 | 3× slower (behind the pillar, your shadow still out in the open) |
| 2:45–3:22 | 12:00:18–55 | real speed (stand still; that one hasn't; the night guard; his torch) |
| 3:22–3:26 | 12:00:55–56 | 3× slower (you shield your eyes; your shadow does it a second later) |
| 3:26–3:40.7 | 12:00:56–12:01:11 | real speed (he saw that; his radio) |
| 3:40.7–3:48.6 | 12:01:11–13.6 | 4× then 2.5× slower (you run; your shadow just stands there) |
| 3:48.6–4:08.9 | 12:01:13.6–29.8 | real speed, 2.5× slower out of the bay |
| 4:08.9–4:20.1 | 12:01:29.8–31.9 | 5× slower (the ramp at 25 km/h; your shadow 7 m behind, sitting on nothing) |
| 4:20.1–4:30 | 12:02:06.8–10.0 | +34 s at the cut: camera 7 on level 2, 3× slower |
| 4:30–4:49.9 | 12:02:39.4–57.1 | +27 s at the cut: the exit barrier, 2× slower, then real speed to the end |

`script.js` throws if the clock runs backwards, if any of 14 caption moments ("your shadow steps out", "the shadow's
hand is up", "it walks right into you", "it jumps after you've already landed", "you shield your eyes", "it runs too",
"your shadow stops too", "the one in the back has sat up"…) doesn't sit on its event, or if any of 13 caption numbers
drifts from `physics.js`.

The film is told by:
- 63 short second-person captions;
- the HUD: YOUR SHADOW 1.00 s LATE, how far behind you it is, EVERYONE ELSE'S: ON TIME, the clock and how slowly it
  runs, your speed and your shadow's distance in the run and the car (with "SPEEDING UP" while it catches up);
- one context box per beat (your speed, your shadows, lamps on, the guard's distance, the car's speed…);
- labels pinned in the scene (YOU NOW / YOUR SHADOW, WHERE YOU WERE 1 s AGO; LIT, SHOULD BE YOUR SHADOW);
- insets: light's last 1.5 m to the floor (5 billionths of a second against 1 s), the Earth carrying you;
- the sound.

## Shot list (39 shots)

| time | shot | clock |
|---|---|---|
| 0:00–0:10.6 | the title over the stair door; you step out, your shadow stays in the doorway, then follows | 11:57:58 PM |
| 0:10.6–0:21.9 | level 4 from above; your eyes down the aisle ("it will warn you about something") | 11:58:04 |
| 0:21.9–0:41.7 | the floor side-on; up at the lamp; 5 billionths of a second; more than 100 million times later | 11:58:15 |
| 0:41.7–0:59.9 | your hand up, its shadow waiting; your phone filming it | 11:58:35 |
| 0:59.9–1:29.2 | the wall tests under a hard bulkhead lamp: the walk (1.4 m behind), the stop (it walks into you), the turn, the jump | 11:58:47 |
| 1:29.2–1:38.4 | the convex mirror: you, on time | 11:59:06 |
| 1:38.4–1:47.5 | from above, inside four lamps: four shadows, all late | 11:59:15 |
| 1:47.5–2:23.3 | "Officially, this is impossible"; at the open edge, the town; compared to what? (280 m/s, 30 km/s) | 11:59:24 |
| 2:23.3–2:34.2 | 12:00 AM: half the lamps go off, darker | 12:00:00 AM |
| 2:34.2–3:01.8 | footsteps; you hide behind a pillar, your shadow still out in the open; stand still | 12:00:11 |
| 3:01.8–3:10.7 | "That one hasn't": the night guard's shadow looms on the van's doors behind you | 12:00:34 |
| 3:10.7–3:39.7 | the guard; his torch throws your shadow onto the van; you shield your eyes, it a second later; he backs away, radioing | 12:00:43 |
| 3:39.7–3:54.3 | the run to your car; your shadow stands there, then runs 5 m behind you | 12:01:10 |
| 3:54.3–4:20.1 | the doors lock; out of the bay; the car's shadow on time, yours still sitting in your seat; the ramp at 25 km/h | 12:01:19 |
| 4:20.1–4:30.0 | +34 s: camera 7, level 2: your car goes past, then your shadow | 12:02:06 |
| 4:30.0–4:49.9 | +27 s: the exit barrier; your shadow stops; the car's shadow on the wall; the one in the back sits up; the question | 12:02:39 |

## How it follows the owner's lessons

- Everyday place, bizarre physics: a car park at midnight, alone, walking to your car.
- Action in the first 5 s: under the title your shadow stays in the doorway (0:03.6).
- A real-physics nod in minute one: a shadow is only where light can't reach; a normal shadow is 5 billionths of a
  second late (0:28); 1 s is more than 100 million times later (0:37).
- Under five minutes, no filler; the clock never replays a second (two forward jumps at cuts: +34 s and +27 s).
- Tension to the last frame: the guard, the run, the ramp, camera 7, then "Now nothing in your car should be moving"
  and the head rising in the back seat's window; "So whose shadow is that?" No recap.
- Music leads, beds and effects well under it, measured stem by stem (§ Sound).

## Reviews

Round 1 (the first full cut, 4:50, one frame from the middle of every shot, no sound). One independent reviewer for
story, pictures and physics; the scores as given (out of 10): **hook 6, clarity 6, readability 3, tension and ending
6, overall 5.**
- Hook: eerie, but in the first seconds the lag wasn't visible (you were backlit, moving along the shadow's axis).
- Readability: the late shadow was plainly visible in about 8 of 39 frames. The core tests had no visible shadow
  (the lamps sat near the camera's axis and many lamps washed out a dark floor).
- Ending: no driver's head in either window, so "the second one" had no reference.
- The impossible beat's labels were wrong (LIT on the dark late shadow; DARK while the HUD read 0.00 m).
- Filler: the "compared to what?" beat about 22 s; a black void shot; the CCTV beat about 15 s restating the ramp.
- Unreadable horror beats: your shadow on the van out of frame; the guard's face and the car interior black.
- Physics: a shadow's normal delay is light's trip from you to the floor, not from the lamp (about 5 ns, not 9);
  "30 km behind" is relative to the Sun (space has no fixed point); the CCTV caption should say your shadow, not you.
  The other numbers checked out.

**Fixes made after round 1:**
- Readability: three bulkhead lamps on the beams and columns ("wall keys") with the overhead lamps dimmed, so the walk,
  stop, turn and jump each throw a hard, black, late shadow on a pale wall beside you; the pillar and the run get a long
  floor shadow from a low lamp; the four-lamps shot moved above you so four shadows fan out.
- Ending: your head in the front window's patch of light; a second head rising slowly in the rear patch.
- The impossible labels now sit where they belong and show only while you move.
- "Compared to what?": one clear parapet-and-town shot in the middle; the CCTV beat cut to two captions (about 10 s).
- The torch: the guard moved so his torch finds you past the pillar and throws your shadow onto the van; the run and
  drive cameras moved so your shadow is in frame.
- The stranger's shadow ("That one hasn't"): a lamp hanging behind the guard throws his head and shoulders onto the
  van's doors right behind you (found in a last check: it had been invisible).
- Physics: 5 billionths (your shoulders to the floor, 1.5 m / c), "more than 100 million"; "Left behind in space, it
  would be 30 km back along Earth's orbit"; "1 second later, it sees your shadow go past"; the HUD says SPEEDING UP
  while your running shadow is still catching up.

No second scoring round was run: the scores above are the first cut's.

## What is still weak

- "That one hasn't" comes up about 2 s before the guard's shadow reaches the van; the shadow then holds for about
  1.5 s before the cut. It reads, but it is late against its caption.
- The pillar and run shots' floor shadows are readable but soft; the four-lamps shot is still faint.
- The guard's face (lit by his own torch's spill) is dim.
- The wall tests' wall is very bright and plain (a painted wall under a hard lamp); it reads, but looks like a studio.
- The ending's window patches are blocky; the head in the back is clear only in its last seconds.
- "Compared to what?" still runs about 20 s over three shots.
- The people are the house's simple figures.

## Sound

No narrator: the captions are silent and the sound carries the gaps. Three stems, everything synthesised from seeded
code (`sound-*.js`), so the soundtrack is a pure function of the film:
- **the score** (cold D minor, eerie like Slower light). Its idea is the film's: every note of the motif comes back
  1 story second later, an octave down and muffled, like a shadow of the note. A backwards piano into the moment your
  shadow stays behind; glass strings and a bell on "5 billionths"; a walking pulse in the tests that stops when you
  stop while its echo walks on; four bells for four lamps; a stinger on "impossible"; wide strings for the Earth; the
  score drops out under the lamps going off; a heartbeat under the footsteps; a stinger on "That one hasn't"; a low
  ostinato for the guard; a driving pulse for the run, cut dead when the doors lock; the ramp's rise cut dead at the
  CCTV; at the end the strings glide up a semitone and the motif stops a note short on the last frame;
- **the beds**, by place: level 4's lamp hum (100 Hz and harmonics, darker after midnight with half the lamps off), the
  concrete box's room tone and the town through the open sides; the wind and a far siren at the edge; camera 7's hiss;
  the exit lane's sodium buzz, the street and the ticket terminal's whine. In the slowed stretches they sink a little;
- **the effects**, each on its story moment: the stair door and its echo, your footsteps, your sleeve, your phone's
  record tone, the jump's landing (yours; your shadow makes no sound at all), the lamps' contactors clunking off at
  midnight, the guard's door, boots and keys, his gasp, his radio, your run, the car's door, locks and indicator relay,
  the starter, engine and tyres, the ramp's expansion joint, nothing on camera 7, the brakes, the terminal's beeps and,
  from the back seat, a slow creak of vinyl.

**Mix.** −15.2 LUFS integrated, −2.4 dBTP, loudness range 8.6 LU (the baked WAV). The mastered `final-soundtrack.m4a`
(AAC 256k, through a limiter at −3 dB) measures −15.3 LUFS and −2.6 dBTP; `small-soundtrack.m4a` (AAC 128k, for the
phone-size copy) measures −15.4 LUFS and −2.6 dBTP.

**The score leads** (the owner's rule of 31 October 2026), measured stem by stem (solo renders, ebur128) in 10-second
windows across the whole film, with the stem trims added in:
- over the beds: 8.1 to about 25 dB (median 14.5 dB). The closest are 1:30 (the mirror) and 1:50 (the edge's wind),
  both quiet stretches of the score.
- over the effects: 9.3 to 55 dB (median 15.7 dB). The closest is 1:30 (your footsteps by the mirror).
- The ramp's climax (4:13 to 4:21) sat 7 dB over the rest of the score; the mix brings it down 3.5 dB (`mix.js`), so
  those windows sit about 3.5 dB nearer the beds than the solo numbers say (still about 22 dB over them).
- stem trims: music +2.5, beds −4.5, effects −2.5 dB; master +7.5 dB (`mix.js`).
- The baked soundtrack (`soundtrack.js`, MP3 160k) carries the code's fingerprint; `tools/check-page.cjs` reports
  SOUND READY at once, so the baked copy is accepted.

## Delivery

- **Runnable ZIP** `shadow-lag-film.zip` (in the project files): extract it, open `shadow-lag.html` in Chrome or Edge,
  wait for SOUND READY, press Space. The soundtrack is baked in and checked against the code's fingerprint.
- **Final 1080p MP4** on the owner's PC (graphics card), one command in the repo folder after pulling this branch:
  `node films/shadow-lag/render-gpu.cjs --channel chrome --workers 2 --out D:\renders\shadow-lag --small`.
  - It makes `D:\renders\shadow-lag\shadow-lag_final_1080p.mp4`: 1920×1080, 30 fps, H.264 CRF 18, 4:50, with the
    mastered soundtrack `final-soundtrack.m4a` copied in.
  - With `--small` it also makes `shadow-lag_final_small.mp4` (1280×720, under 30 MiB).
  - It is resumable: run it again and finished segments are kept.
- **Thumbnails** (house style) in the project files: `thumb-wall.jpg` (your shadow walking toward you on the wall),
  `thumb-guard.jpg` (the guard's shadow on the van behind you), `thumb-exit.jpg` (the car's shadow at the exit).

## Files

`shadow-lag.html` and `films/shadow-lag/`: `CAPTIONS.md` (the story), `build-timing.cjs` → `timing.js`, `layout.js`
(where everything is), `clock.js` (the story clock), `physics.js` (every number, you, the guard, your car),
`script.js` (the caption checks), `shots.js`, `film.js`, `kit.js`, `cast.js`, `car.js`, `deck.js`, `deckset.js` (level 4
and level 2: lamps, cameras, labels), `exit.js`, `hud.js`, `audiokit.js`, `audio.js`, `mix.js`, `sound-lib.js`,
`sound-music.js`, `sound-amb.js`, `sound-sfx.js`, `soundtrack.js` (baked), `final-soundtrack.m4a`,
`small-soundtrack.m4a`, `render-gpu.cjs`, `PLAN.md`, this report.
