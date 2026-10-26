# What if light started moving backward?

Voiceless 16:9 long-form (1920×1080, 30 fps, 7:37), the Slower light / Slower sound formula: one ordinary night, one
rule, told by captions, a readout, a clock, a few honest illustrations and the sound. Page: `light-backward.html`.
Captions: `CAPTIONS.md` → `node build-timing.cjs` → `timing.js`. Every number on screen: `physics.js` (§ 2).

## 1. The rule

At **10:00:00 PM GMT tonight** (late October) every photon in the universe reverses its direction, **once** (in the
Sun's frame). Matter is untouched: lamps, fires and the Sun go on shining as normal afterwards, and new light goes the
normal way. Tagged THOUGHT EXPERIMENT · ONLY THE DIRECTION OF LIGHT CHANGES. Real time reversal of a light wave flips
its magnetic field (E stays, B → −B), which the film says in the real section.

## 2. The physics (physics.js)

The one idea: light reversed at 10:00 retraces its path, so what reaches a point at time t is the light that passed
that point at −t, sent back. The Earth has moved 2·v·t since then (v = 29.78 km/s), so a source's reversed light only
reaches you once your spot is out of the Earth's body and out of its shadow for that source (lbExitTime, exact).

| when | what | where it comes from |
|---|---|---|
| 10:00:00 | every star and the Moon go out (their light in flight turned round) | |
| 10:00:01.3 | a sliver of the Moon's NIGHT side lights (old sunlight that missed the Moon, coming back), seen 1.28 s later | lbMoonPoint |
| 10:00:10 → | mirror-image stars: light that had already passed the Earth comes back from the opposite direction; 35 of the 937 stars brighter than mag 5 by 10 s, 136 by 20 s, 502 by 80 s | lbStarTable |
| 10:00:20 | Sirius's mirror image, alt 17° in the WEST (az 276°); the real Sirius rises in the east about 2 h later | |
| 10:00:57 | Canopus (dec −52.7°), alt 39° in the north-west: never above the horizon from 51.5° N | |
| 10:01:08 → | the south-west sky glows first: the air 40 km up and 600 km away leaves the Earth's shadow 10–15 s before you | lbAirOn |
| 10:01:20 | the second Sun: your garden leaves the Earth's shadow (80.36 s), alt 46°, az 143° (the anti-solar point) | LB_SKY.on |
| | the shadow sweeps across the night side at 2v = 60 km/s; all of it lit in R/v = 214 s ("3 and a half minutes") | |
| | the second Sun shows the Sun as it was at −(s + 495.85) s: 9:49 PM at 10:02:35, one second further back every second | lbSecondShows |
| 10:00:00 (noon in Hawaii) | the Sun goes out on the whole day side; new light needs 495.85 s (0.9937 AU) | LBP.tSun |
| | Voyager 1, ~25 billion km out: its signal in flight (≈23.5 h old) turns round; the next one reaches Earth ~23.5 h later | |
| 10:08:16 | the Sun comes back, the disc's centre first (2.3 light-seconds closer than its edge) | lbSunSeen |
| 10:08:16 → | its own old light lands back on it: surface ×2 output, T = 5,772 K × 2^¼ = 6,864 K (5,500 → 6,600 °C); e-folding 4 s is a guess | lbSunGain |
| 10:08:18 | the Moon's day side lights again (0.91 s further from the Sun + 1.28 s); twice as bright as the night side | LB_MOON.dayBack |
| | Earth gets 3× sunlight (2× real Sun + 1× second Sun) — Venus gets 1.9× | |
| midnight | the second Sun (dec +12.5°) at alt 51° in the south; the real Sun's October noon is ≈ 26° | |
| 6:47 AM | the real Sun rises in the east as the second Sun sets in the west (geometric, refraction ignored) | LB_SUNRISE |
| noon | UV-B at 310 nm: blackbody ratio 6,864 / 5,772 K = 3.6× → sunburn "more than 3 times faster" | |
| per day | Britain, late October: 61.7 MJ/m² at the top of the air, midsummer was 41.5 MJ/m² | lbnum (scratch) |
| | extra absorbed ≈ 2 × 340 × 0.7 ≈ 476 W/m² vs today's imbalance ≈ 1–2 W/m²: "hundreds of times faster" | |
| | 2 m of sea ice at 150 W/m²: ~47 days ("within months") | |
| | ~10 % more sunlight → moist/runaway greenhouse (the far future Sun); here +200 %: the oceans' 1.4 × 10²¹ kg boiled off in ~500–1,000 years at albedo 0.3–0.5 ("about a thousand") | |
| +4.6 billion years | the second Sun shows the Sun's birth; after that there is no old light left, and night comes back | |

Real section: moonlight 1.28 s, sunlight 8 min 16 s; most naked-eye stars are hundreds of light-years away; phase-
conjugate mirrors; the 2023 temporal reflection ("time mirror") for microwaves (Moussa et al., Nature Physics 19, 863,
2023); no way to reverse all light: you'd have to flip every wave's magnetic field at once.

Honest limits: the second Sun's glow and the sky are drawn, not radiative-transfer; the Sun's ×2 assumes it absorbs
and re-emits its own returning light (steady state reached in seconds is a guess); 6:47 AM ignores refraction.

## 3. Story time

script.js maps film time to story time (lbStoryAt; lbStory and lbFilmAt invert it): real time from 9:59:39 to 10:02:40
(every appearance at its true second), Hawaii in real time then 6× over the black sky, a lapse to 10:08:14, real time
over the Sun's return, lapses over the night (×30 at midnight, ×20 at sunrise), real time at noon, then days.

## 4. Shots (shots.js, 42)

Three sets: **garden** (garden-build.js + garden.js: a terrace back garden facing SSE, the telescope, the lantern, the
cat, the park at sunrise), **space** (space.js: illustrations: the stream of old sunlight, the shadow, the wave, the
half-planet, Voyager 1, two suns, the ice, the boil, the birth), **hawaii** (hawaii.js: Waikiki at noon). Cold open
(10:02:30, the second Sun) → title → 9:59 → the rule → 10:00:00 → the Moon's sliver → the mirror sky, Sirius,
Canopus → the lantern replayed a billion times slower → the south-west glow → the second Sun → daylight, the robin,
the streetlights → why (space) → the shadow, the wave → the Moon → the telescope's card → the Sun's past → Hawaii's
noon goes black → half the planet → the wait, Voyager → 10:08:16 → twice as bright → the Moon → ×3 → midnight →
sunrise, two shadows → noon → never dark → space → summer → heat, ice → boil → birth → night again → real → question.

## 5. Look and HUD

House style (STYLE_BIBLE, the voiceless films): serif captions low centre, numbers amber; readout top left (LIGHT
TURNED AROUND · time since · mirror-image stars back · NEXT); clock top right (TONIGHT / TOMORROW / n DAYS LATER, plus
IN HAWAII); labels on named stars and places; honest tags bottom left (THOUGHT EXPERIMENT / ILLUSTRATION · NOT TO
SCALE / TIME-LAPSE / REAL).

## 6. Sound

Synthesised and seeded (audiokit.js, sound-lib.js, sound-music.js, sound-amb.js, sound-sfx.js; mix.js). Score in E:
the theme (E–B–A–F♯ → E) over the title, the second Sun and the question; from 10:00:00 it keeps coming back
BACKWARDS on a reversed piano. Places: the garden at night/by day, the park's dawn chorus, Waikiki's surf and crowd.
Effects: the clock's last five seconds, the stars going out (a reversed swell cut dead), the mirror sky's tings, the
lantern, the cat, the streetlights' relays, the gasp and the cheer, Voyager's pips (backwards after the turn), the
inverter, the ice, the boil. Mix −16 to −14 LUFS, ≤ −1 dBTP.

## 7. Review log

(filled in after the independent reviews)
