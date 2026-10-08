# Episode report — WHAT IF EVERYTHING LOST ITS ELASTICITY?

**TITLE**
WHAT IF EVERYTHING LOST ITS ELASTICITY? (slug `no-elasticity`, page `no-elasticity.html`)

**BRANCH**
`episode/no-elasticity-w25koa` (PR #1 was opened from the UI; nothing merged).

**DURATION**
60.2 s film (1807 frames at 30 fps, 1080 × 1920). It is cut from a 73.6 s story clock with `CONFIG.edit`: four waits are
dropped and the crash (story 53.35–55.0) plays at 1/3 speed. See `PLAN.md` for the mapping.

**PHYSICS RULE**
Solids lose elastic recovery. They still resist being deformed (stiffness and strength are unchanged), but once deformed
they never spring back: every solid behaves as perfectly plastic, and its deformation is the running maximum of what it has
taken. Held constant: gravity, mass, momentum, air and other gases (tyres stay round), water, living tissue (people are
fine), engines (spared by fiat; the closing note says so). Collisions are perfectly inelastic (e = 0). The closing note:
"Fictional rule: solids never spring back. People, air, water and engines work as normal." Full rules, numbers and
simplifications: `PLAN.md` §1.

**REUSED SYSTEMS** (engine `js/`, unchanged)
`CameraController` (first-person head, cinematic shots via the pov track), `ViewerHands` (the rubber band), `People` /
`Person` (teenager, kid, walkers, the running club), `VehicleFactory` (car bodies and profiles), `Environment` (subclassed
as `NeCity`), `AudioEngine` (subclassed as `NeAudio`), `StoryHUD` (title, captions, readouts, closing note), `Edit`
(the cut and the slow motion), post-processing, fog, `Look`, particles, timeline tracks, seeded RNG, textures, geometry
helpers, the dev controls. Tools: `check-page`, `stills`, `contact-sheet`, `preview-sheets`, `render-parallel`,
`render-wav`, `bake-soundtrack`, `encode-final`.

**NEW SYSTEMS** (all in `films/no-elasticity/`, all prefixed `Ne` / `NE` / `ne`)
- `city.js`: `NeCity`: the avenue, a raised brick speed table, the junction and signal masts, a plaza, a café with a
  cushioned bench, a steel footbridge. Vertex-shader bending (`neSag`, `neDroop`, `neLean`) shows the footbridge's kept
  dip, drawn 300× deeper and labelled so (`NE_SAG_DRAW`).
- `props.js`: `NeBall` (a solid rubber ball whose flat spot stays; a dashed arc over its old top), `NeTramp` (round
  trampoline whose springs stay stretched and whose mat stays down in a funnel), `NeRacket`, `NeShoe`, `NeCushions`,
  `NeBand` (the rubber band your hands stretch once).
- `cars.js`: `NeCar` (permanent spring set per axle event, capped at the bump stops; coils that shorten; crush),
  `neBuildTruck`, `neLane`, `NE_CRASH` (a perfectly inelastic three-car crash solver: momentum and angular momentum
  conserved, tyre scrub, the van piling in), `NE_TAP` (the 5 km/h tap and back-off), `NeTraffic`, scrape sparks.
- `cast.js`: `NeCast` (people, the running club and its load on the footbridge, film actions and shadows).
- `film.js`: the cinematic inserts (`NE_SHOTS`), world-pinned tags (`NE_TAGS`), the dashed "where it used to be" lines,
  hand poses, the grade.
- `audio.js` / `soundtrack.js`: `NeAudio` and its bake (sounds that obey the rule: no boings, no ringing, no horns).

**ASSETS ADDED**
None. Everything is procedural (geometry, textures and sound are generated in code). No third-party media.

**ENGINE CHANGES**
None (`git diff` on `js/` is empty; `js/audio/audioEngine.js` untouched).

**MAJOR TIMESTAMPS** (film seconds)
| Time | Beat |
|---|---|
| 0.0 | Title over the plaza; a teenager dribbling a solid rubber ball; SHAPE RECOVERY 100 % → 0 % (0.35–1.25). |
| 1.45 | The ball lands and stays down. |
| 1.75 | Low close-up of the flat ball, a dashed arc over its old top (WHERE ITS TOP USED TO BE). |
| 5.6 / 7.55 / 9.5 / 11.45 | Montage: racket strings, shoe foam, cushion dent, rubber band. |
| 13.4 | "Even things built to bounce back…" |
| 15.98 | The trampoline mat stays down; "Bodies are fine. Their gear isn't." |
| 18.2 | A red hatch heads for the speed table. |
| 19.9 | Beside its front wheel: the body settles below a dashed line, RIDE HEIGHT LOST 0 → 8 cm. |
| 23.5 | Two low cars scrape over the table. |
| 26.4 | Beside a loaded truck's rear axle: its springs end on their stops (0 → 11 cm). |
| 30.7 | The footbridge: a running club crosses; the deck keeps its deepest dip (7.2 mm, drawn 300×). |
| 36.1 | The payoff: an SUV runs the red into a sedan. 1/3 slow motion 36.65–41.6, contact at 37.4. |
| 40.7 | High arc round the wreck; the van piles in at 41.2; "Three cars. One wreck." (43.6). |
| 46.0 | A late hatch taps the wreck at 5 km/h (47.5), backs off: the bumper stays pushed in. |
| 50.6 | "Without elasticity…" |
| 51.9 | Back low beside the flat ball (the opening, looped); "…almost nothing gets a second chance to return to shape." (53.2) |
| 56.9 | Closing note; fade to 60.2. |

**KNOWN LIMITATIONS**
- The ball's flat spot (10 % of its diameter, physically right) is subtle at phone size; the ball can still read as round.
- The footbridge is thin in the frame and its runners are small.
- The scraping cars' sparks are barely visible, and sparks at crawling speed are physically debatable.
- The montage reads as a list of four label plates.
- The rubber-band hands look odd.
- The van's tail is a blank slab (no lights or bumper detail).
- The late hatch brakes without a braking dive (under the rule its front springs would set a little too).
- An 18 cm solid rubber ball would be heavy (several kg) to dribble.
- The car and truck beats feel alike.
- The sound has only been level-measured, never listened to.
- The fixes after the fourth review were not re-scored.

**FINAL PREVIEW PATH**
- MP4 (1080 × 1920, 30 fps, H.264 + AAC, one file under 30 MiB): `/mnt/project-files/no-elasticity/no-elasticity.mp4`
  (not committed).
- Runnable ZIP (unzip, open `no-elasticity.html`, press Space): `/mnt/project-files/no-elasticity/no-elasticity_film.zip`
  (tested unzipped with `check-page`: boots, "SOUND READY after 0s", no console errors).
- In the repo: open `no-elasticity.html` (the baked soundtrack is in `films/no-elasticity/soundtrack.js`).

**PERFORMANCE / FPS**
- Scene cost per frame (probe): 182–759 draw calls, 204K–285K triangles.
- Software WebGL (headless SwiftShader, 432 × 768) frame times after warm-up: 14–45 ms for most sampled
  frames, one at 522 ms. Real-time FPS on a GPU browser was not measured here.
- Final render: about 13 s per 1080 × 1920 frame per worker in software WebGL, 4 workers, roughly 1 h 40 min for the film.
- Sound: mixed to about −17 LUFS integrated, true peak about −1.5 dBTP (measured on the preview bake).

**REVIEW NOTES** (four independent reviewers per round, scores out of 10, exactly as given)
| Round | Cut | Retention | Normal viewer | Cinematography | Physics |
|---|---|---|---|---|---|
| 1 | 71.6 s | 4.5 | 5 | 5 | 5 |
| 2 | 60.8 s | 5.5 | 5.5 | 5 | 7 |
| 3 | 60.4 s | 5.5 | 5 | 5.5 | 8 |
| 4 | 60.2 s | 6 | 5 | 6 | 8 |

Round 4's main notes and what was done about them are in `PLAN.md` §8. In short: the end now loops back to the opening
ball close-up, the dead-air street was cut short, captions were rewritten in plainer words, "Three cars. One wreck." moved
onto the arc, the crash and wreck cameras and the tap framing were adjusted, tags stay inside the frame, creaks and long
rumbles became short dull whumps, and the closing note is in plain words. Those fixes were not re-scored. The weaknesses
listed above are what the reviewers still flagged or what is still open.
