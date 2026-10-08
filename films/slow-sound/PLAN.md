# WHAT IF THE SPEED OF SOUND BECAME 10× SLOWER? — production plan

A 61-second vertical (9:16, 1080×1920, 30 fps) first-person film on the shared engine. **One afternoon in a football
stadium, six shots** (hard cuts; the story clock never jumps), a black storm standing beyond the far stand. Under the
centred title the speed of sound falls from 343 m/s to **34.3 m/s** (1,235 → 123 km/h) at 1.35–2.45 s. From then on
every sound reaches you late, by exactly its distance ÷ 34.3 m/s, and anything faster than 123 km/h outruns its own sound.

This is the **redesign** ordered by the owner's creative override (2026-10-08): audio is the defining mechanic, and the
template (person → car → machinery → airplane → destruction, in a city street) is gone. The first version (a one-take
city avenue) is in the branch history up to `e2e3ae3`; the redesign brief is in `/mnt/project-files/slow-sound/REDESIGN.md`
(the five identity questions, the ten ranked consequences, the three signature moments, the old → new shot table).

## 1. Rules (the fictional rule, held constant, changed, simplifications, what we must not claim)

| Item | This episode |
|---|---|
| Exact fictional rule | The speed of sound in air is 34.3 m/s instead of 343 m/s. Nothing else is changed. |
| Held constant | Light, air density and pressure, gravity, people, how fast people move and kick, the weather. |
| Changed | Every sound arrives 10× later (29 ms per metre, half a minute per kilometre). Every speed is 10× closer to Mach 1 (a 144 km/h shot is Mach 1.17, and a ball's drag jumps near Mach 1). Anything whose pitch is set by an air cavity drops ~10× (a whistle hoots; a voice keeps its pitch but its throat and mouth resonances drop, so words blur into a deep buzz). Echoes take 10× longer. High notes are soaked up within metres (absorption grows as 1/c³). |
| Real consequences (one per beat) | A gun's bang runs down a 62 m start line in 1.8 s: each runner starts when it reaches them. A shout 28 m away arrives 0.81 s after you see it, with its words blurred. One announcement from five loudspeakers at 17–109 m reaches you as three arrivals 0.5, 2.0 and 3.1 s late. A whistle 66 m away arrives 1.9 s late, ~10× lower. A free kick at 144 km/h is supersonic for its first 3 m, then the air brakes it hard; from 59 m away you hear the kick 0.79 s after the goal. A drum 40 m away is heard 1.2 s late, and a crowd clapping to it claps in ripples spreading out from the drum. A lightning flash 1.71 km away is seen at 0:03 and heard at 0:52.6; its front crosses the city (birds lift off the roofs as it reaches them), then the stadium in 3.2 s, the far stand first. |
| Simplifications | One wave speed, no wind, no temperature layering. Absorption is applied by hand (distant bangs, cracks, horns and the thunder are low-passed; not a per-path filter). Thunder is timed from the bolt's ground point (its nearest part); the roll after it stands for the rest of the channel. Voices: a buzz at the speaker's pitch through resonances ten times lower (stylised). The ball: dv/dt = −k·v², k = 0.0532·Cd, Cd rising from 0.25 (slow) to ~1 (Mach ≥ 1). The fronts are drawn as rings on the grass and spheres in the air (the thunder's as a curtain brightest near the ground). |
| Misconceptions to avoid | A sonic boom is not a one-off bang "when it breaks the barrier": it is the cone the ball drags. Light is unaffected: you see everything on time. The thunder's front does not push anything: people and birds react because they hear it. |
| Formulas / numbers used | `arrival = eventTime + distance / 34.3` (`js/audio/soundArrival.js`). Mach = v / 34.3. The ball's first arrival is the minimum of te + d(te)/c over its flight (`SoundArrival.firstArrival`). Thunder: 1,713 m ÷ 34.3 = 49.9 s. |
| Must NOT claim | That this could happen; that real crowds or players would behave exactly so; any real stadium, club or broadcaster. |

## 2. The places (layout in metres, camera path)

- **The stadium**: pitch 105 × 68 (x along its length, goals at x = ±52.5); the main stand on +z (22 rows, a roof from
  z 41.8 to 61.5), the far stand on −z, end stands at ±x, floodlight masts with loudspeaker clusters at (±66, ±52), a
  big screen above the west end. A city of low blocks and trees outside. The storm: a shelf cloud and rain curtain toward
  (30, −1662), 1.71 km beyond the far stand; the sun behind the main stand lights the pitch and the far stand.
- **Shot 1** (0–9.6): you stand in row 8 of the main stand at x 6.5 (eye 6.2 m up), above the near end of a 30-runner
  start line on the halfway line; the starter fires at (−1.6, −36.6), 85 m away. (The rows just below you are empty.)
- **Shot 2** (9.6–15.6): on the pitch below the main stand at (−3.5, 30); your friend stands on their seat in row 11 at
  x −22, 27.9 m away, in a quiet block of a dozen fans.
- **Shot 3** (15.6–21.7): by the near touchline at (−2, 33); the big screen at the west end; loudspeakers 17–109 m away.
- **Shot 4** (21.7–29.8): high in the main stand (row 18, in the aisle at x 35, eye 10.4 m up); the referee at
  (44.5, −8.6), 66 m away; the free kick from (30.2, −1.6), 59 m away; a few fans just below you.
- **Shot 5** (29.8–38.6): on the pitch at (−8, −1), facing the far stand; the drummer at its front (x −14), 40 m away.
- **Shot 6** (38.6–61.4): standing in row 12 of the main stand at x 6, under the roof, looking across at the storm;
  stewards along the near touchline.

## 3. Shot list (story seconds = film seconds)

| # | Time | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|---|
| 1 | 0–3.7 | Title over the start line (the runners crouch on "Set!" at 1.0), the far stand, the black storm; lightning strikes in it at 2.7 | "Set!" on time (0.9); the crowd's murmur sinks into a deep hollow murmur, a falling tone, as the speed drops; no thunder | centred TITLE · SPEED OF SOUND 1,235 → 123 KM/H · from 2.95 the small tag THE FLASH'S THUNDER · IN 49 S |
| 1 | 3.8–9.6 | The gun: a puff, a glassy dome and a ring run down the line; the runners peel off one by one (4.16 → 5.93); the view follows the front, then settles on the staggered line | the bang at 6.27 (dull: its highs are soaked up), then its echoes off the stands; footsteps from where each runner is | THE STARTING GUN 0.00 → 2.47 S · ITS BANG IS ON ITS WAY TO YOU… → HEARD · 85 M AWAY · THE RUNNER NEAREST YOU HEARD IT 1.8 S AFTER THE FIRST · "Whoever stood nearest the gun would start first." |
| 2 | 9.6–15.6 | Long lens: the friend (orange jacket, on their seat) waves, shouts with one hand at the mouth (10.35), waves, shouts again (12.9) | each shout 0.81 s late, a deep blurred buzz | SOUND DELAY 0.00 → 0.81 S · tag IN 42 S · bubbles "“Hey! Up here!”" (11.16) and what actually arrives, "“Uvvh… hhrrh!”" (13.70) · "Your friend's shout would take almost a second…" / "…and you couldn't make out a word." · VOICE RESONANCES 10× LOWER |
| 3 | 15.6–21.7 | The big screen: the announcer speaks (16.3), lower third LADIES AND GENTLEMEN…; rings and domes from five loudspeakers | the hollow announcement three times: 16.80, 18.29/18.42, 19.38/19.47, each with its horn's ring | ONE ANNOUNCEMENT · NOT YET → HEARD 1× → 3× · FROM 5 LOUDSPEAKERS · 0.5 · 2.0 · 3.1 S LATE · tag IN 36 S · "One announcement would reach you three times." |
| 4 | 21.7–29.8 | Long lens on the referee's whistle (22.3); wide on the penalty area: run-up, the kick (25.3), the view pans with the ball onto the goal (26.23), the net bulges, the keeper is beaten; the fans below you and the far stand leap on sight | the whistle as a low hoot (24.23) with its echoes; silence through the shot; the crowd round you erupts; then the kick's crack and deep "dum" (27.02, 0.79 s after the goal), the net | THE REFEREE'S WHISTLE 0.00 → 1.93 S · ON ITS WAY · 66 M → AND ABOUT 10× LOWER · THE SHOT · 144 KM/H · MACH 1.17 · SUPERSONIC FOR ITS FIRST 3 M · THEN THE AIR BRAKES IT HARD → GOAL · THE KICK IS STILL ON ITS WAY… → THE KICK: HEARD 0.8 S AFTER THE GOAL · "A hard shot would break the sound barrier…" / "…and you'd hear the kick after the goal." |
| 5 | 29.8–38.6 | The drummer at the front of the far stand through a long lens (strokes every 0.45 s from 29.02, 17 strokes), then the far stand wide and still: each fan raises white-and-gold scarves when the beat reaches them, so ripples spread out along the stand from the drum | each beat 1.2 s late; ~1,200 claps, each placed by its own arrival | THE DRUM · 1.2 S LATE · 40 M AWAY · EACH FAN CLAPS WHEN THE BEAT REACHES THEM · tag IN 21 S · "A crowd could never clap in time…" / "…every beat would ripple along the stand." |
| 6 | 38.6–47 | From your seat: the storm; the view comes down to the city and the far stand; a faint curtain of air comes over the city and flocks of birds lift off the roofs as it reaches them (from ~42) | the bed thins to near-silence and a low pad | THE FLASH AT 0:03 · 14.0 → 0.0 S · ITS THUNDER: 470 → 0 M AWAY · UNTIL IT REACHES YOU · "Remember the flash at the start?" / "Its thunder is still on the way." / "Thunder would take half a minute per kilometre." |
| 6 | 47–52.6 | The lens closes on the far stand: the front reaches it (49.4 back rows → 50.0 front): the whole stand ducks; the lens opens and follows the front (a bright line on the grass, a curtain behind it) across the pitch (51.2 centre, 52.15 near touchline): the players duck, then the stewards | gasps from between you and the storm arrive with the thunder | countdown |
| 6 | 52.65–61.4 | It reaches you: a white jolt, shake, your hands fly up, two muffled seconds, the rows around you duck; a calm wide; the view lifts to the sky; a new bolt (58.7); fade (61.15) | a deep blow and thump (no crack: over 1.7 km the air soaks up the highs); the world muffled; the roll in waves; a quiet chord | THE THUNDER · 50 S LATE · IT WOULD ROLL ON FOR OVER A MINUTE · "You'd see everything as it happened…" / "…and hear it long after it was over." · THAT FLASH · 45 S · UNTIL YOU HEAR IT · FICTIONAL SIMULATION note |

## 4. Hero shots (screenshot-worthy; cover candidate that doesn't spoil the payoff)

- **Cover candidate (~4.8 s)**: the start line from the stand, half the runners gone and half still waiting, the dome and
  ring of the bang crossing the line, the black storm behind. It spoils nothing.
- The clap ripples spreading along the far stand (~34 s).
- The free kick's rings piling up round the box, the goal and the leaping fans (~26.3 s).
- The far stand ducking as the curtain of air reaches it, birds above (~50 s).

## 5. Escalation check (a new consequence every 5–8 s; nothing static for 3 s)

The rule (1.35) and a silent flash (2.7) → the bang running down the line (3.8) → a voice that arrives late and blurred
(10.35) → one voice heard three times (16.3) → a whistle 2 s late and ~10× lower (22.3) → a supersonic shot heard
after the goal (25.3) → a crowd that can't clap together (29.8) → the flash's thunder, still on its way (38.6) → birds
lifting off the city as it comes (~42) → the far stand ducking (49.4) → the front crossing the pitch → reaching you
(52.65) → a new flash whose thunder is a minute away (58.7). People, then a whole crowd, then the sky. The small
"thunder in N s" tag at every cut keeps the opening flash open. Longest gap between new events: ~4 s (the thunder's wait,
carried by the countdown, the curtain and the birds).

## 6. Sound

`films/slow-sound/audio.js` (`SndAudio`, an AudioEngine subclass; the engine file is untouched). Every one-shot is
scheduled when its front reaches your ear (your ear jumps at the cuts): the arrival is found by marching the front
(`SND_RUN`, which also handles the speed change under the title) against the ear's path. Thousands of small sounds
(claps, cheers, gasps, footsteps) are mixed in JavaScript as grains, each placed by its own source's arrival, from the
crowd's own numbers (`crowd.js`). Echoes are image sources off the four stand fronts. Voices are hollow (a buzz at the
speaker's pitch through low resonances). Buses: crowd bed, sources, voices, effects, crowd, music, each with a trim; the
thunder is the loudest moment. Echoes off a stand front reach you only if you are on its pitch side. Distant highs are
low-passed by hand (absorption). Measured (second preview): −14.6 LUFS, true peak −1.9 dBFS before encoding (the final
encode passes the audio through a limiter: AAC raises true peak by ~1.2 dB). Everything is synthesised.

## 7. Systems / files

- `js/audio/soundArrival.js` — shared helper (added by this episode's first version, unchanged).
- `films/slow-sound/script.js` — ★ the beats, the stadium layout, every moving thing, the camera shot by shot, the
  arrivals at your ear, captions and live readouts.
- `films/slow-sound/stadium.js` — `SndStadium` (Environment subclass): the pitch, stands, roof, masts and loudspeakers,
  LED boards, the big screen (drawn live), goals and the bulging net, the city outside, the storm sky, lightning.
- `films/slow-sound/crowd.js` — `SndCrowd`: ~9,000 fans, instanced, posed in the vertex shader from story time and their
  own drum / thunder / goal times.
- `films/slow-sound/cast.js` — `SndCast`: runners and the starter, the friend, the referee, the free kick, the drummer,
  your neighbours, the players, the ball.
- `films/slow-sound/waves.js` — `SndRipples` (rings on the grass), `SndShells` (fronts in the air; the thunder's as a
  curtain), `SndPuffs` (gun smoke), `SndBirds` (flocks on the city roofs that lift off as the thunder reaches them).
- `films/slow-sound/audio.js` — the sound. `films/slow-sound/film.js` — build/update/grade.
- Reused: CameraController, ViewerHands, StoryHUD, post grade, Look, Person rig, BillboardSystem, BlobShadows,
  SoundKit, SoundArrival, Environment.

## 8. Review log (scores as given, swipe timestamps, what changed — never inflated)

City version (before the redesign): two rounds of four reviews: round 1 retention 4, viewer 5, visual 4.5, physics 7;
round 2 retention 5, viewer 6, visual 5, physics 7.5.

Stadium version: see `EPISODE_REPORT.md`.
