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
| 27.4–51.3 airliner found by a bystander, telephoto, plunge, fireball, countdown to the boom | 27.4–36.15 balloons rocket up at 2 g; the mum and the girl run past you for the stair door; the clock runs out over the empty party; the first stones in slow motion |
| 51.3–56.4 debris and a falling sign board | 36.15–51.9 the cloud's ice breaks the party one thing at a time, then comes through the roof over you |
| 56.4–62.0 look back at the limp flag | 51.9–60.8 silence; a white roof; a lace sheet barely moving in the wind; closing lines |

## BEFORE / AFTER
- **Before (v1):** a street film whose middle was a car and pigeons and whose climax was a distant airliner and a
  fireball; it read as the channel template ("what feels recycled": 2/10).
- **After (v2):** a rooftop film with no car, plane, explosion or falling person; the climax is a consequence built from
  the rule (drag holds a storm's ice up); "what feels recycled": 6.5/10 on the final output.

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
| v2 round 3 (60.8 s preview) | 6 / 2 | 6 | 6.5 | — | — |
| Final audit (1080×1920 output, before the top-3 fixes) | 6.5 / 2 | 6 | 6 | 6.5 | 7 |

Final audit sub-scores (on the real 1080×1920 MP4): style consistency 7, pacing 6, physics 7, phone clarity 6,
escalation 6.5, continuity/technical 7 (1,824 frames at 30/1 fps, 60.800 s, no dropped, duplicated or black frames
outside the intended fade; the first impact and the table landing in sync with their sounds; −14.8 LUFS, −1.2 dBTP).
Retention sub-scores: hook 6, middle 5.5, clarity 6, escalation 6.5, payoff 6. Normal viewer: hook 6, understanding 6,
wow 6.5, ending 5, rewatch/share 5.5. Still recycled (reviewer): the 100 → 0 % opener panel and the wind panel; the
clock; the climbing km/h readout and "faster than sound"; the NORMAL AIR ghosts; the paper-and-ball demo; the quiet
wreckage plus moral lines ending. No banned shot.

**Top 3 fixed after the audit** (not re-scored):
1. **The climax lands.** The roar ducks for a moment under each hero breakage (bottles, cake, chimney pot, table) and
   those hits are louder (each now 2.5–3.5 dB over the roar around it); a second, tighter snap-in, a camera kick and a
   white flicker as the table top lands; the sound now fades out with the picture instead of cutting dead at 60.5.
2. **The lull before the ice (28.4–34.6).** The mum and the girl run past you for the stair door (you go too), then you
   turn back to the empty party under the dark cloud as the clock runs out: a new image, people at stake, and the
   reason the roof is empty. The balloons' caption lands as they go; the storm is already half dark when you come back
   from the cloud, so "All of it lands here in 16 seconds" is said under a dark sky.
3. **Legibility and glitches.** The kite's tag sits on its flyer, still holding the string (KITE · FELL INTO THE
   STREET), instead of on empty air; the camera eases in on the falling kite under the title; the confetti and parachute
   tags sit beside their objects; the ghost-toy tag shows only while the ghost is in frame; the confetti and balloons
   are framed clear of the clock; the ice readout goes with the last ice; the note is one line; the doorway flicker
   (43.2–45.7 and 50.9–53.7) is gone (two faces z-fighting under the door head, and screen-space AO banding on the
   ceiling a hand's breadth from the camera).

## REMAINING WEAKNESSES
- The middle is still a row of curiosities (confetti, gust, balloons) before the stakes arrive; only the clock and the
  run for the door build towards the ice.
- The cloud cut-away (11.7–17.9) is hard to read on a phone: mostly white then grey, until the lightning.
- The payoff reads as a heavy hailstorm rather than supersonic ice: the damage (puffs, polka-dot holes, a table that
  stands for 15 s) is gentler than 1,300–1,800 km/h would do, and the roof holes only start at 45.2 although stones land
  from 37.
- The ending (51.9–60.8) is a static view; only text changes.
- The stairwell objects are dots until the landing snap-in; the balloons leave the frame in about half a second.
- The timeline behind the numbers is compressed: "falling for 31 seconds" and the cut-away's 440 km/h assume more fall
  time than the story has shown (the countdown itself is honest).
- Recycled channel devices remain by design of the format: the 100 → 0 % opener, the clock, the km/h readout, the
  NORMAL AIR ghosts, closing moral lines.
- Sound has only been level-measured, not listened to.

## FINAL CREATIVE-QUALITY ASSESSMENT
A clear step away from the template: one place (a rooftop party), no car, plane, crane, explosion or falling person,
and a climax that is a real consequence of the rule (without drag a storm cloud's ice lands faster than sound) instead
of an airliner. The reviewers rate it 6.5/10 for freshness against 2/10 for the old cut, but only 6/10 for retention and
for a normal viewer: the new ideas are good and specific, yet several are small or quick on a phone, and the film peaks
at the first stone (34.6) rather than at its end. The last fixes target exactly those weak points (the run for the
door, a bigger table moment, audible breakages, a clean doorway), and were not re-scored; my own estimate (not a reviewer's) is a
small gain, a solid 6–6.5, not a Friction-level 8. The strongest images are the paper and ball landing together,
the rain flying sideways past washing that barely moves, the first stone in slow motion and the ice coming through the
roof over you.

## FINAL OUTPUT
`no-air-resistance_v2.mp4` in the project files (`/mnt/project-files/no-air-resistance/`), with the runnable ZIP
`no-air-resistance_film.zip` (unzip, open `no-air-resistance.html`, press Space). 60.8 s, 1080×1920, H.264 at 30 fps (1,824 frames), AAC 160 kbps 48 kHz stereo, 26.7 MiB, −16.3 LUFS, −1.4 dBTP. Renders are not
committed. To rebuild: `tools/render-parallel.sh no-air-resistance.html <dir> 1080 1920 4 30`, then
`tools/render-wav.cjs` and `tools/encode-final.sh <dir> <wav> 60.8 <out>.mp4 27`.
