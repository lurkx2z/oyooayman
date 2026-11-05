# What if the speed of light increased and couldn't stop?

A voiceless 16:9 long-form film: 1920×1080, 30 fps, 5:16. It follows the Gravity keeps tilting / Friction 10s / Air
solid formula and the owner's YouTube lessons (28 October 2026):
- **an everyday place, and new scenery:** a night train along a sea wall on a Saturday at 9 PM (no kitchen, flat,
  street or city reused). From it the film visits a hospital across the bay (the MRI room, the roof, the generator
  room, a ward corridor), a stadium in the middle of a match, an observatory on the mountain, the coast road and the
  beach where the train stops, with a bonfire party on it;
- **action on frame 1:** under the title the train is running along the wall at 120 km/h and sounds its horn. At 2.85 s
  (9:00:00 PM) light starts speeding up, 1% every second, compounding, for ever;
- **the real nuance in the first minute:** "Officially, this is impossible. Since 1983 the speed of light has been a
  fixed number, 299,792,458 m/s. The metre is defined by it." (0:23–0:31). Only light speeds up; electrons, atoms and gravity
  stay as they are: that is the one impossible thing;
- **a stake by 0:40:** "light is electricity and magnetism, rippling": every magnet on Earth gets weaker, and
  everything built on them (the grid, the MRI, the generators, the cars' spark coils, the speakers) fails in the first
  minute;
- **tension to the last frame:** the colours go, the fire stops glowing while it is still hot, the Earth can't cool
  down; the stars stay, because their old light is arriving faster, until that light runs out: the Sun's (9:03),
  Saturn's (9:07). Then light's own waves stretch (a photon keeps its energy, so its wavelength grows with c): at 9:10
  your eyes can't focus them and every star is a blur; at 9:16 they are as wide as your pupils and less and less light
  gets in. The last caption, "What will be the last light you ever see?", is cut on the last frame. There is no recap.

The owner's rule of 29 October 2026: **the story clock only runs forward**. One clock (`LF_CLOCK`, script.js): real
speed under the title, then the first 40 seconds after 9 PM ten times slower (2.85 s to 2:26 of film), then real speed
from the beach on, jumping forward only at cuts (the HUD says by how much), the big ones of 45 s (to the heat), 3 min
(to Saturn), 2 min (to 9:10), 6 min (to 9:16) and 2 min (to 9:18:00, the question).
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
| the grid's transformer iron saturates (B_sat ∝ 1/k², running at 1.7 of 2.0 T) | 1.085 | 8.2 s | 0:46 |
| the MRI quenches (flux fixed, so I ∝ k²; the wire carries 21% over) | 1.1 | 9.6 s | 1:00 |
| the grid trips | 1.15 | 14.05 s | 1:14 |
| the stadium's own feed trips | 1.155 | 14.45 s | 1:18 |
| the hospital's generators start (and sag: their field magnets are weaker too) | 1.17 | 15.5 s | 1:29 |
| the train's driver brakes (0.75 m/s² from 120 km/h) | 1.18 | 16.6 s | 1:40 |
| cars stall, one by one (a spark coil's ½LI² 40% down; the battery at 8.6 V of 12) | 1.3 | 25.6–27.2 s | 1:50–1:57 |
| the observatory's barometer freezes (mercury's melting point −38.8 + 105 (1 − 1/k²) °C reaches the dome's 6 °C) | 1.32 | 27.95 s | 2:12 |
| gold's absorption edge (3.7 − 1.3/k² eV) leaves the visible: the ring turns silver | 1.47 | 38.9 s | 2:20 |
| the train stops by the beach | 1.82 | 61.0 s | 2:32 |
| a speaker pushes a quarter as hard (B ∝ 1/k², −40 log₁₀ k dB) | 2 | 69.7 s | 2:40 |
| the fire is seven times dimmer at the same temperature (1/k²) | 2.7 | 100 s | 3:05 |
| colour drains (dyes and cones catch 1/k) | 5 | 161.7 s | 3:35 |
| the Sun's old light is used up: c₀∫k ds = 499 light-s; after it, what the Sun sends now (k/kₑ³) | 6 | 179.5 s (9:03:00) | 3:51 |
| Earth can't shed its heat as light (1% of it gets out): the Earth can't cool down | 10 | 231.4 s | 3:58 |
| Saturn goes out (its light: 4,740 + 4,330 light-s of sunlight) | 91 | 453.6 s (9:07:34) | 4:39 |
| green light's waves 400 times longer (0.22 mm): the eye's blur 1.22 λ/D (D = 7 mm) is 2° | 400 | 602 s (9:10:02) | 4:49 |
| the waves as wide as a dark-adapted pupil (7 mm): k_pupil = 12,727; light getting in 1/(1 + (k/k_pupil)⁴) | 12,727 | 950 s (9:15:50) | 5:01 (shown at ×14,000) |
| the last caption, cut on the last frame | 46,700 | 1,080 s (9:18:00) | 5:12–5:16 |

- **Old light:** light that left before 9 PM arrives k× faster (and k× as much per second), and the eye catches 1/k of
  it (retina OD 0.4), so the stars look about as bright as before (×1.4–1.5). It runs out when light has swallowed
  the whole column between the source and you: k = 1 + D·ln(1.01)/c₀ for a column D light-seconds long.
- **GPS:** receivers time light with the old c, so the fix is lost at once ("NO FIX"; the timing is (k − 1) off).
- **Light's waves:** a photon keeps its energy E = hc/λ, so λ grows as k. The eye's diffraction blur 1.22 λ/D grows
  with it (lights.js lfEyeLook: the picture softens, then goes formless, then darkens as less fits through the pupil;
  sky.js spreads each star over the blur disc, keeping its light).
- **Heat:** sunlight already in flight arrives k× as fast: six times the heat by 9:03 on the day side; it barely looks
  brighter because the eye catches less. After 9:03 the Sun's new light is far weaker (k/kₑ³: 4× the heat and falling).
- **The train:** 120 km/h east along the sea wall, three cars on 25 m rails; it runs on the grid's overhead line, so
  it brakes when the grid goes and stops by the beach steps at 61 s.

## 3. The beats (CAPTIONS.md, 27 beats after the title, 58 captions)

1. **The train** (0:00–0:50): the title over the train on the sea wall; the window and the stars; "Your phone just lost
   its GPS"; the real speed of light and the impossible part; light is electricity and magnetism, rippling; the
   pantograph's arcs; ×1.08, the transformers choke and every light on the coast flickers.
2. **The hospital across the bay** (0:50–1:12): the MRI's superconducting magnet; its current climbs on its own; ×1.1,
   the quench; the helium plume from the roof.
3. **The blackout** (1:12–1:50): the coast goes dark; the stadium goes dark with 40,000 people inside; then 40,000
   phones; the hospital's generators start and sag; only the battery lights stay on; the train brakes in the dark,
   sparks off its wheels.
4. **The road and the mountain** (1:50–2:26): ×1.3, the cars on the coast road stall (their spark coils are magnets);
   the observatory's barometer freezes at 6 °C; your ring turns silver.
5. **The beach** (2:26–3:25, real speed): the train stops by a beach with a bonfire party; the party's speaker fades
   (×2, a quarter as hard); in the hospital the patients' names slide off the magnetic board; the fire seven times
   dimmer and no cooler; the plankton in the waves fading like the phone screens; the stadium's phones going dark.
6. **The colours, the day, the heat** (3:25–4:10): the colours drain (×5, your eyes too); the day side's six times the
   heat, then 9:03, the Sun's old light has all arrived; ×10, the Earth can't cool down.
7. **The stars** (4:10–5:16): the only light not fading; but it is running out; 9:07, Saturn goes out (seen in the
   observatory's eyepiece); 9:10, light's waves are 400 times longer and every star is a blur; 9:16, the waves are as
   wide as your pupils and less and less gets in; "What will be the last light you ever see?", cut on the last frame.

## 4. Sets and shots (shots.js: 45 shots)

- **coast** (coast-world.js, coast.js, train.js, city.js, sky.js): the sea wall, tracks and overhead line, the coast
  road with lamps and cars, houses, the headland with its tunnel and lighthouse, the beach with the bonfire and the
  party, the bay with the city lights across it and the hospital on the far shore, the night sky (real southern stars
  at 33.9° S, the Milky Way, the Magellanic Clouds, Saturn). The train: three cars with people, cabin lights, the
  battery emergency lights, brake sparks (with their own orange light).
- **hospital** (hospital.js): the MRI room (magnet, couch, control window), the generator room, a ward corridor, the
  nurses' board with magnetic name cards.
- **stadium** (stadium.js): a 40,000-seat bowl, floodlights, players, the crowd's phones.
- **obs** (observatory.js): the dome with the slit open, the telescope, the old mercury barometer, the eyepiece view.

Look: night, the house grade, the light physics applied per set (lights.js: LEDs and the glow fade, colour drains
toward grey, old light drawn with k/adapt; from 9:10 the eye's diffraction blur, lfEyeLook, then a formless glow that
darkens as less light fits through the pupil). No z-fighting: every set was scanned for coplanar overlapping triangles
(§ 6).

## 5. Sound (sound-lib.js, sound-music.js, sound-amb.js, sound-sfx.js; mix.js)

- **The score** (eerie, A minor): an endless rising Shepard–Risset tone under the whole film (it never arrives, like
  the speed of light), getting faster at the beach and again at the stars; a title motif; pads that tighten with the
  grid; hits on the transformers, the quench, the grid and the stadium; phone bells; a stumbling pulse for the
  generator; an ice cluster and a bell when the mercury freezes; falling bells for the gold; the beach progression as
  the colours drain (Am9 → Am → A5 → A1); a swell and hit as the Sun's light runs out; stars, a roll to Saturn and a hit,
  the stretching waves (a cluster gliding down, bell pairs a semitone apart); the pupil drone darkening; the question
  motif, cut on the last frame.
- **Beds** (per place): the train's rumble and cabin hum, the sea against the wall; the bay; the hospital's air
  handling and the MRI's cold-head pump; the stadium's roar and then a frightened murmur; the wind round the dome; the
  road's crickets; the surf and the party's voices. In the slow minutes every bed is lowered and darkened.
- **Effects:** the horn, the wheels on the rail joints, the pantograph's arcs, the transformer hum turning harsh, the
  MRI's knocks and alarm, the quench bang and helium roar, the district thumps, the stadium's contactors and the
  crowd's gasp, the generator, the brakes and the doors, the cars coughing out, the barometer taps, the party's song
  (its level follows the speakers' −40 log₁₀ k dB) and the fire's crackle.
- **The mix (owner's rule, 31 October 2026):** the music clearly leads, the beds about 10 dB under it, measured stem
  by stem: 9.3 to 22.5 dB over the beds (median 14.3), 5.9 to 37 dB over the effects (median 18); −14.8 LUFS,
  −2.5 dBTP; mastered AAC `final-soundtrack.m4a` −14.9 LUFS / −2.8 dBTP (mix.js header has the trims).

## 6. Checks and review log

- **Z-fighting (owner, 4 November 2026: "make sure there is no z fighting"):** a scan of every shot for overlapping
  coplanar triangles with different looks (within 4 mm) found about 20 kinds: the train's end walls, door windows,
  tail lights, headrests and underframe; the sea wall's parapet and piers; the platform; the phone screens (yours and
  the stadium's); the hospital mattress, headboard and the board's name cards; the goal nets; the telescope's boxes;
  the people's belts, chest strips and bag straps (film-level, cast.js). All fixed with stand-offs larger than the
  depth buffer's step at viewing distance. What the scan still lists is off-screen or under a pixel.
- **Independent reviews (5 November 2026), scores as given:** story and retention 6/10, visuals 6/10, physics 7/10.
  - *Story:* nothing visible changed until 0:48; the middle read like a list; the 9:03 payoff (the Sun's old light
    running out) wasn't shown; pictures didn't always match the captions; the ending (the nearest star going out at
    9:23) lost human scale. *Fixed:* the GPS loss on your phone at 0:13 (the first visible change), the pantograph's
    arcs and the flicker before 0:48; the day-side diagram shows the Sun's heat after 9:03 falling; captions re-cut to
    the pictures (the road, the board, the fire); a new ending told through your own eyes (the waves stretching until
    you can't focus, then until they barely fit through your pupils).
  - *Visuals:* the hospital too bright in the blackout; payoffs unseen; HUD boxes colliding; the "as light speeds up"
    ladder cluttering the frame; a black bar across the partygoers' necks (the camera inside your own neck); dark
    frames; the stadium phones and the GPS phone hard to read; the plankton looking like lasers. *Fixed:* all of those
    (the ladder removed; insets and labels kept clear of each other and of the clock; your body hidden where the
    camera is your eyes; the brake sparks larger, with their light; the nurses' board framed clear of the HUD; the
    plankton crests broken into patches; the starfield aimed at Achernar and the Magellanic Clouds).
  - *Physics:* the naked-eye ending ignored the wavelength stretch; "every atom stays" was wrong (α changes); GPS
    error was overstated; the Sun's fade after 9:03 was missing; "burns hotter" and "the first night that won't get
    colder" were loose; "one force"; cars' coils. *Fixed:* every one in the captions, the HUD and physics.js.
  - *Still weak:* the fire still looks bright on screen (the film's exposure follows your eyes adapting, so "seven
    times dimmer" lives mostly in the HUD number); the starfield is fine at 1080p but faint in small previews; the
    MRI room is a plain white box.
