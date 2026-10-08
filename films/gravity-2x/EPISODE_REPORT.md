# Episode report — What if gravity became twice as strong?

## TITLE
**WHAT IF GRAVITY BECAME TWICE AS STRONG?** (page: `gravity-2x.html`, folder: `films/gravity-2x/`)

## BRANCH
`episode/gravity-2x-kaet66` (one episode, one branch; nothing merged).

## DURATION
68.7 s film (a 73.2 s continuous take trimmed by `CONFIG.edit` in six invisible places). 1080×1920, 30 fps,
2,062 frames. Format: Oxygen/Friction structure (centred serif title for 3.1 s, a new consequence every 3–8 s,
human → machines → infrastructure → payoff), first person, minimal top-left HUD, serif captions.

## PHYSICS RULE
At 1.6 s Earth's surface gravity goes from 9.81 to 19.62 m/s² (over 0.25 s) and stays there. Every mass and inertia
stays the same, so weight (m·g) doubles, everything falls at 2 G (time ×0.71, impact speed ×1.41, impact energy ×2),
springs sag twice as far, wings need twice the lift (the same wing needs 41 % more speed), and anything built for 1 G
with less than a 2× margin can fail. Failures are selective: most buildings hold, cars still drive. The air is left as
it was (on screen: "AIR PRESSURE CHANGES NOT SHOWN"). Numbers on screen: 70 kg → 1,373 N (at 1 G 687 N) · kid's jump
6 cm (at 1 G 30 cm) · pallet 9 m in 0.96 s, 68 km/h (at 1 G 1.35 s, 48 km/h) · crane load 12 t pulls like 24 t ·
hoist brake at 160 % of what it can hold · 12 t falls 21.7 m in 1.49 s at 105 km/h (at 1 G 2.10 s, 74 km/h).
Derivations: `PLAN.md` § 1.

## REUSED SYSTEMS (engine, not edited)
CameraController (path, bob, breathing, startles, shakes, tilt) · ViewerHands (hand poses, plus aimed poses for the
bag and the palms) · StoryHUD (title, readouts, captions, note, the closing two-line stack) · Post (grade, flash,
chroma, tunnel) · fog · Environment (subclassed as GvCity) · People (Person, ACTIONS, BLEND, BlobShadows) · Vehicles
(car factory and types) · AircraftSystem (subclassed as GvAirliner) · particles (BillboardSystem, StreakSystem) ·
AudioEngine / SoundKit (subclassed as GvAudio; `audioEngine.js` untouched) · Edit (`CONFIG.edit`) · Look · Tex · Geo ·
MathX / Track · the tools (check-page, stills, render-parallel, render-wav, bake-soundtrack, encode-final).

## NEW SYSTEMS (film-level only, all in `films/gravity-2x/`, globals prefixed GV / Gv / gv)
- `site.js`: GvCrane (slew, luff, outrigger sink and lean, pendulum load, brake creep and three slips, the 2 G free
  fall, the boom's recoil), GvFlatbed (deck folds into a V, tyres burst), GvScaffold (loading bay, pallet and its 1 G
  ghost, the bow and fold), GvAwning, GvTank.
- `traffic.js`: GvTraffic (the low coupe and its scrape times, the box truck's leaf springs and snap, the pickup's
  dented cab, the ambulance, background cars).
- `cast.js`: GvCast and 16 gravity actions (gvBuckle, gvHeavy, gvLoaded, gvBags, gvSetDown, gvTrudge, gvCarry,
  gvHandsKnees, gvBenchTry, gvBenchSlump, gvBenchSit, gvSignal, gvStop, gvLookUp, gvGrip, gvBrick), the kid's hops,
  paramedics' kits that drop at 2 G.
- `fx.js`: GvChunks (instanced debris), gvThrow (2 G ballistics that land and slide), a lumpy puff texture, every
  impact's dust, glints, debris and water.
- `film.js`: GV_LOOK (where your eyes go, with blends and fovs), gvAimHand, palm contact shadows, the dust haze.
- `audio.js`: GvAudio (street bed, your body, every failure, the jet, the fall's hush, the ending).
No engine (`js/`) changes.

## ASSETS ADDED
None. Everything is procedural (geometry, textures, sound). The soundtrack is baked into `films/gravity-2x/soundtrack.js`.
No third-party media.

## MAJOR TIMESTAMPS (film seconds)
| Film s | Beat |
|---|---|
| 0–3.1 | title; the kid hops; you hold the bag; HUD 1.0 G |
| 1.6 | gravity doubles: HUD 2.0 G, the bag yanks your hand down, the kid and his mum buckle |
| 4.2–7.0 | you set the bag down · "Everything you lift feels twice as heavy." · 1,373 N |
| 7.1 | the kid's 6 cm hop (readout) |
| 9.2–12.6 | the old man can't stand · "Standing up becomes hard work." |
| 13.2–15.5 | the loading bay gives; the pallet falls 9 m with its 1 G ghost |
| 15.5 | the pallet smashes the pickup's cab · "And falling things hit twice as hard." · 68 km/h |
| 19.5–22.8 | the low coupe scrapes the crossing · "Cars still drive. Their springs sag twice as far." |
| 24.0–26.1 | the loaded truck's spring snaps |
| 26.9–31.2 | the crane's outrigger punches into the road; the 12 t load · "Every machine was built for 1 G. Some with thin margins." |
| 31.4–34.3 | the scaffold bows and folds into the street |
| 34.6–37.3 | the old awning tears off · "Most buildings hold. The weak spots don't." |
| 37.1–41.1 | the rooftop water tank bursts over the cornice |
| 41.1–47.9 | the airliner comes over at full power and sinks below the rooftops · "Its wings now carry twice the weight." |
| 47.9–51.1 | exhausted people; paramedics barely carry their kit |
| 51.1–54.9 | your knee gives; palms on the pavement; you push back up · "Getting up is like lifting a second you." |
| 55.1–58.1 | the hoist brake slips three times (160 %) |
| 58.1–59.6 | the brake lets go: 12 t free-falls 21.7 m in 1.49 s (the street hushes) |
| 59.6 | impact on the flatbed at 105 km/h: flash, shake, the deck folds, beams fly, dust |
| 62.1–68.7 | HUD 2.0 G · MASS UNCHANGED · "Nothing became more massive." → "Everything just became twice as heavy." · FICTIONAL INSTANT GRAVITY CHANGE · fade |

## KNOWN LIMITATIONS
- Not re-reviewed after the fix round: the scores below are for the previous preview.
- The truck shot (24–26 s) still fills the frame, so the spring snap is felt more than seen.
- The outrigger punch (≈ 27.8 s) is small in the frame.
- The water-tank shot holds about 1.5 s before the burst.
- The 1 G ghost pallet is faint and unlabelled at phone size.
- People are low-poly with stiff, procedural animation.
- The sound has only been level-measured (−17.1 LUFS integrated, −1.7 dBTP), not listened to by a person.
- Simplifications: instant, uniform change; the atmosphere's response (pressure toward 2 atm, heating) is not shown.

## FINAL PREVIEW PATH
- Runnable ZIP (tested from a fresh unzip, boots with sound): `/mnt/project-files/gravity-2x/gravity-2x_film.zip`
  (project files; not committed).
- Final MP4 (1080×1920, 30 fps, H.264 3,076 kbps + AAC 160 kbps, 68.7 s, 26.5 MiB, one file):
  `/mnt/project-files/gravity-2x/gravity-2x.mp4` (project files; not committed). Audio −17.1 LUFS, −1.7 dBTP.

## PERFORMANCE / FPS
Measured in headless Chromium with software rendering (SwiftShader, 4 cores), so these are not GPU numbers:
- Boot (scene build plus the soundtrack): 13 s with nothing else running.
- Per frame: 1,220–1,660 draw calls, 203k–220k triangles, about 1,150 geometries and 103 textures (sampled at film
  1, 15.6, 33, 45, 59.7 and 66 s).
- Final render: 2,062 frames at 1080×1920 in about 2 h with 4 workers (about 17 frames a minute).
- Real-time playback fps on a GPU was not measured here.

## REVIEW NOTES
Four independent reviewers scored the 69.7 s preview (scores as given, not inflated): retention **5/10**,
cinematography **5.5/10**, normal viewer **5/10**, physics **7/10**. Their swipe points, top problems and every change
made in response are in `PLAN.md` § 8. Biggest changes: the final drop re-staged (visible slips, a locked wide shot,
a hush, a bigger hit on the flatbed, the boom only recoils), the physics wording fixed, a stronger first 4 seconds,
shorter lulls. The film was **not re-scored** after these fixes.

Open questions left for the comments: why didn't the crane tip (its counterweight doubled too)? Could the pilots dive
for speed? Which birds can still fly? Do cars stop shorter (friction doubles, mass doesn't)? Could bodies cope with
2 G for days? Would the denser air have saved the airliner?
