# What if you kept shrinking and couldn't stop? — plan

A voiceless 16:9 long-form film (1920×1080, 30 fps, 7:38) in the style the owner asked for after studying a channel
that makes 8-minute "What if" videos with no narration: one continuous first-person journey, a short second-person
caption every few seconds, a corner readout with a plain comparison, a human thread underneath (Mum's messages), a
real-physics ending, then black. None of that channel's caption lines are used; every line here is our own.

Page: `shrinking.html`. Code: `films/shrinking/`. Beats and captions: `script.js`. Height over time: `SH_KEYS`.

## The physics the scenes come from

You shrink smoothly from 1.75 m to the Planck length (1.6 × 10⁻³⁵ m), about 35 powers of ten, at a rate that slows
where there is something to see and speeds up where there is not. Each scene is a consequence that only exists at
that size:

| size | consequence | scene |
|---|---|---|
| 1 m → 5 cm | everything familiar becomes a landscape | the bedroom grows; the cat notices you and is horse-sized |
| 1 cm | strength scales with area, weight with volume | you lift a toy brick 100× your weight |
| 6 mm | jump height doesn't shrink with size (flea) | a jump fifty times your height onto the phone |
| 1 mm → 0.4 mm | a screen is subpixels | letters as tall as you, then red/green/blue lights |
| 0.4 mm | a phone's vibration is an earthquake; small things fall slowly | the call throws you off; a soft landing |
| 200 µm | dust is mostly skin; mites eat it | the mite |
| 150 µm | surface tension beats weight | the spilt water traps the mite |
| 100 µm → 1 µm | air is viscous (low Reynolds number) | moving in syrup, stopping dead; pollen; a skin flake with bacteria |
| 1 µm → 0.3 µm | Brownian motion; smaller than light's wavelength | shoves from nothing; the colours fade to grey |
| 200 nm | viruses that hunt bacteria | a phage lands and fires |
| 10 nm → 1 nm | air molecules at 1,700 km/h | molecular hail; DNA |
| 0.1 nm | atoms have no surface; they're almost empty | haze, electron "maybe", the stadium and the pea |
| fm | the nucleus; a proton is a storm of gluon field | twelve nucleons; three quarks; pairs flickering |
| below 10⁻¹⁹ m | nothing has been measured | rings for each factor of ten; space boils (foam) |
| 1.6 × 10⁻³⁵ m | the Planck length; that much energy makes a black hole | a black hole forms, evaporates in a flash |

## Three signature moments

1. **The cat looks down at you** (23.5 s) and jumps (32.4 s): the glass and the phone go over, its nose comes down.
2. **The phone's buzz as an earthquake** (113.2 s): Mum's call throws you off the screen into a slow fall.
3. **The smallest possible thing is a black hole** (433 s): it forms, bends the foam round it, and flashes away.

## Structure (≈ 7:38)

1. The bedroom (0–74): title over the room · the ceiling rises · the cat · Mum's text saves you · the brick.
2. The phone (74–125): the run and the jump · letters, pixels, subpixels · the call and the quake · the fall.
3. The dust (125–233): look up (your bedroom is a city) · dust is skin · the mite · the water · hair, syrup air,
   pollen, a skin flake, bacteria · Brownian shoves · the colours fade.
4. The grey (233–291): electron-microscope view · your hands · the phage · molecular hail · DNA.
5. The atom (291–371): DNA is balls · inside the haze · the electrons' blur · emptiness · stadium and pea · the
   nucleus · a proton's storm.
6. Beyond (371–458): a quark that doesn't grow · no experiment below here · the rings of scale · foam · the Planck
   length · the black hole · the flash · black · the phone buzzes in the dark (Mum: "Where are you?").

Honest labels in the corner: SLOW MOTION (the jump, the fall), ILLUSTRATION · TOO SMALL FOR LIGHT (the grey),
ILLUSTRATION · FALSE COLOUR (nucleus, proton), THEORY · BEYOND ANY EXPERIMENT (below the quark).

## Sound (no narrator)

`sound-music.js`, `sound-amb.js`, `sound-sfx.js`, mixed in `mix.js` (−16 to −14 LUFS, true peak ≤ −1 dBTP, a real
loudness range). The theme is a music-box figure (A–F–E–D) that returns an octave lower each world; below the
proton a Shepard–Risset glissando falls as fast as you shrink and freezes at the Planck length, with one fixed tone
(the quark) over it. The bedroom's sounds grow round you (a ticking clock gets deeper and more echoing, the cat's
breath becomes wind, the phone's buzz becomes an earthquake). Footsteps, the mite's feet, the Brownian shoves and
the molecular hail are placed from the same motion the camera uses, so they land on the picture.

## What could feel recycled (checked while building)

- The bedroom is our usual low-poly interior: kept small, seen from a few centimetres so it reads as a landscape.
- Crossfades between worlds: one per world, each motivated (landing, colour fade, balls, haze, proton, the limit).
- No cars, cranes, collapsing buildings, explosions or falling people; the only "disaster" is the phone's buzz.
