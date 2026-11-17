# Episode report — *What if the air got 1% thinner every minute?*

**Format.** 16:9 long-form, 1920×1080, 30 fps, 5:14 (313.8 s). Voiceless, in the Gravity tilts 90° / Friction 10 s /
Gravity keeps tilting formula, built to the owner's YouTube lessons of 28 October 2026 (an everyday place, action in
the first seconds, a real-physics nod in the first minute, tension to the last frame), the rule of 29 October 2026
(**the story clock only runs forward**), "more new scenery" and "no z-fighting" (4 November) and the audio rule of
31 October (the music clearly leads, measured stem by stem). The tone is the eerie, close-to-horror feel of Slower
light, the channel's best film. The place is new: a cruise ship, the fictional *Coral Meridian* (290 m, 17 decks,
3,100 passengers and 1,200 crew), in the open Atlantic 1,500 km from land, on a sunny Saturday morning.

**Length, said plainly.** The owner's lesson asks for about six minutes. This film is 5:14: the rule runs from 10:00 AM
to the ocean boiling at 3:39 PM, and the film ends there instead of padding the middle.

Page `air-thinner.html`, code `films/air-thinner/`. Every number is in `PLAN.md` § 2 (computed in `physics.js`);
captions are in `CAPTIONS.md`.

**The rule.** From 10:00:00 AM ship's time, every minute the Earth's air loses 1% of what is left (all of its gases, the
same share at every height: the sky keeps its shape and only thins). It just goes: no wind, no storm. Nothing else
changes: the sea, the Sun, the ship, the temperatures. After n minutes 0.99ⁿ of the air is left, and the pressure falls
through every height it passes: an airliner's cabin at 10:29, half the air at 11:08, Everest at 11:56, the height where
even pure oxygen fails at 1:11 PM, then the point where water boils at its own temperature (the hot tubs at 2:26, body
temperature at 2:37, the pool at 3:27, the sea at 3:39).

**The promise in the first 10 s** (0:09.7): "You're the ship's dive instructor. Before noon, you and this girl will be
the only two from this ship still awake."

**The real physics in minute one** (0:20 to 0:47): air has weight, 10 tonnes over every square metre of the deck; you
don't feel it because it presses from every side; losing the first 1% is like climbing 85 metres; at this rate the
ocean itself boils at 3:39 this afternoon; it's the same everywhere on Earth, and there's nowhere lower than sea level.

**Generous and approximate:** each 1% step is felt over 0.35 s (the rule says "at once"); when each person passes out is
seeded between 11:03 and 11:44 rather than modelled per person; the ship slowing from 20 knots once its diesels choke is
drawn, not simulated; the breathing rates (14 and 9 litres a minute at 1 bar, slow and calm in 26 °C water) set the
8:57 PM tank deadline; the sky's brightness is taken as proportional to the air above (stars show from about 7.5% of
the air down); the world's sounds fall by 20·log₁₀(air left) dB on deck (a sound's pressure goes with the air's
density); only the top of the sea boils (at 10 m the water's own weight keeps it liquid).

## The clock (`script.js`, `clock.js`)

The story clock only runs forward. It jumps ahead 23 times, always at a cut, and the HUD clock says so ("+10 MIN
LATER"); within a shot it runs in real time. Every clock time a caption reads is checked against the HUD's clock, and
every caption that names a moment is checked to sit on it (`script.js` throws otherwise).

| film | story | what |
|---|---|---|
| 0:00–0:03.6 | before 10:00 AM | the title over the sunny pool deck; a boy's cannonball |
| 0:03.6 | 10:00:00 | the first 1% goes; the promise over the girl with her balloon |
| 0:35.2 | 10:00:53 | the forecast: the ocean boils at 3:39 |
| 0:47.9 | 10:10:51 | ears popping; her balloon swelling |
| 0:59.5 | 10:14:58 | the barometer drops below Typhoon Tip's 870 hPa |
| 1:11.3 | 10:29:49 | as thin as an airliner's cabin; sealed things swell; her balloon bursts |
| 1:26.3 | 10:35:05 | every fizzy drink foams over |
| 1:36.8 | 10:44:11 | one flight of stairs leaves people gasping; the old man by the pool |
| 1:50.3 | 10:46:01 | you, the ship's dive instructor; 10 m of sea weighs as much as the sky; 6 tanks |
| 2:10.9 | 10:52:09 | down the stairs; the lost girl; her hand |
| 2:25.0 | 11:07:59 | half the air is gone: the engines choke, black smoke |
| 2:31.7 | 11:12:57 | the big screen flickers; the power fails all over the ship |
| 2:38.8 | 11:20:07 | deck 2, as thin as 6,400 m: your sight closing in |
| 2:53.5 | 11:23:19 | the tanks on a line under the ship; you roll in with her |
| 3:04.3 | 11:25:39 | 10 m down: you can breathe; 4,300 people above you can't |
| 3:17.7 | 11:55:59 | Everest: nobody on board without oxygen is still awake |
| 3:29.7 | 12:30:09 | an oceanic whitetip circling |
| 3:44.0 | 1:11:01 PM | even pure oxygen isn't enough: the officer breathing it is out too |
| 3:50.6 | 1:18:59 | she lets go and kicks for the light; you catch her fin |
| 4:04.7 | 1:40:07 | the sky going dark |
| 4:11.0 | 2:25:58 | the hot tubs boil at 39 °C |
| 4:19.3 | 2:37:00 | water at body temperature boils |
| 4:29.7 | 3:00:05 | stars in full sunshine; 5% of the air left |
| 4:38.8 | 3:26:59 | the pool boils |
| 4:44.7 | 3:38:58 | the ocean boils (only the top); then real time to the end |
| 5:09.5–5:13.8 | 3:39 PM | "Would you take her up to see them?" |

Two countdowns run in the HUD from the start: THE SEA BOILS IN h:mm:ss (from the first minute), and YOUR AIR RUNS OUT
IN h:mm:ss (from the dive on), so every jump visibly costs hours.

## Shot list (62 shots)

| shots | film | what |
|---|---|---|
| T1 | 0–3.5 | the title over the pool deck; a boy cannonballs in, the splash under the first 1% |
| S1–S3 | 3.5–20.3 | the ship alone on the ocean; the girl with her red balloon (the promise); the pool deck |
| W1–W3 | 20.3–35.2 | under a parasol, the 10 tonnes; the terrace; the camera rising 85 m |
| B1–B2 | 35.2–47.9 | the open sea from the rail; sea level beside the hull |
| E1–E2 | 47.9–59.5 | a man working his jaw, ears popping; the balloon bigger |
| St1–St2 | 59.5–71.3 | the bridge and its barometer; the bow from low over the sea |
| C1–C3 | 71.3–86.3 | the sun deck; a crisp packet swelling; the balloon bursting |
| F1–F2 | 86.3–96.8 | the bar's drinks foaming over; one glass close |
| Sr1–Sr3 | 96.8–110.3 | people gasping on the stairs; the old man and his wife; straight down the stern to deck 2 |
| K1–K4 | 110.3–130.8 | you at the windbreak; the deck gasping; the hull from 10 m down; the dive shop's six tanks |
| D1–D3 | 130.8–144.9 | down the stairs; the girl alone, crying; her hand takes yours |
| N1–N3 | 144.9–158.8 | the funnel pouring black smoke; the ship trailing it; the big screen flickers and dies |
| M1–M3 | 158.8–173.5 | the dark marina platform; your vision tunnelling; her in her mask |
| V1–V3 | 173.5–184.3 | the tanks on the line under the ship; the backward roll and splash; sinking |
| U1–U3 | 184.3–197.7 | the two of you on the line at 10 m; her breathing; the hull and the light |
| Ev1–Ev2 | 197.7–209.7 | the deck from above, everyone slumped; the old man's still hand |
| Sh1–Sh3 | 209.7–223.9 | fish; the whitetip comes in; it circles |
| O1 | 223.9–230.6 | the officer slumped on the bridge wing, his oxygen mask and its hose to the bottle |
| R1–R3 | 230.6–244.7 | she lets go; from above, she kicks for the light; you catch her fin |
| Sk1 | 244.7–250.9 | the sky going dark over the ship |
| Tb1–Tb4 | 250.9–269.7 | a hot tub starts to boil; the tubs wide; the deck at body temperature; you two, calm |
| Sr4–Sr5 | 269.7–278.8 | stars in full sunshine over the dead ship; stars over the funnel |
| Se1–Se3 | 278.8–297.1 | the pool boiling; the ocean boiling from the marina; the boiling surface from below |
| L1–L2 | 297.1–308.9 | close on you and your tank; the girl from behind, against the light |
| Q1 | 308.9–313.8 | from 4.5 m below: the two of you small under the hull; the question |

## How it follows the owner's lessons

- **Action in the first 5 s:** the title is already the pool deck: a boy's cannonball, and at 0:03.6 the first 1%
  goes, with the score's first toll. At 0:09.7 the promise: you and this girl will be the only two still awake.
- **Real physics in minute one:** the weight of the air, why you don't feel it, the first 1% as 85 m of height, and the
  3:39 PM forecast, all before 0:47.
- **Everyday, human-scale, new scenery:** a cruise ship's pool deck, bar, stairwells, bridge wing, dive shop and marina,
  the open Atlantic and the sea under the hull. None of the earlier films' sets.
- **The story clock only runs forward:** no replays; 23 forward jumps at cuts, each shown on the HUD clock.
- **Tension to the last frame, no recap:** a promise at 0:10, a goal for you from 1:50 (get her and the tanks under 10 m of sea), the
  pass-out race on deck 2, the countdowns, the shark, her letting go, then the last tank's deadline and a question that
  asks what you would do with her.
- **The music clearly leads** (§ Sound).
- **No z-fighting**, and the picture-pitfalls list (no particle alpha over 1, no kilometre-long triangles).

## Reviews

Independent reviewers saw stills at 1 frame a second (they cannot hear) and read a brief of the story and the sound.
Scores as given.

**Round 1** (the first cut, 5:07).
- Story and retention: hook 5, clarity 7, pacing 5, tension 5, science payoff 7, ending 4, overall retention 5
  (predicted average view about 36%, range 32–40%). The reviewer recomputed the physics and found every number right,
  but four captions overselling or wrong (the drinks, the engines, the dark sky, "stars beside the Sun"). Top problems:
  tension dies once you can breathe at 3:07; the big pictures don't land (the balloon bursts out of frame, wisps of
  smoke, a black rectangle for the blackout, no sky in "the sky is going dark", no stars at phone size, the boiling sea
  reading as fog); a slow, abstract opening.
- Picture: image quality 6, composition 5, phone readability 4.5, ship and sea 6, under water 5.5, people 4, HUD and
  captions 6.5, overall 5. Weakest: a blank pale plane filling the bow shot; the man with the ears shot from behind;
  the smoke; the sky shot with no sky; a grey blimp of a shark hiding the girl; broken slumped poses; the boil as snow;
  grey murk at the end. Cheapest: featureless faces and a black rectangle for a regulator.
- **Fixed:**
  - the countdowns in the HUD (THE SEA BOILS IN, YOUR AIR RUNS OUT IN), and the HUD's height rounded to match the
    85 m caption;
  - the title: the cannonball big in frame, splashing as the first 1% lands;
  - faces on the close-up cast (eyes that blink and shut, brows, mouths that gasp), regulators with a mouthpiece and
    hose, front-facing close-ups of the man with his ears, you and the girl on the stairs;
  - one "collapsed" pose for everyone who passes out, arms and head hanging;
  - the bow shot rebuilt from low over the sea; Sr3 now looks straight down the stern, 13 decks, to the dive shop;
  - the smoke: a thick black plume from the funnel, trailing behind the ship in the aerial; the big screen flickers and
    dies with the power;
  - the sky darkens with the air left; the sky shot tilted up; stars bright enough to see on a phone, over a hard-lit
    ship in full sunshine;
  - the shark rebuilt (tapered body, pointed snout, dark back, white-tipped fins) and kept on the open side, behind you
    two; fish faded near the lens;
  - the sea boil: glossy bursting domes over the whole surface with thin steam; the boiling surface from below;
  - the dive shop dressed (BC jackets, masks, a stripe, the room around the rack); a splash as you go in; the two of you
    kept apart while sinking; no bubbles drifting past the lens;
  - the officer framed with his mask and its hose to the green bottle; the girl on the stairs no longer behind your legs;
    foam drips that stay below the rim; the funnel's band seam; clipped barometer labels; 1,500 km on the HUD;
  - captions: "can't burn all their fuel", "too little air left to light it", "stars … in full sunshine", "the gas comes
    out of them faster as less air presses down on them";
  - the ending: "Up there: stars in the afternoon. And her parents." and the question "Would you take her up to see
    them?" (it pays off her lost parents and makes the choice about her).

**Round 2** (5:08, after the fixes above).
- Story and retention: hook 5, clarity 7, pacing 5, tension 5, science payoff 8, ending 6, overall retention 5
  (predicted average view about 37%, range 32–42%). The reviewer rechecked every number against 1013 × 0.99ⁿ and found
  them right. Top problems: no protagonist and no visible threat in the first 1:46; the second half loses personal
  stakes (one 30-second threat, then spectacle around two still figures); key beats that don't read (the blackout, the
  bodies, the girl's face behind an opaque mask, the 3 PM "full sunshine" looking like moonlight). Physics flags: "Nobody
  on board is awake" at 11:56 contradicted the 1:11 PM oxygen line; "1,500 km from land" suggested land would help.
- Picture: image quality 5.5, composition 4.5, phone readability 4, ship and sea 6, under water 5, people 3.5, HUD and
  captions 6, overall 4.5. Weakest: the last shot (both figures behind the caption); the dark-sky shot (85% empty sky,
  the ship a smudge under the caption); the smoke aerial (the plume behind a HUD panel); the big screen (already dark
  before the power fails); the box masks hiding the faces; the officer's bare walls and a label over the HUD; the
  boiling surface from below; the man with his ears. Glitches: the big screen fighting its housing (a diagonal split),
  labels printed over HUD panels, the tanks hanging on a bar, the shark passing in front of the divers.
- **Fixed after round 2:**
  - the hook: "You're the ship's dive instructor. Before noon, you and this girl will be the only two from this ship
    still awake." at 0:09.7, over the girl with her balloon (it replaces "Nobody on deck felt a thing.");
  - "It's the same everywhere on Earth. And you're already at sea level: there's nowhere lower to go.";
  - the oxygen thread made consistent: "Nobody on board without oxygen is still awake." (11:56) and "1:11 PM. Even pure
    oxygen isn't enough now. The officer breathing it is out too.";
  - the big screen: it was coplanar with its housing (z-fighting); now 2 cm proud of it, brighter, and seen lit for
    2 s before the power fails on the 11:13 step;
  - dive masks with a thin frame and a clear lens (the eyes show), the strap round the head; the girl's mask close-up
    from a little below, so we see her face, not her crown;
  - reframed: the last shot from 4.5 m below with the two of you in the middle of the frame; the dark-sky shot with the
    ship above the caption; the smoke aerial from the other side, the plume streaming clear; the girl with the
    promise caption at eye level;
  - the shark's circle kept at least 3.6 m from you two; its label under it, clear of the air panel; the officer's
    label removed (the HUD panel says it); "THE SKY AROUND IT: ALMOST BLACK";
  - the tanks standing on the floor in a rack with posts; stronger direct sunlight as the air goes (sea-level air takes
    about a quarter of the Sun's beam), so the afternoon deck is harder-lit.

## What is still weak

- **The first 1:50 is still facts before a person.** The promise caption at 0:09.7 now names you and the girl, but you
  are not seen acting until the dive shop at 1:50. Round 2's predicted average view (about 37%) is below Slower
  light's 42%.
- **The second half's stakes are thin.** After the whitetip and her letting go (about 30 s of threat) the sky, the
  stars and the boil are spectacle around two still figures under water.
- **People are simple low-poly figures** (the reviewer scored them 3.5); the man by the pool still has the big ears.
- **Repeated compositions:** the pool deck and the shots along the tank line come back several times.
- **The sea surface seen from below** is a blob texture, and the 3 PM sky still reads a little like night at phone
  size, although direct sunlight is now harder.
- **Some HUD clutter** on the busy deck shots (two panels, the clock, a label).
- No third review of this final cut (the round-2 fixes above were checked with stills, not by a new reviewer).

## Sound

No narrator: the captions are silent and the sound carries the film. Three stems, everything synthesised from seeded
code (`sound-*.js`), so the soundtrack is a pure function of the film:
- **the score**, its idea the film's (the major third is the air): the title in D major with bells, drained through a
  closing filter at 10:00, then D minor. Every step of the rule seen on screen is a low toll, the film's clock. The
  theme sighs down to the tonic and lifts a semitone off it, unresolved. A heartbeat on the stairs and in the marina,
  six bells for six tanks, a hit and a low cluster when the engines choke, a dead cut when the power fails, silence on
  the roll into the sea, D major again (filtered, far off) when you can breathe under water and the third falling to
  minor for the 4,300 who can't, a slow two-note ostinato for the whitetip, bells for the stars, the film's biggest
  swell for the boil heard from under water, one bell on the question, cut on the last frame;
- **the beds**, by where the camera is: the sea along the hull, the wind of the ship's way, its machinery and 60 Hz
  hum, the crowd (chatter, then gasping, then nobody) and the steel band on the deck speakers until the power fails.
  Up top all of it is as loud as the air lets it be (a sound's pressure goes with the air's density: −6 dB at half
  the air, −26 dB at 5%), so by the afternoon the deck is all but silent. Under the sea the beds don't thin: the
  sea's hiss, the propellers while the engines run, the dead hull groaning, and the boil's roar overhead;
- **the effects**, on their story moments: each step's pressure push, the boy's cannonball, your ears popping, the
  balloon stretching and bursting, the bridge's barometer alarm, the drinks foaming over, the PA chime and a voice you
  can't make out, the valve cracked open in the dive shop, buckles, the engines choking (sixteen cylinders labouring,
  misfiring), the breakers dropping out, the tanks knocking, your two regulators (yours slow, hers quick, both
  speeding up for the shark and when she lets go), the whitetip passing, a watch ticking on a still wrist, the boiling
  sea.

**Mix.** The baked WAV: −14.5 LUFS integrated, −2.4 dB peak, loudness range 9.9 LU (wider than usual on purpose: the
air takes the sound away). The mastered `final-soundtrack.m4a` (AAC 256k, through a limiter at −3 dB) measures
−14.7 LUFS and −2.7 dB peak; `small-soundtrack.m4a` (AAC 128k, for the phone-size copy) measures −15.2 LUFS and
−3.5 dB peak. Both are 315.3 s (the film plus 1.5 s of tail).

**The score leads** (the owner's rule of 31 October 2026), measured stem by stem (solo renders, ebur128) in 10-second
windows across the whole film, with the stem gains added in:
- over the beds: minimum 8.7 dB (0:50 and 1:10, the deck's crowd and the steel band), then 9.0 dB (0:10) and
  9.5 dB (0:20); median 14.0 dB. Late in the film the beds up top are nearly silent by design.
- over the effects: median 10.2 dB. The closest is 2:00 (2.3 dB): the 2-second hiss of the valve cracked open in the
  dive shop, a story sound meant to cut through; then 3:30 (4.7 dB, the whitetip coming in and your regulators) and 3:40
  (6.1 dB). No effects play from 0:10 to 0:40, where the score and the beds carry the physics.
- stem gains: music +2.5, beds +0.5, effects −0.5 dB, master +7.5 dB, a limiter at −2.5 dBTP (`mix.js`). The score's
  rises and dips are keyed to the beats, not to film seconds.
- The baked soundtrack (`soundtrack.js`, fingerprint `c25ae13c`) carries the code's fingerprint, so the ZIP plays its
  sound outside Chrome too; `tools/check-page.cjs` reports SOUND READY after 2 s and no console errors.

## Delivery

- **Runnable ZIP** `air-thinner-film.zip` (in the project files, 8.4 MB): extract it, open `air-thinner.html` in Chrome
  or Edge on a computer, wait for SOUND READY, press Space. Tested from a fresh unzip with `tools/check-page.cjs`:
  SOUND READY after 2 s, no console errors.
- **Final 1080p MP4**, rendered on the owner's PC (graphics card) on 17 November 2026 from commit 5b923c9, the frames
  in 8 minutes (about 19 frames a second): `node films/air-thinner/render-gpu.cjs --channel chrome --workers 2 --out
  D:\renders\air-thinner --small`.
  - `D:\renders\air-thinner\air-thinner_final_1080p.mp4`: 1920×1080, 30 fps, H.264 CRF 18, 313.83 s (9,415 frames),
    981 MiB, with the mastered soundtrack `final-soundtrack.m4a` copied in: −14.7 LUFS, loudness range 9.6 LU,
    −2.7 dB peak. **This is the file to upload.**
  - `air-thinner_final_small.mp4`: 1280×720, 26.3 MiB, 313.81 s, −15.2 LUFS, −3.5 dBTP (a preview copy).
  - The command is resumable: run it again and finished segments are kept.
- **Thumbnails** (house style) in the project files: `thumb-boil.jpg` ("26 °C / AND STILL THE SEA BOILS", the sea
  boiling against the hull), `thumb-stars.jpg` ("5 % left / AND STILL THE SUN IS UP", stars and the Sun over the ship
  at 3 in the afternoon), `thumb-under.jpg` ("10 m down / AND STILL YOU CAN BREATHE", you and the girl on the tank
  line; "Above you, 4,300 people can't.").

## Files

`air-thinner.html` and `films/air-thinner/`: `CAPTIONS.md` (the story), `build-timing.cjs` → `timing.js`, `layout.js`
(where everything is), `clock.js`, `physics.js` (every number), `script.js` (the clock and the caption checks),
`shots.js`, `film.js`, `kit.js`, `cast.js` (people, masks, dive gear), `ship.js` (the *Coral Meridian*), `deck.js` (the
pool deck, the bar, the screen, the stairs, the dive shop, the marina), `sealife.js` (fish, the whitetip), `world.js`
(sea, sky, the boil), `set.js` (cameras, labels, grade), `hud.js`, `audiokit.js`, `audio.js`, `mix.js`,
`sound-lib.js`, `sound-music.js`, `sound-amb.js`, `sound-sfx.js`, `soundtrack.js` (baked), `final-soundtrack.m4a`,
`small-soundtrack.m4a`, `render-gpu.cjs`, `PLAN.md`, this report.
