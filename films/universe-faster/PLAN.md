# PLAN — *What if the universe kept expanding faster and faster?*

16:9 long-form, 1920×1080, 30 fps, 5:56. Voiceless, in the Slower light film's format (the owner's choice on
2026-10-25: "you know the exact formula of the slower light"): one quantity that keeps getting worse and can't stop,
a corner readout, short second-person serif captions with empty screen between them, one night in one place, first
person, real physics, then the real measurements at the end. House style: `/mnt/project-files/what-if-channels-study/STUDY.md` § 6.

Page `universe-faster.html`, code `films/universe-faster/`, captions `CAPTIONS.md` (timed by `build-timing.cjs` into
`timing.js`), every number from `physics.js`.

## 1 · The idea

Tonight at 7:30, the growth of space starts speeding up, and it never stops speeding up. You are in your back garden
with a telescope, a cup of tea, a candle in a lantern and your cat. The film follows the night to midnight:

1. the first second (slowed down): every galaxy, then Andromeda, then every star goes over the edge, and nothing
   looks any different, because their light is still on its way;
2. the sky goes out: the stretch reaches you; red stars go first, the hottest last; Saturn and the Sun go over the
   edge; the Moon shrinks and reddens;
3. you get lighter: the fountain, a jump, your ears, the tea boiling at 75 °C, the candle flame going round;
4. 11:35, weightless; the air drifts off; the ground cracks; Earth comes apart from the outside in; your garden drifts
   away (the cold open's moment);
5. the last second (slowed down): your house, then you, then the atoms;
6. midnight; then what's real (the acceleration, measured since 1998; a rip, probably not) and the real future.

## 2 · The physics (physics.js)

**The rule.** Space grows by a scale factor a(n), n = seconds after 19:30:00, a(0) = 1. Its growth rate H = ȧ/a:

    H(n) = H0 + b·n + h·[1/(R − n) − 1/R − n/R²]      H0 = 2.2×10⁻¹⁸ /s, b = 1.5×10⁻⁸ /s², h = 4/3, R = 4.5 h

The last term is the textbook phantom-energy Big Rip (w = −1.5 gives H = h / time left, with h = 2/(3|1+w|) = 4/3),
started from rest at 7:30 so that midnight is the rip; b·n is the onset. ln a has a closed form (`uxLnA`).

**What follows** (all computed, nothing typed in by hand):

| quantity | formula | values tonight |
|---|---|---|
| doubling time (readout) | ln 2 / H | 10 billion years at 7:29 → 1 h at 10:00 → 28 min at 11:00 → 14 min at 11:30 → 5 min at 11:50 → 0.52 s at 11:59:59 |
| the edge | c / H | 14 billion ly → 2 ly after the first second → 0.2 ly at 7:30:10 |
| the pull | ä/a = Ḣ + H², a free thing at r feels (ä/a)·r outward | jumps to 1.5×10⁻⁸ /s² at 7:30 (the b term): your weight drops to 99% at once |
| weight | 1 − (ä/a)·R⊕/g | 95% at 10:00, 82% at 11:00, 31% at 11:30, zero at 11:35:16 |
| air pressure | ∝ weight (the air's own weight presses on you) | ears pop near 11:26; tea boils at 75 °C (Antoine) |
| stretch | light crossing growing space: a(now)/a(sent) | a blackbody θ stretched by s looks exactly like a blackbody θ/s of the same size: red stars go dark first |
| over the edge | something set free at the onset, at comoving distance χ, crosses when ȧ·χ = c | Neptune 8:30:56, Saturn 9:34:22, the Sun 10:55:34, the Moon 11:54:45 |
| stars over the edge | c/H = their distance | Deneb 0.001 s, Altair 0.126 s, all named stars by half a second |
| Earth's layers | a shell lets go when ä/a beats (4/3)πGρ̄ inside it (PREM) | surface 11:35:16, 660 km 11:36:53, core–mantle boundary 11:42:41, inner core 11:44:01 |
| the last second | ä/a = h(1 + h)/left² | your house at 0.79 s (5 g across 10 m: about 0.1 MPa, mortar's bond strength), you at 56 ms (~170 g head to foot), molecules at ~10⁻¹⁴ s, atoms at 4×10⁻¹⁷ s (the pull on an electron equals its binding) |

**"Over the edge"** means moving away faster than light (beyond c/H). Because H keeps rising, the true point of no
return (the event horizon) is nearer still: from 7:30 it is never more than c × 4.5 h = 32 AU away, so every star was
cut off at the onset itself, Saturn at 8:48, the Sun at 10:41, the Moon at 11:53. The captions only ever say that
things past the edge can't reach you, which is true; they never say things inside it still can.

**The real universe is different in one way the film says out loud.** Its expansion is speeding up (each galaxy
recedes faster every year), but its growth rate H is falling, so the real doubling time is slowly getting longer
(10 → about 12 billion years). In the film, from 7:30, H rises and the doubling time shrinks. Hence "At 7:30, the
doubling time starts to shrink" and, at the end, "The speeding up is [real]. … But the doubling time isn't shrinking."

The Moon, the Sun and Saturn are drawn by light-travel time: what you see is the light arriving now, sent when they
were nearer (`uxSent`), stretched by `uxStretch`; their size and brightness follow. Checked against an orbit
integration: once set free, the Moon's distance tracks a(n) to within 1%.

**Honesty labels on screen.** THOUGHT EXPERIMENT · FROM 7:30, SPACE GROWS FASTER AND FASTER; ILLUSTRATION · SPACE
GROWING · 10 BILLION YEARS IN 20 SECONDS; ILLUSTRATION · DISTANCES SQUEEZED TO FIT; THE FIRST SECOND · SLOWED DOWN;
THE NIGHT, SPED UP; THROUGH YOUR TELESCOPE · 120×; FROM HERE, PRETEND YOU CAN BREATHE; THE LAST SECOND · SLOWED DOWN;
REAL · ILLUSTRATED; REAL MEASUREMENTS · ILLUSTRATED; THE REAL FUTURE · ILLUSTRATED.

**What's real (the end).** The acceleration was discovered with supernovae in 1998. A rip needs dark energy whose
push keeps growing (w < −1); the latest surveys (DESI, 2025) point to dark energy that is steady or weakening, not
growing. Even in today's universe, the galaxies beyond our Local Group are leaving: in about 100 billion years only
our own merged galaxy will be left in the sky.

## 3 · Structure (shots.js, script.js)

| time | beat | set |
|---|---|---|
| 0:00 | cold open: 11:41, the house adrift, lit red from below ("At 11:41 tonight, you'll fall into the sky.") | garden |
| 0:06 | title over the garden at 7:29 | garden |
| 0:11 | space grows (galaxy lattice, a ruler), held together | cosmos |
| 0:27 | Saturn in the telescope | scope |
| 0:35 | the rule, the cat on the wall, 7:30 | garden |
| 0:43 | the first second, slowed down: the edge closing in, Andromeda, letting go (all at once), every star; the cat lands | garden, cosmos |
| 1:55 | the stretch, red stars first (a star count falls from 976 to 0), the Moon, Saturn over the edge, the blue stars, the Sun | garden, scope |
| 3:08 | lighter: weight, fountain, the Moon goes out, the jump, the air, your ears, the tea, the flame | garden |
| 4:02 | weightless, chairs and mug fall up, the crack (a glowing line across the lawn), your garden drifts away, Earth in pieces | garden |
| 4:48 | the last second, slowed down: the house, you, the atoms | garden |
| 5:01 | midnight | dark |
| 5:06 | what's real; the real future; the closing question in the garden at 7:29 | cosmos, garden |

**Signature moments.** The first second: every star over the edge and nothing looks different (1:33–1:46); Saturn
going over the edge in your own telescope while you still see it (2:30–2:43); the last second, one tick per doubling
of space, the house letting go brick by brick (4:48–5:01).

## 4 · Sound (audio.js, sound-*.js, mix.js)

All synthesised. Score in D minor (sound-music.js): the theme D–A–G–E then the octave D (an octave is a doubled
frequency); the sky's chord slides down as starlight stretches; in the last second, a tick for every doubling of
space. Ambience (sound-amb.js): the garden at night, quieter and duller as the air thins, nothing after 11:36; in the
first second the garden's sound is slowed with the picture into a low throb. Effects (sound-sfx.js): the telescope,
the cat, your steps and jump at your weight, your ears popping, the tea, your breathing. Targets: −16 to −14 LUFS,
≤ −1 dBTP, real dynamics.

## 5 · Delivery

`films/universe-faster/render-gpu.cjs` renders the final 1080p MP4 and a small copy under 30 MiB on the owner's PC.
Runnable ZIP, EPISODE_REPORT.md and thumbnails in `/mnt/project-files/universe-expanding-faster/`.
