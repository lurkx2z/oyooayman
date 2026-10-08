# Episode report — What if air resistance suddenly disappeared?

## TITLE
**WHAT IF AIR RESISTANCE SUDDENLY DISAPPEARED?** (page: `no-air-resistance.html`, folder: `films/no-air-resistance/`)

## BRANCH
`episode/no-air-resistance-y6gxpi` (one episode, one branch; nothing merged; PR #5 was opened by the owner).

## DURATION
62.2 s film (a 68.0 s continuous take: the paper drop at 0.4× and the plunge at 0.25×, four invisible cuts).
1080×1920, 30 fps, 1,867 frames. Format: Oxygen/Friction structure (centred serif title for 3.4 s, the rule changes
under the title at 2.0 s, a new consequence every 4–8 s, human → machines → animals → aircraft → weather → payoff),
first person, minimal top-left HUD, serif captions.

## PHYSICS RULE
From 2.0 s, **solid objects feel zero aerodynamic force from relative motion through air**: drag 0 and lift 0, on every
solid (paper, people, birds, wings, canopies, cars, debris). Kept on purpose: pressure, breathable air, temperature,
gas behaviour, sound, and buoyancy (static pressure). Liquids are not solids, so water droplets (steam, clouds, the
impact's spray) still ride the wind; this is said on screen (STEAM IS WATER · STILL BLOWN, and the closing note) and is
how the film shows that the air is still moving. Followed through: solids push no air either, so after the change
nothing flaps, rustles or whooshes, the storm is silent, and the airliner falls without a sound (no roar, no sonic
boom); only its impact is heard. Numbers on screen: paper and ball both land in 0.53 s (≈ 1.38 m) · skydiver
565 → 850 km/h (normal top speed ≈ 200 km/h) · coasting car 86 vs 80 km/h, rolls 2.65 km vs 1.66 km · airliner at
11,400 m and 240 m/s loses its lift: supersonic from story ≈ 20.5, 6,500 m · 1,410 km/h when you find it, impact 2.1 km
away at ≈ 1,910 km/h, ~63° down · balloon ≈ 2 g up (21.6 m/s²) · boom 6.1 s after the flash (2.1 km ÷ 343 m/s) · debris
thrown 2.1 km arrives at ≈ 710 km/h (584–795) · sign board falls 12.0 m in 1.61 s, hits at 55 km/h.
Derivations: `PLAN.md` § 1. We do not claim it could happen (the closing note says "Fictional physics").

## REUSED SYSTEMS (engine, not edited)
ViewerHands · StoryHUD (title, readouts, captions, says, note, closing lines) · Post / Look (grade, flash, smear,
vignette) · fog · Environment (subclassed as NrCity) · People (Person, BlobShadows) · Vehicles (VehicleFactory) ·
AircraftSystem (its airliner model, built through `_build`) · particles (BillboardSystem, StreakSystem) · AudioEngine /
SoundKit (subclassed as NrAudio; `audioEngine.js` untouched) · Edit (`CONFIG.edit`) · Track · RNG · Geo · MathX · the
camera rig from SCRIPT (path, look, fov, shakes) · the tools (check-page, stills, render-parallel, render-wav,
bake-soundtrack, encode-final, preview-sheets).

## NEW SYSTEMS (film-level only, all in `films/no-air-resistance/`, globals prefixed NR / Nr / nr)
- `physics.js`: the rule as formulas: wind speed and load, the drop, the jump (NR_JUMP), the car with its normal-air
  twin (NR_CAR, integrated tables), the plane's ballistic arc (NR_PLANE), the balloon, debris launch solutions aimed
  down the avenue, the sign board.
- `city.js`: NrCity (the Air film's avenue, copied and owned here; trees that spring upright; racing clouds; a gap in
  the far skyline).
- `wind.js`: NrWind (flag cloth shader with load, a NORMAL AIR ghost flag, awning, umbrellas, blade sign that swings
  undamped, bins, litter that drops, steam that keeps streaming).
- `actors.js`: NrPeople, NrPigeons (five flyers that fall out of the air, skid and get up; ground pigeons that can't
  lift; the ledge drop), NrTraffic (the coasting car, its ghost, leaflets), NrBalloon.
- `sky.js`: NrPlane, NrCloudDeck (the cloud layer it sinks through), NrImpact (flash, fireball that cools to grey,
  river-spray column that drifts with the wind), NrDebris (ballistic, no drag), NrBoard, NrAerial (the skydiver scene:
  puff clouds, the useless canopy, the NORMAL AIR ghost dome).
- `film.js`: props, hands, HUD tags that track objects, the side-view inset, the countdown, the long-lens near-plane
  trick, the grade. `audio.js`: NrAudio (wind heard only through what it moves, the silent plane, the delayed boom,
  hits delayed by distance, the score).
No engine (`js/`) changes.

## ASSETS ADDED
None. Everything is procedural (geometry, textures, sound). The soundtrack is baked into
`films/no-air-resistance/soundtrack.js`. No third-party media.

## MAJOR TIMESTAMPS (film seconds)
| Film s | Beat |
|---|---|
| 0–3.4 | title over the windy avenue; flag flying, five pigeons flying at you; AERODYNAMIC FORCE 100 % |
| 2.0 | 0 %: the flag drops dead, the pigeons fall out of the air, litter drops; the steam keeps blowing |
| 5.5–10.2 | paper and ball let go together, land together (0.53 s, slow motion ×0.4); NORMAL AIR ghost sheet |
| 10.2–18.2 | 2 km up: the skydiver's speed keeps climbing; he pulls at 14.4; the canopy can't open |
| 18.2–23.2 | the coasting car keeps 86 km/h vs its normal-air ghost; leaflets thrown out keep pace |
| 23.2–27.4 | pigeons can't take off; one steps off a ledge and drops |
| 27.4–33.2 | "Look… up there!": the airliner on a long lens, nose level, falling through a cloud deck in silence |
| 33.2–37.6 | WIND 40 → 100 KM/H: the steam streams flat, a ghost flag snaps, the real flag hangs |
| 37.6–41.7 | a child's balloon shoots straight up |
| 41.7–45.2 | the plunge (slow motion ×¼): the airliner drops behind the far blocks |
| 45.2 | impact 2.1 km away: flash, fireball, column of spray |
| 46.3–51.3 | ITS SOUND ARRIVES IN 5…1 S |
| 51.3 | the boom; you run |
| 53.6–55.8 | debris rains along the avenue at ≈ 710 km/h; a sign board falls where you stood (55 km/h) |
| 56.4–62.0 | look back: limp flag, streaming steam; *The air would still be there. / It just couldn't catch you.* |

## KNOWN LIMITATIONS
- Not re-reviewed after the round-2 fixes; the last scores (below) are for the version before them.
- The middle (car, birds) is the softest stretch; storm and balloon still come after the plane (a reviewer suggested
  moving them before it).
- The paper drop is filmed from straight above; the balloon leaves frame for about a second; the countdown shot is
  mostly static; the outro is a held shot.
- The impact column is made of billboard puffs (soft round edges show at full size); debris pieces are plain boxes;
  viewer hands are simple.
- Physics cheats: the canopy spilling out of its bag (with no drag nothing would pull it out); the plane's attitude is
  held nose-level by script (correct for zero aerodynamic moments, but not simulated); hero timings are scripted from
  the formulas. Sound is kept by the brief, which the rule otherwise strains (a solid that pushes no air should make
  little sound); the film leans into that with the silent plane and storm.
- The sound has been level-measured (−16.9 LUFS, peak −2.1 dBFS), not listened to by a person.
- The skyline and the river beyond it are never seen close; the impact is a long-lens view over the far blocks.

## FINAL PREVIEW PATH
FINAL_PREVIEW_PLACEHOLDER

## PERFORMANCE / FPS
PERFORMANCE_PLACEHOLDER

## REVIEW NOTES (scores as given, four independent reviewers per round)
| Round | Retention | Normal viewer | Visual | Physics |
|---|---|---|---|---|
| 1 (69.5 s preview) | 4.5 | 5 | 5.5 | 6.5 |
| 2 (63 s preview) | 5 | 5 | 5 | 7.5 |

Round 1 fixed: the hook (flag above the title, pigeons falling), a silent plane (no sonic boom, which pushes air),
a near-silent wind, the liquids exemption on screen, a 63 s cut, a telephoto on the plane, a countdown to the boom.
Round 2 fixed: the impact rebuilt (plane drops past the far blocks, flash, orange fireball, spray column, held before
the cut), a bigger tracked plane in a cloud deck, NO LIFT / NO DRAG labels (LIFT 0 N read as "LIFT ON"), a round ghost
canopy, the skydiver centred over puff clouds, a NORMAL AIR ghost flag in the storm, slow motion labelled, wings that
only clap after the change, the countdown starting on 5, COASTING 85, a tighter run (62.2 s). Full notes and timestamps:
`PLAN.md` § 8.
