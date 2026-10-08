# WHAT IF THE SPEED OF SOUND BECAME 10× SLOWER? — production plan

A 71-second vertical (9:16, 1080×1920, 30 fps) first-person film on the shared engine. One place, one continuous take, no
cuts: you stand on the kerb at the corner of a parking lot on a sunny avenue, with a construction site and an elevated
highway beyond the lot. Under the centred title the speed of sound falls from 343 m/s to **34.3 m/s** (1,235 → 123 km/h)
at 1.35–2.45 s. From then on every sound in the film reaches you late, by exactly its distance ÷ 34.3 m/s, and anything
faster than 123 km/h outruns its own sound.

## 1. Rules (the fictional rule, held constant, changed, simplifications, what we must not claim)

| Item | This episode |
|---|---|
| Exact fictional rule | The speed of sound in air is 34.3 m/s instead of 343 m/s. Nothing else is changed. |
| Held constant | Light, air density and pressure, gravity, materials, engines, people, the speeds things normally move at. |
| Changed | Every sound arrives 10× later (2.9 ms per metre). Every speed is 10× closer to Mach 1: 50 km/h is Mach 0.40, 110 km/h Mach 0.89, 126 km/h Mach 1.02, 160 km/h Mach 1.30, a landing airliner Mach 2.1, a cruising one Mach 8 (236 m/s against the colder air's 29.5 m/s at 11 km). |
| Real consequences (one per beat) | 30 m: a clap and a shout arrive 0.88 s after you see them. 100 m: a pile driver's bangs arrive 2.94 s late and keep coming after it stops. A 50 km/h siren is pitched +68 % coming and −29 % going (more than an octave apart). A car at 110 km/h is at Mach 0.89; speeding up to 126 km/h it passes Mach 1 and drags a shock cone: what it emitted after that arrives squeezed together, and its boom reaches you only after it has run p / √(M²−1) ≈ 240 m supersonic. Propeller tips go supersonic and crackle. A landing airliner flies silently overhead; its shock reaches the street ~5.7 s later, cracks a few weak panes, sets off car alarms and the pigeons. A police car at Mach 1.3, 11 m away, is never heard coming; its shock bursts the weakest windows along the street; after it has passed, the siren it sounded while approaching arrives in reverse. |
| Simplifications | Sound is a single wave speed with no wind, no temperature layering and no absorption change. Shock strength is not simulated as a pressure field: which panes give way is chosen per pane from a seeded hash (about 12 % burst on the near side, 5 % across), and on the stretch of shopfront you watch the fates are set by hand (two weak panes burst, one cracks, the rest hold) so it reads. Hearing a 34 m/s world: the same air, the same ear, the same loudness at the source. |
| Misconceptions to avoid | A sonic boom is not a one-off "bang when you break the barrier": it is a cone dragged behind for as long as the thing is supersonic, heard when the cone sweeps over you. You never hear a supersonic thing coming; you hear it after it has passed. Light is unaffected: you still see everything on time. |
| Formulas / numbers used | `soundArrivalTime = eventTime + distance / soundSpeed` (`js/audio/soundArrival.js`). Mach = v / 34.3. Cone half-angle = asin(1/M). A shock reaches a listener at perpendicular distance p only after the source has been supersonic for p / √(M²−1) of track. Doppler: the received sound is the emitted sound replayed through a delay line whose delay is the exact arrival time, so pitch and loudness change by dte/dt. Arrival of a supersonic source is a fold of A(te) = te + d(te)/c; its minimum is the boom. |
| Must NOT claim | That this could happen; exact window-breaking overpressures; that the airliner would survive (it is shown shuddering, flames surging, smoke pouring); any specific real place or vehicle model. |

## 2. The places (layout in metres, camera path)

- **You**: x 9.4, eye 1.83 m, on the right kerb of a two-lanes-each-way avenue (centre x 0, shopfronts at x ±12.5).
  You step forward from z 7.2 to z 1.0 during the title and stand there to the end.
- **The friend**: across the avenue at (−9.8, −22.5), 30.3 m from you — claps five times under the title (heard on time, then later
  and later as the speed drops), waves, claps three more times, shouts "Hey! Over here!".
- **The parking lot and plaza** to your right (x 13…52), cars parked in rows; three of them have alarms.
- **The construction site**: a pile driver at (40, −95), 100.8 m away, hitting every 1.3 s until 16.15 s.
- **The elevated highway** at x 62 (deck 6 m, open galvanised rails): the yellow sports car comes toward you on it from
  ~400 m at 110 km/h, passes Mach 1 at 28.7 s and passes you at x 57.2, 48 m away. Nothing stands in the long-lens line to it
  (the cross street's buildings on your side start beyond the highway).
- **The drone** in the lot at (15.6, −4.8); its pilot at (18.8, −8.2).
- **The airliner**: on a 3° glide at 72 m/s, 220 m up, passing over x 24 at 48.6 s, flying toward you and over you.
- **The police car** in the near lane (x −1.75) at 44.4 m/s, passing you at 59.2 s, 11 m away.

## 3. Shot list (story seconds = film seconds, no cuts)

| # | Time | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|---|
| 1 | 0–4.6 | Busy sunny street; the friend across the avenue already clapping; you step to the kerb | the claps on time, then later and later; a falling tone as the rule changes | centred TITLE · SPEED OF SOUND 1,235 → 123 KM/H |
| 2 | 4.2–11.0 | Zoom to the friend: a wave, three claps, a shout; rings spread from each sound | each clap 0.88 s after the hands meet; "Hey! Over here!" late | SOUND DELAY live counter 0.00 → 0.88 S · bubble "“ … ”" then "“Hey! Over here!”" on arrival · "You'd see people speak before you heard them." |
| 3 | 11.0–19.1 | Zoom to the pile driver at 100 m, a dust puff each blow; it stops at 16.15 | bangs 2.94 s late; three more after it has stopped | SOUND DELAY 2.9 S · N BANGS STILL ON THE WAY · "A hundred metres away: three seconds late." · "It had already stopped…" / "…but the bangs kept coming." |
| 4 | 19.0–24.0 | An ambulance at 50 km/h passes in the avenue | its two-tone siren high coming, more than an octave lower going | AMBULANCE · 50 KM/H MACH 0.40 · SIREN PITCH +68 % → −29 % · "Passing sirens would drop more than an octave." |
| 5 | 24.0–37.9 | Long lens on a yellow sports car on the highway at 110 km/h; it speeds up past 123 km/h, dust off the deck behind it; the lens widens as it passes | a squeezed high whine, then (supersonic) its squeezed approach building into the boom (36.48), rattling windows, its engine low | LOCAL MACH 0.89 → 1.02 · SUPERSONIC · "ITS SHOCK WAVE REACHES YOU IN x S" · "Highway speed is now almost the speed of sound." · "A normal road car could break the sound barrier." · "It's outrunning its own sound." |
| 6 | 38.3–44.2 | The drone takes off, its props crackling, and drops | a tearing buzz-saw crackle, then the crash 0.25 s late | DRONE PROPELLER TIPS MACH 2.6 · "Small propellers would go supersonic too…" / "…and couldn't keep it in the air." |
| 7 | 44.2–49.1 | A landing airliner overhead, shuddering, flames surging, smoke, a cone of shocked air, in silence | nothing from it | AIRLINER · 260 KM/H MACH 2.1 / AT CRUISE ALTITUDE MACH 8 · "Even a landing airliner would be supersonic." · "And you can't hear it. Not yet." |
| 8 | 49.3–54.4 | Look down the avenue: a low wall of dust comes up the street, pigeons burst off the roofs flock by flock, cars brake | the bed thins; then the long double boom (54.36), rumble, car alarms, wings | ITS SHOCK WAVE 355 M → 0 M · COMING UP THE STREET · 260 KM/H · "You'd see its shock wave before you heard it." |
| 9 | 55.0–59.5 | A police car at 160 km/h comes straight up the near lane, lights flashing, silent; its shock (59.41): your fingers fly up into the frame, windows burst | silence (the quietest bed of the film), then the hardest crack, thump and rumble; glass pane by pane; its siren reversed, then low | POLICE CAR · 160 KM/H MACH 1.30 · countdown · "A police car you'd never hear coming." |
| 10 | 60.0–63.2 | Hold on the shopfronts: two panes gone with glitter on the pavement, one cracked, most intact, a man cowering | glass still falling, alarms | "Only the weakest windows gave way." |
| 11 | 63.2–71.0 | Aftermath: back to the friend across the avenue, stopped cars with brake lights and hazards | alarms falling away, a low chord | SPEED OF SOUND 123 KM/H / 34.3 M/S · "You wouldn't need a fighter jet…" / "…to break the sound barrier." · FICTIONAL SIMULATION note · fade 70.35–70.75 |

## 4. Hero shots (screenshot-worthy; cover candidate that doesn't spoil the payoff)

- **Cover candidate (~46 s)**: the airliner overhead, shuddering in its own cone of shocked air, flames at the engines,
  with "MACH 2.1" on screen. It spoils nothing about the street payoff.
- The yellow sports car on the highway, dust lifting off the deck behind it, "SUPERSONIC" on screen (~34 s).
- The pigeon wave and dust sweeping up the avenue ahead of the airliner's boom (~53 s).
- The shopfronts after the police car: glitter carpets in front of a few burst windows (~61 s).

## 5. Escalation check (a new consequence every 5–8 s; nothing static for 3 s)

Claps slipping late under the title (1.4) → delayed voice (4.2) → delayed bangs at 100 m (11.0) → bangs after it stops
(16.5) → Doppler octave (19.0) → almost supersonic at highway speed (24.0) → the car breaks the barrier (28.7) → its boom
(36.5) → supersonic propellers (38.4) → a silent supersonic airliner (44.2) → its shock coming up the street (49.3) and
arriving (54.4) → a silent police car (55.0) and the glass (59.4) → the aftermath and the line (63.2). Longest gap between
new consequences: 7.8 s (the car's run from Mach 1 to its boom, held by the countdown). People, then machines, then
infrastructure, then the street.

## 6. Sound

`films/slow-sound/audio.js` (`SndAudio`, an AudioEngine subclass; the engine file is untouched). Every source is timed
by `SoundArrival`: one-shots are scheduled at their arrival time; moving sources (ambulance, highway cars, drone, airliner,
police car, the avenue's own cars) are played through a delay line whose delay follows `SoundArrival.delayCurve`, which
gives the late arrival, the Doppler pitch and the "everything at once" compression of a supersonic approach exactly. The
booms are N-waves at least as long as the body ÷ the speed of sound (car 0.15 s, police car 0.13 s, airliner 0.9 s),
high-passed so the infrasonic ramp between the cracks doesn't pump the limiter, with a thump, rumble and window rattle.
After the police car has passed, the siren it sounded while approaching arrives in reverse (the early branch of the
arrival curve, `movingEarly`). Glass is placed pane by pane at the time each pane's breaking is heard. The mix measures
−16.2 LUFS integrated, true peak −1.4 dBTP (an oversampled soft clip after the limiter). Licence-safe: everything is
synthesised.

One deliberate liberty: at 400–1,100 m the supersonic car's squeezed approach would be faint; the film puts a rising floor
under it (never louder than the boom) so you hear it build.

## 7. Systems / files

- `js/audio/soundArrival.js` — **new shared helper** (engine commit, additive): `arrivalTime`, `arrival`, `emissions`,
  `emitTimeAt`, `delayCurve`, `firstArrival`, `mach`, `coneHalfAngle`, `boomDelay`.
- `films/slow-sound/script.js` — numbers, paths, camera, captions, readouts; computes the three boom times at load.
- `films/slow-sound/city.js` — `SndCity` (Environment subclass): avenue, lot, site, elevated highway, roofs and units for the glass.
- `films/slow-sound/cast.js` — `SndCast`: friend, pilot, walkers, reactions, cars, police car, pile driver, drone, pigeons.
- `films/slow-sound/waves.js` — `SndRipples` (expanding sound rings and wake fronts on the ground), `SndDust`, `SndPlaneFx`
  (cone, vapour collar, flames, smoke, shudder), `SndGlass` (per-pane fates, burst/crack decals, shards, glitter).
- `films/slow-sound/audio.js` — the sound. `films/slow-sound/film.js` — build/update/grade.
- Reused: CameraController, ViewerHands, StoryHUD, post grade, Look, PeopleSystem, VehicleFactory, BillboardSystem,
  BlobShadows, AircraftSystem, SoundKit, Environment.

## 8. Review log (scores as given, swipe timestamps, what changed — never inflated)

See `EPISODE_REPORT.md` for the reviewer scores, swipe points and what was changed after the reviews.
