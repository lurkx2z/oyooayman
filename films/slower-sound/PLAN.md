# What if sound kept getting slower and couldn't stop?

Voiceless 16:9 long-form (1920×1080, 30 fps, 7:58), the Slower light / Time-on-your-feet formula: one ordinary day,
a rule that keeps getting worse, told by captions, a readout, a clock, illustrative rings and the sound itself.
Page: `slower-sound.html`. Captions: `CAPTIONS.md` → `build-timing.cjs` → `timing.js`. Fresh film (the old 9:16
"Slow sound" short is a different idea: a constant slow speed; this one keeps halving).

## 1. The rule

From **7:00:00 on a Saturday** the speed of sound in air **halves every hour**, everywhere at once. Nothing else about
the air changes (pressure, density, temperature, wind stay as they were; light, bodies and solids are untouched).

## 2. The physics (physics.js computes every number on screen)

- c(h) = 343 m/s × 2^−h at the ground (20 °C); 295 m/s × 2^−h at 11 km (−56.5 °C), h = hours after 7:00.
- Sound already in flight slows too: a sound made at h0 has gone D = c0·τ·(2^−h0 − 2^−h1) by h1, τ = 3600/ln 2 = 5,194 s.
  So every sound has a **horizon**, the farthest it can ever get: H(h) = c(h)·τ.

| when | c | what |
|---|---|---|
| 7:00 | 343 m/s | a blackbird 5.5 m away is heard 0.016 s (≈1/60 s) late |
| 7:14:19 | 295·2^−h < 250 at 11 km | airliners (250 m/s) are supersonic up there |
| 7:27:22 | ground c < 250 | their booms reach the ground (cutoff Mach: before this the boom refracts upward and never lands) |
| 8:00 | 171.5 m/s | voices: vocal folds unchanged, vocal-tract resonances (formants) ∝ c → an octave lower (what SF6 does, ~0.39×) |
| 9:00 | 85.75 m/s | reverberation time ∝ 1/c: a 0.5 s kitchen rings 2 s |
| 10:00 | 42.9 m/s | formants three octaves down: vowels gone |
| 10:27:14 | 31.3 m/s | 70 mph motorway cars supersonic; their noise takes 1 min 43 s to cross 3.2 km |
| 10:47 | 25 m/s | a hard-kicked ball supersonic |
| 11:00 | 21.4 m/s | ambulance at 13.2 m/s: f′/f = 1/(1−13.2/21.4) = 2.6 coming, 1/(1+0.62) = 0.62 going |
| 11:40:36 | 13.4 m/s | 30 mph town cars supersonic: silent coming, a crack, then the engine from both sides; a supersonic source approaching is heard in reverse order |
| 12:00 | 10.7 m/s | the bell 800 m away rings 12:00:00, heard 12:01:15 (75.2 s); its horizon is 55.7 km |
| 12:57:45 | 5.5 m/s | a moderate breeze outruns sound: a shout from downwind can never arrive upwind |
| 14:00 | 2.7 m/s | λ of a 300 Hz voice = 9 mm (was 1.1 m): no more diffraction round a van; interaural delay 0.2 m / c ≈ 0.075 s |
| 14:59:20 | 1.34 m/s | walkers supersonic: every step a tiny boom |
| 16:00 | 0.67 m/s | TV 3 m away: 4.48 s late (picture now, sound later); a clap rings 0.5 s × 512 ≈ 4 min 16 s |
| 16:25 | 0.5 m/s | cats outrun their meows |
| 18:00 | 16.7 cm/s | horizon 870 m: lightning 1 km away is never heard |
| 19:28 | 6 cm/s | slower than a tortoise |
| 22:00 | 1.05 cm/s | music box 3 m away: arrives 4 min 55 s later (22:04:55), × c(arr)/c(emit) = 0.945 (lower and slower); walking into it at 1.4 m/s: × 135 |
| 0:00 | 2.6 mm/s | horizon 13.6 m (a champion racing snail ≈ 2.75 mm/s) |
| 3:00 / 6:00 | | horizons 1.7 m / 21 cm |

Real section: Mars ~240 m/s, ~250 m/s above 240 Hz (Maurice et al., Nature, 1 Apr 2022); SF6 ~130–134 m/s; bubbly
water down to ~20 m/s (Wood's equation), the hot chocolate effect (Crawford, Am. J. Phys. 1982); sound in a
Bose–Einstein condensate at a few mm/s (Andrews et al., PRL 79, 553, 1997); c ∝ √T so half speed needs T/4 = 73 K
(−200 °C), colder than liquid nitrogen (77 K, −196 °C).

## 3. Story time

script.js maps film time to story time: real time inside every scene (so every delay, echo and Doppler shift is the
real one), a 1.3 s time-lapse into each new hour, on-screen lapses for the bell, the music box wait and the night.

## 4. Shots (shots.js)

Two sets: **garden** (garden-build.js: the house, the garden, the kitchen; garden.js) and **street** (street.js: a
terrace high street running 800 m to a church). 39 shots: cold open (3 PM, every step a boom) → title → 7:00 garden,
blackbird, airliner, the boom, the boom carpets → 8:00 neighbour, kettle, radio → 9:00 spoon → 10:00 Mum, texting →
motorway → 11:00 street, ambulance, silent cars, the close pass, the music car → noon bell, the kick, the bell's
horizon from above → 1 PM wind, 2 PM van, ears, 3 PM crowd → 4 PM TV, clap, earbuds → 5 PM cat, hum → 6 PM storm →
8 PM dusk → 10 PM music box, walking into it, the wait → midnight, 3 AM, 6 AM → silence, heartbeat → real → question.

## 5. Look and HUD

House style (STYLE_BIBLE, the voiceless films): serif captions low centre, numbers amber; readout top left (SPEED OF
SOUND · value · "as fast as …" · NEXT landmark and its time); clock top right (day + time); a context line; an honest
tag bottom left (THOUGHT EXPERIMENT / RINGS: ILLUSTRATION / TIME-LAPSE / REAL). Rings (rings.js): a translucent shell
at the radius each sound has really reached, brighter where it meets the ground.

## 6. Sound

Synthesised and seeded (audiokit.js, sound-*.js). Diegetic sounds are rendered physically: ssHeardStill (delay by the
slowing air + the frequency drop c(arr)/c(emit)) and ssMoving (for each moment you hear, which emission moments are
reaching you: Doppler, reversed order and the crack of a supersonic source all fall out). Score: the hour chime drops
an octave each hour until it is below hearing. Mix −16 to −14 LUFS, ≤ −1 dBTP.
