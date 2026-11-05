# Episode report — *What if light stopped bouncing for 10 seconds?*

**Format.** 16:9 long-form, 1920×1080, 30 fps, 5:01 (301.4 s). Voiceless, in the Gravity tilts 90° / Gravity keeps
tilting / Friction 10s formula and the eerie tone of Slower light, built to the owner's YouTube lessons of 28 October
2026 (an everyday place, action in the first seconds, a real-physics nod in the first minute, about five to six
minutes, tension to the last frame), the rule of 29 October 2026 (**the story clock only runs forward**) and "more new
scenery" (4 November): a hilltop funfair, a motorway and an airport in the valley below it, a car on the motorway, its
verge, a flight deck, a control tower, a rollercoaster's front seat and the space station. No kitchen, flat, street,
city, train or beach set reused.

One clock (`NB_CLOCK`, `script.js`) runs from Saturday 3:29:57 PM to 4:43:04 PM:

| film | story | speed |
|---|---|---|
| 0:00–0:02.85 | 3:29:57.15–3:30:00 | real speed, under the title |
| 0:02.85–0:34.75 | 3:30:00.00–01.50 | 21× slower (the Moon's last light at 0:29.25) |
| 0:34.75–3:59.25 | 3:30:01.50–07.00 | 37× slower |
| 3:59.25–4:08.9 | 3:30:07.00–10.00 | 3× slower (the count) |
| 4:08.9–4:19.25 | 3:30:10.00–11.26 | 8× slower (the Moon back at 4:19.1) |
| 4:19.25–4:30.35 | 3:30:11.26–22.36 | real speed |
| 4:30.35–4:41.45 | 3:32:10–3:32:21 | real speed, after a "+2 min" jump at the cut |
| 4:41.45–5:01.4 | 4:42:44–4:43:04 PM | real speed, after a jump at the cut; Saturn goes out at 4:52.1 |

The HUD says how slowly the clock runs, or how far it jumped. `script.js` throws if the clock runs backwards, and if
the captions that name a moment ("There goes the Moon", "The Moon comes back last", "There is none") don't sit on it;
`shots.js` throws if the clock jumps anywhere but on a cut.

The film is told by:
- 58 short second-person captions;
- the HUD: light bouncing 0% or 100%, back in …, the next moment, the clock;
- one context box per beat;
- labels pinned in the scene;
- insets: the Moon's light-time, Rayleigh scattering, the electron, the 306 m blind, a fibre, the undersea cables, the
  energy, your pupil, Saturn's light-time;
- one-line footnotes, the honest "APPROX." ones included;
- the sound.

Page `light-no-bounce.html`, code `films/light-no-bounce/`. Every number is in `PLAN.md` § 2 (computed in
`physics.js`); captions are in `CAPTIONS.md`.

**The physical reading.** From Saturday 21 November 2026, 3:30:00 PM, for ten seconds nothing anywhere reflects or
scatters light, of any colour, from radio to X-rays. Light goes straight on through clear things (air, glass, water,
your eyes' lenses: bending stays) or is absorbed. Everything that makes its own light carries on.

**The one impossible part**, said at 1:17: reflection, scattering and refraction are the same electrons shaking with
the light, so there is no switch for only one of them.

The Sun, the Moon and Saturn are where an ephemeris puts them for that day and place (51.5° N; checked by the physics
review). What follows:

- **Only light sources are visible.** Everything else is pure black, seen only as a shape against a source:
  - your reflection goes from the Fun House's mirror;
  - you can't see your hands, only your phone's screen (an OLED screen makes its own light; an LCD bounces its backlight
    and goes dark, so the sat-nav and the flight deck's displays go out);
  - 400 people around you show only as phone screens and the bulbs they block;
  - something with bear's ears stands between you and the DOUGHNUTS sign, and comes closer.
- **Old light is still on its way.** The Moon (372,500 km that day, 1.24 light-seconds) shines on for 1.24 s and goes,
  and comes back 1.24 s after everything else. Saturn (8.77 AU, 72.9 light-minutes) shines on all through. At
  4:42:55 PM the light it would have bounced at 3:30 should arrive, and there is none: Saturn goes out for ten
  seconds.
- **The sky goes black at 3:30 PM**, because a blue sky is sunlight bouncing off air (Rayleigh: blue about 4× more
  than red, (650/450)⁴ = 4.35). The stars come out, and the low Sun (3.9° up, through about 12 air masses) arrives
  whole: white, and 3× brighter in clean air, up to about 10× with haze.
- **About 58 million drivers** (1.45 billion cars, about 4% moving) see only each other's lights, and their cars' radar
  is blind. At 110 km/h, ten seconds is 306 m.
- **A plane on final approach** lands on the runway's lights alone. Radar is light too, so the tower's primary radar
  gets no echoes, but the plane's transponder sends its own signal.
- **The internet's glass fibres go dark**, because they hold light by bouncing it. That includes about 600 undersea
  cables (about 99% of traffic between continents) and the satellite links (dishes and lasers): ≈ 0% left.
- **From the space station** the Earth is gone, except the lights that shine upwards.
- **Everything absorbs the sunlight it used to bounce.** Earth's albedo 0.30 falling to 0 for ten seconds is
  5.2 × 10¹⁷ J, about 8,300 Hiroshima bombs (Earth absorbs about 19,000 every 10 s anyway: +43%).
- **Your pupils open** (2.5 → 6.6 mm, 7× the light), so more stars appear and more of the Sun gets in. At 3:30:10 a
  white-out, then a dazzle while they close.

## Shot list (current cut, 39 shots)

| time | what | clock |
|---|---|---|
| 0:00–0:06 | the title over your reflection in the Fun House's wavy middle mirror (bulbs up its red pillars), you filming yourself, the carousel's organ playing, someone in a bear suit walking in behind you; at 0:02.85 the mirror goes black between its bulbs | 3:29:57 → 3:30:00.15 |
| 0:06–0:16 | the fair in the dark: only its bulbs, signs and phone screens | 00.15–00.61 (21× slower) |
| 0:16–0:35 | at the fence: the Moon still there; at 0:29.25 its last light arrives and it goes; the frame opens out to the valley's lights | 00.61–01.50 |
| 0:35–1:07 | the sky black at 3:30 PM (the Rayleigh inset), the Sun white, the stars; only light sources | 01.50–02.37 (37× slower) |
| 1:07–1:27 | your phone floating in the dark; the impossible part (the electron inset) | 02.37–02.91 |
| 1:27–1:44 | 400 people you can't see, only their phones; something passes in front of the DOUGHNUTS sign | 02.91–03.36 |
| 1:44–2:23 | the motorway from the hill; at the wheel at 110 km/h behind a car braking blind; the verge; a plane landing across the valley, its flight deck dark but for its own lights, the tower's radar with no echoes | 03.36–04.41 |
| 2:23–2:27 | "It hasn't moved." | 04.41–04.52 |
| 2:27–2:47 | your friend's rollercoaster (its track a ribbon of lights, her view), the fire juggler | 04.52–05.07 |
| 2:47–3:15 | your video stops sending; the internet's glass threads and the undersea cables dark; from the space station, only the lights that shine upwards | 05.07–05.80 |
| 3:15–3:24 | "It's closer." Sound still bounces: you can hear it breathing | 05.80–06.04 |
| 3:24–3:59 | the heat (8,300 bombs, the dots filling); Saturn shines on (73 light-minutes); your pupils open; don't look at the Sun | 06.04–07.00 |
| 3:59–4:09 | "Whatever is near you, you'll see it in 3 seconds": 3 · 2 · 1 | 07.00–10.00 (3× slower) |
| 4:09–4:18 | 3:30:10: a white-out, then the bear's face a metre from yours, its mouth a black hole, paws up | 10.00–11.16 (8× slower) |
| 4:18–4:24 | the Moon comes back last, 1.24 s late, over the valley | 11.16–15.8 (real speed from 4:19.25) |
| 4:24–4:30 | on the verge: the pile-up, cars spun across the lanes, hazards, alarms | 15.8–22.4 |
| 4:30–4:41 | +2 minutes: every video of it is black with dots; the internet finding its way back; sirens | 3:32:10 PM |
| 4:41–5:01 | 4:42 PM: the hilltop at the fence watching Saturn, their phones held up; at 4:52.1 it goes out; "Seen from Saturn, the Earth just went dark."; "What would you have done?", cut on the last frame | 4:42:44–4:43:04 PM |

## How it follows the owner's lessons and playbook

- **Everyday place, human scale:** a Saturday afternoon at a funfair, with a friend on the rollercoaster. The
  motorway, the airport and the space station are seen from it, or cut to as "meanwhile". All new sets.
- **Action on frame 1:** you are filming yourself in a wavy mirror under the title, and something in a bear suit walks
  up behind you. At 0:02.85 your reflection goes.
- **Real nuance in the first minute:** the Moon's 1.2 light-seconds (0:16–0:29), why the sky is blue (0:39), and at
  1:17 why the premise is impossible.
- **A stake by 1:40, kept alive:** something passes between you and the lights (1:40), "It hasn't moved." (2:23),
  "It's closer." (3:15), the count (3:59), the reveal (4:09).
- **No clock resets:** one forward clock. The slow minutes say how slowly; every jump says how far.
- **Length:** about five minutes (5:01), no recap. The ending (4:42 PM, Saturn) is new information, not a summary.
- **Not an "X kept getting slower" derivative:** the dark is ten seconds long, and the film is about seeing.
- **Teaser Shorts:** the reflection going (0:00–0:16), the Moon going out (0:16–0:35), something in the dark (1:40,
  2:23, 3:15), the count and the reveal (3:59–4:18), Saturn going out (4:41–5:01).
- **Thumbnails** (house style, real frames):
  - `thumb-bear.jpg`: 10 seconds, "and someone was right here", "You couldn't see who was in front of you.";
  - `thumb-crowd.jpg`: 400, "and you can't see one of them", "Only their phones, and the lights they block.";
  - `thumb-motorway.jpg`: 58 million, "and still they're moving", "At 110 km/h, 10 seconds is 300 metres blind.".

## Reviews

One round, three independent reviewers on the first full cut (5:25; contact sheets and stills of every shot, the
caption timeline, the physics), before the fixes. Scores as given:

- **Story and retention 5/10.**
  - Strong premise and three real ideas (the Moon's old light, the thing in the dark, Saturn's echo); the clock rule
    holds.
  - But from 0:03 to 4:25 the frames were almost all black with dots, so the captions carried everything.
  - The mirror read as a window, and "Your reflection is gone" came 11 s late.
  - The Moon was followed by 5 s of pure black.
  - The middle was a list of ten stops with the same "X can't see Y" pattern; the horror thread dropped for
    2.5 minutes.
  - Pictures didn't match captions (one phone for "only their phones", the speedometer at 70 against 110 km/h).
  - The reveal was spent before it was said, and a smiling mascot turned it comic.
  - 4:40–5:08 was a recap, and the Saturn ending was one pixel on an empty sky.
- **Visuals 4/10.**
  - A third of the dark section showed almost nothing; labels pointed at empty black; text clipped or collided
    throughout.
  - Weakest: the crowd (one phone, no blocked bulbs), "something passed" (invisible), the coaster and dodgems (faint
    dots), the black Moon and sky shots, the heat shot (a ring on empty sky), the Moon's return into a flat grey void,
    a crash shot with orderly traffic.
  - Strongest: the daylight fair, the bear's face, the juggler's torches, the first dark fair, the dashboard, the
    Earth's edge from the station.
- **Physics 7/10.**
  - Core reasoning right and honestly framed (the Moon, Saturn's single gap, Rayleigh, 306 m, 8,300 bombs, radar
    against transponder, fibres, the admitted impossibility).
  - Errors:
    - Saturn's time: 4:42:10 against the true 4:42:55;
    - the air mass: 11× against about 12×;
    - "white things heat up like black ones": wrong under the film's own rule, they turn see-through;
    - a road inset that read 0.4 s for 3.7 s;
    - the speedometer;
    - "1% left" of the internet: ≈ 0%;
    - the Moon's distance: the average 384,400 km against that day's 372,500 km.
  - Loose: LCD screens and headlights drawn as making their own light; "3× brighter" ignoring haze; "the light it
    didn't bounce"; "blinding" for a sub-second dazzle; city glow from orbit.

**Fixed after the round** (the cut was restructured, not patched):

- **The ephemeris.** The Moon at 372,500 km (1.24 s, "1.2" in the captions); Saturn at 72.9 light-minutes, going out
  at 4:42:55; the Sun 3.9° up through about 12 air masses, "3–10× brighter".
- **A new hook.** You film yourself in the wavy middle mirror, close, with bulbs up its pillars and the glass visibly
  warping; the bear walks in behind you; "Your reflection is gone." at 0:04, and the mirror stays black between its
  bulbs. The mirror diagram is gone. The Moon's black frame is now about a second before the valley's lights open
  out.
- **A thriller thread through the middle.** Something with bear's ears crosses the lit DOUGHNUTS sign (1:40), "It
  hasn't moved." (2:23), "It's closer. Sound still bounces. You can hear it breathing." (3:15), then the count and the
  reveal. The bear's smile became an open black mouth, paws raised.
- **Shorter.** The dodgems, the lasers and the recap captions are cut; the plane no longer undoes its own tension;
  the heat shows its Sun in frame.
- **The ending.** The people at the fence hold their phones up under Saturn, with the Moon bright beside it. Saturn
  goes out at 4:52.1 and the film ends while it is still dark. The HUD says "SATURN: DARK", not when it comes back.
- **Physics wording.** "White things heat up like black ones" is gone (the heat beat now says everything soaks up the
  sunlight it used to bounce); OLED against LCD (the sat-nav
  and the flight deck's screens go dark); headlights as bare bulbs; radar blind; "≈ 0% left"; "the light it would
  have bounced"; "It's dazzling", with the white-out gone in under a second; "the lights that shine upwards".
- **Pictures matched to captions.**
  - Your car really is at 110 km/h (a clear lane ahead, the speedometer at 107 by 3:30:03.5), and the label names
    the car ahead in your lane.
  - The crowd's phone screens glow cool white and big enough to count.
  - The coaster's track is a dense ribbon of lights with the train a gap in it.
  - The pile-up is seen from the verge: cars spun across the lanes, hazards, alarms close by.
- **The HUD.**
  - Labels and insets are kept clear of the panels and of each other; inset text shrinks to fit.
  - The footnotes are one line and step aside when a caption runs to two.
  - "ROUGH:" became "APPROX.:".
  - The count numeral is moved off the bear's silhouette.

These fixes were checked on stills, not re-scored.

## What is still weak

- Story 5/10, visuals 4/10 and physics 7/10 were the scores before the fixes; the fixes have not been re-scored.
- The middle (1:44–3:15) is still a tour of places, about 10–15 s each, held together by the cut-backs to the shape
  in front of you.
- Much of the film is dots on black, by design. On a phone the dark shots read best at full screen.
- The reflection is small: you are 3 m from the mirror, so your face is a few percent of the frame.
- The Moon's return is a small disc in a pale sky.
- The pile-up reads as spun, stopped cars; there is no smoke or debris.
- The people are the house's simple low-poly figures; the far crowd is capsules.

## Sound

All synthesised and seeded (`sound-*.js`, `mix.js`). It is baked into `soundtrack.js` with the film-side fingerprint
fix, so the ZIP plays its sound outside Chrome too.

- **Score.** An original score in a cold A minor: string pads, a felt piano also played backwards, glass bells, a low
  drum, a heartbeat that quickens as the shape comes closer, a music box over the carousel's organ before 3:30, the
  endless rise under the count, a dazzling A major chord at 3:30:10, a stinger on the reveal, and the motif a note
  short at the end, cut on the last frame.
- **Beds** for each place, all running at the world's own speed while nothing bounces: a quarter, so the fair's
  400-voice murmur sinks two octaves and drags; they rise through the count and snap back at 3:30:10. The places:
  - the fair's murmur, generators and rides;
  - the valley's wind and the motorway far below;
  - your car, the verge, the flight deck, the tower;
  - the coaster's wind, the station's fans;
  - the jam after the crash: idling engines and wind.
- **Effects:**
  - the carousel's band organ, running down like tape at 3:30;
  - the crowd's cries, slowed;
  - something passing you, then rustling, a step, a breath: sound still bounces;
  - horns and squeals on the motorway, the flight deck's chime, the tower's squelch and warning beeps;
  - the coaster, the juggler's torches, your video not sending, metal roofs ticking in the heat;
  - the riser into 3:30:10, 400 people screaming, the person in the bear suit gasping and stumbling;
  - on the verge: car alarms close by, horns, one more crash up the road;
  - your phone filling with messages, sirens;
  - the crowd's soft "oh" when Saturn goes out.

**Mix.** −15.2 LUFS integrated, −2.4 dBTP, loudness range 7.0 LU (the baked WAV). The mastered
`final-soundtrack.m4a` (AAC 256k, through a limiter at −3 dB) measures −15.3 LUFS and −2.6 dBTP;
`small-soundtrack.m4a` (AAC 128k, for the phone-size copy) measures −15.3 LUFS and −2.2 dBTP.

**The score leads** (the owner's rule of 31 October 2026), measured stem by stem in 10-second windows across the whole
film:
- over the beds: 7.4 to 18.5 dB (median 11.8 dB). The closest is 3:30:10, when 400 people scream at once.
- over the effects: 6.1 to 24.1 dB (median 12.0 dB). The closest is the same screams; the driver's horns came down
  4 dB to sit 7.4 dB under the score.
- stem trims: music +2.5, beds −6.5, effects −4.5 dB (`mix.js`).

## Delivery

- **Runnable ZIP** `light-no-bounce-film.zip` (in the project files): extract it, open `light-no-bounce.html` in Chrome
  or Edge, wait for SOUND READY, press Space. The soundtrack is baked in and checked against the code's fingerprint.
- **Final 1080p MP4** on the owner's PC (graphics card), one command in the repo folder after pulling this branch:
  `node films/light-no-bounce/render-gpu.cjs --channel chrome --workers 2 --out D:\renders\light-no-bounce --small`.
  - It makes `D:\renders\light-no-bounce\light-no-bounce_final_1080p.mp4`: 1920×1080, 30 fps, H.264 CRF 18, 5:01,
    with the mastered soundtrack `final-soundtrack.m4a` copied in.
  - With `--small` it also makes `light-no-bounce_final_small.mp4` (1280×720, under 30 MiB).
  - It is resumable: run it again and finished segments are kept.

## Files

- page `light-no-bounce.html`; code and plan `films/light-no-bounce/`
- runnable ZIP, report and thumbnails: `/mnt/project-files/light-no-bounce/`
