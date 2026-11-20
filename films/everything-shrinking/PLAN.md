# What if everything kept shrinking and couldn't stop?

A voiceless 16:9 long-form film (4:47) in the house formula: Friction 10 s, Gravity keeps tilting, No light, Sound faster
than light. It uses the "kept … and couldn't stop" title pattern that brings most of the channel's views, and the eerie,
quiet tone of Slower light. Page: `everything-shrinking.html`. Captions: `CAPTIONS.md` → `build-timing.cjs` →
`timing.js`. The story clock (`clock.js`) only runs forward. It jumps only at cuts, and the HUD says "+N s LATER".

**Setting (new scenery).** A lake campsite in the Canadian Rockies (51.4° N, 116.2° W, 1,890 m), on Saturday
28 August 2027 at 6:49 AM, just before sunrise. You are in a tent with your son Leo, who is six. The neighbours
sleep in a camper van. There is spruce forest, a turquoise lake and a ring of peaks 1,300–1,800 m above the water.

## 1. The rule
At 6:49:00 AM everything except you starts shrinking towards your tent. Its atoms shrink too, so it keeps its shapes,
materials and density. Every 30 seconds it is half the size: s(τ) = 2^(−τ/30). You do not shrink.

The film's one cheat: the air stays on a world too small to hold it, and you can still breathe after it has shrunk
below your eyes. The HUD says so.

## 2. The physics (`physics.js`; `script.js` checks every caption number against it)
- **Gravity** at the surface of a ball of the same density scales with its radius, so g = 9.81·s. Your weight is
  75·s kg and the escape speed is 11,186·s m/s. At 1:12 you weigh 9 kg. At 3:16 you weigh 14 g, and the escape
  speed (1.98 m/s) is below a standing jump (3 m/s). At 3:55 it is under 10 cm/s.
- **Sound.** A thing of the same shape and material rings at a frequency ∝ 1/size, so it goes an octave up per
  halving. Leo's voice (275 Hz) is 2 octaves up at 1:02. It sounds like a bird at 1:52 (7.6 kHz), a whistle at
  1:57 (10.3 kHz) and is gone at 2:00 (above 17 kHz, an adult's limit). Your voice to them (120 Hz) drops below
  20 Hz once s < 1/6: they feel it as a quake. The valley's deepest steady sound (100 Hz) passes 17 kHz at τ = 222 s.
- **The view.** Your eyes are 1.66/s m up to the world. The Sun's upper limb clears the skyline to the ENE for your
  eye at τ = 266.9 s (6:53:27). That is a horizon map plus the Earth's curve, with refraction added. The meadow
  stays 3.6° under its skyline, so the valley is still dark. By shadow:1 (τ = 302) you are 1.9 km tall to them,
  taller than every peak, so your shadow lies on them.
- **The peaks** (1,500 m) reach your waist (1.05 m) at τ ≈ 314.
- **The air.** It shrinks with the world, so its scale height is 8.4·s km. Your hand at 1.08 m is 3 km up to Leo:
  thin air (68 %) and −15 °C (lapse rate 6.5 °C/km). At 3:42 less than 1 % of the air is above your kneeling eyes.
- **The airliner.** A 737 cruising at 11 km (39.5 m long) passes at your kneeling eye height when
  (11,000 − 1,890)·s = 1.18 m. It is 5 mm long.
- **The Earth** is 2·6,371 km·s across. It is 800 m at 3:35, and a house (12 m), a car (4.6 m) and smaller than you
  between 4:09 and 4:16. At 30 cm its mass, 5.97×10²⁴·s³ kg, is 75 kg, the same as yours. It reaches a grain of
  sand (1 mm) 4 minutes later, and 0.4 µm (violet light's wavelength) in 10.
- **The Moon** shrinks too and comes closer by the same factor, so it keeps the same angular size (0.52°).

## 3. The beats (25 beats including the title and the question; 51 captions)
title → start (the tent closes in; Leo asleep) → out (through the roof) → rule (Poincaré 1908: if everything changed size, would anyone notice?
Unless one thing didn't) → leo (to him, you're growing) → voice (2 octaves) → weight (9 kg; you pick him up) →
neighbours (30 m tall; screaming) → rumble (your voice is a quake) → hush (bird, whistle, nothing) → quiet (only
you) → sunrise (you see it first) → shadow (the gold peaks; seen from them, you block their sunrise) → peaks (the lake a puddle; the peaks at
your waist) → air (3 km up, −15 °C; you put him down; he walks off; gone) → escape (14 g; you hold on to two
mountains) → plane (5 mm) → curve (800 m) → sky (the air below your eyes; stars at 6:57) → lift (it can barely hold you)
→ moon (the same size) → house / car / smaller → ball (30 cm, 75 kg) → end (Leo is on it; 4 and 10 minutes) →
question: "Would you watch it until it's gone?"

## 4. Set and shots (`shots.js`: 51 shots, one set)
One set (`world.js`). The world is a group scaled by s round the tent. You, your hands and the camera stay in your
own metres. The terrain is a polar ring mesh out to 600 km on the curved Earth, with the globe beyond it. It is lit
per pixel by the real dawn (`worldfx.js`): the local Sun against a horizon map, sunlight reddened by the air, and
haze from the optical depth, so the haze stays right at any scale. The modes are in `modes.js`. In your own view
your body is not drawn, but it still casts its shadow.

## 5. Sound (`sound-lib.js`, `sound-music.js`, `sound-amb.js`, `sound-sfx.js`; `mix.js`)
- **Score.** Leo's lullaby is five falling notes that end a semitone off home. A music box that belongs to the world
  plays it, an octave higher every 30 s, until it is out of hearing (gone by 2:05). Your score (strings, piano,
  drums, the endless rise) never changes pitch. The music leads (the owner's rule of 31 October 2026).
- **World sounds** (river, wind in the spruce, dawn chorus, Leo, the neighbours, the quake) are played at
  ekWorldRate = 1/s and fade past 17 kHz.
- **Your sounds** (your breath, your heartbeat from the quiet on, your blood in your ears) stay at your own pitch.

## 6. Checks and review log
- `script.js` refuses to run if any caption number or moment drifts from `physics.js`. The clock anchors throw if
  the clock would run backwards.
- Reviews, scores and fixes are in `EPISODE_REPORT.md`.
