# Episode report: What if the speed of sound became 10× slower?

## TITLE
WHAT IF THE SPEED OF SOUND BECAME 10× SLOWER? (on screen: *WHAT IF THE / SPEED OF SOUND / BECAME 10× SLOWER?*)

## BRANCH
`episode/slow-sound-uj6or1` (session-assigned; PR #3 was opened from the Claude Code UI by the owner). Page `slow-sound.html`,
folder `films/slow-sound/`.

## DURATION
69.8 s (2,095 frames at 30 fps), one continuous first-person take, no cuts. Title 0–3.7 s, fade to black 69.55–69.8 s.

## PHYSICS RULE
The speed of sound in air is 34.3 m/s instead of 343 m/s (1,235 → 123 km/h), switched at 1.35–2.45 s. Nothing else
changes: light, air, gravity, materials and normal speeds are the same. You see everything on time; every sound reaches
you at `soundArrivalTime = eventTime + distance / soundSpeed`; anything faster than 123 km/h is supersonic, silent as it
approaches and heard as a boom when its Mach cone sweeps over you (after it has run p / √(M²−1) supersonic).

Declared simplifications (also in `PLAN.md` § 1): one wave speed, no wind or temperature layers; absorption (≈ 1/c³, about
1,000× stronger) not modelled; the shout is muffled rather than given exactly scaled formants; the car's Mach 1.02 needs
still 20 °C air; "a normal road car" ignores transonic drag and the engine breathing slow air; which panes break is a
seeded choice (hand-set on the stretch you watch), not a pressure simulation.

## REUSED SYSTEMS
CameraController (tracks, idle sway), ViewerHands (poses), StoryHUD (title, readouts, captions, says, notes), post
grade, Look, installFog, PeopleSystem, VehicleFactory (sedan, hatch, suv, van, ev, taxi, bus), BillboardSystem (dust,
smoke), BlobShadows, AircraftSystem, Environment (subclassed as `SndCity`), AudioEngine (subclassed as `SndAudio`; the
engine file is untouched), SoundKit synth blocks, Edit/Track, seeded RNG and noise. Tools: check-page, stills,
render-parallel/render-frames, render-wav, bake-soundtrack, preview-sheets, encode-final.

## NEW SYSTEMS
- `js/audio/soundArrival.js` (engine commit f0d3139, additive): `arrivalTime`, `arrival`, `emissions`, `emitTimeAt`,
  `delayCurve`, `firstArrival`, `mach`, `coneHalfAngle`, `boomDelay`. Any film can use it to time sounds by distance.
- `films/slow-sound/audio.js`: moving sources played through delay lines that follow their exact arrival curves (late
  arrival, Doppler pitch, the "everything at once" squeeze of a supersonic approach), `movingEarly` for the reversed
  branch after a supersonic pass, N-wave booms with thump, rumble and rattle, glass pane by pane in arrival order,
  limiter plus an oversampled soft clip.
- `films/slow-sound/waves.js`: `SndRipples` (thin sound rings on the ground and wake fronts, shader with fwidth
  anti-aliasing), `SndDust`, `SndPlaneFx` (shock cone, vapour collar, engine flames, smoke, shudder), `SndGlass`
  (per-pane fates, burst and crack decals, shards, glitter).
- `films/slow-sound/script.js`: computes every boom time at load from the paths; live HUD counters (sound in flight,
  distance, Mach, shock countdown, the shock front's distance).

## ASSETS ADDED
None. All geometry is procedural, all sound is synthesised, fonts are the repo's own. No third-party media.

## MAJOR TIMESTAMPS
| Time (s) | Beat |
|---|---|
| 0–3.7 | Title over the avenue; the friend's claps slip late as the HUD counts 1,235 → 123 km/h |
| 4.2–11.0 | Friend at 30 m: claps and "Hey! Over here!" arrive 0.88 s late (live SOUND DELAY counter, rings) |
| 11.0–19.1 | Pile driver at 100 m: bangs 2.94 s late; stops at 16.15, three bangs still arrive |
| 19.0–24.0 | Ambulance at 50 km/h (Mach 0.40): siren +68 % coming, −29 % going |
| 24.0–37.9 | Sports car on the highway: Mach 0.89 at 110 km/h → Mach 1.00 at 28.7 → Mach 1.02; boom at **36.48** |
| 38.3–44.2 | Drone: propeller tips Mach 2.6, it drops at ~42.4 (crash heard 0.28 s later) |
| 44.2–49.1 | Landing airliner overhead at 260 km/h (Mach 2.1), shuddering, silent |
| 49.3–54.4 | Its shock comes up the street at 290 km/h (dust wall, pigeons, a sedan brakes); boom at **54.36** |
| 55.0–59.5 | Police car at 160 km/h (Mach 1.30), silent; boom at **59.41**, windows burst |
| 60.0–63.2 | The shopfront: two panes gone, one cracked, the rest intact |
| 63.2–69.8 | Aftermath; "You wouldn't need a fighter jet…" (63.9) / "…to break the sound barrier." (66.3); note 68.1 |

## KNOWN LIMITATIONS
- The middle is still slow: the pile driver (8 s) and the sports car (14 s) were flagged in both review rounds. The
  retention reviewer's main fix (cut ~9 s from 11–38 s) was not made, because a cut breaks the one-take sound-delay logic.
- The first boom (36.48) reads mostly through sound, dust in the lot, parked cars rocking and the shake; on screen it is
  still modest.
- The police car is only on screen briefly before its shock; there is no close pass in frame.
- The pile driver's rig briefly overlaps the car's line around 32 s.
- Hands and fingers are low-poly and read as blocky in the ear-covering pose.
- Several whip pans remain (10.5–11.4, 23.4–24.3, 38.0–38.6, 43.7–44.5, 48.4–49.4, 58.6–59.0; up to 5.7 frame-widths/s).
- The physics simplifications listed under PHYSICS RULE.
- No one has listened to the sound; it has only been measured (−16.1 LUFS integrated, true peak −1.6 dBTP).
- Two fresh renders of the soundtrack are bit-identical up to the airliner's boom (54 s) and then differ slightly
  (25–49 dB below the signal, same loudness). The cause is probably the engine's convolution reverb running part of its
  work on a background thread (inferred, not proven). The MP4 uses the WAV that was measured; the page's baked track is
  another render of the same mix.
- The final cut has not been through a third review round.

## FINAL PREVIEW PATH
- Final MP4 (1080×1920, 30 fps, 69.8 s): `/mnt/project-files/slow-sound/slow-sound_final_1080x1920.mp4` (project
  files; MP4s are not committed to the repo).
- Runnable ZIP: `/mnt/project-files/slow-sound/slow-sound_film.zip` (unzip, double-click `slow-sound.html`, press Space).

## PERFORMANCE/FPS
- Rendering here is software-only (SwiftShader, no GPU): about 6.5 s per 1080×1920 frame per worker; 2 workers is the
  fastest setting (0.15 frames/s together; 4 workers thrash). The final render took about 3.8 hours.
- Boot about 14 s; with the baked soundtrack the sound is ready immediately (live synthesis takes about 30 s).
- Real-time frame rate on a GPU machine was not measured.

## REVIEW NOTES
Two rounds of four independent reviewers. Scores are as given.

| Round | Previewed | Retention | Normal viewer | Visual | Physics |
|---|---|---|---|---|---|
| 1 | fe8fbab + plan | 4 | 5 | 4.5 | 7 |
| 2 | c183492 | 5 | 6 | 5 | 7.5 |

**Round 1 swipe points:** 1.5–2.5 (nothing visible changes), 4–6 (friend tiny), 13–16 (hazy pile driver, the biggest
drop), 29–33 (the supersonic car a sliver behind a minivan and hedge), 50–53.5 (the shock invisible), 63–70 (empty
avenue). Physics errors found: window count contradicted "only the weakest", N-waves too short, no reversed sound after
supersonic passes, cruise Mach should use the speed of sound at altitude (Mach 8), the note should say "in air".
**What changed:** every beat restaged (zoom on each source, ripples and a live delay counter, a clear long-lens line to
the car, a dust wall for the airliner's shock, pigeons, hand-set window fates, a busier ending, the physics fixes).

**Round 2 swipe points:** 2.8–3.7 (a dark car under the title), 13–17 (pile driver repeats the "late" idea), 25–28
(small hazy car at the start of a 14 s segment), 37–39 (the boom a grey smear, then a toy drone), ~65 (calm ending).
Best moments: 49–54.4 (dust wall, countdown, pigeons) and 59–61 (the windows). Physics: the shock front moves at about
290 km/h (not 260), formants, N-wave length L / v, drone 9.5 m / 0.28 s, Mach 1.02 margin, absorption.
**What changed after round 2:** thin crisp ripple rings (the glare bands are gone), lighter dust with a near-camera fade
and a taller billow under the airliner's shock, the lamp post and bin removed from the shock-front view, the near-lane
sedan brakes to a stop at the airliner boom, parked cars rock at each boom, sun moved behind you, a dark small drone rotor
blur, a red pile-driver hammer, the shout muffled, the airliner's reversed approach, 290 km/h, the disclaimer on a
two-line plate, the ending tightened to 69.8 s. Not re-scored after these fixes.
