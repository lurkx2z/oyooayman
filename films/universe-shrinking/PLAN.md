# PLAN — *What if the universe kept shrinking and couldn't stop?*

16:9 long-form, 1920×1080, 30 fps, 4:44 (284.2 s). Voiceless, in the Slower light / Universe faster format (the
owner's brief on 2026-10-25: the exact formula of those two films, a fresh escalation, and **retention first**: "people's
watch time are almost half of the video length"). One quantity that keeps getting worse and can't stop (**the
temperature of space**), a corner readout, short second-person serif captions with empty screen between them, one night
in one place, first person, real physics, then the real science at the end. House style:
`/mnt/project-files/what-if-channels-study/STUDY.md` § 6.

Page `universe-shrinking.html`, code `films/universe-shrinking/`, captions `CAPTIONS.md` (timed by `build-timing.cjs`
into `timing.js`), every number from `physics.js`.

## 1 · The idea

Tonight at 7:30 the universe starts to shrink, faster and faster, and it can't stop: at midnight there is no space left
(a Big Crunch). Galaxies, stars, the Earth and you are held together and keep their size; only the empty space between
them shrinks. You are in your back garden on a freezing October night, with a telescope and your cat. On the way to
midnight the universe rewinds its whole history: the sky becomes everything it has ever been, ending as the light of
the Big Bang.

1. **The squeeze** (7:30–10:00): starlight that set out before 7:30 is squeezed by shrinking space; red Mirach turns
   white; at 9:14 the universe is half its size and every star looks twice as hot; stars you've never seen come out;
   at 10:00, 131,000 stars, the most beautiful sky anyone has ever seen.
2. **The glow** (10:00–11:15): the dark between the stars glows (the light of every galaxy that ever shone, squeezed
   into colours you can see); 10:30, a city's sky; 11:00, twilight at 11 p.m.; the stars drown.
3. **The heat** (11:25–11:35): the frost melts; space reaches 0 °C and the Milky Way turns inside out (its dark dust
   lanes, warmed, outshine its stars); space passes body heat, then boiling. The cat goes in; so do you.
4. **The fire** (11:36–11:46, from the kitchen window; labelled "from here, pretend nothing can hurt you"): the lawn
   steams; the dead leaves start to burn with no spark; the lawn, the apple tree, the shed and the fence; brighter than
   noon; your telescope melts; the Moon fades into the sky; the windows start to sag ("real glass would have cracked
   by now").
5. **The afterglow** (11:47–11:55): the bird bath boils (at 7:29 it was ice); the Big Bang's afterglow floods the sky;
   your house starts to melt; everything becomes as hot as the sky, so it vanishes into it (no shadows, no edges); 11:52, space is
   2,700 °C: the light of the universe at 380,000 years, the way it looked when it was made; 11:55, the surface of the
   Sun in every direction.
6. **The last second** (slowed down): hotter than the Sun's core, nuclei burst, protons melt, then known physics runs
   out (the readout freezes at the Planck temperature, 1.4 × 10³² °C).
   Midnight.
7. **Is any of this real?** Space is growing, faster every year (1998). But in 2025 a giant map of space (DESI) found
   a clue that the push behind that growth may be fading; if it becomes a pull, growth reverses; one study puts a Big
   Crunch about 20 billion years from now. Then the garden at 7:29 again: "If the sky caught fire at midnight… what
   would you do at 7:29?"

## 2 · The physics (physics.js)

**The rule.** Every free distance is multiplied by 1/s(n), n = seconds after 19:30:00, s(0) = 1. Its rate:

    |H|(n) = ṡ/s = b·n + h·[1/(R − n) − 1/R − n/R²]      b = 3.4×10⁻⁸ /s², h = 4/3, R = 4.5 h

The last term is the mirror image of the textbook phantom Big Rip (H = h / time left), started from rest at 7:30 so
that midnight is the end; b·n is the onset. ln s has a closed form (`ucLnS`, and `ucLnSLeft` from the time left, which
keeps full precision in the last second).

| clock | shrink s (the universe is 1/s of its size) | the temperature of space (2.7255 K × s) |
|---|---|---|
| 8:00 | 1.06 | −270 °C |
| 9:14 | 2.0 | −268 °C |
| 10:00 | 4.5 | −261 °C |
| 11:00 | 26 | −202 °C |
| 11:27:51 | 100 | 0 °C |
| 11:32:39 | 137 | 100 °C |
| 11:45 | 395 | 800 °C |
| 11:52:10 | 1,100 | 2,725 °C (3,000 K) |
| 11:54:58 | 2,120 | 5,500 °C (the Sun's surface) |
| 0.87 s to midnight | 5.7 million | 15.7 million K (the Sun's core) |
| 0.039 s | 370 million | 1 billion K (nuclei come apart) |
| 0.0002 s | 370 billion | 1 trillion K (protons and neutrons melt into quarks and gluons) |
| 1.7×10⁻¹⁹ s | 5×10³¹ | 1.4×10³² K, the Planck temperature: known physics runs out |

**What follows** (computed, nothing typed in by hand):

- **The squeeze.** Light crossing shrinking space has every wavelength divided by s. A blackbody of temperature θ,
  squeezed by s, looks exactly like a blackbody of θ·s with the same size in the sky (its surface brightness rises as
  s⁴), so a star's colour and brightness follow θ·s. Mirach (3,800 K, red) looks 5,100 °C by 8:43 and white by 8:50;
  at 9:14 (s = 2) every star looks twice as hot. Fainter stars brighten past the limit you can see (`ucStarCount`):
  1,900 at 7:29 in a town garden, 131,000 at 10:00 (the peak, before the sky's own glow takes over).
  Fresh light is not squeezed: the Moon's sunlight is 8 minutes old, so the Moon stays the colour it is.
- **What fills space.** The extragalactic background light (every galaxy's starlight and warm-dust glow, mostly far
  infrared) and the Big Bang's afterglow (2.7255 K). Squeezed by s: νI_ν(λ) → s⁴·νI_ν(λ·s); the afterglow stays a
  blackbody at 2.7255·s K. Both start invisible and slide into the visible: the dark between the stars ×3.8 brighter
  at 10:09; a city's sky (≈ 18 mag per square arcsecond) at 10:30; twilight at 11:00 (≈ 14 mag/arcsec²); 0 stars
  visible by about 11:42. The afterglow overtakes the galaxies' light at about 11:48:45 ("a second light floods the
  sky"; it turns the sky from blue-white to orange-red).
- **The Milky Way turns inside out.** Its dark lanes are cold dust (≈ 20 K) that glows in the far infrared. Squeezed
  ×100 (11:27) that glow lands in the visible and outshines the stars behind it: ×169 at 11:27:58 (`ucDust0`).
- **Heat** (`ucThermal`). The sky radiates σT⁴ of its effective temperature onto everything; each kind of thing warms
  towards it at a rate set by how much heat it holds per square metre and what it loses into the ground, the wall or
  the air behind it (`UC_STUFF`). Before tonight the sky is effectively −35 °C through the air, which is why there is
  frost. Results: the frost melts at 11:25:37 (while space is still about −35 °C: the sky's light on it plus the warmer soil underneath);
  the lawn steams at 11:36; dry leaves reach 257 °C (the low end for catching with no flame nearby: they would
  smoulder first and flame by about 11:39) at 11:37:34; the apple tree
  11:40:31, the lawn 11:40:39 (it had to dry first), the shed 11:42:48, the fence 11:43:37; the telescope's aluminium
  tube reaches 660 °C at 11:43:49; window glass softens (≈ 680 °C) at 11:45:44; the bird bath (8 cm of water under 5 mm
  of ice) loses its ice at 11:39:53 and boils at 11:47:46; the steel table melts at 11:49; the outer brick starts to
  melt (≈ 1,330 °C) at 11:50:15. The sky's heat on your skin (the readout) is 1,290 W/m² at 11:33, more than the midday
  Sun's ≈ 1,000.
- **Fire needs air, and the air is still here.** Dry things burn. The flames are hotter than a normal fire because the
  air and fuel arrive preheated by the sky: T_flame = 1,450 K + 0.85 × (the fuel's temperature above 290 K)
  (`ucFlameT`). They glow as blackbodies at that temperature and stay brighter than the sky for as long as there is fuel.
- **The Moon fades into the sky.** Its face sends back sunlight, 12% of the sky's light and later its own heat (its dust
  warms as fast as dead leaves). Contrast against the sky: 32% at 11:43:20, 11% at 11:44:00, zero at 11:44:25.
- **Everything vanishes into the light.** A surface's radiance is ρL + (1 − ρ)B (reflected sky + its own glow). When
  its temperature reaches the sky's, B = L and every surface sends exactly the sky's light whatever its colour or
  angle: no shadows, no edges (a furnace's inside looks the same way). The garden draws this as
  mix(lit colour, sky colour, B/L) per kind of thing (garden.js); the brick walls last longest (11:52:40).
- **The past, rewound.** Space at shrink s is as hot as the universe was when it was 1/s of today's size (redshift
  z = s − 1); the readout's age comes from ΛCDM (Planck 2018): 380,000 years at z ≈ 1,100 (11:52), when the first atoms
  formed and the afterglow was released.
- **The last second.** Timed from the time left (`ucLnSLeft`): 15.7 million K at 0.873 s, 5 billion K at 0.0116 s
  (helium and heavier nuclei come apart; only fragile ones like deuterium go at 1 billion K), 1.8 trillion K at
  0.00014 s (protons and neutrons melt into quarks and gluons), the Planck temperature (1.4 × 10³² K) at 1.7×10⁻¹⁹ s,
  where the readout freezes.

**What the film adds or exaggerates (and says so on screen):**
- The cosmos shots (the rule, held together, the promise, what's real, the 3D map, the future) are labelled THOUGHT
  EXPERIMENT · OUR RULE, ILLUSTRATION or REAL · ILLUSTRATED.
- **The rule itself is impossible at this speed** (a thought experiment): a crunch in four and a half hours means a
  pull of about 5 km/s² across 1 AU at the start, far more than the Sun's grip on the Earth; nothing bigger than the
  solar system could really hold together. The last second's timing (the speed-up near midnight) comes from our rule
  too; a real crunch would reach the Planck temperature about 10⁻⁴³ s before the end. The labels say "our rule".
- **In a real crunch** over billions of years, light from the stars of our own galaxy (only centuries in flight) would
  barely be squeezed; the galaxies' light and the afterglow would do what the film shows. That is why the ending no
  longer says the real end would look "just like this".
- **The heating** is a lumped model (each kind of thing warms towards the sky); it ignores the air soaking up and
  re-emitting heat. Real window panes crack at about 150–200 °C (about 11:41), and the hot glass and the light through
  it would burn you: from 11:36 the film is labelled "from here, pretend nothing can hurt you", and the windows caption
  says real glass would have cracked.
- The afterglow's ripples are 1 part in 100,000; the film shows them 10,000× stronger, and the label says so.
- The DESI map is a bow-tie of points, not the survey's real data.
- The flames, smoke and embers are drawn (a stylised fire), but their timing, temperature and colour come from the
  physics above.
- Readouts are rounded; the stars-you-can-see count is a model of a town garden's sky (limit ≈ 6.2 mag tonight).

**The real science at the end.** The universe is growing, faster every year (supernovae, 1998; Nobel Prize 2011).
DESI's second data release (March 2025, about 15 million galaxies and quasars), combined with the afterglow and supernovae,
prefers dark energy that weakens over time (2.8–4.2σ depending on the data combined: a clue, not a discovery). Fading
alone is not enough (a push that fades to zero still leaves space growing forever); if the push becomes a pull (a
negative cosmological constant), the growth reverses into a Big Crunch; one 2025 study (Luu, Qiu & Tye) estimates
a total lifespan of about 33 billion years, i.e. a crunch about 20 billion years from now. Other fits allow no crunch at
all; the film says "one study" and "one model's estimate · one of several".

## 3 · The clock (script.js)

The night clock on screen is always n. Before 7:30 it runs in real time; from 7:30 it is sped up scene by scene, with
every caption's clock time pinned to the moment it really happens (the keys in `UC_NKEYS`); the last second is slowed
down (log of the time left). Every pinned time above is checked against `physics.js` (see `ucNightForTemp`,
`ucNightForK`).

## 4 · Retention design (the owner's priority)

- **Hook in 3 s:** a flash-forward to 11:44 tonight, from the kitchen: the garden on fire under a sky brighter than noon,
  the cat a silhouette at the window: "11:44 tonight. The night sky is brighter than noon. / And it's setting your
  garden on fire." The title follows at 0:08 (one line, 3.4 s).
- **The promise at 0:40:** "By midnight, you'll see the light of the Big Bang": the payoff is named early and arrives
  at 3:34.
- **A new reveal every 5–8 s**, each with its own clock time and readout change (76 captions in 4:44). No section
  longer than ~25 s without a new kind of event; the fire section is a chain of ignitions.
- **Escalation ladder:** colour → brightness → glow → heat → fire → melting → vanishing → the Big Bang → the last
  second. Each step is a different kind of change, not just "more".
- **Signature moments:** the Milky Way inside out (2:01); the fire with no spark (2:28); the Moon fading into the sky
  (2:49); the garden vanishing into the light, then the Big Bang's light with its ripples (3:23–3:46); the last second.
- **Shorter:** 4:44 against the faster film's 5:56; no recap, no outro card.
- **After the first reviews** (viewer: enjoyment 6, retention 5, clarity 6, visuals 5): the galaxies-crashing
  side-track is cut (the clock dashes from 11:18 to 11:25 on the cut to the frost), the ending is 33 s instead of 43 s
  (no "the same end" beat), the hook window blazes, the hot sky is graded deep gold-orange instead of washed out, Mirach
  is a big red star in the telescope's eyepiece, and the squeeze diagram is large.

## 5 · Sound

Synthesised, three stems (`sound-music.js`, `sound-amb.js`, `sound-sfx.js`, levels in `mix.js`): a D minor score whose
theme ends on its octave (a doubled frequency: "twice as hot"); the sky's chord slides up as starlight is squeezed;
one tick per halving of the universe in the last second. The garden at night (the town, an owl, dogs, a train, a dawn
chorus at 11 p.m. when the sky reaches twilight), a hot wind as the sky heats, the fire as much as is alight at each
moment (heard through the glass from the kitchen), effects placed on the night clock (each ignition, the telescope,
the glass, the bird bath, the house), a throb for the slowed last second, silence at midnight.

## 6 · Files

- `universe-shrinking.html`; `films/universe-shrinking/`: `physics.js` (the rule and everything computed), `script.js`
  (beats and the clock), `shots.js`, `sky.js` (the sky dome, stars, Moon, ripples), `garden-build.js` + `garden.js`
  (the garden, the kitchen, the fire, the materials), `cat.js`, `cosmos.js` (illustrations, the map, the future),
  `dark.js`, `hud.js` (readout, captions, charts), `film.js`, `kit.js`, sound files, `render-gpu.cjs`.
