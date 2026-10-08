# Episode report — What if gravity became twice as strong? (v3, the leisure centre)

## TITLE
**WHAT IF GRAVITY BECAME TWICE AS STRONG?** (page: `gravity-2x.html`, folder: `films/gravity-2x/`)

## BRANCH
`episode/gravity-2x-kaet66` (one episode, one branch; PR #4 was opened by the owner; nothing merged).

## WHY v3
The owner's creative direction override (2026-10-08) banned the "normal city → person reacts → car → machinery →
airplane → destruction" template, and asked for GRAVITY 2× to "make viewers physically FEEL the weight" with lifting,
sports, stairs, a swimming pool, gym equipment and suspended loads. v2 (a sunny street, a crane, an airliner and a
12 t load onto a flatbed; 68.7 s) is kept in git at commit `99692f2`. v3 is a full rebuild in one leisure centre on
the same engine and the same film-level systems (camera, hands, HUD, cast rig, particles, sound set-up).

## DURATION
60.3 s film (a 67.5 s continuous take trimmed by `CONFIG.edit` in three invisible places). 1080×1920, 30 fps,
1,810 frames. Format: Oxygen/Friction structure (centred serif title for 3.2 s, a new consequence every 1–4 s),
first person, minimal top-left HUD, serif captions.

## PHYSICS RULE
At 1.6 s Earth's surface gravity goes from 9.81 to 19.62 m/s² (over 0.25 s) and stays there. Every mass stays the
same, so weight doubles, everything falls at 2 G (time ×0.71, impact speed ×1.41), work against gravity doubles, and
water pressure and buoyancy double too (so anything floating floats exactly as before). The air is left as it was (on
screen: "AIR PRESSURE CHANGES NOT SHOWN"). Numbers on screen: scale 70.0 → 140.0 kg, mass still 70 kg · bar 80 kg
lifts like 160 kg (785 → 1,570 N) · free throw peak 2.90 m vs rim 3.05 m (1 G ghost 3.68 m) · dead hang: your grip
holds 140 kg (70 kg at 1 G) · one floor: 4,400 J (2,200 J at 1 G) · floating: buoyancy = weight = 1,373 N · 10 m
fall in 1.01 s (1.43 s at 1 G), 71 km/h (50 km/h), like a 20 m dive at 1 G; the 1 G ghost has fallen 5.0 m when she
hits · 3 m deep: water pressure like 6 m at 1 G · pressing out of the water: 70 % of you out = 98 kg on your arms
(49 kg at 1 G). Derivations: `PLAN.md` § 1.

## SCENES CHANGED (v2 → v3, every scene)
| v2 (film s) | v3 (film s) |
|---|---|
| 0–3.1 sunny avenue, a kid hops, you hold a bag | 0–6.3 looking down at a gym scale between your hands: 70.0 → 140.0 kg; a woman's dumbbells hit the floor |
| 4.2–12.6 bag set down; kid's 6 cm hop; an old man can't stand | 6.0–9.3 a treadmill runner is carried off the back of the belt |
| 13.2–15.5 bricks pallet falls 9 m onto a pickup | 9.3–15.4 two men can't get an 80 kg bar off the safety arms |
| 19.5–26.1 low coupe scrapes; a truck's spring snaps | 15.4–17.3 a free throw peaks under the rim; its 1 G ghost scores |
| 26.9–41.1 crane outrigger, scaffold, awning, water tank | 17.3–21.75 you hang from a pull-up bar until your grip peels and you drop |
| 41.1–47.9 airliner sinking over the rooftops | 21.75–26.6 down the open stair past a man who sat down; your knee gives |
| 47.9–54.9 exhausted people; palms on the pavement | 26.6–35.65 the pool: swimmers float exactly as before; a man on the ladder can't get out |
| 55.1–59.6 a 12 t load falls 21.7 m onto a flatbed | 35.65–47.1 you float; a diver steps off the 10 m tower beside a 1 G ghost; you watch her plume under water |
| 62.1–68.7 looking down at the wreck in the dust | 47.1–53.3 you try to press yourself out of the pool and can't · 53.3–60.3 floating, the closing lines |

## REUSED SYSTEMS (engine, not edited)
CameraController · ViewerHands (plus aimed poses for the grips, the bar, the rail and the deck) · StoryHUD · Post ·
fog · Environment (subclassed as GvCentre) · People (Person, ACTIONS, BLEND) · particles (BillboardSystem,
StreakSystem) · AudioEngine / SoundKit (subclassed as GvAudio; `audioEngine.js` untouched) · Edit (`CONFIG.edit`) ·
Look · Tex · Geo · MathX / Track · the tools. No engine (`js/`) changes.

## NEW SYSTEMS (film-level only, all in `films/gravity-2x/`, globals prefixed GV / Gv / gv)
- `centre.js`: GvCentre: the gym, the sports hall, the open stair, the pool hall, the pool basin (deep end), the 10 m
  tower, the lifeguard chair, the ladder, loungers, the lawn and trees outside.
- `props.js`: GvScale (a live display), GvTreadmill, GvBench (bar on the safety arms), GvPullUp, the basket, the ball
  and its 1 G ghost arc, GvWater (surface, ripples, the view from under water), caustics.
- `cast.js`: the 2 G actions (cling, carried off, heave, spot, shoot, stair sit, float, tread, ladder climb and slip,
  platform kneel, edge, pencil dive, rise, deck kneel) and the 1 G ghost diver.
- `fx.js`: the crown splash, white water, droplets, bubbles and plume, chalk.
- `film.js`: GV_LOOK, the floor and water under you, the hang and the press-out (your body at 2 G), the under-water
  mode, the grade.
- `audio.js`: GvAudio: gym music and room, the change, treadmill, bench, court through glass, your efforts (hang,
  stair, press-out), the pool hall, the ladder, the dive, under water, the closing chord.

## ASSETS ADDED
None. Everything is procedural (geometry, textures, sound). The soundtrack is baked into `films/gravity-2x/soundtrack.js`.
No third-party media.

## REVIEW NOTES
Five independent reviewers scored the first v3 preview (scores as given, not inflated): retention **5/10**,
cinematography **5/10**, normal viewer **6/10**, physics **8/10** (clarity of science 7), creative differentiation
**6/10**. The top 3 problems and every fix are in `PLAN.md` § 8. The final was **not re-scored** after the fixes.

## FINAL PRODUCTION AUDIT (on the actual 1080×1920 output)
An independent reviewer audited the first encoded final (scores as given): retention **7/10**, cinematography/visual
**6.5/10**, normal viewer **7/10**, physics **8/10**, creative differentiation **7/10**.
- **Style:** on-model (centred serif title on frame 1, small top-left HUD, serif captions, clean low-poly light).
- **Pacing:** no stretch over 4 s without a new event (longest 2.9 s); 35.65–40.7 felt slow.
- **Physics:** every on-screen number checked out; two wording problems (the stair HUD vs caption, "feels weightless").
- **Phone clarity (360×640):** headlines and captions read; the small HUD sub-lines don't; the pull-up, the floating
  shot and the small diver were hard to read.
- **Output:** 1,810 frames, 30 fps CFR, 1080×1920, no decode errors, no duplicate/black frames except the fade; the
  trims are clean one-frame cuts; sync within a frame at five checked events; one glitch at the climb-out.
- **Top 3 fixed afterwards** (only the changed shots re-rendered): the climb-out glitch (head jump, above/below-water
  flicker, early "0 kg", early splash), the stair's two messages and invisible knee buckle, the unreadable pull-up.
  Details: `PLAN.md` § 8. The fixed final was not re-scored.

## KNOWN LIMITATIONS
- The small HUD sub-lines (e.g. "AT 1 G 785 N · NOW 1,570 N") are too small to read on a phone; the headlines carry it.
- The three trims read as location jumps rather than invisible cuts.
- The floating shot (35.65–37.4) doesn't make it obvious that it is you floating.
- The forearms in the hang read as cones (the engine's hand rig); people are low-poly with procedural animation.
- Some structure echoes v2: the fall clock with a 1 G ghost, the closing-line pattern, "like holding two of you".
- The sound has only been level-measured, not listened to by a person.
- Simplifications: instant, uniform change; the atmosphere's response (pressure toward 2 atm) is not shown.

## PERFORMANCE / FPS
Headless Chromium with software rendering (SwiftShader, 4 cores), not GPU numbers: boot 5 s; per frame 209–387 draw
calls and 57k–80k triangles (sampled at film 1, 12.6, 19.5, 27, 41.7, 44, 50, 58 s). Final render: 1,810 frames at
1080×1920 in about 77 min with 4 workers. Real-time playback fps on a GPU was not measured.
