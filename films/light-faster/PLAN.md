# What if the speed of light increased and couldn't stop?

A voiceless 16:9 long-form film: 1920×1080, 30 fps, 5:24. It follows the Gravity keeps tilting / Friction 10s / Air
solid formula and the owner's YouTube lessons (28 October 2026):
- **an everyday place, and new scenery:** a night train along a sea wall on a Saturday at 9 PM (no kitchen, flat,
  street or city reused). From it the film visits a hospital across the bay (the MRI room, the roof, the generator
  room, a ward corridor), a stadium in the middle of a match, an observatory on the mountain, the coast road and the
  beach where the train stops, with a bonfire party on it;
- **action on frame 1:** under the title the train is running along the wall at 120 km/h and sounds its horn. At 2.85 s
  (9:00:00 PM) light starts speeding up, 1% every second, compounding, for ever;
- **the real nuance in the first minute:** "Officially, this is impossible. Since 1983 the speed of light is a fixed
  number, 299,792,458 m/s. The metre is defined by it." (0:23–0:36). Only light speeds up; electrons, atoms and gravity
  stay as they are: that is the one impossible thing;
- **a stake by 0:40:** "light and magnetism are one force": every magnet on Earth gets weaker, and everything built on
  them (the grid, the MRI, the generators, the cars' sparks, the speakers) fails in the first minute;
- **tension to the last frame:** the colours go, the fire stops glowing while it is still hot, the night stops getting
  colder; the stars stay, because their old light is arriving faster, until that light runs out: the Sun's (9:03),
  Saturn's (9:07), the nearest star's (9:23). The last caption, "What will be the last light you ever see?", is cut
  on the last frame. There is no recap.

The owner's rule of 29 October 2026: **the story clock only runs forward**. One clock (`LF_CLOCK`, script.js): real
speed under the title, then the first 40 seconds after 9 PM ten times slower (2.85 s to 2:36 of film), then real speed
from the beach on, jumping forward only at cuts (the HUD says by how much): five jumps, of 16 s, 32 s, 48 s, 3 min and
16 min, the last to 9:23:38.
`script.js` throws if a segment runs backwards; `shots.js` throws if the clock jumps anywhere but on a cut.

Page: `light-faster.html`. Captions: `CAPTIONS.md` → `node build-timing.cjs` → `timing.js`. Every number on screen
comes from `physics.js` (§ 2).

## 1. The rule

From **Saturday 7 November 2026, 9:00:00.000 PM**, light everywhere gets **1% faster every second**, compounding:
c(s) = 299,792.458 km/s × 1.01^s. It never stops. Light already on its way speeds up too and keeps its energy.

- **The one impossible thing:** c changes while the electron's charge and mass, Planck's constant, ε₀ and gravity stay
  put (physically: the fine-structure constant α falls as 1/k, with k = c/c₀).
- **Everything else follows** from μ₀ = 1/(ε₀c²) and α ∝ 1/k (physics.js header): magnetism weakens as 1/k², thermal
  glow as 1/k², light emission from LEDs and plankton falls as 1/(1 + k³/9), dyes and the retina catch light as 1/k,
  relativistic chemistry (gold's colour, mercury's melting point, the lead-acid cell) fades as 1/k².

## 2. The physics (physics.js)

| Moment | k | Story time (after 9 PM) | Film time |
|---|---|---|---|
| the grid's transformer iron saturates (B_sat ∝ 1/k², running at 1.7 of 2.0 T) | 1.085 | 8.2 s | 0:51 |
| the MRI quenches (flux fixed, so I ∝ k²; the wire carries 21% over) | 1.1 | 9.6 s | 1:05 |
| the grid trips | 1.15 | 14.0 s | 1:19 |
| the stadium's own feed trips | 1.155 | 14.45 s | 1:23 |
| the hospital's generators start (and sag: their field magnets are weaker too) | 1.17 | 15.5 s | 1:33 |
| the train's driver brakes (0.75 m/s² from 120 km/h) | 1.18 | 16.6 s | 1:45 |
| cars stall (an ignition coil's ½LI² 40% down; the battery at 8.6 V of 12) | 1.3 | 26.4 s | 2:07 |
| the observatory's barometer freezes (mercury's melting point −38.8 + 105 (1 − 1/k²) °C reaches the dome's 6 °C) | 1.32 | 28.0 s | 2:23 |
| gold's absorption edge (3.7 − 1.3/k² eV) leaves the visible: the ring turns silver | 1.47 | 38.9 s | 2:31 |
| the train stops by the beach | 1.82 | 61.0 s | 2:42 |
| a speaker pushes a quarter as hard (B ∝ 1/k², −40 log₁₀ k dB) | 2 | 69.7 s | 2:51 |
| the fire is seven times dimmer at the same temperature (1/k²) | 2.7 | 100 s | 3:21 |
| colour drains (dyes and cones catch 1/k) | 5 | 161.7 s | 3:51 |
| the Sun's old light is used up: c₀∫k ds = 499 light-s | 6 | 179.5 s (9:03:00) | 4:09 |
| Earth can't shed heat as light: the first night that won't get colder | 10 | 231.4 s | 4:13 |
| Saturn goes out (its light: 4,740 + 4,330 light-s of sunlight) | 91 | 453.6 s (9:07:33) | 4:55 |
| the nearest star (Alpha Centauri, 4.37 ly) goes out | 1.37 million | 1,420 s (9:23:40) | 5:08 |

- **Old light:** light that left before 9 PM arrives k× faster (and k× as much per second), and the eye catches 1/k of
  it (retina OD 0.4), so the stars look about as bright as before (×1.4–1.5). It runs out when light has swallowed
  the whole column between the source and you: k = 1 + D·ln(1.01)/c₀ for a column D light-seconds long.
- **GPS:** receivers time light with the old c: errors of order (k − 1) × 10,000 km (rough, labelled as such).
- **Heat:** sunlight already in flight arrives k× as fast: six times the heat by 9:03 on the day side; it barely looks
  brighter because the eye catches less.
- **The train:** 120 km/h east along the sea wall, three cars on 25 m rails; it runs on the grid's overhead line, so
  it brakes when the grid goes and stops by the beach steps at 61 s.

## 3. The beats (CAPTIONS.md, 27 beats, 60 captions)

1. **The train** (0:00–0:55): the title over the train on the sea wall; the window and the stars; "Your phone thinks
   you're out at sea" (GPS); the real speed of light and the impossible part; light and magnetism are one force; the
   pantograph's arcs; ×1.08, the transformers' iron saturates and the lights flicker.
2. **The hospital across the bay** (0:55–1:17): the MRI's superconducting magnet; its current climbs on its own; ×1.1,
   the quench; the helium plume from the roof, seen from the coast.
3. **The blackout** (1:17–1:56): the coast goes dark; the stadium goes dark with 40,000 people inside; then 40,000
   phones; the hospital's generators start and sag; only the battery lights stay on; the train brakes under its
   emergency lights.
4. **The road and the mountain** (1:56–2:36): ×1.3, the cars on the coast road stall (and relativity's 10 of 12
   volts); the observatory's barometer freezes at 6 °C; your ring turns silver.
5. **The beach** (2:36–3:41, real speed): the train stops by a beach with a bonfire party; the party's speaker fades
   (×2, a quarter as hard); in the hospital the patients' names slide off the magnetic board; the fire seven times
   dimmer and just as hot; the plankton in the waves fading like the phone screens; the stadium's phones going dark.
6. **The colours, the day, the heat** (3:41–4:27): the colours drain (×5, your eyes too); the day side's six times the
   heat; ×10, the first night in history that won't get colder.
7. **The stars** (4:27–5:24): the only light not fading; but it is running out; 9:07, Saturn goes out (seen in the
   observatory's eyepiece); 9:23, light is 1.4 million times faster and the nearest star goes out; "What will be the
   last light you ever see?"

## 4. Sets and shots (shots.js: 45 shots)

- **coast** (coast-world.js, coast.js, train.js, city.js, sky.js): the sea wall, tracks and overhead line, the coast
  road with lamps and cars, houses, the headland with its tunnel and lighthouse, the beach with the bonfire and the
  party, the bay with the city lights across it and the hospital on the far shore, the night sky (real southern stars
  at 33.9° S, the Milky Way, the Magellanic Clouds, Saturn). The train: three cars with people, cabin lights, the
  battery emergency lights.
- **hospital** (hospital.js): the MRI room (magnet, couch, control window), the generator room, a ward corridor, the
  nurses' board with magnetic name cards.
- **stadium** (stadium.js): a 40,000-seat bowl, floodlights, players, the crowd's phones.
- **obs** (observatory.js): the dome with the slit open, the telescope, the old mercury barometer, the eyepiece view.

Look: night, the house grade, the light physics applied per set (lights.js: LEDs and the glow fade, colour drains
toward grey, old light drawn with k/adapt). No z-fighting: every set was scanned for coplanar overlapping triangles
(§ 6).

## 5. Sound (sound-lib.js, sound-music.js, sound-amb.js, sound-sfx.js; mix.js)

- **The score** (eerie, A minor): an endless rising Shepard–Risset tone under the whole film (it never arrives, like
  the speed of light), getting faster at the beach and again at the stars; a title motif; pads that tighten with the
  grid; hits on the transformers, the quench, the grid and the stadium; phone bells; a stumbling pulse for the
  generator; an ice cluster and a bell when the mercury freezes; falling bells for the gold; the beach progression as
  the colours drain (Am9 → Am → A5 → A1); a swell and hit as the Sun's light runs out; stars, a roll to Saturn and a hit,
  the nearest star's hit; bells cut faster and faster; the question motif, cut on the last frame.
- **Beds** (per place): the train's rumble and cabin hum, the sea against the wall; the bay; the hospital's air
  handling and the MRI's cold-head pump; the stadium's roar and then a frightened murmur; the wind round the dome; the
  road's crickets; the surf and the party's voices. In the slow minutes every bed is lowered and darkened.
- **Effects:** the horn, the wheels on the rail joints, the pantograph's arcs, the transformer hum turning harsh, the
  MRI's knocks and alarm, the quench bang and helium roar, the district thumps, the stadium's contactors and the
  crowd's gasp, the generator, the brakes and the doors, the cars coughing out, the barometer taps, the party's song
  (its level follows the speakers' −40 log₁₀ k dB) and the fire's crackle.
- **The mix (owner's rule, 31 October 2026):** the music clearly leads, the beds about 10 dB under it, measured stem
  by stem (mix.js header has the numbers).

## 6. Checks and review log

- **Z-fighting (owner, 4 November 2026: "make sure there is no z fighting"):** a scan of every shot for overlapping
  coplanar triangles with different looks (within 4 mm) found about 20 kinds: the train's end walls, door windows,
  tail lights, headrests and underframe; the sea wall's parapet and piers; the platform; the phone screens (yours and
  the stadium's); the hospital mattress, headboard and the board's name cards; the goal nets; the telescope's boxes;
  the people's belts, chest strips and bag straps (film-level, cast.js). All fixed with stand-offs larger than the
  depth buffer's step at viewing distance. What the scan still lists is off-screen or under a pixel.
