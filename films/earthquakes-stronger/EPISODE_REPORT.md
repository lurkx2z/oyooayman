# Episode report — *What If Earthquakes Got 1 Magnitude Stronger Every Minute?*

**Format.** 16:9 long-form, 1920×1080, 30 fps, **9:51** (591.0 s). Narrated (ElevenLabs, voice Michael, 85 clips made
in GitHub Actions with the repository secret; never cut, sped up or regenerated), in the new recipe from the niche study
of 27 November 2026: open on the craziest frame (magnitude twelve: the planet cracking, the city, your face), then "And
this is magnitude three", no title card; a ladder of famous labelled things; "you" as a character with a face; bright
daylight; crowds that react; minimal bold text (a MAGNITUDE counter and one status word); 126 shots (a new picture every
2–3 s in the first 15 s, 18 in minute one, then 10–16 a minute).

**The rule.** Saturday morning on San Francisco's Embarcadero, waiting for a helicopter tour of the bay. A tiny
earthquake starts under the waterfront, and every minute every earthquake on Earth gets one magnitude stronger and none
of them stops. The film runs in real time: one minute of film is one minute of the story. Everything else follows real
physics, and the shortcuts are tagged on screen.

**What follows** (all from `quake.js`; it checks every number the narrator says against the code and the page refuses
to run if one is wrong): magnitude 3 is a bolt of lightning; every step is 32× the energy (log₁₀ E = 1.5 M + 4.8,
USGS), two steps 1,000×; 4 beats MOAB, 5 is 500 t of TNT, 6 is Hiroshima, 7 is Haiti 2010 (the old brick buildings go,
the fill under the waterfront turns to mud, the road splits, the pier breaks up as you lift off), 8 is 1906 and Castle
Bravo (the fires, the Transamerica Pyramid, the Golden Gate), 9 is Japan 2011 and ten Tsar Bombas (the bay drains like a
bathtub and comes back over your café), 10 has never been recorded (a month of all human energy; the crack runs from Los
Angeles to Oregon), 11 is three years of human energy (Tokyo, Dubai, Istanbul shaking too; two dozen quakes growing),
12 is four days of all the sunlight on Earth. One more minute passes the dinosaur asteroid; seven more would blow the
planet apart. "You have two hours of fuel. And seven minutes of planet." "Who would you call?"

## The look
"You": the channel's reusable character (orange jacket, blue trousers, white trainers, teal backpack). The Embarcadero
in morning sun: your café terrace, the promenade, the F-line streetcars, the Ferry Building, a pier with a helipad, the
Bay Bridge, downtown and the Transamerica Pyramid; the city from the air as it falls and burns; the Golden Gate; Los
Angeles (the Hollywood sign), Mexico City (the Angel of Independence), the Hoover Dam, the Space Needle, Tokyo at 2 AM
(the Skytree), Dubai (the Burj Khalifa), Istanbul (the Bosphorus Bridge); the globe with every growing quake and the
crack. The HUD: MAGNITUDE and a giant number top left (it pops yellow on every tick), one status word, the minute bar
with your clock, labels pinned to things, comparison cards, and an honest tag at the bottom.

## Sound
- **Score** (synthesised): it climbs a semitone every minute as the earthquake climbs a magnitude (minute one in C,
  minute ten in A), with a hit and the climb's two-note motif on every tick, and three falling notes for you (the café,
  the lift-off, the last line). Morning plucks at the café; a low pulse at "this one isn't stopping"; full drive at "So
  you run"; it opens wide as you leave the ground; high and still above the draining bay; the last line alone on the
  piano and one bell on the question.
- **Beds**: the Embarcadero on a Saturday morning (traffic, the bay lapping under the café, gulls, a ferry horn) thinning
  as the city fails; the helicopter cabin; the wind over the bay; the other cities; a low floor in space.
  **Effects**: the ground's rumble and the city rattling at the shaking's own rhythm with a jolt on every tick, the cup,
  the shelves, the phones' emergency alert, the crowd, windows, chimneys, car alarms, the streetcar, the mud, the bricks,
  the split road, the pier, the turbine winding up and the rotor, the Bay Bridge, the fires, the wave, the Hollywood
  letters, the dam, the Needle, Dubai's glass, the planet cracking. No breathing loop.
- **Mix.** The rendered WAV: −15.3 LUFS integrated, −1.5 dBTP, LRA 5.0 LU. `final-soundtrack.m4a` (AAC 256k, limiter
  at −3 dB): −15.4 LUFS, −2.3 dBTP. `small-soundtrack.m4a` (AAC 128k): −15.5 LUFS, −1.6 dBTP. Stems: voice −2 dB,
  music +9, beds −9, effects −6, master −2.5. The baked soundtrack uses the rounded fingerprint, so the ZIP plays its
  sound outside Chrome too (fingerprint 0bb10d20).
- **The music leads** (the owner's rule), measured stem by stem (solo renders, K-weighted, 10-second windows, stem gains
  added): the score is 10.4 dB or more over the beds in every window (median about 17 dB). The only exception is the
  last 1.5 seconds after the final cut, where the music has already stopped. The effects sit under the score except
  for the Bay Bridge's deck dropping (about 4:48), where they are level with it.

## Reviews
Three independent reviewers per round (pacing, picture, science), each looking at contact sheets of a full preview
render and the script. Scores as given, out of 10:

| Round | Pacing | Picture | Science |
|---|---|---|---|
| 1 (first preview) | 5 | 4 | 7 |
| 2 (after fix round 1) | 5 | 5 | 8 |

**Fixed after round 1:** the tsunami read as a fog band (now a dark wall of water with a foam crest, the bay floor
showing as it drains); fires, haze, mud boils, the split road, the pier and the crack pit redone; cockpit angles; label
caps; minute 1 reordered and minute 2 cut faster; the moving "postcard" city shots; the planet cracking.

**Fixed after round 2:**
- *Science wording:* the longest real ruptures (Chile 1960, Sumatra 2004: about 1,000–1,500 km) against the crack (about
  1,300 km at "Los Angeles to Oregon", still growing, onto the Cascadia fault off Oregon); the Golden Gate is retrofitted
  for a magnitude 8.3, about a minute of shaking, not five and a half; MOAB is the biggest non-nuclear bomb *used in war*;
  Tsar Bomba the biggest *ever exploded*; each step is waves 10× taller on a seismograph; where the quake starts (a small
  fault under the waterfront, then the San Andreas); boiling every ocean (about 3.7 × 10²⁷ J, magnitude 15 to 16) on the
  last chart, which is now marked as a log scale.
- *Picture:* the wall of water now reaches the terrace on screen; the Bay Bridge's deck drop happens inside its shot; a
  bus for "a truck rumbling past"; a gentler streetcar derailment; smoke and spray fade out near the lens; the thin crack
  no longer breaks into black specks along the horizon; the map shots' dark ticks (black terrain seams) are gone; the
  fires are lit by the magnitude-8 jolt and the fires shot looks at the districts that burn; the Haiti shot is an aerial
  over the old brick districts coming down; the helicopter's lettering is no longer mirrored on one side; labels that
  pointed at haze removed; text kept off faces and cards (the end question, the Mexico City card, the fuel screen, the
  menu wall); a soft dark backing under the counter.
- *Pacing:* the slow beats in minutes 1 and 2 are split into more shots (the promenade, your pilot on the phone, your
  booking on your phone, the rotor starting, over your shoulder down the pier).

**Still weak, said plainly** (no third round of reviews was run after these fixes): minutes 1 and 2 are calm by design
(magnitudes 3 and 4 are barely felt), so they are the slowest stretch; the far city is low-detail from the air; the
moment the wave hits the café falls on a cut.

## Delivery
- `/mnt/project-files/earthquakes-stronger/`: `earthquakes-stronger-film.zip` (the runnable page: unzip, open
  `earthquakes-stronger.html` in Chrome or Edge, wait for SOUND READY; tested from a fresh unzip), this report, and
  `thumbnail-1.jpg`, `thumbnail-2.jpg`, `thumbnail-3.jpg` (1280×720, for YouTube Test & compare: bright daylight, only
  "MAGNITUDE 12", your shocked face, the street splitting under you, an office tower tipping).
- The 1080p film is rendered on the owner's PC with `node films/earthquakes-stronger/render-gpu.cjs --channel chrome
  --out D:\renders\earthquakes-stronger --small` (D: only): `earthquakes-stronger_final_1080p.mp4` (1920×1080, 30 fps,
  H.264 CRF 18, the mastered AAC 256k soundtrack copied) and a 720p copy under 30 MiB.
- Branch `claude/project-thread-4w7kq0` (no pull request).
