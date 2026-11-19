# Episode report — *What if sound travelled faster than light?*

**Format.** 16:9 long-form, 1920×1080, 30 fps, 4:17 (257.45 s). Voiceless, in the Gravity tilts 90° / Friction 10 s /
Gravity keeps tilting formula, built to the owner's YouTube lessons of 28 October 2026 (an everyday place, action in
the first seconds, a real-physics nod in the first minute, tension to the last frame), the rule of 29 October 2026
(**the story clock only runs forward**), "more new scenery" and "no z-fighting" (4 November) and the audio rule of
31 October (the music clearly leads, measured stem by stem). The tone is the eerie, close-to-horror feel of Slower
light, the channel's best film. The place is new: a corn farm in Iowa on a Saturday evening in late July, a
thunderstorm coming in from the west, the corn 2.4 m tall, and your 9-year-old daughter Maisie has just run into it
after the dog.

**Length, said plainly.** The owner's lesson asks for about six minutes. This film is 4:17, shorter on purpose, as
Earth stopped spinning (4:09) was. The first cut was 4:57. Both round-1 reviewers named the bats beat as the sag, so it
was cut (4:39). The round-2 story reviewer then named three lecture captions in the first minute, a repeated "the bang
is the flash" and a slow middle, so those were cut too, instead of padding the film to a length (§ Reviews).

Page `sound-faster-light.html`, code `films/sound-faster-light/`. Every number is in `PLAN.md` § 2 (computed in
`physics.js`; `script.js` refuses to run if a caption's number or moment drifts from it); captions are in `CAPTIONS.md`.

**The rule.** At 8:52:00 PM on Saturday 24 July 2027 sound starts travelling at 1,000,000 km/s (3.3 times light).
Only its speed changes: how loud things are and how far they carry stay the same (the footnote at 0:32).

**The one impossible part**, said on screen at 0:32: in real physics this can't happen; air would have to be
7 million times stiffer than steel to do it. The film keeps everything else real.

**Generous and approximate:** the corn, the paths and the bodies are drawn, not simulated; the tornado is a straight
track at 60 km/h; the phone call's lag is a round 0.25 s; the running speeds (2.28 m/s blind through the corn,
2.4 m/s carrying her) are estimates.

## The clock (`script.js`, `clock.js`)

The story clock only runs forward. It jumps once, +25 s, at the cut into the corn, and the clock says so in big orange
type for 3.5 s ("+25 s LATER"). From 8:52 the HUD also keeps two lines up: "TORNADO WARNING · UNTIL 9:30 PM" (from
8:52:18) and "MAISIE IN THE CORN m:ss" (until she is found, then "MAISIE · WITH YOU").

| film | story | what |
|---|---|---|
| 0:00–0:03.6 | before 8:52 PM | the title: Maisie in her yellow raincoat runs across the wet lawn into the corn |
| 0:03.6 | 8:52:00 PM | the boom: nine thunders at once; the picture whites out |
| 0:28.5 | 8:52:25 | a strike 3 km away: its thunder lands with the flash |
| 0:39.0 | 8:52:35 | the 6 km bolt across the sky; its 13 s of rumble lands in one blow |
| 0:55.1 | 8:52:51 | you call her name: no echo from the barn |
| 1:02.4 | 8:52:59 | she calls back: as loud as if beside you, from nowhere |
| 1:39.6–1:47.2 | 8:53:36 | you walk north along the corn, the wrong way |
| 1:48.5 / 1:49.8 | 8:53:45 | the freight train's horn (11 km) and the Hansens' dogs (1.4 km), together |
| 2:02.1 | 8:53:59 | the town's tornado sirens (6 km) |
| 2:12.7 | 8:54:09 | the sheriff's car passes; no drop in pitch |
| 2:20.3 | 8:54:17 | a flash shows the tornado, 3 km west |
| 2:35.0–2:55.5 | 8:54:31 | you call her phone again; she answers; 120 m, west, towards the tornado |
| 2:56.7 | +25 s → 8:55:18 | you run into the corn |
| 3:15.2 | 8:55:37 | lightning hits the yard light behind you; the farm goes dark |
| 3:33.6 | 8:55:55 | the tornado takes the Hansen farm, 1.3 km west (seen lit beside the funnel, then gone) |
| 3:46.4 | 8:56:08 | a flash: the yellow raincoat, 6 m away |
| 3:55.3–4:12.0 | | the cellar 130 m behind you (54 s, carrying her); if the tornado is coming at you, its winds reach the cellar in 51 s |
| 4:13.7–4:17.5 | | "Which way would you run?" (her yellow hood at the bottom of the frame, the funnel ahead) |

## Shot list (47 shots)

| shots | film | what |
|---|---|---|
| T1 | 0–10.2 | the title: tracking behind Maisie across the lawn into the corn; the boom at 0:03.6 |
| K1–K2 | 10.2–21.8 | the storm over the field; you on the lawn (inset: nine thunders on their way) |
| F1–F2 | 21.8–31.9 | you walk to the corn; the strike 3 km away (footnote: strictly, its thunder now wins by 7 millionths of a second) |
| R1–R2 | 31.9–38.4 | the windmill against the storm; the yard light (label: the storm cellar) |
| M1–M3 | 38.4–51.0 | the 6 km bolt; you at the corn (inset: 13 s of rumble collapsing); you, looking back at the house |
| C1–C2 | 51.0–63.2 | you call her; the barn (label: its echo was 0.35 s late) |
| A1–A2 | 63.2–71.8 | she calls back; you can't tell where she is |
| E1–E3 | 71.8–90.7 | your ears (the head diagram); a high shot over you at the corn |
| H1–H3 | 90.7–105.3 | hands over your ears; louder means closer; you walk the wrong way |
| W1–W3 | 105.3–123.1 | long lenses: the train 11 km, the Hansen farm 1.4 km, the plain (inset map) |
| S1–S3 | 123.1–138.7 | the town's lights and sirens; the sheriff's car; you looking down the yard |
| N1–N3 | 138.7–155.6 | the flash that shows the tornado; the funnel; it's getting louder |
| P1–P3 | 155.6–176.7 | you call her phone; Maisie crouched with the dog, answering; the phone map |
| Q1–Q3 | 176.7–194.6 | +25 s: POV down the rows with the torch; from above; running at the camera |
| X1–X3 | 194.6–202.3 | the yard light hit; its dead lamp glowing out; you stumble |
| V1–V2 | 202.3–211.0 | the wind at 90 km/h; the corn lying down |
| Y1–Y2 | 211.0–225.4 | the Hansen farm, lit beside the funnel; its lights die and it flies apart into it; debris |
| Z1–Z6 | 225.4–257.45 | the flash: the raincoat; you hold her; the high wide with the race map; everywhere; POV turning; POV west: "Which way would you run?" |

## How it follows the owner's lessons

- **Action in the first 5 s:** the title is already Maisie running into the corn; at 0:03.6 nine thunders land at once.
- **Real physics in minute one:** 343 m/s and 3 seconds a kilometre (0:22), the strike from 3 km now 7 millionths of a
  second ahead of its own light (a footnote at 0:29), why nothing real can do it (0:32), and the 6 km bolt's 13 s
  rumble (0:41). Maisie is called at 0:51.
- **Everyday, human-scale, new scenery:** a corn farm in a thunderstorm, none of the earlier films' sets.
- **The story clock only runs forward:** no replays; one jump (+25 s) at a cut, shown in the clock.
- **Tension to the last frame, no recap:** the tornado warning in the first caption and in the HUD from 0:18, her time
  in the corn ticking in the HUD, the tornado from 2:20, the run, and a race the film leaves open: the cellar is
  54 s away carrying her, and if the tornado is coming at you its winds get there in 51.
- **The music clearly leads** (§ Sound).
- **No z-fighting**, and the picture-pitfalls list (no particle alpha over 1, no kilometre-long triangles).

## Reviews

Independent reviewers saw stills at 1 frame a second and every frame at 5 fps (they cannot hear) and read a brief of
the story and the sound. Scores as given.

**Round 1** (the first cut, 4:57).
- Story and retention: hook 6, clarity 6, pacing 4, tension 5, science payoff 7, ending 7, overall retention 5
  (predicted average view 32–35 %). Top problems: a 44-second physics run from 0:22 with Maisie not mentioned; the
  threat arriving at 2:58; a sightseeing sag from 2:02 to 3:13 (the bats barely visible); "it arrives at once"
  repeated about eight times; an ending with an obvious answer (the cellar east, the tornado west).
- Picture: image quality 6, composition 5.5, phone readability 5, mood 6.5, HUD and captions 7, overall 5.5. Weakest:
  the bats (specks), the bat at your face (flat planes in the lens), the Hansen farm hit (nothing to see), the torch from
  above (black, a "moon"), the wind and the corn lying down, the embrace (the torch in his face). Glitches: a tree trunk
  sweeping across the lens at 0:21, footnotes flashing for one frame, a 0.4 s snap at 0:58, the tornado popping in
  one frame before its flash, the sheriff's headlights ahead of the car.
- **Fixed:**
  - the bats cut (both reviewers): 4:57 → 4:39;
  - Maisie named in the call ("Maisie isn't back"); "MAISIE IN THE CORN m:ss" in the clock box from 8:52 to the find;
    "TORNADO WARNING · UNTIL 9:30 PM" in the speed box from 0:18, blinking in;
  - captions that said "at once" again rewritten to say something new: "Somewhere in it is her voice.", "You can't
    tell which way the town is.", "Its roar is already here. It sounds as close as the rain.", "You hear its roof go.
    You can't tell if that was a kilometre away, or a hundred metres."; "In the flash: a tornado" (it stays visible
    after); "That one was 6 km long" (said after the bolt); the 44,000 line now says what it compares ("The smallest
    gap your brain can use is 44,000 times longer"); the yard light's caption lost its second "90 metres";
  - the ending made a real race: the escape map shows "THE CELLAR: 54 s, CARRYING HER" against "THE TORNADO: 53 s, IF
    IT'S COMING AT YOU"; the storm cellar is labelled in the yard at 0:44;
  - the boom at 0:03.6 jolts the picture white for a tenth of a second;
  - the tornado appears only from the frame of its flash; the footnotes stay up for their whole beat; you turn instead
    of snapping round when you stop or start walking; the big maple moved out of the camera's path;
  - the torch from above shows its beam cutting through the rows; the corn-lying-down shot low behind you, the inset off
    you; the embrace with the torch put down on the ground, shining up at your faces, your arms round her; the Hansen
    farm's lights bigger, going out the instant the roofs go, framed tighter (12.5°) with a ground strike on the hit;
    the sheriff's lights pinned to the car; the yard light's label says the distance when it was hit.

**Round 2** (the 4:39 cut).
- Story and retention: hook 6, clarity 6.5, pacing 5, tension 6 (about 4 before the tornado, about 7.5 after), science
  payoff 7, ending 6, overall retention 5.5 (predicted average view about 33 %, 30–36 %). Top problems: a lecture from
  0:32 to 1:08 with Maisie gone (three caveats in a row, then empty sky); the stakes undersold in the first 30 s (no
  caption said "tornado" until 2:24); the HUD saying "SHE'S 120 m AWAY · WHICH WAY?" (it broke the premise and spoiled
  the phone); the middle standing still for 50 s; an ending whose answer looked obvious (the cellar east, the tornado
  west, the real race hidden in small map text, Maisie out of frame). Kept: no echo / "You can't tell where she is";
  the phone "in your own pocket" and her crouched in yellow; "She's 90 metres away", the Hansen roof, the raincoat.
- Picture: image quality 6, composition 5.5, phone readability 4.5, mood 7, HUD and captions 6, overall 6. Weakest:
  the Hansen farm hit (no farm to see, the funnel a grey pillar); the torch from above (75 % black); the embrace (his
  arms not round her, no dog); the freight train (one dot); the 6 km bolt (0.4 s, vertical, its length never reads);
  the farmer's framings at 1:04 and 1:15. Glitches: a grey box at the edge of the title shot; fat raindrops at the
  lens in long-lens shots; the yard-light bolt like a searchlight; a see-through disc over the tornado; a map dot on
  the "Y" of "YOU + HER"; corn leaves sweeping past the lens in the last POV turn.
- **Fixed** (4:39 → 4:17):
  - the first caption now says "under a tornado warning"; the "Strictly…" caption became a footnote; the two rule
    captions became one caption ("In real physics this can't happen…") and a footnote; the rumble beat is two captions;
    "Distance doesn't make a sound late any more." and "Now the bang is the flash." (with its set-up) are cut. Maisie is
    now called at 0:51 (was 1:09) and the tornado is shown at 2:20 (was 2:41);
  - the HUD at her answer says "HOW FAR? WHICH WAY? · HER PHONE: NO ANSWER", and the phone beat says "You call her
    phone again… This time she answers. You hear her twice: through the air, then on the phone.";
  - jargon and double numbers rewritten: "0.2 billionths: 44,000 times too short for your brain", "They flow round your
    head as if it weren't there";
  - the ending is the race, said in captions and checked against the physics: "Carrying her, that's 54 seconds." /
    "If the tornado is coming straight at you, its winds reach the cellar in 51." / "You can hear it everywhere. You
    can't hear which way it's moving."; the HUD no longer says "EAST"; the last POV shows her yellow hood under the
    funnel;
  - the boom whites out the picture for a beat; the 6 km bolt crawls across the sky and glows for 0.85 s; the
    yard-light bolt is kinked all the way down; the Hansen farm now stands 150 m beside the tornado's track, its east
    windows and barn door lit, seen through a 8.5° lens beside the funnel for 2.6 s before its lights die and it flies
    into the funnel; the torch from above reframed with you lit; the embrace with her up on her knees in your arms
    (the dog caption replaced: "You have her. She's shaking."); the farmer framed on the left third, his face above the
    captions; the dead yard light glows orange as it dies; the cellar box hidden in the title shot; no raindrops at
    the lens in long lenses; the tornado's top dissolves into the cloud (no disc); the map labels moved apart; the corn
    cleared round the last POV turn.

## What is still weak

- **Length:** 4:17, well under the six-minute lesson; both rounds of review asked for cuts, not more.
- **Faces:** the low-poly faces are small and plain; Maisie's face is mostly hidden by her hood on the phone.
- **The dog** is small and dark: it reads in the phone shot and in the flash that finds her, barely elsewhere.
- **The freight train** is still a light and a label on the horizon (4.6 s now, was 7 s).
- **The torch from above** is mostly dark on purpose ("Beyond it, you only see when the lightning strikes"), but a
  phone screen will show little there.
- **The tornado** is a cone of streaked cloud, not a photoreal funnel; it reads in every flash, but up close it is a
  shape, not weather.
- **Phone readability:** the HUD sub-lines and map text are small (house style); the captions carry the story.
- Not re-reviewed after the round-2 fixes: the scores above are for the 4:39 cut.

## Sound

No narrator: the captions are silent and the sound carries the film. Three stems, everything synthesised from seeded
code (`sound-*.js`), so the soundtrack is a pure function of the film:
- **the score**, in D minor: before 8:52 its theme is played one note after another with echoes; from 8:52 its notes
  land at once, as one chord. It cuts out for 1.5 s on the yard light, turns to D major on the find and ends on the
  question with its theme on an unresolved E flat, its last hit on the last flash;
- **the beds**, by place and time: before 8:52 the evening in wide stereo with the yard's echo (rain on the lawn, the
  breeze, the corn hissing, drips off the gutters); on the boom the stereo snaps shut: from then on every world sound is
  mono, dry and in the middle of your head; in the corn the rain on the leaves close; the wind building to a gale; the
  tornado's roar from just before it is seen, louder as it comes closer;
- **the effects**, all instant: the nine thunders in one blow, every strike's thunder with its flash, your call with no
  echo, her voice as loud as if she were beside you, the train's horn and the dogs together, the town's sirens, the
  sheriff's siren with no change of pitch, her ringtone as if in your pocket and her voice twice (the air, then the
  phone 0.25 s later), the run, the yard light (the loudest sound in the film), the Hansen farm coming apart.

**Mix.** −14.4 LUFS integrated, −2.4 dBTP, loudness range 8.0 LU (the baked WAV). The mastered `final-soundtrack.m4a`
(AAC 256k, through a limiter at −3 dB) measures −14.5 LUFS and −2.4 dBTP; `small-soundtrack.m4a` (AAC 128k, for the
phone-size copy) measures −14.5 LUFS and −2.6 dBTP.

**The score leads** (the owner's rule of 31 October 2026), measured stem by stem (solo renders, ebur128) in 10-second
windows across the whole 4:17 cut, with the stem trims added in:
- over the beds: 9.4 to 21.3 dB (median 14.3 dB). The closest are 3:00 to 3:10 (the run through the corn, 9.4 dB) and
  3:20 to 3:30 (the gale, 9.4 dB). 0:50 to 1:00, the hush before your call, measured 6.7 dB; the beds now dip 3 dB
  there, which makes it about 9.7 dB (worked out, not re-measured).
- over the effects: median about 10.7 dB. The effects come within 2.7 to 6.3 dB of the score in three places, as
  intended: the train's horn and the dogs (1:50 to 2:00, 2.7 dB), the sheriff's siren (2:10 to 2:20, 2.9 dB) and the
  gale (3:20 to 3:30, 6.3 dB).
- stem trims: music +3.5, beds −1, effects −3 dB; master 5.0; a limiter at −2.5 dB (`mix.js`).
- The baked soundtrack (`soundtrack.js`, 6.9 MB, fingerprint `c1b1b74d`) is loaded by the page, so the ZIP plays sound
  in any browser; `tools/check-page.cjs` reports SOUND READY after 3 s and no console errors.

## Delivery

- **Runnable ZIP** `sound-faster-light-film.zip` (in the project files, 7.6 MB): extract it, open
  `sound-faster-light.html` in Chrome or Edge on a computer, wait for SOUND READY, press Space. Tested from a fresh
  unzip with `tools/check-page.cjs`: SOUND READY after 3 s, no console errors.
- **Final 1080p MP4**, rendered on the owner's PC (graphics card) on 19 November 2026 from commit 1e8827f, entirely on
  D: (C: was full: a fresh copy of the branch at `D:\oyooayman-render-src`, temp files in `D:\render-tmp`), the
  frames in 8 minutes (about 16 frames a second), 11 minutes in all: `node films/sound-faster-light/render-gpu.cjs
  --channel chrome --workers 2 --out D:\renders\sound-faster-light --small`.
  - `D:\renders\sound-faster-light\sound-faster-light_final_1080p.mp4`: 1920×1080, 30 fps, 257.50 s (7,725 frames),
    1,286 MiB, with the mastered soundtrack `final-soundtrack.m4a` copied in: −14.5 LUFS, loudness range 7.8 LU,
    −2.4 dBTP. **This is the file to upload.**
  - `sound-faster-light_final_small.mp4`: 1280×720, 26.5 MiB, 257.47 s (one frame fewer than the film), −14.5 LUFS,
    −2.6 dBTP (a preview copy).
  - Check frames at 4, 140, 226 and 254 s (`check_*.jpg` beside the MP4) were looked at: none black or broken.
  - The command is resumable: run it again and finished segments are kept.
- **Thumbnails** (house style) in the project files: `thumb-thunder.jpg` ("1,000,000 km/s / AND STILL YOU CAN'T FIND
  HER", the 6 km bolt over the farm), `thumb-tornado.jpg` ("3 km away / AND STILL ITS ROAR IS INSIDE YOUR HEAD", the
  funnel lit by a flash), `thumb-raincoat.jpg` ("120 metres / AND STILL SHE SOUNDS RIGHT BESIDE YOU", her yellow
  raincoat in the corn).

## Files

`sound-faster-light.html` and `films/sound-faster-light/`: `CAPTIONS.md` (the story), `build-timing.cjs` → `timing.js`,
`layout.js` (where everything is), `clock.js`, `physics.js` (every number), `script.js` (the clock and the caption
checks), `shots.js`, `film.js`, `kit.js`, `cast.js` (people and poses), `world.js` (the farm, the Hansen farm, the town),
`corn.js` (the corn), `sky.js` (the storm, the lightning, the rain), `tornado.js`, `fx.js` (glows, sparks, smoke, debris),
`farm.js` (cameras, lights, labels, grade), `hud.js`, `audiokit.js`, `audio.js`, `mix.js`, `sound-lib.js`,
`sound-music.js`, `sound-amb.js`, `sound-sfx.js`, `soundtrack.js` (baked), `final-soundtrack.m4a`,
`small-soundtrack.m4a`, `render-gpu.cjs`, `PLAN.md`, this report.
