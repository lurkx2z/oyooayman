# What if light started moving backward?

Voiceless 16:9 long-form (1920×1080, 30 fps, 7:55), the Slower light / Slower sound formula: one ordinary night, one
rule, told by captions, a readout, a clock, a few honest illustrations and the sound. Page: `light-backward.html`.
Captions: `CAPTIONS.md` → `node build-timing.cjs` → `timing.js`. Every number on screen: `physics.js` (§ 2).

## 1. The rule

At **10:00:00 PM GMT tonight** (late October) every photon in the universe reverses its direction, **once**, in the
frame of the solar system's centre of mass. Matter is untouched: lamps, fires and the Sun go on shining as normal
afterwards, and new light goes the normal way. Tagged THOUGHT EXPERIMENT · ONLY THE DIRECTION OF LIGHT CHANGES. Real
time reversal of a light wave flips its magnetic field (E stays, B → −B), which the film shows in the real section.

## 2. The physics (physics.js)

The one idea: light reversed at 10:00 retraces its path, so what reaches a point X at time s is the light that passed
the point P = X + U·s at −s, sent back (U = 2v, v = 29.78 km/s: the Earth has moved on into the returning light). A
source's reversed light only reaches you once P is out of the Earth's body and out of its shadow for that source
(lbExitTime). The Earth itself is a source: the light it sent up into space comes back as **a mirror Earth**, centred
on P/|P|, radius asin(R/|P|); a town C at −s is seen in the direction of P − C (lbMirrorEarth, sky.js).

| when | what | where it comes from |
|---|---|---|
| 10:00:00 | every star and the Moon go out (their light in flight turned round) | |
| 10:00:01.3 | a sliver of the Moon's NIGHT side lights (old sunlight that missed it, coming back) | lbMoonGhost |
| 10:00:07–08 | P leaves the Earth (it starts 2° below the horizon, under the garden): the sky fills with the mirror Earth's town lights, upside down, the image's centre near the zenith | lbMirrorEarth |
| 10:00:12–18 | Copenhagen, then Stockholm, near the image's edge | |
| 10:00:10 → | mirror-image stars: light that had already passed the Earth, back from the opposite side; 44 of the 1,918 stars brighter than mag 5 are up by 10 s, 153 by 20 s, 530 by 81 s | lbStarTable |
| 10:00:20.5 | Sirius's mirror image, alt 17° in the WEST (az 276°); the real Sirius rises in the east about 2 h later | |
| 10:00:59 | the image has shrunk (centre alt 61°, az 55°, from 890 km up): European Russia, Moscow alt 16° (2,500 km away) | |
| 10:01:02 → | the air leaves the Earth's shadow before you do: the N/NNE sky glows at 62–68 s, the SW at ~90 s | lbAirOn |
| 10:01:21 | the second Sun: your garden leaves the Earth's shadow (81.03 s), alt 46°, az 143° (the anti-solar point) | LB_SKY.on |
| | the shadow sweeps across the night side at 2v = 60 km/s; all of it lit in R/v = 214 s ("3 and a half minutes") | |
| | the second Sun shows the Sun as it was at −(s + 495.85) s: 9:49 PM at 10:02:35, one second further back every second | lbSecondShows |
| 10:00:00 (noon in Hawaii) | the Sun goes out on the whole day side; new light needs 495.85 s (0.9937 AU) | LBP.tSun |
| | Hawaii's sky fills with the sunlit Pacific and its clouds, upside down (the Earth's own reflected sunlight): the image's radius 87° → 52.5° at 60 s → 24° at 214 s → 11.7° at 493 s, its light on the ground (k·sin alt) 0.29 → 0.11 → 0.035 → 0.01 → 0.0014 of the Sun's | lbEarthGhost |
| | Voyager 1, 25.8 billion km out: its signal in flight (23.9 h old) turns round; the next reaches Earth 23.9 h after 10:00 | |
| 10:08:13.5 | the Sun comes back, the disc's centre first, its edge 2.32 s later (shown slowed down 8×) | lbSunSeen, LBP.tFirst |
| 10:08:13.5 → | its own old light lands back on it: output ×2, T = 5,772 K × 2^¼ = 6,864 K (5,500 → 6,600 °C); e-folding 4 s is a guess | lbSunGain |
| 10:08:18 | the Moon's day side lights again (498.04 s); twice as bright as the night side | LB_MOON.dayBack |
| | Earth gets 3× sunlight (2× real Sun + 1× second Sun); Venus gets 1.9× | |
| midnight | the second Sun (dec +12.5°) at alt 51° in the south; the real Sun's October noon is 26° | |
| 6:44:38 AM | sunrise (the centre 0.83° below the horizon), the second Sun setting opposite; two shadows for ~11 min | LB_SUNRISE |
| 6:45 → 11:45 | the little Earth: the light it sent up yesterday, back, seen from 1.9 → 3.0 million km; 0.39° → 0.25° across, az 199° alt 57° → az 280° alt 17°; it turns backwards | lbMirrorEarth |
| noon | UV-B at 310 nm: blackbody ratio 6,864 / 5,772 K = 3.6× → sunburn "more than 3 times faster" | |
| per day | Britain, late October: 61.7 MJ/m² at the top of the air, midsummer was 41.5 MJ/m² | lbnum (scratch) |
| | the Sun's ×2 lasts about a year: the Sun wobbles 13 m/s round the centre of mass (Jupiter), so after that its old light comes back to where it was, not where it is; long term the Earth gets ~2.3× | |
| | extra absorbed ≈ (2.3 to 3 − 1) × 340 × 0.7 ≈ 300–480 W/m² vs today's imbalance ≈ 1–2 W/m²: "hundreds of times faster" | |
| | 2 m of sea ice at 150 W/m²: ~47 days ("within a year") | |
| | ~10 % more sunlight → runaway greenhouse (the far-future Sun); here +130–200 %: the oceans' 1.4 × 10²¹ kg boiled off in ~850–2,000 years at albedo 0.3–0.5 ("within a few thousand years") | |
| | the second Sun keeps showing older and older sunlight, steady for ~10,000 years (the galaxy's pull on the Sun is the next limit); the film shows it to 10,000 years | |

Real section: moonlight 1.28 s, sunlight 8 min 16 s; most naked-eye stars are hundreds of light-years away; the
sunlight that missed the Earth is still flying away; phase-conjugate mirrors; the 2023 temporal reflection ("time
mirror") for microwaves (Moussa et al., Nature Physics 19, 863, 2023); no way to reverse all light: you'd have to flip
every wave's magnetic field at once.

Honest limits: the glow, the sky and the mirror Earth's brightness are drawn, not radiative transfer (the mirror Earth
is added on top of the air in front of it, which is right in kind); the Sun's ×2 assumes it absorbs and re-emits its
own returning light (steady state in seconds is a guess); the boil range depends on the albedo of a steam-shrouded Earth.

## 3. Story time

script.js maps film time to story time (lbStoryAt; lbStory and lbFilmAt invert it): real time from 9:59:39 to 10:02:40
(every appearance at its true second), Hawaii in real time then 25× as its sky shrinks, a lapse to 10:08:13, the Sun's
first 0.4 s slowed 8× (tagged), back to real time by 10:08:18, lapses over the night (×30 at midnight, ×20 at sunrise,
~800× over the little Earth), real time at noon, then days, years and thousands of years (space, tagged TIME-LAPSE).

## 4. Shots (shots.js, 43)

Three sets: **garden** (garden-build.js + garden.js: a terrace back garden facing SSE, the telescope, the lantern, the
cat, a crane up over the rooftops, the park at sunrise), **space** (space.js: illustrations: the stream of old sunlight
and the shadow tube behind the Earth, the wave, the half-planet, Voyager 1, the ice, the boil, the shells of old
sunlight), **hawaii** (hawaii.js: Waikiki at noon). Cold open (10:02, the second Sun) → title → 9:59 → the rule →
10:00:00, the Moon goes out → the wrong-side sliver → the sky lights up with town lights, upside down → Sirius in the
west → the mirror diagram → the lantern replayed a billion times slower → Europe from above the rooftops, shrinking →
the northern glow → the second Sun → daylight, the robin, the streetlights → why (space) → the shadow, the wave → the
Moon → the telescope's card → the Sun's past → rewind: Hawaii's noon, its sky full of upside-down sea and clouds,
shrinking away → rewind: half the planet → the wait, Voyager → 10:08:13, a dot then a disc → twice as bright → the
Moon → ×3 → midnight → sunrise, two shadows → the little Earth → noon → never dark → summer → heat, ice → boil → the
second Sun running back → rewind: the last starry night → real → question.

## 5. Look and HUD

House style (STYLE_BIBLE, the voiceless films): serif captions low centre, numbers amber; readout top left (SINCE LIGHT
TURNED AROUND · time · mirror-image stars back / the real Sun / sunlight × · NEXT); clock top right (TONIGHT / TOMORROW
/ n DAYS LATER, plus IN HAWAII); labels on named stars, towns and places; a context line under the readout; honest tags
bottom left (THOUGHT EXPERIMENT / ILLUSTRATION · NOT TO SCALE / TIME-LAPSE / SLOWED DOWN / REWIND / REAL).

## 6. Sound

Synthesised and seeded (audiokit.js, sound-lib.js, sound-music.js, sound-amb.js, sound-sfx.js; mix.js). Score in E:
the theme (E–B–A–F♯ → E) over the title, the second Sun and the question; from 10:00:00 it keeps coming back
BACKWARDS on a reversed piano. Places: the garden at night/by day, the park's dawn chorus, Waikiki's surf and crowd.
Effects: the clock's last five seconds, the stars going out (a reversed swell cut dead), the mirror sky's tings, the
lantern, the cat, the streetlights' relays, the gasp and the cheer, Voyager's pips (backwards after the turn), the
inverter, the ice, the boil. Mix −16 to −14 LUFS, ≤ −1 dBTP.

## 7. Review log

**Round 1** (first preview, 7:37; three independent reviewers):
- Viewer: retention 6/10, clarity 6/10. The second Sun, Hawaii going dark and the doubled Sun land; the mirror stars,
  "the gap came back", the phase-conjugate mirror and the magnetic-field line get lost. 0:38–1:42 was a minute of
  near-black sky; the trigger moment was invisible; Canopus repeated Sirius; the real section restated earlier facts.
- Visuals: 6/10. The mirror sky never visibly appeared; the Moon was never seen going out; the Sun's return was rushed
  and washed out; the space stream read as TV static; the boil read as a snowball; the two-sun planet's dim ring read
  as a seam; floating slivers in the night garden.
- Physics: 7/10. The big miss: the day side's own reflected sunlight was also in flight, so Hawaii's sky could not
  snap to black (and the night sky gets the town lights back). Also: the rule needs a frame (now the solar system's
  centre of mass, which limits the Sun's ×2 to about a year), the boil time was too short, sunrise times.
- Fixes: the mirror Earth everywhere (town lights at 10:00:08, Europe from above, Hawaii's sky full of upside-down sea
  and clouds shrinking west, the little Earth at dawn); one beat for the stars and the Moon going out; Canopus, the
  space time-lapse and the duplicate real beat cut; the stream redrawn (fewer, longer streaks, the Sun in frame, a
  shadow tube); the boil as a cream/ochre steam shroud; a warm twilight ring; the return slowed 8× with a darker
  telephoto; the telescope tube and the solar panels' pale edges no longer float in the night shots; REWIND tags.

**Round 2**: (after the second preview)
