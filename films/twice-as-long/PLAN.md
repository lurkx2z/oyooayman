# What If Every Step You Took Was Twice as Long?

A narrated 16:9 long-form film (8:19, 1920×1080, 30 fps), the first one in the channel's **new recipe** (the owner
agreed on 27 November 2026, after the niche study): a counted-step title, open on the craziest frame and then "Step
1" (no title card), short narration lines with gaps (Michael, ElevenLabs, natural settings), "you" as a character with a
face, a ladder of famous things with a new one every 5–8 s, bright daylight (dark only in space), visible destruction
and crowds that react, minimal bold sans text (a big step counter, one status word, labels), 6–10 shots a minute.
Page: `twice-as-long.html`. Narration: `NARRATION.md` → GitHub Actions → `narration/` + `narration-timing.js`
(`build-timing.cjs`). The edit is built on the narration: `steps.js` pins every step to a word, `shots.js` every cut.

## 1. The rule, and the numbers (`steps.js`; `script.js` checks every number the narrator says and throws if one is wrong)
- **Step n is 0.75 m × 2ⁿ⁻¹ long, and every step takes one second of your own time.** That is the one made-up rule
  (the HUD says so). So every new step is longer than all the others put together (Σ₁ⁿ = 0.75 (2ⁿ − 1) m), and if you
  step back you always land 0.75 m behind where you started: your own front door, the film's refrain.
- **On the ground** (steps 1–14) the steps are leaps along the street, some slowed down on screen (`TW_D`); step 5 is
  the step back over the bus. Step 7 is 48 m/s (173 km/h); step 10 (384 m, the Empire State Building's roof is 381 m)
  is faster than sound (343 m/s), so it drags a shock wave: the sonic boom breaks every window on the street. Step 13
  is Mach 9: the squeezed air in front of you glows (stagnation heating, thousands of degrees: real). Steps 6–14 are
  12.3 km; your office is 8 km from your door, so you miss it by 4.3 km.
- **Step 15** is 12.3 km/s, over Earth's escape velocity (11.2 km/s): the ground curves away and you never come down.
  Steps 16–20 low over New England, burning like a meteor; Boston hears the bang.
- **In space** the steps follow each other. Step 22 passes the Space Station's height (420 km; a crew capsule takes
  about 9 minutes). Step 24 ≈ the Earth's radius, step 25 its diameter, step 27 is 50,000 km/s.
- **The light barrier.** From step 29 a step is a sizeable fraction of light speed: step 29 is 56 %. Step 30 is longer
  than the trip to the Moon, so it can't take one second on Earth's clock. Time gives instead: a step is one second of
  *proper* time, so Earth's clock reads √(1 + (L/c)²) seconds (step 30: 1.67 s). This is special relativity, exactly
  (the HUD: on the ISS, about 0.005 s less every 6 months).
- **The ladder** (`space.js` places each one on your path; the HUD says they are placed): the Moon during step 29,
  Mars ≈ step 37 (51.5 million km: Mars at its closest is 54.6), the Sun's distance beaten by step 39, Jupiter's by 41,
  Saturn's by 42, Pluto passed after 43, Voyager 1 (about 25.4 billion km out in late 2026) during 45, Proxima Centauri
  (4.24 ly) during 56. Step 46 takes a day on Earth; a month has gone by at step 50, almost nine months at 53, almost six
  years at 56.
- **The turn.** Turned round at step 57 you would land 0.75 m behind your own front door, 11.4 years after you left.
  You keep going: 91 years at step 60, 1,462 years at 64; the Milky Way (100,000 ly) whole behind you at step 70; longer
  than humans have existed (300,000 years) by 72; farther than Andromeda (2.5 million ly) at 75; the cosmic web at 84;
  6.1 billion years at 86 (the Sun a red giant: in about 5 billion years, said on screen); at step 90, 98 billion ly
  out: farther than the observable universe is wide (about 93 billion ly). The expansion of the universe is left out
  (said on screen).

| step | length | all steps so far | speed (of c) | the step on Earth's clock | Earth's clock since step 1 | film |
|---|---|---|---|---|---|---|
| 1 | 0.75 m | 0.75 m | 0.000 % | — | — | 0:04 |
| 2 | 1.50 m | 2.25 m | 0.000 % | — | — | 0:13 |
| 3 | 3.00 m | 5.25 m | 0.000 % | — | — | 0:17 |
| 4 | 6.00 m | 11 m | 0.000 % | — | — | 0:21 |
| 5 | 12 m | 23 m | 0.000 % | — | — | 0:30 |
| 6 | 24 m | 47 m | 0.000 % | — | — | 1:04 |
| 7 | 48 m | 95 m | 0.000 % | — | — | 1:10 |
| 8 | 96 m | 191 m | 0.000 % | — | — | 1:21 |
| 9 | 192 m | 383 m | 0.000 % | — | — | 1:28 |
| 10 | 384 m | 767 m | 0.000 % | — | — | 1:38 |
| 11 | 768 m | 1.535 km | 0.000 % | — | — | 1:56 |
| 12 | 1.536 km | 3.071 km | 0.001 % | — | — | 2:01 |
| 13 | 3.072 km | 6.143 km | 0.001 % | — | — | 2:15 |
| 14 | 6.144 km | 12.29 km | 0.002 % | — | — | 2:32 |
| 15 | 12.29 km | 24.58 km | 0.004 % | 1.00 s | 15.0 s | 2:44 |
| 21 | 786.4 km | 1,573 km | 0.262 % | 1.00 s | 21.0 s | 3:11 |
| 22 | 1,573 km | 3,146 km | 0.525 % | 1.00 s | 22.0 s | 3:21 |
| 24 | 6,291 km | 12,580 km | 2.1 % | 1.00 s | 24.0 s | 3:32 |
| 25 | 12,580 km | 25,170 km | 4.2 % | 1.00 s | 25.0 s | 3:38 |
| 27 | 50,330 km | 100,700 km | 16.6 % | 1.01 s | 27.0 s | 3:51 |
| 29 | 201,300 km | 402,700 km | 55.8 % | 1.20 s | 29.3 s | 3:56 |
| 30 | 402,700 km | 805,300 km | 80.2 % | 1.67 s | 31.0 s | 4:28 |
| 37 | 51.54 million km | 103.1 million km | 0.999… | 2.9 min | 6.2 min | 4:44 |
| 39 | 206.2 million km | 412.3 million km | 0.999… | 11.5 min | 23.4 min | 4:57 |
| 41 | 824.6 million km | 1.649 billion km | 0.999… | 45.8 min | 92.2 min | 5:08 |
| 42 | 1.649 billion km | 3.299 billion km | 0.999… | 91.7 min | 3.1 h | 5:15 |
| 44 | 6.597 billion km | 13.19 billion km | 0.999… | 6.1 h | 12.2 h | 5:20 |
| 45 | 13.19 billion km | 26.39 billion km | 0.999… | 12.2 h | 24.5 h | 5:29 |
| 46 | 26.39 billion km | 52.78 billion km | 0.999… | 24.5 h | 48.9 h | 5:41 |
| 50 | 422.2 billion km | 0.08926 ly | 0.999… | 16.3 days | 32.6 days | 5:53 |
| 53 | 0.357 ly | 0.714 ly | 0.999… | 130.4 days | 260.8 days | 6:03 |
| 56 | 2.856 ly | 5.712 ly | 0.999… | 2.856 years | 5.712 years | 6:08 |
| 57 | 5.712 ly | 11.42 ly | 0.999… | 5.712 years | 11.42 years | 6:32 |
| 60 | 45.7 ly | 91.4 ly | 0.999… | 45.7 years | 91.4 years | 6:36 |
| 64 | 731.2 ly | 1,462 ly | 0.999… | 731.2 years | 1,462 years | 6:43 |
| 67 | 5,849 ly | 11,700 ly | 0.999… | 5,849 years | 11,700 years | 6:50 |
| 70 | 46,800 ly | 93,590 ly | 0.999… | 46,800 years | 93,590 years | 6:58 |
| 72 | 187,200 ly | 374,400 ly | 0.999… | 187,200 years | 374,400 years | 7:11 |
| 75 | 1,497,000 ly | 2,995,000 ly | 0.999… | 1,497,000 years | 2,995,000 years | 7:19 |
| 80 | 47,920,000 ly | 95,840,000 ly | 0.999… | 47,920,000 years | 95,840,000 years | 7:27 |
| 84 | 766,700,000 ly | 1,533,000,000 ly | 0.999… | 766,700,000 years | 1,533,000,000 years | 7:33 |
| 86 | 3,067,000,000 ly | 6,134,000,000 ly | 0.999… | 3,067,000,000 years | 6,134,000,000 years | 7:45 |
| 90 | 49,070,000,000 ly | 98,140,000,000 ly | 0.999… | 49,070,000,000 years | 98,140,000,000 years | 7:58 |

(Speed: your true speed as seen from Earth, v/c = (L/c)/√(1 + (L/c)²), which never reaches 1. "Earth's clock" for the
steps on the ground is the film's own (you stand still between some leaps), so it starts at step 15.)

## 2. The look
- **You**: a bright, reusable character with a face (`js/world/youCharacter.js`, built for this film so later films reuse it): an orange jacket, blue
  trousers, white trainers, a teal backpack, expressions (grin, surprise, shock, awe), seen from outside.
- **New York** (`nyc.js`, `nyc-set.js`, `street.js`): a made-up brownstone side street in Brooklyn Heights (the HUD says your
  street is made up; the city and its landmarks are at their real places), the bus stop and bus, the avenue, the Statue of Liberty, the Empire State Building, the Brooklyn
  Bridge, Manhattan's towers; crowds who film you, then the broken windows, car alarms, a crater line. Bright morning.
- **The sky** (`sky.js`, `boston.js`): New England from high up, the curve of the Earth, the meteor trail; Boston's Esplanade
  crowd looking up at the streak.
- **Space** (`space.js`, `cosmos.js`): a floating-origin cosmos (far bodies compressed past 2,000 km), the Earth, the
  ISS, the Moon, the planets drawn from across your path, Voyager, Proxima; star aberration and Doppler as you near c.
- **The deep** (`deep.js`): point clouds drawn about the camera: the Milky Way (four arms, a bar, dust), Andromeda,
  the Orion Nebula, the cosmic web at three sizes, the observable universe from outside.
- **Text**: a big step counter top-left, one status word under it (the step's length, then your speed, then Earth's
  clock), measured labels on the famous things, the honest tag bottom-left. No title card.

## 3. The shots (`shots.js`: 123 shots: a new picture every 2–3 s in the first 15 s, then 6–10 a minute, more
  on the street)
cold open (step ninety, the film's very last moment as a flash-forward, so no second is shown twice) · step one on
your stoop · Monday morning, late · steps 2–5 (the bus stop, the step back over the bus, home) · the rule (diagrams) ·
the walk to work: steps 6–9 (traffic, the pavement cracks, phones, the Statue, awnings) · step 10 (the Empire State
Building, the cone, the boom, the glass, every window) · steps 11–14 (Mach 2, the Brooklyn Bridge, squeezed air,
Mach 9, the crater, your office, the park) · step 15 (escape) · the meteor, Boston · space (the Station, look back,
the Moon) · the light barrier (the clocks) · the planets, the evening at home, Voyager · a day, a star, a month, the
posters · Proxima, six years · the turn, the future street · the deep (Milky Way, every person who ever lived,
Andromeda, dust, the web) · the red giant · step ninety · the last choice · "Which way would you step?"

## 4. The sound (`sound-*.js`, `mix.js`)
- **Voice**: the 79 clips, never regenerated, cut or sped up; the other stems duck under it.
- **Score** (`sound-music.js`, all synthesised): two ideas, the step (a note and its octave: twice the frequency) and
  home (G E C falling: your front door, always in C). C major plucks on the street, A minor building to the boom, which
  cuts the music dead; D minor driving through Manhattan; D major in space; the light barrier bends the strings down at
  "Time"; a hit on every planet; the biggest moment at step seventy; the open's hit again at step ninety; one bell on
  the question, cut on the last frame.
- **Beds** (`sound-amb.js`): the street, the wind of your wake, the high air, the Esplanade, space's floor, home, the
  deep. **Effects** (`sound-sfx.js`): every step (push-off, stride, landing), the crack, the boom and the glass, car
  alarms, the craters, the meteor, Boston's gasp, a whoosh for every famous thing, the watch and Earth's clock. No
  breathing loop (only a breath as an accent).
- **Mix**: the music leads; the beds about 10 dB under it, measured stem by stem; −16 to −14 LUFS, true peak ≤ −1 dBTP.

## 5. Delivery
ZIP (runnable, baked soundtrack with the code's fingerprint, tested from a fresh unzip), `EPISODE_REPORT.md`, three
thumbnails (giant bold number, a red warning word, the character) in `/mnt/project-files/twice-as-long/`; the final
1080p render on the owner's PC (D: only) to `D:\renders\twice-as-long`.
