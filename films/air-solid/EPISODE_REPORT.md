# Episode report — *What if air became solid for 3 seconds?*

**Format.** 16:9 long-form, 1920×1080, 30 fps, 5:29 (329.2 s). Voiceless, in the Slower light / Friction 10s / Gravity
tilts formula, built to the owner's YouTube lessons of 28 October 2026 (an everyday place, action in the first
seconds, a real-physics nod in the first minute, about five to six minutes, tension to the last frame) and the rule of
29 October 2026: **the story clock only runs forward**. One clock (`SA_CLOCK`, `script.js`) runs from Sunday
1:59:59.97 PM to 2:02:30 PM: real speed under the title, slow motion into the lock, then the three seconds stretched
over 3 min 45 s ("110× SLOWER" on the HUD: every new angle is a few thousandths of a second later than the last), the
last second ×0.1, the release ×0.05, the park falling ×0.2, then real speed with forward jumps at cuts ("+20 s",
"+40 s", "a minute", "two minutes"). `script.js` throws if the clock runs backwards and `shots.js` throws if it jumps
anywhere but on a cut. The film is told by 63 short second-person captions, a countdown ("THE AIR IS SOLID FOR
2.837 s"), the clock with milliseconds, one context line per beat, labels pinned in the scene, insets (the speed
ladder, a cube of air, the bell's sound), honest tags and the sound. Page `air-solid.html`, code `films/air-solid/`,
every number in `PLAN.md` § 2 (computed in `physics.js`), captions `CAPTIONS.md`.

**The physical reading.** At 2:00:00.000 PM all the air on Earth sets solid where it stands, for exactly 3 seconds.
It keeps its weight, temperature and density (1.2 kg/m³); nothing can push through it and it can't move. **That is
the one impossible part**, and the film says so at 0:40 after the real thing: real air does turn solid, below
−210 °C, shrinking about 800 times. Everything else follows:

- anything moving through air stops dead in that instant: a body stopped from speed v is hit like a belly flop from
  h = v²/2g. The ladder climbs from walking (5 km/h, 10 cm) through your cat (3 m/s, 46 cm), running (48 cm),
  cycling (1.6 m), the car (3.5 m), a pigeon (5.1 m) and the main road (50 km/h, 9.8 m, almost as high as your
  12 m window) to motorways (110 km/h, 48 m);
- sound is air moving, so for three seconds there is none: you hear your heartbeat through your bones (70 bpm, beats
  at 2:00:00.45, 01.30 and 02.15); the church bell's first stroke was 41 m out from the tower when the air set, and
  when it lets go the frozen pulse splits in two (d'Alembert): half reaches your window at 2:00:03.144, half goes
  back to the tower; the hammer, stuck in the belfry's air, strikes the second stroke late;
- every wind on Earth stops: its spin goes into the planet, and the day is about 2 thousandths of a second shorter
  (for now; it comes back as the winds rebuild over hours);
- at 2:00:03 everything starts again **from a standstill**: the girl off the climbing frame drops 1.1 m, the runner
  10 cm up mid-stride lands and tips over (an inverted pendulum), the bike with no speed to steer with falls on its
  side, the swing carries on from the top of its arc, the fountain's frozen column drops into the basin;
- every running engine stopped at 2:00 (the air in its cylinders set); a minute later few have been restarted;
- about 10,000 airliners were in the air (a stand-in number, labelled; flight trackers show 8,000–12,000), most at
  900 km/h: by the formula a 3.2 km belly flop, but no real fall lands that hard (terminal speed ~55 m/s), so the
  caption and the ladder say exactly that.

## Shot list (current cut, 44 shots)

| time | what | clock |
|---|---|---|
| 0:00 | the title over your kitchen: you pour a glass of water, the radio plays, your cat jumps off the table (slow motion) | 1:59:59.97 |
| 0:03 | through your eyes: the jug, the stream, your hand; the radio cuts dead; "Three seconds is nothing. Unless you were moving." | 2:00:00.000 |
| 0:18–0:32 | everything stopped: the water stream, the cat in mid-air (from the floor, the gap under her) | ×110 slower |
| 0:32–1:44 | you frozen at the table, can't breathe or blink; real solid air and the impossible part (the cube); the silence: the bell you didn't hear, your heartbeat; the steam in curls, the dust; the clock's stuck second hand; your cat is fine (46 cm) | 2:00:00.0–00.9 |
| 1:45–2:28 | the window; the pigeon in mid-wingbeat (5.1 m); walkers (10 cm); the cyclist (1.6 m); the car and its driver (3.5 m) | 2:00:00.9–01.3 |
| 2:28–3:12 | the fountain turned to glass, the carp under the locked surface; the girl off the climbing frame; the boy at the top of his swing; the dog 30 cm from its frisbee; the runner in flight (48 cm) | 2:00:01.3–01.7 |
| 3:14–3:41 | the main road (9.8 m) and motorways (48 m); every wind on Earth stops, the day 2 ms shorter | 2:00:01.7–02.0 |
| 3:41–3:51 | one second left, counted down big, from the window and through your eyes | ×10 slower |
| ★ 3:51–4:00 | **2:00:03: it's air again**; everyone breathes in at once; the water lands in the glass, the cat lands | ×20 slower |
| 4:00–4:18 | the park falling from a standstill: the girl, the runner tipping over, the bike, the swing | ×5 slower |
| 4:18–4:28 | the bell's frozen stroke split in two: half to you, half back to the tower | real speed |
| 4:28–5:00 | +20 s: bruises; +40 s: every engine stopped, nobody has restarted (a starter that won't catch); a minute later: the first sirens, a police car down the middle of the road | 2:00:23–2:01:03 |
| 5:00–5:27 | two minutes later: hardly a breath of wind, chimney smoke straight up, the flag limp; the planes: "No fall from any height lands that hard." | 2:02:00–2:02:30 |
| 5:27–5:29 | "How fast were you going at 2:00?", cut on the last frame | |

## How it follows the owner's lessons and playbook

- Everyday place, human scale: your 5th-floor kitchen on a Sunday afternoon, the street below, the park across the
  road, the main road past the park.
- Action on frame 1: you are pouring and the cat is jumping under the title; the radio cuts dead at 2.85 s.
- Real nuance in the first minute: real air does turn solid (below −210 °C, about 800 times smaller), at 0:40; this
  air didn't shrink and can't move: that's the impossible part.
- A stake by 0:17: "Three seconds is nothing. Unless you were moving." Every scene after it is a speed and the hit it
  means, climbing from 10 cm to 48 m, then the whole planet's winds.
- No clock resets: one forward clock; while the air is solid every new angle is a few thousandths of a second later.
- About five and a half minutes (5:29), no recap; the aftermath gets colder (stalled cars, sirens, no wind) and ends
  on the planes and the question.
- Not an "X kept getting slower" derivative.
- Teaser Shorts: the cat in mid-air (0:18–0:32), the pigeon and the car (1:50–2:28), 2:00:03 and the park falling
  (3:41–4:18).
- Thumbnails (house style, real frames): `thumb-cat.jpg` (3 s, "and still your cat hangs there"), `thumb-pigeon.jpg`
  (36 km/h, "and still in mid-wingbeat"), `thumb-road.jpg` (50 km/h, "and still no one can breathe"), and on request `thumb-pour.jpg` (3 s, through your
  eyes: the jug, the stream stopped halfway into the glass, "and still the water won't fall").

## Reviews

One round, three independent reviewers on the first cut (preview stills and contact sheets of every shot), before the
fixes. Scores as given:

- **Story and retention 6/10**: a list-like park stretch (1:35–3:15), no stakes stated up front, the bell paid off
  without a set-up, the wind interrupting the speed ladder, a flat aftermath.
- **Physics 8/10**: every height right; "like falling flat from 3.2 km" misleading for planes (terminal speed);
  "almost the height of your kitchen" wrong (the window is meant); "no wind anywhere" overstated; wording nits (the
  cat didn't "hit" the air; below −210 °C; air that also can't move).
- **Visuals 6/10**: a weak hook (a faceless stranger pouring for 9 s), steam like straight rods, the swing boy like a
  ragdoll, the runner reading as standing (and facing the wrong way), the cat and the jumper not reading as airborne,
  HUD collisions, the carp and pigeon models, empty frames (leaves, ball, sirens, flag).

Fixed after the round (see `PLAN.md` § 5): the park cut by three beats (leaves, ball, flock); the stake at 0:13; the
bell set up in the silence; the wind moved after the motorway; the aftermath rewritten; every physics wording fix
(the ladder's airliner row now says "NO FALL LANDS THAT HARD"); the first shot after the title through your eyes; you
frozen at the table; steam in curls; the swing side-on; the runner in profile, legs apart, 10 cm up; the cat and the
girl filmed from below with the gap under them; HUD collisions cleared (caption width, the ladder below the clock,
labels off heads, the cube's labels one after the other); a new pigeon and a new koi; the carp's locked surface with
frozen ripples; a police car with flashing lights; the flag and the smoke reframed. These fixes were checked on
stills, not re-scored.

## What is still weak

- Story 6/10 and visuals 6/10 were the scores before the fixes; the fixes have not been re-scored.
- The motorway shot is the main road on a long lens, not a motorway.
- The cars on the street look parked rather than stopped mid-motion: nothing in frame says "moving a moment ago"
  except the labels.
- People are the house's simple low-poly figures; poses read at a distance, less so close up.
- The second half of the aftermath leans on the same street and park.

## Sound

All synthesised and seeded (`sound-*.js`, `mix.js`), baked into `soundtrack.js` with the film-side fingerprint fix
(rounded numbers, so the ZIP plays its sound outside Chrome too). Before 2:00: a pop song on a small radio, the pour,
the clock, the cat's claws, all cut dead at the lock. During the three seconds: no outside sound at all (the HUD says
the score is the film's), your heartbeat four times, the blood in your ears and a faint ringing. At 2:00:03: the air
rushing back, your gasp and the whole street's, the water into the glass, the cat landing, half of the bell's stroke
arriving, the radio coming back slowed. Then the park's thuds and cries, the swing creaking, car alarms, the bell's
late second stroke, a starter motor that won't catch, sirens, and no wind. Score: an ice motif (A F E D) over cold D
minor pads; a pulse through the city that tightens to the main road; a low drum on every belly flop, harder the higher;
the floor drops for the wind; a roll to the release, a breath of nothing, one hit and the film's first major chord;
thinner after; the motif without its last note on the question.

**Mix.** −15.6 LUFS integrated, −2.5 dBTP, loudness range 6.0 LU (the baked WAV); the mastered
`final-soundtrack.m4a` (AAC 256k, through a limiter at −3 dB) measures −15.6 LUFS and −2.4 dBTP, and
`small-soundtrack.m4a` (AAC 128k, for the phone-size copy) −15.7 LUFS and −2.7 dBTP. **The score leads** (the owner's
rule of 31 October 2026): measured stem by stem in 10-second windows across the whole film, the music sits 10.4 to
23.9 dB over the room, street and park beds (median 13.5 dB, unweighted RMS); during the three seconds there are no
beds at all, and the blood-in-your-ears bed under the heartbeat sits about 11 dB under the score. Stem trims music
+7, beds −8, effects +4 dB (`mix.js`).

## Delivery

- **Runnable ZIP** `air-solid-film.zip` (in the project files): extract it, open `air-solid.html` in Chrome or Edge,
  wait for SOUND READY, press Space. The soundtrack is baked in and checked against the code's fingerprint.
- **Final 1080p MP4** on the owner's PC (graphics card), one command in the repo folder after pulling this branch:
  `node films/air-solid/render-gpu.cjs --channel chrome --workers 2 --out D:\renders\air-solid --small` →
  `D:\renders\air-solid\air-solid_final_1080p.mp4` (1920×1080, 30 fps, H.264 CRF 18, the mastered soundtrack
  `final-soundtrack.m4a` copied in, 5:29) and `air-solid_final_small.mp4` (1280×720, under 30 MiB). Resumable: run it
  again and finished segments are kept.

## Files

- page `air-solid.html`; code and plan `films/air-solid/`
- runnable ZIP, report and thumbnails: `/mnt/project-files/air-solid/`
