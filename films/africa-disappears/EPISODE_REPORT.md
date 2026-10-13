# Episode report: What if Africa suddenly disappeared?

A narrated vertical short: 9:16, 1080×1920, 30 fps, **1:57 (117.07 s)**. The owner's own script, word for word, read
by the house narrator (Charlie). Page: `africa-disappears.html`. Plan and shot list: [`PLAN.md`](PLAN.md). Script and
narration settings: [`NARRATION.md`](NARRATION.md).

## Why it is 1:57, not 1:29

The script estimated about 1:29. Read naturally, the 25 clips need more time than that, and the owner's rules are that
the voice is never cut or sped up and both 3-second NO NARRATION beats stay. So the scenes stretched to fit: each
idea is set up by the narrator, then the picture and sound carry it before the next line. The owner chose the
vertical format for this film. Every picture beat is keyed to a real word time.

## How it was made

1. **Narration first.** The script was split into 25 clips (one per sentence group) and generated once with the
   repo's ElevenLabs workflow. `build-timing.cjs` turns the clips' word times into the film clock
   (`narration-timing.js`); `script.js` names every beat (`AF.mine`, `AF.ports`, `AF.silence`, …).
2. **Physics and numbers checked** (PLAN § 1). The land does not collapse or explode: it simply stops existing, a seam
   sweeping across it. What is left is a basin about 4 km deep behind a 4 km wall. The basin holds about 120 million
   km³ (about 9 % of the oceans), so it fills over weeks and sea level falls by about 300 m everywhere else.
   Coastlines move **outward**, as the last scene shows. The climate lines are labelled "ILLUSTRATION · NOT A
   FORECAST", because the script says "could change".
3. **Sets, all procedural.** A globe built from Natural Earth outlines with a filling shader (the ocean spilling over
   the rim, the fronts crossing the floor, the churn), a platinum mine, a car and battery plant, a departures board,
   Rotterdam, a chocolate aisle, a container ship in the churned Atlantic, the Congo rainforest, a Tanzanian
   waterhole, an emergency session, a phone at a kitchen table, a European harbour drying out. There are 20 shots;
   see PLAN § 2.
4. **Sound, all synthesised and seeded.** There are four stems: voice, an original score in D minor, ambience per
   shot, and event effects. `mix.js` ducks the music under the voice, and a dynamics map shapes the film's swells.
   The duck lets go before the three hits (the vanish, the silent beat, the final pull-away). A true-peak limiter
   follows. The mix is baked into `soundtrack.js`, so the page plays with sound offline.
5. **Independent reviews.** Two picture reviews (from contact sheets, the transcript and the timeline) and two sound
   reviews (from measured stems and spectra). Fixes were made after each round.
6. **Final render.** The frames were rendered on the owner's PC graphics card with `render-gpu.cjs` (Chrome,
   RTX 3060 Ti). The video is two-pass H.264 sized under 30 MiB, with the measured AAC soundtrack copied in.

## Independent reviews (scores as given)

| Review | Scores (out of 10) |
|---|---|
| Picture, first cut | viewer 6, retention 5, clarity 6, visuals 5, science 6 |
| Picture, after the first fixes | viewer 6, retention 6, clarity 6, visuals 6, science 7 |
| Sound, first mix | mix 5, sound design 5, music 6.5, dynamics/impact 4.5 |
| Sound, after the first fixes | mix 6.5, sound design 6.5, music 7, dynamics/impact 6 |

The second round of fixes (below) was not re-scored.

## What was fixed after the reviews

**After the first picture review** (its problems 1–6 of 8):
- The ocean "waited" at the rim from 8 s to 50 s, and the pour read as grey static. Now the Atlantic spills over the
  rim within seconds of the vanish, and the big pour (50–53 s) reads as falls: glassy at the lip, white down the wall.
- The mine was washed out, then a brown haze after the vanish. It now has a stronger grade and rock detail on the
  basin floor, the dust falls into the void, and the camera looks out across the floor 4 km below.
- The time tags jumped back and forth. They now use one clock counted from the vanish.
- The storm ship was generic grey, and the rain had no cause. The rain is gone, and the containers are coloured.
- The night globe was black on black, with clipped city labels. It was re-framed, with a moonlit ocean, a charcoal
  basin and readable names.
- The trade map barely changed. Now Africa's ports flare red and go, the lanes retract, and the Suez line snaps.

**After the second picture review:**
- The forest and the herd were still there on "gone" and "vanish". The seams now start on the word.
- The climate lines looked like random scratches. They were rebuilt as 120 streaming current lines with bright heads,
  which bend as the new pattern forms. (The reviewer proposed hand-placed gyres instead; that was not done.)
- The mine, Rotterdam, the forest and the coast sat in the same beige haze. Their fog was halved and their grades
  raised.
- The spindrift streaks read as rain and were removed; only the bow spray is left.
- The clock seemed to run backwards. The flashbacks are now tagged "THE SAME SECOND" (South Africa, the Congo Basin,
  Tanzania), and the pour is tagged "MEANWHILE · HOUR 1".
- The city figures on the night globe came from an old dataset, about half of today's metro populations. The numbers
  were dropped; the names stay.
- Africa's big ports are labelled on the trade map (Lagos, Tanger Med, Durban, Mombasa, Port Said, Abidjan, Dakar),
  and each one turns red on "Ports disappear".
- The presenter in the emergency session no longer covers the "MISSING: 1.58 BILLION" ticker.
- A zebra-like marbling on the wall of water (from a noisy coast-distance gradient) was removed.

**After the first sound review:** the three hits now land at full level, because the duck lets go just before them.
The slams land on the peaks of the ship's own motion. The low blows are short and saturated, so a phone speaker
carries them. There are new gulls and an elephant's trumpet. The narrator is softer for the families. The final
swell has headroom, and the sound cuts to silence on the last frame.

**After the second sound review** (its top 3):
- The silent beat and the final swell no longer drive the limiter flat. The strings were lowered, the lowest note
  was dropped from the chord, and the final swell was reduced.
- The silent beat was all low end, so a phone heard it no louder than the narration. The chord is brighter now, with
  a high crash and a reverse swell into it.
- The ocean roar competed with "the oceans begin to move". It was lowered, and now it swells in the pause before the
  line.
- The phone scene's pad was changed so it no longer beats against the ringing tone.

## What is still weak (honest)

- **The forest and the waterhole:** the canopy is soft green balls, the elephants are boxy, and the giraffe is barely
  visible.
- **The storm (61–68 s):** "Coastal regions face dangerous waves" plays over open sea. There is no harbour insert. The
  ship's container stack reads as a blocky mosaic head-on.
- **The starved line (29–32 s):** on "those supplies are gone", the line is still full of car bodies.
- **The board (43 s):** "Food, energy and manufactured goods" plays over a passenger departures board, a mild
  mismatch.
- **The mix** is still somewhat dark (low-mid heavy, 2–6 kHz well under the mids), and the limiter still works at the
  two climaxes, less than before.
- The second round of fixes was not re-scored by the reviewers.

## Deliverables

- **The film:** `africa-disappears_final.mp4`. One file, **26.3 MiB** (27,579,849 bytes), 1080×1920, 30 fps, 117.1 s,
  H.264 at about 1.7 Mb/s + AAC 160k. Soundtrack measured on the delivered file: −15.7 LUFS integrated, −1.3 dBTP
  true peak, loudness range 5.9 LU. It is in the project files under `africa-disappears/`, and on the owner's PC under
  `renders\africa-disappears\`.
- **The archive copy** (owner's PC only): `africa-disappears_master.mp4`, 440 MiB, H.264 CRF 18 + AAC 256k
  (−15.7 LUFS, −1.7 dBTP).
- **Runnable ZIP:** `africa-disappears_film.zip`. Unzip it, open `africa-disappears.html` in Chrome, and press
  Space. The sound is built in.
- **Contact sheet:** `africa-disappears_contact-sheet.jpg`, one frame every 4 s of the final file.

## Render note

Cloud renders here use software graphics (about 0.3 frames/s, two hours or more for this film). The final render ran
on the owner's PC instead: an RTX 3060 Ti, through the installed Chrome (Direct3D 11). The command was
`node films/africa-disappears/render-gpu.cjs --channel chrome`. The 3,513 frames took about 3 minutes (about
18 frames/s), and spot frames match the cloud renderer. The run is resumable. It writes 15-second H.264 segments, joins
them and copies in `final-soundtrack.m4a`. Then it makes the deliverable with two-pass H.264 and copies in
`small-soundtrack.m4a`. The 160k soundtrack is encoded once, measured, and trimmed 0.5 dB, so that the AAC overshoot
stays under −1 dBTP.
