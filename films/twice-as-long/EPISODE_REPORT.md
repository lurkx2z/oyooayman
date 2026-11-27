# Episode report — *What If Every Step You Took Was Twice as Long?*

**Format.** 16:9 long-form, 1920×1080, 30 fps, **8:19** (499.3 s). Narrated (ElevenLabs, voice Michael, 79 clips made
in GitHub Actions with the repository secret; never cut, sped up or regenerated), in the new recipe from the niche study
of 27 November 2026: open on the craziest frame (step ninety), then "And this is step one", no title card; a ladder of
famous labelled things; "you" as a character with a face; bright daylight on Earth, dark only in space; destruction and
reacting crowds; minimal bold text; 123 shots (a new picture every 2–3 s in the first 15 s, then 6–10 a minute).

**The rule.** Monday morning, late for work, Brooklyn Heights. Every step lands twice as far as the last one and still
takes one second on your watch. Step n is 0.75 m × 2ⁿ⁻¹. Everything else follows real physics, and the shortcuts are
tagged on screen.

**What follows** (all from `steps.js`; `script.js` checks every number the narrator says against the code and the page
refuses to run if one is wrong): step 8 is longer than the Statue of Liberty, step 10 is the height of the Empire State
Building and faster than sound (the boom breaks every window on the street), step 13 is Mach 9 and the air glows, step 14
misses your office by 4 km, step 15 beats escape velocity, steps 16–20 burn over New England like a meteor, step 21 is
space, step 29 passes the Moon at 56 % of light speed. Step 30 can't be taken in one second without beating light, so
your clock slows: on Earth step 30 takes 1.7 s (√(1 + (L/c)²)), step 37 three minutes, step 46 a day. From then on
Earth's years pile up: a month (step 50), posters at home, six years (Proxima, step 56), and turning round at step 57
would land you behind your front door eleven years after you left. You keep going: ninety years, fifteen hundred, out of
the Milky Way (step 70), longer than humans have existed, past Andromeda, the cosmic web, six billion years and the red
giant, and step ninety: farther than the observable universe is wide. "Which way would you step?"

## The look
"You": a bright, reusable character (orange jacket, blue trousers, white trainers, teal backpack). Brooklyn Heights
brownstones, the Promenade, the Brooklyn Bridge, Manhattan and Central Park in morning sun; New England from the air;
Boston's Esplanade; the Space Station, the Moon, Mars, Jupiter, Saturn, Pluto and Voyager 1 as slow-motion flybys with
you in front; Proxima Centauri, the Orion Nebula, the Milky Way, Andromeda, the cosmic web, the red giant and the
observable universe. The HUD: STEP and a giant number top left, one status line under it (the step's length, your
speed, then Earth's clock), labels pinned to things, a few diagrams, and an honest tag at the bottom.

## Sound
- **Score** (synthesised): two ideas, the step (a note and its octave: twice the frequency) and home (G E C falling).
  C major plucks on the street, A minor building to the boom, which cuts the music dead; D minor through Manhattan; D
  major in space; the strings bend down at "Time"; a hit on every planet; the biggest moment at step seventy; one bell
  on the question.
- **Beds**: the street, the wind of your wake, the high air, the Esplanade, space's floor, home in the evening, the deep.
  **Effects**: every step, the crack, the boom and the glass, car alarms, craters, the meteor, Boston's gasp, a whoosh
  for every famous thing, the watch and Earth's clock. No breathing loop.
- **Mix.** The rendered WAV: −15.2 LUFS integrated, −1.5 dBTP. `final-soundtrack.m4a` (AAC 256k, limiter at −3 dB):
  −15.3 LUFS, −2.6 dBTP, LRA 5.0 LU. `small-soundtrack.m4a` (AAC 128k): −15.4 LUFS, −2.7 dBTP.
- **The music leads** (the owner's rule), measured stem by stem (solo renders, K-weighted, 10-second windows, stem gains
  added): the score is 11.8 dB or more over the beds in every window. The first measurement had the beds level with
  the score on the street; the narrated balance is now music +9 dB, beds −12, effects −6, master −2.5.

## Reviews
Three independent reviews of the full preview, scores as given:
- **Retention**: hook 4, pacing 4, clarity 7, payoff 5, recipe 5, **overall 5/10**.
- **Picture**: image 5, composition 4.5, readability 5, character 6, famous things 4, **overall 5/10**.
- **Science**: numbers 8, consequences 6.5, honesty 7, hard to dunk on 5, **overall 7/10** (every spoken number checked
  out; one wrong astronomy claim and several on-screen numbers that disagreed with each other).

**Fixed after the reviews:** the planets and the Moon were tiny dots (now slow-motion flybys past you); a camera inside
a house wall; the Earth at the red giant was a black disc (now a lit, half-molten crescent); the cold open now pulls
back from your face; a stiff arms-out floating pose; the Statue of Liberty was a pale cone in haze; the meteor was a
white smear; the Space Station showed no solar wings; the cosmic web didn't read (the pull-out now ends on a face-on
slice, labelled); the observable universe looked like the edge of everything (galaxies now carry on past it, labelled
"all we can see from Earth"); far windows shimmered; a "stray line" (police tape, now on posts); an empty street after
the boom (glass glittering, people ducking then staring); no rim light in space; colliding labels in the rule diagram.
On screen: Earth's clock now says what this one step took (to step 49), then how long you've been gone, so the number
on screen is the number you hear; the race diagrams show Earth's clock (light still wins); the red giant is labelled
7.6 billion years with a tag that at 6 billion the Sun has only begun to swell; the phone can't receive calls; new tags
for the ISS trip, the meteor's blast, looking back at full speed, the step back's aim (the zigzag through New York puts
it about 2 km off), the expansion of the universe and the cosmic web; "placed on your path" on Proxima, Orion and
Andromeda.

**Still weak, said plainly** (no second round of reviews was run after the fixes): the light-barrier lecture (4:03–4:43)
is the slowest stretch; the trousers turn pinkish inside the heat glow; the curve shot crops your head close to the top;
the watch close-up is plain; the narration still says "the Sun has swollen into a red giant" at six billion years (the
tag corrects it).

## Delivery
- **Runnable ZIP** `twice-as-long-film.zip` (in the project files): extract it, open `twice-as-long.html` in Chrome or
  Edge, click to play. The soundtrack is baked in (fingerprint matched; tested on a fresh unzip: boots, SOUND READY at
  once, no console errors).
- **Thumbnails**: `thumb-step90.jpg` (step ninety, 98 billion light years), `thumb-mach9.jpg` (step thirteen, the air
  on fire), `thumb-moon.jpg` (step twenty-nine, half light speed).
- **Thumbnails for YouTube Test & compare** (27 November 2026, after a 3.3 % click-through rate on the first one; one
  idea each, the same "you", bold type, about four words): `thumb-test-step30.jpg` (one foot on New York, the other on
  the Moon: step 30 is 402,700 km, about the Earth–Moon distance), `thumb-test-6000km.jpg` (a city-sized footprint seen
  from above, "1 STEP = 6,000 KM": step 24 is 6,291 km), `thumb-test-cantstop.jpg` (your shocked face, the Earth small
  behind you, "CAN'T STOP"). Rendered with the film's own character, Earth and Moon, composed at 1280×720.
- **Final render** on the owner's PC (27 November 2026, from commit bd97d54, Chrome on the GPU, 2 workers, 15 min in
  all): **upload `D:\renders\twice-as-long\twice-as-long_final_1080p.mp4`** (1920×1080, 499.3 s, 957.5 MiB, −15.3
  LUFS, −2.6 dBTP); the small copy `twice-as-long_final_small.mp4` (1280×720, 26.1 MiB, −15.4 LUFS, −2.7 dBTP). The 8
  check frames (steps 5 to 86) are all correct.

## Files
`twice-as-long.html`; `films/twice-as-long/`: `PLAN.md`, `NARRATION.md`, `narration/` (the 79 clips and their word timings), `narration-timing.js`,
`narration-audio.js`, `build-timing.cjs`, `steps.js`, `script.js`, `shots.js`, `kit.js`, `cast.js`, `fx.js`, `film.js`,
`hud.js`, `nyc.js`, `street.js`, `nyc-set.js`, `sky.js`, `boston.js`, `cosmos.js`, `space.js`, `deep.js`, `audiokit.js`,
`audio.js`, `mix.js`, `sound-lib.js`, `sound-music.js`, `sound-amb.js`, `sound-sfx.js`, `soundtrack.js` (baked),
`final-soundtrack.m4a`, `small-soundtrack.m4a`, `render-gpu.cjs`.
