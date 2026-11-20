# What if the air got 1% thinner every minute?

Voiceless 16:9 long-form, 5:14 (313.8 s), slug `air-thinner`, page `air-thinner.html`. Built like Gravity tilts 90°,
Friction 10 s and Gravity keeps tilting, to the owner's YouTube lessons of 2026-10-28, in the eerie horror tone of
Slower light (the channel's best):
- an everyday, human-scale place with new scenery: a cruise ship (the fictional "Coral Meridian", 290 m, 17 decks,
  3,100 passengers and 1,200 crew) in the open Atlantic, 1,500 km from land, on a sunny Saturday morning;
- action in the first 5 s (the title is the pool deck, a boy's cannonball; at 0:03.6 the first 1% goes);
- the real physics in minute one (air has weight: 10 tonnes over every square metre; losing 1% of it is like climbing
  85 metres; at this rate the ocean boils at 3:39 this afternoon, and you are already at sea level);
- about 5 minutes, no filler; the story clock only runs forward and jumps only at cuts (23 jumps, 10:00 AM → 3:39 PM);
- one thread through the second half (you, the ship's dive instructor, take a lost girl and six tanks under the ship);
- tension to the last frame, no recap: the last tank runs out tonight; up there, stars in the afternoon and her parents;
  "Would you take her up to see them?" (at the top she'd pass out in 15 s);
- the music clearly leads, beds about 10 dB under it, measured stem by stem (2026-10-31);
- no z-fighting, and the picture pitfalls list (no particle alpha over 1, no kilometre-long triangles).

## 1. The rule

From 10:00:00 AM ship's time, every minute the Earth's air loses 1% of what is left (each step is felt over 0.35 s). It
just goes: no wind, no storm. Nothing else changes: the sea, the Sun, the ship. The film follows the pressure down
through every height it passes (an airliner cabin, the top of Everest, the height where even pure oxygen fails) to the
point where water boils at its own temperature: the hot tubs, then body temperature, then the pool, then the sea.

## 2. The physics (physics.js; every caption number and moment is checked against it in script.js)

- The air left after n steps is 0.99ⁿ; the pressure starts at 1013.25 hPa. A step's height is the ISA pressure altitude
  (standard atmosphere, five layers to 47 km).
- Air's weight over a square metre: 101,325 Pa / 9.81 = 10.3 tonnes (caption 10). The first 1% = 84.7 m (caption 85).
- Below 870 hPa (Typhoon Tip, 1979, the lowest sea-level pressure ever measured) at 10:15; an airliner cabin (8,000 ft,
  2,438 m) at 10:29; her balloon (radius ∝ (p₀/p)^⅓, blown up near its limit) bursts on the 10:30 step.
- Half the air is gone at 11:08 (49.5%): the diesels, which burn what air their cylinders take in, choke and smoke
  black (too much fuel for the air); the generators trip at 11:13 and the ship goes dark. The ship slows from 20 knots
  (10.3 m/s) to 6 m/s, then drifts.
- 11:20: as thin as 6,361 m (caption 6,400); you, working hard, would pass out by 11:27:40; you go in at 11:23:26.
- 10.08 m of seawater (1025 kg/m³) weighs as much as the whole sky (caption 10). At 10.1 m the water alone gives
  1.02 bar, so a scuba regulator gives you air at sea-level pressure whatever is left above.
- Everest (8,849 m) at 11:56; 13,700 m (45,000 ft, where pure oxygen no longer keeps you conscious) at 1:11 PM, where
  the time of useful consciousness is 9–15 s (caption 15).
- The sky dims with the air above it (scattered light ∝ the air): darker blue by 1:40 PM; stars from about 6% (3:00 PM:
  4.9% left, caption 5).
- Water boils where the air is thinner than its vapour pressure (Antoine): the hot tubs (39 °C, 69.8 hPa) at 2:26 PM;
  body temperature (37 °C, 62.6 hPa, the Armstrong limit) at 2:37 PM; the pool (28 °C) at 3:27 PM; the sea (26 °C,
  33.5 hPa) at 3:39 PM. Only the top: at 10 m the water's own weight keeps it liquid.
- The tanks: six 12-litre tanks at 200 bar = 14,400 litres of air at 1 bar. You breathe 14 and she 9 litres a minute
  (at 1 bar, slowly, in warm water), at the pressure round you; the last runs out at 8:57 PM.
- 4,300 people on board (3,100 passengers + 1,200 crew); the nearest land is Santo Antão, Cape Verde, 1,541 km away
  (caption 1,500).
- Sound up top: a sound's pressure goes with the air's density, so the world's sounds fall 20·log₁₀(air) dB (−6 dB at
  half the air, −23 dB when the hot tubs boil) and dull a little; under the sea nothing changes (`ATL.loud`).

## 3. The beats (CAPTIONS.md: 24 beats after the title, 59 captions)

start (10:00, 1,500 km from land; nobody felt a thing) · weight (10 tonnes; like climbing 85 m) · boil (the ocean boils
at 3:39; nowhere lower to go) · ears (10:10; her balloon swelling) · storm (10:15, below any storm) · cabin (10:29;
everything sealed swells; her balloon bursts) · fizz (10:35, drinks foaming over) · stairs (10:44; the man by the pool;
the doctor 13 decks down) · tanks (you run the dive shop; 10 m of sea; 6 tanks) · down (13 decks down; the lost girl;
her hand) · engines (11:08 half the air, the engines choke; 11:13 the power fails) · marina (11:20, 6,400 m; your sight
closing in) · dive (the tanks on a line; you go in) · under (10 m down; you can breathe; 4,300 can't) · everest (11:56;
nobody awake) · shark (12:30; a whitetip circling) · oxygen (1:11 PM) · rise (she lets go; 15 s up there; you catch her
fin) · sky (1:40, going dark) · tubs (2:26 the hot tubs boil; 2:37 body temperature) · stars (3:00, stars by the Sun;
5% left) · sea (3:27 the pool; 3:39 the ocean; only the top) · last (the last tank at 8:57 tonight; up there,
stars and her parents) · question ("Would you take her up to see them?").

## 4. Sets and shots (shots.js: 62 shots)

- The ship (ship.js, deck.js): hull, superstructure, the bridge and its wings, the funnel and its smoke, deck 15's pool,
  hot tubs, loungers, parasols, the bar, the big screen, the stairwells, deck 2's dive shop and the marina platform
  folded out of the transom; the people (cast.js) on loungers, at the bar, on the stairs.
- The sea and sky (world.js): the ocean with the hull's wake and foam, the sky dimming with the air, stars, the boil on
  every water surface; under water (set.js, sealife.js): deep blue fog, light shafts, the hull from below, the line
  with six tanks, a school of fish, an oceanic whitetip, you and the girl with your regulators' bubbles.

## 5. Sound (sound-lib.js, sound-music.js, sound-amb.js, sound-sfx.js; mix.js)

No narrator. Three stems, all synthesised from seeded code. The score (D major for the sunny title, drained through a
closing filter at the first 1%; D minor after) tolls on every step on screen and is keyed to every beat. Beds by place:
on deck the sea, the wind of the ship's way, the fans, the crowd (chatter, then gasping), a steel band on the speakers
until the blackout, all as loud as the air lets them be; the stairwell; the dive shop; under the sea the hiss, the
propellers, the dead hull and the boiling surface overhead. Effects on their story moments, each heard once.

## 6. Checks and review log

- script.js throws if a caption's moment or number drifts from physics.js (13 caption moments, 16 caption numbers,
  every clock reading, 2 forecasts, 9 claims about the moment).
- The music's dynamics and the beds' dips (mix.js) are keyed to beats, so a caption change moves them with the picture.
- Reviews and fixes: EPISODE_REPORT.md § Reviews.
