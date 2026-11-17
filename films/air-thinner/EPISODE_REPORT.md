# Episode report — *What if the air got 1% thinner every minute?*

**Format.** 16:9 long-form, 1920×1080, 30 fps, 5:08 (307.75 s). Voiceless, in the Gravity tilts 90° / Friction 10 s /
Gravity keeps tilting formula, built to the owner's YouTube lessons of 28 October 2026 (an everyday place, action in
the first seconds, a real-physics nod in the first minute, tension to the last frame), the rule of 29 October 2026
(**the story clock only runs forward**), "more new scenery" and "no z-fighting" (4 November) and the audio rule of
31 October (the music clearly leads, measured stem by stem). The tone is the eerie, close-to-horror feel of Slower
light, the channel's best film. The place is new: a cruise ship, the fictional *Coral Meridian* (290 m, 17 decks,
3,100 passengers and 1,200 crew), in the open Atlantic 1,500 km from land, on a sunny Saturday morning.

**Length, said plainly.** The owner's lesson asks for about six minutes. This film is 5:08: the rule runs from 10:00 AM
to the ocean boiling at 3:39 PM, and the film ends there instead of padding the middle.

Page `air-thinner.html`, code `films/air-thinner/`. Every number is in `PLAN.md` § 2 (computed in `physics.js`);
captions are in `CAPTIONS.md`.

**The rule.** From 10:00:00 AM ship's time, every minute the Earth's air loses 1% of what is left (all of its gases, the
same share at every height: the sky keeps its shape and only thins). It just goes: no wind, no storm. Nothing else
changes: the sea, the Sun, the ship, the temperatures. After n minutes 0.99ⁿ of the air is left, and the pressure falls
through every height it passes: an airliner's cabin at 10:29, half the air at 11:08, Everest at 11:56, the height where
even pure oxygen fails at 1:11 PM, then the point where water boils at its own temperature (the hot tubs at 2:26, body
temperature at 2:37, the pool at 3:27, the sea at 3:39).

**The real physics in minute one** (0:17 to 0:43): air has weight, 10 tonnes over every square metre of the deck; you
don't feel it because it presses from every side; losing the first 1% is like climbing 85 metres; at this rate the
ocean itself boils at 3:39 this afternoon, and there's nowhere lower to go.

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
| 0:03.6 | 10:00:00 | the first 1% goes |
| 0:43.6 | 10:10:51 | ears popping; her balloon swelling |
| 0:55.2 | 10:14:58 | the barometer drops below Typhoon Tip's 870 hPa |
| 1:07.0 | 10:29:49 | as thin as an airliner's cabin; sealed things swell; her balloon bursts |
| 1:22.0 | 10:35:05 | every fizzy drink foams over |
| 1:32.5 | 10:44:11 | one flight of stairs leaves people gasping; the old man by the pool |
| 1:46.0 | 10:46:01 | you, the ship's dive instructor; 10 m of sea weighs as much as the sky; 6 tanks |
| 2:06.6 | 10:52:09 | down the stairs; the lost girl; her hand |
| 2:20.7 | 11:07:59 | half the air is gone: the engines choke, black smoke |
| 2:28.6 | 11:12:59 | the power fails all over the ship |
| 2:34.4 | 11:20:07 | deck 2, as thin as 6,400 m: your sight closing in |
| 2:49.2 | 11:23:19 | the tanks on a line under the ship; you roll in with her |
| 3:00.0 | 11:25:39 | 10 m down: you can breathe; 4,300 people above you can't |
| 3:13.4 | 11:55:59 | Everest: nobody on board is awake |
| 3:24.3 | 12:30:09 | an oceanic whitetip circling |
| 3:38.6 | 1:11:01 PM | even pure oxygen would fail now |
| 3:44.5 | 1:18:59 | she lets go and kicks for the light; you catch her fin |
| 3:58.7 | 1:40:07 | the sky going dark |
| 4:04.9 | 2:25:58 | the hot tubs boil at 39 °C; at 2:37, water at body temperature |
| 4:23.7 | 3:00:05 | stars in full sunshine; 5% of the air left |
| 4:32.8 | 3:26:59 | the pool boils |
| 4:38.7 | 3:38:58 | the ocean boils (only the top); then real time to the end |
| 5:03.5–5:07.8 | 3:39 PM | "Would you take her up to see them?" |

Two countdowns run in the HUD from the start: THE SEA BOILS IN h:mm:ss (from the first minute), and YOUR AIR RUNS OUT
IN h:mm:ss (from the dive on), so every jump visibly costs hours.

## Shot list (62 shots)

| shots | film | what |
|---|---|---|
| T1 | 0–3.5 | the title over the pool deck; a boy cannonballs in, the splash under the first 1% |
| S1–S3 | 3.5–17.2 | the ship alone on the ocean; the pool deck; the girl with her red balloon |
| W1–W3 | 17.2–32.2 | under a parasol, the 10 tonnes; the terrace; the camera rising 85 m |
| B1–B2 | 32.2–43.5 | the open sea from the rail; sea level beside the hull |
| E1–E2 | 43.5–55.1 | a man working his jaw, ears popping; the balloon bigger |
| St1–St2 | 55.1–66.9 | the bridge and its barometer; the bow from the bridge wing |
| C1–C3 | 66.9–82.0 | the sun deck; a crisp packet swelling; the balloon bursting |
| F1–F2 | 82.0–92.5 | the bar's drinks foaming over; one glass close |
| Sr1–Sr3 | 92.5–105.9 | people gasping on the stairs; the old man and his wife; straight down the stern to deck 2 |
| K1–K4 | 105.9–126.5 | you at the windbreak; the deck gasping; the hull from 10 m down; the dive shop's six tanks |
| D1–D3 | 126.5–140.6 | down the stairs; the girl alone, crying; her hand takes yours |
| N1–N3 | 140.6–154.4 | the funnel pouring black smoke; the ship trailing it; the big screen flickers and dies |
| M1–M3 | 154.4–169.2 | the dark marina platform; your vision tunnelling; her in her mask |
| V1–V3 | 169.2–179.9 | the tanks on the line under the ship; the backward roll and splash; sinking |
| U1–U3 | 179.9–193.3 | the two of you on the line at 10 m; her breathing; the hull and the light |
| Ev1–Ev2 | 193.3–204.2 | the deck from above, everyone slumped; the old man's still hand |
| Sh1–Sh3 | 204.2–218.6 | fish; the whitetip comes in; it circles |
| O1 | 218.6–224.5 | the officer slumped on the bridge wing, his oxygen mask on |
| R1–R3 | 224.5–238.7 | she lets go; from above, she kicks for the light; you catch her fin |
| Sk1 | 238.7–244.9 | the sky going dark over the ship |
| Tb1–Tb4 | 244.9–263.6 | a hot tub starts to boil; the tubs wide; the old man and his wife, still; you two, calm |
| Sr4–Sr5 | 263.6–272.8 | stars in full sunshine over the dead ship; stars over the funnel |
| Se1–Se3 | 272.8–291.0 | the pool boiling; the ocean boiling from the marina; the boiling surface from below |
| L1–L2 | 291.0–303.5 | close on you and your tank; the girl from behind, against the light |
| Q1 | 303.5–307.75 | from below: the two of you small under the hull; the question |

## How it follows the owner's lessons

- **Action in the first 5 s:** the title is already the pool deck: a boy's cannonball, and at 0:03.6 the first 1%
  goes, with the score's first toll.
- **Real physics in minute one:** the weight of the air, why you don't feel it, the first 1% as 85 m of height, and the
  3:39 PM forecast, all before 0:43.
- **Everyday, human-scale, new scenery:** a cruise ship's pool deck, bar, stairwells, bridge wing, dive shop and marina,
  the open Atlantic and the sea under the hull. None of the earlier films' sets.
- **The story clock only runs forward:** no replays; 23 forward jumps at cuts, each shown on the HUD clock.
- **Tension to the last frame, no recap:** a goal for you from 1:46 (get her and the tanks under 10 m of sea), the
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

**Round 2**: _to be added._

## What is still weak

_To be added after round 2._

## Sound

_To be added after the final mix._

## Delivery

_To be added._
