# Episode report — What if air resistance suddenly disappeared? (v2, rooftop cut)

## TITLE
**WHAT IF AIR RESISTANCE SUDDENLY DISAPPEARED?** (page: `no-air-resistance.html`, folder: `films/no-air-resistance/`)

## BRANCH
`episode/no-air-resistance-y6gxpi` (one episode, one branch; nothing merged; PR #5 tracks it).

## DURATION
60.8 s film (62.4 s of story: the stairwell drop at 0.6×, story 10.1–14.2 cut, the first stones at 0.5×).
1080×1920, 30 fps, 1,825 frames. Format kept: centred serif title for 3.4 s, the rule changes under it at 2.0 s, first
person, minimal top-left HUD, serif captions, a new consequence every 4–7 s.

## WHY v2 EXISTS
The owner's creative-direction override (2026-10-08) judged v1 (an avenue, pigeons, a coasting car, an airliner on a
telephoto, its impact, debris) to be the shared template. v2 keeps the engine, the rule, the HUD and the style, and
replaces every scene: one rooftop party under the edge of a storm, its stairwell, one ride inside the storm cloud, and
the storm cloud's ice as the payoff. Identity questions, ten ranked consequences, signature moments and the shot table
(original / why repetitive / replacement / why better): `PLAN.md` § 0.

## PHYSICS RULE
From 2.0 s solid objects feel zero aerodynamic force (drag 0, lift 0). Kept: pressure, breathable air, buoyancy, sound.
Liquids are not covered, so rain, steam and cloud droplets still ride the wind (said on screen). Stated
simplifications: the falling ice loses no speed to cloud droplets or rain; all the cloud's ice starts from rest; the
ice starts at 6 km. Numbers on screen (all re-derived by the physics reviewer): both land in 2.14 s (22.4 m) · the
stone 440 → 490 km/h · balloons ≈ 2 g (21.6 m/s²) · the first ice lands 35 s after the change at 1,235 km/h, the last at
51.5 s and 1,818 km/h · "falling for 31 seconds" · faster than a 9 mm bullet (465–489 vs ≈ 370 m/s). Details: `PLAN.md` § 1.

## EXACT SCENES CHANGED (v1 → v2, film seconds)
| v1 | v2 |
|---|---|
| 0–5.5 windy avenue, flag, pigeons fall out of the air | 0–6.3 rooftop party under the title; sheets, bunting and kite drop at 2.0; the kite's flyer |
| 5.5–10.2 paper and ball from hand height, filmed from above | 6.3–11.7 paper and ball down the building's 22 m stairwell, slow motion |
| 10.2–18.2 skydiver cut-away, canopy can't open, speed and altitude panels | 11.7–17.9 9 km up beside one hailstone; the cloud streams up past it; lightning; one tag |
| 18.2–23.2 coasting car and its ghost, leaflets | 17.9–21.5 confetti cannon (lands as one clump), toy paratrooper whose canopy can't open |
| 23.2–27.4 pigeons can't take off | 21.5–27.4 the gale: rain sideways, washing barely moves, ghost sheet thrashing |
| 27.4–51.3 airliner found by a bystander, telephoto, plunge, fireball, countdown to the boom | 27.4–36.15 balloons rocket up at 2 g; a clock to the cloud's ice; the first stones in slow motion |
| 51.3–56.4 debris and a falling sign board | 36.15–51.9 the cloud's ice breaks the party one thing at a time, then comes through the roof over you |
| 56.4–62.0 look back at the limp flag | 51.9–60.8 silence; a white roof; a lace sheet barely moving in the wind; closing lines |

## BEFORE / AFTER
- **Before (v1):** a street film whose middle was a car and pigeons and whose climax was a distant airliner and a
  fireball; it read as the channel template ("what feels recycled": 2/10).
- **After (v2):** a rooftop film with no car, plane, explosion or falling person; the climax is a consequence built from
  the rule (drag holds a storm's ice up); "what feels recycled": 6/10 before the last fix round, final score below.

## REUSED SYSTEMS (engine, not edited)
ViewerHands · StoryHUD · Post / Look · fog · Environment (subclassed as NrCity) · People · particles (BillboardSystem,
StreakSystem) · AudioEngine / SoundKit (subclassed as NrAudio; `audioEngine.js` untouched) · Edit (`CONFIG.edit`) ·
Track · RNG · Geo · MathX · Batcher · the tools (check-page, stills, render-parallel, render-wav, bake-soundtrack,
encode-final, preview-sheets). No engine (`js/`) changes.

## NEW / REWORKED FILM SYSTEMS (all in `films/no-air-resistance/`, prefixed NR / Nr / nr)
`roof.js` (the roof, party, laundry with the rain's lean, bunting and fairy lights, kite, stair housing with ice holes
punched through its roof, the open-well stairwell) · `hail.js` (rain, confetti and the toy paratrooper with its
normal-air ghost, the cloud's ice, impacts, fast flat chips, craters) · `sky.js` (the ride 9 km up in the storm cloud)
· `physics.js` (the drop, kite, stone, confetti, balloons, the cloud's ice column and its flux) · `film.js` (props,
tags, the clock, the grade) · `audio.js` (each breakage its own sound, the roar, the silence). Reused from v1 and
kept: the rule, the HUD readouts, the hands, the drop props, the ghost-object idea, the balloon physics.

## REVIEW NOTES (scores as given)
| Round | Recycled (new / old) | Retention | Normal viewer | Visual | Physics |
|---|---|---|---|---|---|
| v1 round 2 (63 s avenue cut) | — / 2 | 5 | 5 | 5 | 7.5 |
| v2 round 1 (first rooftop preview) | 6 / 2 | 4.5 | 5 | 5 | 7 |
| v2 round 2 (61.1 s preview) | 6 / 2 | 5.6 | 5.6 | 6.0 (cinematography 5.5) | 7 |
| Final audit (1080×1920 output) | FINAL_DIFF | FINAL_RET | FINAL_VIEW | FINAL_VIS | — |

FINAL_AUDIT_NOTES

## REMAINING WEAKNESSES
REMAINING

## FINAL CREATIVE-QUALITY ASSESSMENT
ASSESSMENT

## FINAL OUTPUT
`no-air-resistance_v2.mp4` in the project files (`/mnt/project-files/no-air-resistance/`), with the runnable ZIP
`no-air-resistance_film.zip` (unzip, open `no-air-resistance.html`, press Space). FINAL_SPECS. Renders are not
committed. To rebuild: `tools/render-parallel.sh no-air-resistance.html <dir> 1080 1920 4 30`, then
`tools/render-wav.cjs` and `tools/encode-final.sh <dir> <wav> 60.8 <out>.mp4 27`.
