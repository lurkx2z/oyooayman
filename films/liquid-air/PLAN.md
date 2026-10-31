# What if the air turned into a breathable liquid for one hour?

This is a voiceless 16:9 long-form film: 1920×1080, 30 fps, about 5:47. It follows the Slower light / Friction 10s
formula and the owner's YouTube lessons and retention playbook of 28 October 2026:
- an everyday place: your living room on the fifth floor on a Saturday afternoon, and the street below;
- action under the title on frame 1 (drops forming out of nothing in your room);
- the real nuance in the first minute (real air is liquid only at −194 °C; liquid breathing is real: 1966 mice);
- a new consequence every few seconds, escalating to a climax (the last of the sky landing in ten seconds);
- tension to the last frame (4:00: it turns back, and the liquid in your lungs becomes 700 times its volume of gas),
  no recap.

It follows the owner's rule of 29 October 2026: **the story clock only runs forward** (one clock, `LA_CLOCK`; it runs at
real speed through the first minute, the dive under, the crash, the sun, the bell and the last ten seconds, faster in
between, and only ever jumps forward at a cut, with a "+N MIN" flag on the HUD clock).

Page: `liquid-air.html`. Captions: `CAPTIONS.md` → `node build-timing.cjs` → `timing.js`. The sky raining down is a
1-D column model run once offline (`build-column.cjs` → `column.js`); every other number comes from `physics.js` (§ 2).

## 1. The rule

At **3:00:00 PM** all the air on Earth starts to turn into a clear liquid: **the same amount every second** (1/600 of
all of it, which is a growing share of what's left), all of it by **3:10:00**. It stays at 15 °C (part of the rule). At **4:00:00** it turns back into air the same way, by 4:10:00.

- The liquid is at the air's temperature (15 °C), as dense as liquid air (**875 kg/m³**), and carries oxygen you can
  breathe. **This is the one impossible thing** (real liquid air boils at −194 °C), and the film says so (HUD tag).
- It forms where the air is: drops out of nothing everywhere, in your room and kilometres up.
- Breathing a liquid is real: Clark & Gollan (1966) kept mice alive for hours breathing oxygenated liquid; liquid
  ventilation has been used for premature babies. It is heavy, slow work.

## 2. The physics (physics.js, column.js)

**The weight.** The sky weighs 101,325 Pa: 10.3 tonnes on every m². As this liquid it is
D = 101325 / (875 · 9.81) = **11.80 m** deep. A litre of it is **714 litres** of air.

**The rain (build-column.cjs).** A 1-D column (300 layers up to 100 km, a standard atmosphere): each second a share
1/(600 − s) of the gas left in each layer becomes drops; drops fall at a terminal speed ∝ √(ρ₀/ρ_gas) (5 m/s at sea
level, ~200 m/s at 30 km); the gas carries the drops' drag, so **the pressure at the street stays near 1 atm while
the rain holds the sky up** (0.98 atm at 3:03, 0.87 at 3:07, 0.70 at 3:09, 0.35 at 3:09:50, 0 at 3:10). Results:

| time | level | rain | air pressure |
|---|---|---|---|
| 3:01 | 2 cm | ~90 mm a minute | 0.99 atm |
| 3:03 | 0.20 m | ~145 mm a minute (record: 31 mm in a minute) | 0.98 |
| 3:05:15 | **0.70 m: parked cars float** | | 0.94 |
| 3:06 | 0.95 m (your waist) | | 0.91 |
| 3:07:12 | 1.50 m (your chin) | | 0.86 |
| 3:07:30 | 1.66 m: over your head | | 0.83 |
| 3:09 | 2.78 m | | 0.70 |
| 3:10:00 | 4.56 m; **61 % of the sky still falling** | | 0 |
| 3:10:10 | **11.80 m** (the last 7.2 m in ten seconds, ~130 m/s mean, the last 4 m in 2 s) | | 0 |

**The light.** Drops scatter like a cloud: in the first second ~17 kg/m² of drops are overhead (a thundercloud holds
1–5), so **the sun is gone within a second** and the day goes to dusk; the street lamps' sensors switch them on. After
3:10:12 nothing is left up there (no air to scatter light, no drops): **the sun in a black sky, with stars**.

**Under it.** Your weight in it: (1060 − 875)/1060 = **17.5 %**: 70 kg → **12 kg** (on the Moon 16.5 %: 11.6 kg).
Light bends going in (n ≈ 1.21): from below, **the whole sky is squeezed into a circle 56° from straight up (Snell's
window)**; outside it the surface is a mirror (total internal reflection). The sun at 22° up is 50° from straight up
under it. The pressure at the street doesn't change: it's the same weight, just closer.

**Sealed things.** The gas inside keeps turning and nothing replaces it: a crisp packet and a capped bottle shrink from
the first second; a football (1.8 atm) goes soft at ~3:04:30; tyres (3.2 atm) at ~3:06:40. **Your ears**: the air
behind your eardrums turns at 1/600 a second → 10 kPa a minute (swallow).

**What floats, what sinks.** Wood (~600 kg/m³) floats: café chairs and tables, picnic tables, branches, fallen leaves,
all pressed against the surface at 11.8 m. Plastic bins (HDPE ~950) stay. Water (1000) is heavier: **the pond stays a
pond** at the bottom of the sky, with its ducks on it. Parked cars lift at ~70 cm, drift, fill (2–5 minutes) and sink;
two slow-filling ones ride the surface up in the crash, then fill and sink. (A sealed car can't float on: with its
air turned, ~0 atm inside against ~1 atm outside, the windows give.)

**The vacuum above.** Your floor is 12.0 m up: **20 cm above the final surface**. After 3:10 your flat is in a vacuum:
your glass of water boils at 15 °C (water's vapour pressure 1.7 kPa), and evaporation cools it until it freezes.
**The top 0.73 m** of the liquid is under 6.3 kPa (the Armstrong limit: blood would boil). The church bell (above the
surface) strikes in silence; its sound reaches you only through the tower's stone and the liquid.

**Voices.** With your lungs full of liquid there is no air to push through your vocal cords: nobody can speak.
**Cold.** 15 °C liquid takes heat from you far faster than 15 °C air (like cold water): everyone shivers.

**4:00.** It turns back at 1/600 a second: every litre gives 1.2 litres of gas a second, everywhere at once. The 3
litres in your lungs make **3.6 litres of gas every second**: a full breath a second, 2,140 litres in all. After one
second there's more gas than liquid everywhere, racing up at ~14 m/s: the street turns to a white froth (we end 5 s
into it).

**Honest limits (said in PLAN and the report; the first two on screen):**
- the liquid at 15 °C is the one impossible thing (HUD tag);
- the heat of the sky's fall is left out: 10 tonnes per m² falling an average of a few km would warm it by ~40 °C
  (HUD tag "LEFT OUT" during the crash);
- the crash's momentum would add a pressure pulse (~+2.6 atm for a few seconds) at the street: not shown;
- in a real deluge like this you'd see only a few metres; the film's exposure and fog keep it readable;
- the liquid would drain downhill: the town is flat;
- the liquid itself at the top boundary of a vacuum would boil off: part of the rule;
- drop sizes and drag are simplified (one terminal-speed law); the column's ~1 % bookkeeping loss is normalised.

## 3. Story time (script.js)

Story s = seconds after 3:00:00 PM. Real speed: 3:00:00–3:00:58 (the first minute), the chin and the first breath
(3:07:07–3:07:36), **3:09:59–3:10:21 (the crash and the sun)**, 3:30:00 (the bell), 3:59:50–4:00:05. Everywhere else
each beat has its own window of the hour (e.g. the cars 3:05:00–3:05:30), and the clock jumps forward only at cuts.

## 4. Shots (shots.js)

48 shots, cut from the captions. 1 — your room (drops out of nothing; the window; the sun gone; your block from the
park with the 11.8 m line; the street from your window with the diagram; ears; the crisp packet; go). 2 — the street
(neighbours out of the door; the deluge; the lamps on at 3:03; the cars float; lighter; your waist; the soft football;
your chin; under; the girl; the street under it; no voices; a car sinking; above the surface at 3:09). ★ the crash from
under it, the surface racing up your block, the sun in Snell's window. 3 — the bottom of the sky (the deep street;
your flat in a vacuum, the glass boiling then freezing; Snell's window; bounding at 12 kg; wood against the surface;
the bins; the pond and ducks; pigeons; the bell in a vacuum, then through the stone; the top 70 cm; the cold; the hard
breathing). 4 — 4:00 (the street; the last ten seconds in six quick cuts; the fizz; the question).

## 5. Look and HUD

The gravity films' street, park and block (five floors now), low-poly stylised, afternoon light from the park side.
The HUD: top left THE AIR, TURNED TO LIQUID (0 → 100 %) and the level in your street; top right the clock (SATURDAY,
3:mm:ss PM, "+N MIN" on jumps); one context line per scene; captions at the bottom, numbers amber; one diagram (the
whole sky as this liquid against your block); labels pinned in the scene; the honest tag bottom left.

## 6. Sound (sound-*.js, mix.js; all synthesised, seeded)

Places: your room (patter of drops, the deluge muffled through the glass), outdoors (the roar of the rain, a deep
rumble of the sky falling), under (everything muffled; the rain drumming on the surface above; after 3:10 a vast quiet),
the vacuum (nothing at all). Effects: drops plinking in the room; cars lifting; your last air bubbling out; the girl's;
a car groaning as it sinks; the crash (a roar out of a black sky, one deep slam, silence); the bell through the stone;
the 4:00 fizz. Score: real-time piano seconds in D minor, a pulse that speeds up with the rain, muffled under, a drone
under the crash, A major for the sun, D lydian piano for the wonder, a cold minor and a heartbeat, ten heartbeats and a
roll to 4:00, a wide chord into the fizz, cut on the question.

## 7. Review log

Round 1 (three independent reviewers on 1 fps stills of the whole film, before fixes). Scores as given:

- **Retention** 5.5/10 overall (hook 5, first 30 s 5, middle 7, payoff 5, clarity 6). Top problems: no stakes after
  3:20 (a list of curiosities until the countdown); the opening undersells the anomaly (rain "from nothing" reads as
  ordinary rain; the sun still visible under "And the sun's gone"); visuals that don't prove the caption.
- **Visuals**: image 6, composition 5, phone readability 5, underwater 6.5, hero moments 5. Best: the sun in a black
  sky (3:11), a car hanging against the surface (2:43), the deluge street (1:20). Worst: the sun disc under "the sun's
  gone", the packet, the blocky foreground hand (lamps, 4:00 street), the girl only seen from behind, the float shot's
  mirrored building, the pond, Snell's window a near-repeat of 3:11, tiny HUD boxes.
- **Physics**: accuracy 7, honesty 6, clarity 8, learning 8, believability 6. Errors: "5 times harder" (4×), caption
  2,000 vs HUD 2,140 litres, the 4:00 fizz far too gentle (a full breath a second; a froth), sealed cars can't float
  (windows give), "nobody could breathe" at 3:09 (0.66 atm: thin, not deadly), "20 cm" is false precision, Moon
  without drag, wood and ducks too certain, no ice, "the same share every second" wording, the cold undersold.

Fixed after round 1:
1. The sun's gone: the bright disc was the room lamp's highlight on the window glass (rougher glass now), and the
   shot's exposure falls as the line lands.
2. Stakes for the second half: the [deep] caption now plants 4:00 ("At 4:00 it all turns back into air. Including the
   litres inside you.") and the HUD counts it down from there ("IT TURNS BACK INTO AIR IN 45 MIN").
3. Drops forming: glassy beads swell out of nothing round the camera before they fall.
4. Snell's window: looking straight up with a wide lens, the whole circle in frame, turning slowly (no longer a repeat).
5. 4:00: a white froth of gas racing up (more gas than liquid after a second), the water whitens, a roar under it;
   caption and HUD: "Every second, the 3 litres in your lungs will make a full breath of air" / 3.6 litres.
6. Sealed cars dropped: two slow-filling ones ride the surface up in the crash, then sink.
7. Captions: 4 times harder; thinner than on Everest; "just above the surface"; "like the Moon, in slow motion"; wood
   "for now"; ducks sit low; the cold comes from every breath; CO₂ in the hard-work line; "stays at 15 °C" in the rule.
8. The girl is seen from the front (her breath, her face); the camera moved off the foreground hands (lamps, 4:00);
   the float shot looks up through Snell's window at the furniture against the surface; the pond shot follows a duck;
   the glass ices over white; a jolt at the slam; HUD boxes and the honest tag 1.2–1.25× larger.

Not fixed (still weak): the crash from below could show more mass arriving (columns, a bulge); the crisp packet still
reads as a blob; extras' poses are stiff; crash damage above the surface (roofs, the tower top) is not shown; CO₂ and
hypothermia are only lines, not consequences.
