# WHAT IF THE SPEED OF SOUND BECAME 10× SLOWER? — production plan

A 63-second vertical (9:16, 1080×1920, 30 fps) first-person film on the shared engine. **One afternoon in a football
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
| Changed | Every sound arrives 10× later (29 ms per metre, half a minute per kilometre). Every speed is 10× closer to Mach 1 (a 144 km/h shot is Mach 1.17). Anything whose pitch is set by an air cavity drops ~10× (a whistle hoots; a voice keeps its pitch but its throat and mouth resonances drop, so it sounds deep and hollow). Echoes take 10× longer to come back. |
| Real consequences (one per beat) | A gun's bang runs down a 62 m start line in 1.8 s: each runner starts when it reaches them. A shout 28 m away arrives 0.81 s after you see it. One announcement from five loudspeakers at 17–109 m reaches you as three arrivals 0.5, 2.0 and 3.1 s late. A free kick at 144 km/h is supersonic: the goal goes in before you hear it struck. A drum 99.5 m away is heard 2.9 s late, and a crowd clapping to it claps in a wave, each fan when the beat reaches them. A lightning flash 1.71 km away is seen at 0:03 and heard at 0:52; its front crosses the stadium in 3.2 s, the far stand first. |
| Simplifications | One wave speed, no wind, no temperature layering. Absorption (which grows roughly as 1/c³, ~1,000× here) is **not** modelled: distant sounds would really be duller and fainter. Thunder is timed from the bolt's ground point (its nearest part); the roll after it stands for the rest of the channel. Voices: a buzz at the speaker's pitch through resonances ten times lower (a stylised hollow voice, not a measured one). The ball's drag: v = v0 / (1 + k·v0·t) with k = 0.0133 /m. The thunder's front is drawn as a ring/sphere from the ground point. |
| Misconceptions to avoid | A sonic boom is not a one-off bang "when it breaks the barrier": it is the cone the ball drags; here you hear the crack where the ball slows through Mach 1, after the goal. Light is unaffected: you see everything on time. |
| Formulas / numbers used | `arrival = eventTime + distance / 34.3` (`js/audio/soundArrival.js`). Mach = v / 34.3. The ball's first arrival is the minimum of te + d(te)/c over its flight (`SoundArrival.firstArrival`). Thunder: 1,711 m ÷ 34.3 = 49.9 s. |
| Must NOT claim | That this could happen; that real crowds or players would behave exactly so; any real stadium, club or broadcaster. |

## 2. The places (layout in metres, camera path)

- **The stadium**: pitch 105 × 68 (x along its length, goals at x = ±52.5); the main stand on +z (22 rows, a roof from
  z 41.8 to 61.5), the far stand on −z, end stands at ±x, floodlight masts with loudspeaker clusters at (±66, ±52), a
  big screen above the west end. A city of low blocks and trees outside. The storm: a shelf cloud and rain curtain toward
  (−263, −1639), 1.71 km beyond the far stand; the sun behind the main stand lights the pitch and the far stand.
- **Shot 1** (0–9.6): you stand in row 8 of the main stand at x 6.5 (eye 6.2 m up), above the near end of a 30-runner
  start line on the halfway line; the starter fires at (−1.6, −36.6), 85 m away.
- **Shot 2** (9.6–15.6): on the pitch below the main stand at (−3.5, 30); your friend stands on their seat in row 11 at
  x −22, 27.9 m away.
- **Shot 3** (15.6–22.6): by the near touchline at (−2, 33); the big screen at the west end; loudspeakers 17–109 m away.
- **Shot 4** (22.6–31.0): beside the east goal, just behind the line of its back net, at (55.6, 8.8); the referee at
  (40, −9.2), the free kick from (30.2, −1.6), 27.5 m away.
- **Shot 5** (31.0–42.4): the far corner of the pitch (49.5, −33.2), looking along the far stand; the drummer in row 13
  at x −48, 99.5 m away.
- **Shot 6** (42.4–63.0): standing in row 12 of the main stand at x 6, under the roof, looking across at the storm.

## 3. Shot list (story seconds = film seconds)

| # | Time | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|---|
| 1 | 0–3.7 | Title over the start line, the far stand, the black storm; lightning strikes in it at 2.7 | "Set!" on time (0.9); the crowd's murmur sinks into a deep hollow murmur, a falling tone, as the speed drops; no thunder | centred TITLE · SPEED OF SOUND 1,235 → 123 KM/H |
| 1 | 4.3–9.6 | The gun: a puff, a glassy dome and a ring run down the line; the runners peel off one by one (4.66 → 6.43); the view follows the front, then settles on the staggered line | the bang at 6.77, then its echoes off the stands; footsteps from where each runner is | THE STARTING GUN 0.00 → 2.47 S · ITS BANG IS ON ITS WAY TO YOU… → HEARD · 85 M AWAY · THE NEAREST RUNNER HEARD IT 1.8 S AFTER THE FIRST · "Whoever stood nearest the gun would start first." |
| 2 | 9.6–15.6 | Long lens: the friend (orange jacket, on their seat) waves, cups their hands and shouts (10.35), waves, shouts again (13.2) | each shout 0.81 s late, deep and hollow | SOUND DELAY 0.00 → 0.81 S · bubbles "“Hey! Up here!”" (11.16), "“Over here!”" (14.0) on arrival · "You'd see people shout before you heard them…" / "…and every voice would sound hollow." · THROAT RESONANCES 10× LOWER |
| 3 | 15.6–22.6 | The big screen: the announcer speaks (16.3), lower third LADIES AND GENTLEMEN…; rings and domes from five loudspeakers | the hollow announcement three times: 16.80, 18.29/18.42, 19.38/19.47, each with its horn's ring | ONE ANNOUNCEMENT · 1 → 5 OF 5 HEARD · 5 LOUDSPEAKERS 0.5–3.2 S LATE · "One announcement would reach you three times." |
| 4 | 22.6–31.0 | The referee's whistle (23.2); the run-up; the kick (26.0); the ball's rings pile into a V; the wall jumps, the keeper dives, goal (26.67), the net bulges; the crowd jumps on sight; the scorer celebrates | the whistle as a low hoot (23.89) with its echoes; silence during the shot; the crack (26.78) and the kick's deep "dum" (26.80) after the goal, the net; the cheers arrive stand by stand | REFEREE'S WHISTLE · 10× LOWER · THE SHOT · 144 KM/H · MACH 1.17 · SUPERSONIC → GOAL · THE KICK IS STILL ON ITS WAY → THE KICK: HEARD · "A hard shot would break the sound barrier." / "You'd hear the kick after the goal." |
| 5 | 31.0–42.4 | Along the far stand: the drummer beats every 0.75 s (31.4, 13 beats); each fan claps when the beat reaches them: stripes of raised arms and scarves roll along the stand; domes and rings from each beat | each beat 2.9 s late; ~700 claps, each placed by its own arrival | THE DRUM · 2.9 S LATE · 99 M AWAY · EACH SECTION CLAPS WHEN IT HEARS IT · "A crowd could never clap in time…" / "…each beat would roll down the stand." |
| 6 | 42.4–49.0 | From your seat: the storm over the far stand; the view lifts to it, then the lens closes on the far stand | the bed thins to near-silence and a low pad | THE FLASH AT 0:03 · 9.8 → 0.0 S · 1.71 KM AWAY · UNTIL ITS THUNDER REACHES YOU · "Remember the flash at the start?" / "Thunder would take half a minute per kilometre." |
| 6 | 49.0–52.6 | The thunder's front reaches the far stand (49.4–49.9): the fans duck section by section; the lens opens and follows the front (a line on the grass, a faint wall in the air) across the pitch (51.1 centre, 52.07 near touchline); the players duck | gasps from between you and the storm arrive with the thunder | countdown |
| 6 | 52.6–63.0 | It reaches you: shake, your hands to your ears, the rows around you duck; the view lifts to the sky; a new bolt (60.8); fade (62.75) | crack, boom, thump; the world muffled for 2.5 s; the roll in waves; a quiet chord | THE THUNDER · 50 S LATE · IT WOULD ROLL ON FOR OVER A MINUTE · "You'd see everything as it happened…" / "…and hear it long after it was over." · THAT FLASH · 45 S · UNTIL YOU HEAR IT · FICTIONAL SIMULATION note |

## 4. Hero shots (screenshot-worthy; cover candidate that doesn't spoil the payoff)

- **Cover candidate (~5.5 s)**: the start line from the stand, half the runners gone and half still waiting, the dome and
  ring of the bang crossing the line, the black storm behind. It spoils nothing.
- The clap stripes rolling along the far stand (~35 s).
- The free kick's ring V on the grass with the ball in the air (~26.4 s).
- The far stand ducking under the thunder, the storm above (~49.9 s).

## 5. Escalation check (a new consequence every 5–8 s; nothing static for 3 s)

The rule (1.35) and a silent flash (2.7) → the bang running down the line (4.3) → a voice that arrives late and hollow
(10.35) → one voice heard three times (16.3) → a whistle an octave-and-a-half lower (23.2) → a supersonic shot heard
after the goal (26.0) → a crowd that can't clap together (31.4) → the flash's thunder, still on its way (42.4) → its front
crossing the stadium (49.4) → reaching you (52.6) → a new flash whose thunder is a minute away (60.8). People, then a
whole crowd, then the sky. Longest gap between new consequences: 6.8 s (the drum shot, carried by the moving clap stripes).

## 6. Sound

`films/slow-sound/audio.js` (`SndAudio`, an AudioEngine subclass; the engine file is untouched). Every one-shot is
scheduled when its front reaches your ear (your ear jumps at the cuts): the arrival is found by marching the front
(`SND_RUN`, which also handles the speed change under the title) against the ear's path. Thousands of small sounds
(claps, cheers, gasps, footsteps) are mixed in JavaScript as grains, each placed by its own source's arrival, from the
crowd's own numbers (`crowd.js`). Echoes are image sources off the four stand fronts. Voices are hollow (a buzz at the
speaker's pitch through low resonances). Buses: crowd bed, sources, voices, effects, crowd, music, each with a trim; the
thunder is the loudest moment. Measured (preview): −14.2 LUFS, true peak −1.2 dBFS before encoding (the final encode
passes the audio through a limiter: AAC raises true peak by ~1.2 dB). Everything is synthesised.

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
- `films/slow-sound/waves.js` — `SndRipples` (rings on the grass), `SndShells` (fronts in the air), `SndPuffs` (gun smoke).
- `films/slow-sound/audio.js` — the sound. `films/slow-sound/film.js` — build/update/grade.
- Reused: CameraController, ViewerHands, StoryHUD, post grade, Look, Person rig, BillboardSystem, BlobShadows,
  SoundKit, SoundArrival, Environment.

## 8. Review log (scores as given, swipe timestamps, what changed — never inflated)

City version (before the redesign): two rounds of four reviews: round 1 retention 4, viewer 5, visual 4.5, physics 7;
round 2 retention 5, viewer 6, visual 5, physics 7.5.

Stadium version: see `EPISODE_REPORT.md`.
