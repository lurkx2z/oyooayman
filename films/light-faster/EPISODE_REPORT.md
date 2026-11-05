# Episode report — *What if the speed of light increased and couldn't stop?*

**Format.** 16:9 long-form, 1920×1080, 30 fps, 5:16 (315.65 s). Voiceless, in the Gravity keeps tilting / Friction 10s
/ Air solid formula, built to the owner's YouTube lessons of 28 October 2026 (an everyday place, action in the first
seconds, a real-physics nod in the first minute, about five to six minutes, tension to the last frame), the rule of
29 October 2026 (**the story clock only runs forward**) and the brief's "more new scenery": no kitchen, flat, street
or city set reused. One clock (`LF_CLOCK`, `script.js`) runs from Saturday 8:59:57 PM to 9:18:03 PM: real speed under
the title, the first 40 seconds after 9 PM ten times slower ("10× SLOWER" on the HUD, 0:03–2:26 of film), then real
speed from the beach on, with forward jumps only at cuts ("+45 s", "+3 min", "+2 min", "+6 min"). `script.js` throws
if the clock runs backwards and `shots.js` throws if it jumps anywhere but on a cut. The film is told by 58 short
second-person captions, the speed of light on the HUD (km/s, ×k, "1% FASTER EVERY SECOND", the next threshold), the
clock, one context box per beat, labels pinned in the scene, insets (the gold reflectance curve, the day side and the
Sun, the column of old light, light's wave and your pupil), honest tags and the sound. Page `light-faster.html`, code
`films/light-faster/`, every number in `PLAN.md` § 2 (computed in `physics.js`), captions `CAPTIONS.md`.

**The physical reading.** From Saturday 7 November 2026, 9:00:00 PM, light everywhere gets 1% faster every second,
compounding (c = 299,792.458 km/s × 1.01^s), and never stops; light already on its way speeds up too and keeps its
energy. The electron's charge and mass, Planck's constant, ε₀ and gravity stay put: **that is the one impossible
part**, and the film says so at 0:23 after the real thing (since 1983 c is a fixed number, 299,792,458 m/s, and the
metre is defined by it). Everything else follows from μ₀ = 1/(ε₀c²) and the fine-structure constant falling as 1/k:

- magnetism weakens as 1/k² ("twice as fast, four times weaker"): the grid's transformer iron saturates at ×1.085,
  the hospital's superconducting MRI magnet has to carry more current to hold its flux and quenches at ×1.1 (helium
  plume from the roof), the grid trips at ×1.15, the stadium's own feed a moment later, the hospital's generators
  start and sag (their field magnets are weaker too), the train (on the grid's overhead line) brakes from 120 km/h,
  cars stall at ×1.3 (a spark coil's energy is a magnet's), a speaker pushes a quarter as hard at ×2, the patients'
  name cards slide off the nurses' magnetic board;
- relativistic chemistry fades as 1/k²: mercury's melting point climbs until the observatory's barometer freezes at
  6 °C (×1.32); gold's absorption edge leaves the visible and your ring turns silver (×1.47);
- light is harder to shake loose and to catch: the fire is seven times dimmer at ×2.7 and no cooler, LEDs, phones and
  the plankton in the waves fade, colours drain (dyes and your eyes' cones catch 1/k); the Earth sheds its heat as
  light, so from ×10 only 1% gets out and it can't cool down;
- old light (already on its way at 9 PM) arrives k× faster and the eye catches 1/k of it, so the stars look as bright
  as ever, until the light is used up: the Sun's at 9:03 (the day side got six times the heat, barely brighter; after
  it, what the Sun sends now is far weaker), Saturn's at 9:07:34, seen going out in the observatory's eyepiece;
- a photon keeps its energy, so its wavelength grows with c: at 9:10 green light's waves are 400 times longer
  (0.22 mm) and your eyes' diffraction blur (1.22 λ/D, D = 7 mm) is 2°: every star is a blur; at 9:16 the waves are
  as wide as your pupils and less and less light gets in. The last caption asks what the last light you see will be.

## Shot list (current cut, 45 shots)

| time | what | clock |
|---|---|---|
| 0:00 | the title over the night train on the sea wall at 120 km/h, its horn | 8:59:57 PM |
| 0:03–0:22 | through the window: the sea and the stars; your phone: "GPS signal lost" | 9:00:00.0–01.9 (10× slower) |
| 0:22–0:43 | the train from outside, the bay and the city across it (the hospital, the stadium); the impossible part; light is electricity and magnetism; the pantograph's arcs | 9:00:01.9–04.0 |
| 0:43–0:50 | ×1.08: the transformers choke, every light on the coast flickers | +4 s |
| 0:50–1:12 | the hospital's MRI room: the magnet, the current climbing on the status screen, ×1.1 the quench; the helium plume from the roof | 9:00:08.6–10.8 |
| 1:12–1:50 | ×1.15 the coast goes dark; the stadium dark with 40,000 people, then their phones; the hospital's generators; only the battery lights; the train brakes in the dark, sparks off its wheels | +3 s, 9:00:13.9–17.7 |
| 1:50–2:26 | ×1.3 cars stall on the coast road (the spark coil); the observatory on the mountain, its barometer freezing at 6 °C; your ring turns silver | +8 s, 9:00:25.6–39.5 |
| 2:26–3:25 | real speed: the train stops by a beach with a bonfire party; the speaker; the nurses' board; the fire seven times dimmer and no cooler; the plankton in the waves; the stadium's phones going dark | 9:00:55–9:02:00 |
| 3:25–3:57 | the colours drain (×5, your eyes too); the day side of the Earth: six times the heat, then 9:03 | +31 s, 9:02:31–9:03:06 |
| 3:57–4:10 | ×10: the Earth can't cool down | +45 s |
| 4:10–4:36 | the stars: the only light not fading (Achernar, the Magellanic Clouds), as bright as ever; the old light running out | 9:04:04–9:04:30 |
| 4:36–4:48 | the observatory's eyepiece: 9:07, Saturn goes out | +3 min |
| 4:48–5:01 | 9:10: light's waves 400 times longer; every star a blur | +2 min |
| 5:01–5:12 | 9:16: the waves as wide as your pupils; a formless glow, fading | +6 min |
| 5:12–5:16 | "What will be the last light you ever see?", cut on the last frame | 9:18:00 |

## How it follows the owner's lessons and playbook

- Everyday place, human scale: a Saturday-night train home along the sea wall, then the beach where it stops; the
  places across the bay (a hospital, a stadium in the middle of a match, an observatory on the mountain) are seen
  from it or cut to as "meanwhile". All new sets.
- Action on frame 1: the train is running along the wall and sounds its horn under the title; at 9:00 (0:03) light
  starts speeding up, and at 0:13 your phone loses its GPS.
- Real nuance in the first minute: the 1983 definition of c and the metre (0:23–0:31), then why magnets care (light
  is electricity and magnetism, rippling).
- A stake by 0:40: every magnet on Earth gets weaker, four times weaker at twice the speed; everything after it is a
  thing built on magnets failing, then the light itself.
- No clock resets: one forward clock; the slow minutes say "10× SLOWER", every jump says how far.
- About five minutes (5:16), no recap; the end gets colder and closer (your own eyes) and ends on the question.
- Not an "X kept getting slower" derivative, and not a copy of the Slower light film: the eerie tone, but faster, on a
  new set, about magnetism and old light.
- Teaser Shorts: the MRI quench and the plume (0:50–1:12), the stadium going dark and its 40,000 phones (1:12–1:30),
  the ring turning silver (2:14–2:26), Saturn going out in the eyepiece (4:36–4:48).
- Thumbnails (house style, real frames): `thumb-stadium.jpg` (348,639 km/s, "and still it won't stop", "The stadium
  just went dark."), `thumb-fire.jpg` (812,498 km/s, "The fire is seven times dimmer, and no cooler."),
  `thumb-blur.jpg` (400× faster, "Every star is a blur.").

## Reviews

One round, three independent reviewers on the first full cut (contact sheets and stills of every shot, the caption
timeline, the physics), before the fixes. Scores as given:

- **Story and retention 6/10**: nothing visibly changed until 0:48; the middle read like a list; the 9:03 payoff (the
  Sun's old light running out) wasn't shown; some pictures didn't match their captions; the ending (the nearest star
  going out at 9:23) lost human scale.
- **Visuals 6/10**: the hospital too bright in the blackout; payoffs unseen; HUD boxes colliding; a "speed ladder"
  cluttering the frame; a black bar across the partygoers' necks (the camera was inside your own neck); dark frames;
  the stadium phones and the GPS phone hard to read; the plankton looking like lasers; the "seven times dimmer" fire
  not looking dimmer.
- **Physics 7/10**: the naked-eye ending ignored the wavelength stretch (the decisive effect); "every atom stays" was
  wrong (α changes); the GPS error was overstated; the Sun's fade after 9:03 was missing; "burns hotter",
  "the first night that won't get colder", "one force" and the cars' coils were loose.

Fixed after the round (see `PLAN.md` § 6): the phone's GPS loss at 0:13 as the first visible change, the pantograph's
arcs and the flicker before 0:48; the day-side diagram now shows the heat after 9:03 falling; captions re-cut to the
pictures; a new ending through your own eyes (the waves stretching until you can't focus, then until they barely fit
through your pupils), with the stars' light spread over the blur disc; the blackout lit only by battery lights and
torches; the ladder removed; insets and labels kept clear of each other and of the clock; your body hidden wherever
the camera is your eyes; bigger brake sparks with their own light; the nurses' board framed clear of the HUD; the
plankton crests broken into patches; the starfield aimed at Achernar and the Magellanic Clouds; every physics wording
fix. These fixes were checked on stills, not re-scored.

## What is still weak

- Story 6/10, visuals 6/10 and physics 7/10 were the scores before the fixes; the fixes have not been re-scored.
- The fire still looks bright on screen: the film's exposure follows your eyes adapting, so "seven times dimmer"
  lives mostly in the HUD number and the darker sand around it.
- The starfield reads at 1080p but is faint in small previews; the Milky Way is low at that hour and season, so the
  sky shots lean on the Magellanic Clouds.
- The MRI room is a plain white box; people are the house's simple low-poly figures.
- The stadium and the observatory are seen briefly; most of the film is on the coast.

## Sound

All synthesised and seeded (`sound-*.js`, `mix.js`), baked into `soundtrack.js` with the film-side fingerprint fix
(so the ZIP plays its sound outside Chrome too). Score in A minor: an endless rising Shepard–Risset tone under the
whole film (it never arrives, like the speed of light), faster at the beach and again at the stars; a title motif;
pads that tighten with the grid; hits on the transformers, the quench, the grid and the stadium; a stumbling pulse
for the generators; an ice cluster and a bell when the mercury freezes; falling bells for the gold; the beach
progression as the colours drain (Am9 → Am → A5 → A1); a swell and hit as the Sun's light runs out; a roll to Saturn
and a hit; for the stretching waves a cluster gliding down and bell pairs a semitone apart; the pupil drone
darkening; the question motif, cut on the last frame. Beds per place (the train's rumble and the sea against the
wall; the hospital's air handling and the MRI's cold-head pump; 40,000 people, then a frightened murmur; the wind
round the dome; crickets on the road; the surf and the party), lowered and darkened in the slow minutes. Effects: the
horn, the rail joints, the pantograph's arcs, the transformer hum turning harsh, the MRI's knocks and alarm, the
quench bang and helium roar, the district thumps, the stadium's contactors and the crowd's gasp, the generator, the
brakes, the cars coughing out, the barometer taps, the party's song (its level follows the speakers' −40 log₁₀ k dB)
and the fire.

**Mix.** −14.8 LUFS integrated, −2.5 dBTP, loudness range 6.5 LU (the baked WAV); the mastered
`final-soundtrack.m4a` (AAC 256k, through a limiter at −3 dB) measures −14.9 LUFS and −2.8 dBTP, and
`small-soundtrack.m4a` (AAC 128k, for the phone-size copy) −14.9 LUFS and −2.3 dBTP. **The score leads** (the owner's
rule of 31 October 2026): measured stem by stem in 10-second windows across the whole film, the music sits 9.3 to
22.5 dB over the beds (median 14.3 dB; the closest is the train's arrival at the beach, with the surf) and 5.9 to
37 dB over the effects (median 18 dB; the closest are the MRI quench and the grid's bangs, meant to cut through).
Stem trims music +2.5, beds −6, effects +2 dB (`mix.js`).

## Delivery

- **Runnable ZIP** `light-faster-film.zip` (in the project files): extract it, open `light-faster.html` in Chrome or
  Edge, wait for SOUND READY, press Space. The soundtrack is baked in and checked against the code's fingerprint.
- **Final 1080p MP4** on the owner's PC (graphics card), one command in the repo folder after pulling this branch:
  `node films/light-faster/render-gpu.cjs --channel chrome --workers 2 --out D:\renders\light-faster --small` →
  `D:\renders\light-faster\light-faster_final_1080p.mp4` (1920×1080, 30 fps, H.264 CRF 18, the mastered soundtrack
  `final-soundtrack.m4a` copied in, 5:16) and `light-faster_final_small.mp4` (1280×720, under 30 MiB). Resumable: run
  it again and finished segments are kept.

## Files

- page `light-faster.html`; code and plan `films/light-faster/`
- runnable ZIP, report and thumbnails: `/mnt/project-files/light-faster/`
