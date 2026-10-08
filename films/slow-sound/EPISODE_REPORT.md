# Episode report: What if the speed of sound became 10× slower?

## TITLE
WHAT IF THE SPEED OF SOUND BECAME 10× SLOWER? (on screen: *WHAT IF THE / SPEED OF SOUND / BECAME 10× SLOWER?*)

## BRANCH
`episode/slow-sound-uj6or1` (session-assigned; PR #3 was opened from the Claude Code UI by the owner). Page `slow-sound.html`,
folder `films/slow-sound/`.

## DURATION
61.4 s (1,842 frames at 30 fps), six shots joined by hard cuts at 9.6, 15.6, 21.7, 29.8 and 38.6 s (the story clock never
jumps). Title 0–3.7 s, fade to black 60.75–61.15 s.

## WHY IT WAS REDESIGNED
The first version (a 69.8 s one-take city avenue: a friend's claps, a pile driver, an ambulance, a supersonic car, a drone,
an airliner, a police car breaking windows; branch history up to `e2e3ae3`) followed the template every episode had
fallen into (person → car → machinery → airplane → destruction). The owner's creative override asked for audio as the
defining mechanic ("People visibly speak before you hear them, sound arrives from distant events seconds later, and
ordinary fast objects can become supersonic"), with no automatic cars, planes, cranes, streets, collapses or explosions.
The identity questions, the ten ranked consequences, the three signature moments and the old → new shot table are in
`/mnt/project-files/slow-sound/REDESIGN.md`.

## PHYSICS RULE
The speed of sound in air is 34.3 m/s instead of 343 m/s (1,235 → 123 km/h), switched at 1.35–2.45 s. Nothing else
changes. You see everything on time; every sound reaches you at `eventTime + distance / 34.3`, marched against your
ear's path (`SND_RUN`, which also handles the change of speed under the title). Declared simplifications are in
`PLAN.md` § 1 (one wave speed, no wind; absorption applied by hand; stylised voices; the ball's drag law; the fronts
drawn as rings, glassy shells and, for the thunder, a line and glow where it meets the world, which is a drawing device).

## REUSED SYSTEMS
CameraController, ViewerHands, StoryHUD (title, readouts, captions, says, notes), post grade, Look, Person rig and
ACTIONS, BillboardSystem, BlobShadows, SoundKit, SoundArrival (`js/audio/soundArrival.js`, added by this episode's first
version), Environment (subclassed as `SndStadium`), AudioEngine (subclassed as `SndAudio`; the engine file is untouched),
seeded RNG and noise. Tools: check-page, stills, render-parallel / render-frames, render-wav, bake-soundtrack,
encode-final. No engine file was changed in the redesign.

## NEW SYSTEMS
- `stadium.js` — `SndStadium`: the pitch, four stands, the main stand's roof, masts with loudspeaker clusters, LED
  boards, a live big screen, goals with a bulging net, a city of low blocks, the storm (shelf cloud, rain curtain),
  lightning.
- `crowd.js` — `SndCrowd`: ~9,000 instanced fans posed in the vertex shader from story time and their own arrival times
  (drum beats, the goal, the thunder): clapping, scarves on the accented beats, leaping, ducking. The rows below your
  last seat come in at the last cut.
- `cast.js` — `SndCast`: runners and the starter, the friend and the quiet block round them, the referee, the free kick
  (wall, keeper, net), the drummer and the red drum, players, stewards, your neighbours; new actions (shout, cheer, drum
  with any period, point up, duck with hands on the ears).
- `waves.js` — `SndRipples` (a ring on the grass where each front meets the ground), `SndFrontLine` (the thunder's front
  where it meets the world: a thin bright line on the ground, roofs and steps and a brief glow on what it has just
  passed, patched into the stadium's and the crowd's materials), `SndShells` (each front as a glassy dome; the thunder's
  as a sheet of glass with a crisp top edge), `SndPuffs` (gun smoke), `SndBirds` (flocks on the city roofs and pigeons
  on the far stand that lift off as the thunder reaches them).
- `script.js` — the ball's flight with drag that jumps near Mach 1 (`SND_BALL`), every arrival at your ear, the camera
  shot by shot, live HUD readouts and the small "THE FLASH'S THUNDER · IN N S" tag at every cut.
- `audio.js` — grains for thousands of claps, cheers, gasps and footsteps, each placed by its own source's arrival;
  image-source echoes off the stand fronts (only from the fronts you face); hollow voices; the thunder, muffled while
  your hands cover your ears.

## ASSETS ADDED
None. All geometry is procedural, all sound is synthesised, fonts are the repo's own. No third-party media.

## MAJOR TIMESTAMPS
| Time (s) | Beat |
|---|---|
| 0–3.7 | Title over a 30-runner start line; "Set!" heard on time (0.9); the speed drops (1.35–2.45, HUD 1,235 → 123 km/h); a silent lightning flash in the storm (2.7); tag "THE FLASH'S THUNDER · IN 49 S" from 3.75 |
| 3.8–9.6 | The starting gun 85 m away: its ring runs down the line and the runners start one by one (4.16 → 5.93); the bang reaches you at 6.27 |
| 9.6–15.6 | Long lens on your friend 28 m away: two shouts (10.35, 12.9), each heard 0.81 s late as a blurred buzz |
| 15.6–21.7 | The announcer on the big screen (16.3); five loudspeakers 17–109 m away; heard three times (16.80, 18.29/18.42, 19.38/19.47) |
| 21.7–29.8 | The referee's whistle (22.3) heard 1.93 s late and ~10× lower (24.23); a free kick at 144 km/h = Mach 1.17 (25.3); goal 26.23, the fans leap on sight; the kick heard 0.79 s after the goal (27.02) |
| 29.8–38.6 | A drummer with a red drum 40 m away, 1.2 s late; each fan claps when the beat reaches them; scarves up on every 4th beat, so bands spread out from the drum |
| 38.6–41.9 | From your seat: "Remember the flash at the start?"; countdown THE FLASH AT 0:03 · N S · ITS THUNDER: N M AWAY; the lens closes on the city's roofs |
| 41.9–47.6 | The front comes over the city (a sheet of glass, each building glowing as it passes); flocks lift off (42.1–42.6, rising over the stand from ~43; 45.0–45.5); the lens moves to the far stand |
| 47.6–50.2 | Pigeons on the far stand's back wall go up (49.45); the stand lights up and ducks row by row, back rows first (49.4 → 50.1) |
| 50.2–52.6 | The front's line crosses the pitch (centre 51.16): the players duck; the view widens and tilts down over the rows in front of you: the stewards (52.15), then the rows below you duck in turn |
| 52.65 | It reaches you: a jolt, your hands thrown up, then over your ears for 1.5 s (the sound muffled for as long), the neighbours below you ducking with their hands on their ears; HUD THE THUNDER · 50 S LATE · IT WOULD ROLL ON FOR OVER A MINUTE |
| 55.0–61.4 | "You'd see everything as it happened…" / "…and hear it long after it was over."; a new flash (57.2), THAT FLASH · 45 S · UNTIL YOU HEAR IT; note FICTIONAL SIMULATION (59.5–61.0); fade 60.75–61.15 |

## SCENES CHANGED (old city version → stadium version)
| Old (city, 69.8 s) | Why it was recycled | New | Why it is better |
|---|---|---|---|
| 0–3.7 title over a busy avenue | Every recent episode opened on a city street | Title over a stadium start line, "Set!", a silent lightning flash | New place; plants the payoff in the first 3 s |
| 4.2–11 friend claps and shouts across the avenue | (The street was the problem) | The friend in the stand through a long lens, voice late and blurred | Keeps the best-liked beat, adds the hollow voice |
| 11–19 pile driver at 100 m | Construction site; static; the biggest drop in both rounds | The race start: runners leave one by one as the bang reaches them | The most readable, original image of the film |
| 19–24 ambulance siren | Vehicle beat | One announcement heard three times from five loudspeakers | A sound effect no episode has had |
| 24–38 sports car on the highway (14 s) | Car; long; rated boring | A 144 km/h free kick: Mach 1.17, the goal before the bang | The same supersonic physics in an everyday object |
| 38–44 drone crash | Toy-like filler | The drum: a crowd that can't clap together | The most visually unusual effect of the premise |
| 44–49 airliner overhead | Airplane; tilt-up used elsewhere | "Remember the flash at the start?" and the countdown; the front over the city, birds | Suspense built from our own opening |
| 49–54 shock wall down the street | A street again | The front crossing the stadium: the far stand, the pitch, the rows in front, then you | Sound made visible on thousands of people |
| 55–63 police car, windows burst | Car plus destruction | Cut | No forced destruction |
| 63–70 quiet aftermath | A calm return after the peak | The thunder rolls on; a new flash whose thunder is 45 s away | The payoff lands at the end and loops back |

Kept from the first version: SoundArrival timing, the per-source arrival scheduling, the ground rings and live HUD
counters, the speech bubble, the grade, the HUD and the title style.

## BEFORE / AFTER
`/mnt/project-files/slow-sound/before_after.jpg`: the city version (top row, 1–62 s) against the stadium version (bottom
row, 1–57.6 s) at matching story beats. The city version's MP4 is kept as
`/mnt/project-files/slow-sound/slow-sound_city_version_1080x1920.mp4`.

## FINAL AUDIT AND THE THREE FIXES
The final 1080×1920 render was audited against Oxygen and Friction (production 6/10; scores below). It passed every
technical check: 1080×1920 H.264, 30 fps, 1,842 frames = 61.400 s, audio the same length with no offset (the bang at
6.25–6.30, the thunder's hit at 52.65 with the picture's jolt at 52.67), −14.8 LUFS, true peak −2.1 dBTP, under 30 MiB,
no dropped or frozen frames, no z-fighting or flicker. Its three highest-impact problems, all fixed and re-rendered
(frames 286–289, 466–469, 649–652, 892–895 and 1156–1745):
1. **The wait for the thunder was unreadable (39–52.7 s).** The "wall" read as a band of cloud, the birds were 3–6 px
   specks. Now the front is drawn where it meets the world: a thin bright line (a few pixels wide at any lens) on the
   ground, roofs and steps, and a short glow on everything it has just passed, so the city lights up building by
   building and the far stand lights up row by row as it ducks. The fog band on the grass is gone; the sheet in the
   air is fainter with a crisp top edge. A long lens on the roofs while the birds lift (drawn ~1.6× larger), and pigeons
   on the far stand's back wall that go up just before the back rows duck.
2. **The climax was weaker than the free kick (52.3–58 s).** The ear-covering was two boxy backs at the bottom of a
   calm wide. Now the view widens and tilts down over the rows in front of you as the front climbs them: the stewards,
   then each row ducks, the neighbours below you cover their ears in the middle of the frame, your own hands are thrown
   up in front of you and then held over your ears for 1.5 s, and the sound stays muffled for as long. The rows below
   your seat (left empty for shot 1) are filled from the last cut, with the view down the steps kept open.
3. **A two-frame jump after every cut.** The camera controller's step sway read each cut's jump in position as a sprint
   and tipped the view for the two frames either side of it (a 20–60 px snap on the long lenses). Walking is off in
   this film (you never walk), so the sway no longer fires.

## KNOWN LIMITATIONS / REMAINING WEAKNESSES
- The middle effects are still mostly heard rather than seen: the announcement (16–21.7) is a still big screen and the
  five loudspeakers are never in frame; the drum's scarf bands (32–38.6) are hard to read at phone size; the friend's
  second shout repeats the first. Every reviewer flagged 16 s and ~35 s as swipe points.
- The delays plateau through the middle (2.5 → 0.8 → 3.1 → 1.9 → 0.8 → 1.2 s) until the thunder's 50 s; only the last
  step escalates (retention reviewer).
- The differentiation review found the structure close to the first version's: the friend at ~30 m with a delay
  counter, a supersonic object, and a front counted down in metres until it reaches you. The setting and the payoff's
  staging are new; the beat list is not.
- The kick's supersonic flight is drawn as domes (rings piling into a V on the grass), not a clear shock cone; at phone
  size the ball is ~8 px.
- The HUD panels are larger and wordier than Oxygen's and Friction's (up to 3–4 lines), and close-up low-poly fans
  (9.6–15.6, 29.8–31.3, 52–56) look crude. The flinching hands are the engine's standard hands.
- The city birds are drawn ~5× a gull's size to read 250–380 m away.
- No one has listened to the sound; it has only been measured.
- The three fixes above were checked on stills and the re-rendered frames, not re-scored by a full review round.

## FINAL PREVIEW PATH
- Final MP4 (1080×1920, 30 fps, 61.4 s, H.264 + AAC 160 kbps, {{SIZE}}):
  `/mnt/project-files/slow-sound/slow-sound_final_1080x1920.mp4` (project files; MP4s are not committed). Audio
  {{LOUD}}.
- Runnable ZIP: `/mnt/project-files/slow-sound/slow-sound_film.zip` (unzip, double-click `slow-sound.html`, press Space).
- Before/after: `/mnt/project-files/slow-sound/before_after.jpg`.

## PERFORMANCE/FPS
- Rendering here is software-only (SwiftShader, no GPU): about 8 s per 1080×1920 frame per worker; 2 workers (4 cores).
  The full render of 1,843 frames took 1 h 57 min; the fix pass re-rendered 606 frames in {{FIXTIME}}.
- Boot about 14 s; with the baked soundtrack the sound is ready immediately.
- Real-time frame rate on a GPU machine was not measured.

## REVIEW NOTES
All scores as given by independent reviewers.

**City version (before the redesign):** round 1 retention 4, viewer 5, visual 4.5, physics 7; round 2 retention 5,
viewer 6, visual 5, physics 7.5 (details in `docs/EPISODE_HISTORY.md` § 12).

**Stadium, preview 1 (63 s):** retention 5.5, viewer 5.5, visual 5.5, physics 7.5; differentiation 7 (originality vs the
other episodes 7.5, vs the old version 6, memorability 6.5, audio as the mechanic 8). Sags at 34–36 (a slow 13-beat drum
from 99 m) and 45–48 (waiting for the thunder); the ending calm; the thunder front hard to read.
**What changed:** every shot tightened (61.4 s), the drum moved to 40 m with fast beats, a reminder tag at every cut,
birds over the city, the far stand ducking section by section, a jolt and muffled hearing at the hit, a second flash.

**Stadium, preview 2:** viewer 6 (interest at 3 s 7, 15 s 6, 35 s 4, 55 s 6; understood 7; coolest 7; ending 5.5;
would share 4.5); retention 5.5 (hook 6, clarity 6, escalation 4.5, payoff 6, ending 5.5); visual 6 (image 5.5,
composition 5.5, camera 6.5, phone 5.5, hero 6, style 6.5); physics 8.5 (numbers 9.5, claims 8.5, visuals 8, honesty
9). Swipes at 31–36 and 39–48. Best moment: the free kick (25–28). Remembered: the runners starting one by one. Viewer
comment: "the runner closest to the gun basically got a 2 second head start, that's so unfair lol".
**What changed:** the blast at the hit became a startle (physics), scarves only on accented beats so the ripple shows,
a red drum, bird silhouettes, the roll fades with the picture, the LED boards' flicker fixed.

**Final (1080×1920), before the three fixes above:**
- Retention 6 (hook 6, clarity 6, escalation 5, payoff 7, ending 7). Main loss at ~16 s; second risk ~44 s. Over 4 s
  with nothing new: 11.3–15.6, 16.9–21.7, 33.0–38.6, ~39.5–49.4.
- Normal viewer 6 (interest at 3 s 7, 15 s 5, 35 s 4, 55 s 6; understood 6; coolest moment 7, the shot that breaks
  the sound barrier with the goal before the bang; ending 6; would share 4). "I'd swipe at about 17 s." Remembered:
  "lightning, then nearly a minute later the thunder finally hits and the whole stadium ducks." Comment: "so a storm
  would just be silent lightning and then a random BOOM a minute later?? no thanks".
- Production 6 (image 6.5, composition 5.5, camera 6, phone readability 5.5, hero shots 6, style consistency 6.5,
  pacing 5.5, ending 5).
- Differentiation 6.5 (originality vs the other episodes 7, vs the old version 5, memorability 6, audio as the mechanic
  8). Its four answers:
  - *What does this episode show that the others don't?* People as a wave detector (the runners leaving one by one,
    fans leaping at the goal before the kick is heard, the far stand ducking); the film's own length as the delay (the
    flash at 2.7 s pays off at 52.65 s); a sports venue; a new visual language for sound (rings and domes, best in the
    Mach dome at 25.5–26.3).
  - *What feels recycled?* From the old version: the 1,235 → 123 km/h readout, the friend at ~30 m with a delay
    counter, the supersonic object (Mach 1.17 kick vs the Mach 1.02 car), the front counted down in metres to you.
    From the other episodes: a "its sound arrives in N s" countdown (No Air Resistance), a running counter as the
    throughline, the two-line closing caption, the city skyline behind the stands.
  - *Which moment is the most memorable?* The race start (4.2–5.9 s); second, the supersonic kick with the goal before
    the bang (25.5–27.0).
  - *At what timestamp would a viewer lose interest?* About 40–48 s (a near-static wide shot, a countdown, three
    captions, the thunder's wall a pale haze, the birds specks); smaller dips at 16–21 and 32–38.

## CREATIVE ASSESSMENT
The redesign does what the override asked: there is no street, car, crane, aircraft, collapse or explosion, every beat
is a sound arriving late from a visible source, and the episode has a signature no other film has (a crowd used as the
detector: runners leaving one by one, fans leaping before the kick is heard, a stand ducking as the thunder crosses it).
Its strongest moments are the race start, the supersonic free kick and, after the last pass, the thunder's front made
visible as it sweeps over the city, the far stand, the pitch and the rows in front of you. Its weakness is the middle:
the announcement and the drum are effects you mostly hear, and the delays stay at 1–3 s until the thunder, so it
scored 6/10 from the viewer, retention and production reviewers, below Friction's level. The fixes made target the
second half, where every reviewer agreed it lost people; a further pass would rebuild the middle around effects you can
see (the loudspeakers firing rings in turn, the drum as an overhead card wave) and shorten the wait.
