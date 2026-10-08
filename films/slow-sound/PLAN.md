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
| Changed | Every sound arrives 10× later (2.9 ms per metre). Every speed is 10× closer to Mach 1: 50 km/h is Mach 0.40, 110 km/h Mach 0.89, 126 km/h Mach 1.02, 160 km/h Mach 1.30, a landing airliner Mach 2.1, a cruising one Mach 6.9. |
| Real consequences (one per beat) | 30 m: a clap and a shout arrive 0.88 s after you see them. 100 m: a pile driver's bangs arrive 2.94 s late and keep coming after it stops. A 50 km/h siren is pitched +68 % coming and −29 % going (more than an octave apart). A 110 km/h car squeezes its approach into a high whine then drops by about four octaves. A road car at Mach 1.02 drags a shock cone: silent as it comes, then everything it emitted arrives at once, then the boom. Propeller tips go supersonic and crackle. A landing airliner flies silently overhead; its shock reaches the street ~5.7 s later, cracks a few weak panes, sets off car alarms and the pigeons. A police car at Mach 1.3, 11 m away, is never heard coming; its shock bursts the weakest windows along the street. |
| Simplifications | Sound is a single wave speed with no wind, no temperature layering and no absorption change. Shock strength is not simulated as a pressure field: which panes give way is chosen per pane from a seeded hash (weak/strong glass), with more breaking on the near side. Hearing a 34 m/s world: the same air, the same ear, the same loudness at the source. |
| Misconceptions to avoid | A sonic boom is not a one-off "bang when you break the barrier": it is a cone dragged behind for as long as the thing is supersonic, heard when the cone sweeps over you. You never hear a supersonic thing coming; you hear it after it has passed. Light is unaffected: you still see everything on time. |
| Formulas / numbers used | `soundArrivalTime = eventTime + distance / soundSpeed` (`js/audio/soundArrival.js`). Mach = v / 34.3. Cone half-angle = asin(1/M). A shock reaches a listener at perpendicular distance p only after the source has been supersonic for p / √(M²−1) of track. Doppler: the received sound is the emitted sound replayed through a delay line whose delay is the exact arrival time, so pitch and loudness change by dte/dt. Arrival of a supersonic source is a fold of A(te) = te + d(te)/c; its minimum is the boom. |
| Must NOT claim | That this could happen; exact window-breaking overpressures; that the airliner would survive (it is shown shuddering, flames surging, smoke pouring); any specific real place or vehicle model. |

## 2. The places (layout in metres, camera path)

- **You**: x 9.4, eye 1.83 m, on the right kerb of a two-lanes-each-way avenue (centre x 0, shopfronts at x ±12.5).
  You step forward from z 7.2 to z 1.0 during the title, stand there until 62.8 s, then step back to z −1.6 for the line.
- **The friend**: across the avenue at (−9.8, −22.5), 30.3 m from you — waves, claps four times, shouts "Hey! Over here!".
- **The parking lot and plaza** to your right (x 13…52), cars parked in rows; three of them have alarms.
- **The construction site**: a pile driver at (40, −95), 100.8 m away, hitting every 1.3 s until 16.15 s.
- **The elevated highway** at x 62 (deck 6 m, open galvanised rails): the 110 km/h car and the supersonic sports car pass
  across your view at x 57.2, 48 m away.
- **The drone** in the lot at (15.6, −4.8); its pilot at (18.8, −8.2).
- **The airliner**: on a 3° glide at 72 m/s, 220 m up, passing over x 24 at 48.6 s, flying toward you and over you.
- **The police car** in the near lane (x −1.75) at 44.4 m/s, passing you at 59.2 s, 11 m away.

## 3. Shot list (story seconds = film seconds, no cuts)

| # | Time | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|---|
| 1 | 0–4.3 | Busy sunny street; you step to the kerb; the world doesn't change | the city in normal time, then a falling tone as the rule changes | centred TITLE · SPEED OF SOUND 1,235 → 123 KM/H |
| 2 | 4.2–11.0 | Zoom to the friend across the avenue: a wave, claps, a shout | each clap 0.88 s after the hands meet; "Hey! Over here!" late | SOUND DELAY 0.88 S / DISTANCE 30 M · "You'd see people speak before you heard them." |
| 3 | 11.0–19.1 | Turn to the pile driver at the site; it stops at 16.15 | bangs 2.94 s late; three more after it has stopped | SOUND DELAY 2.9 S / DISTANCE 100 M · "A hundred metres away: three seconds late." · "It had already stopped…" / "…but the bangs kept coming." |
| 4 | 19.0–24.5 | An ambulance at 50 km/h passes in the avenue | its two-tone siren high coming, more than an octave lower going | AMBULANCE · 50 KM/H MACH 0.40 · "Passing sirens would drop more than an octave." |
| 5 | 24.4–28.0 | A car on the highway at 110 km/h | a high squeezed whine, then a low drone | CAR SPEED · 110 KM/H LOCAL MACH 0.89 · "Highway speed is now almost the speed of sound." |
| 6 | 27.9–37.9 | A sports car accelerates past 123 km/h; a faint Mach cone, dust lifting off the deck | silence from it, then its whole approach as a rising whine, then the boom (36.48), rattling windows | CAR SPEED MACH 0.92 → 1.02 · "A normal road car could break the sound barrier." · "Its sound is still behind it." |
| 7 | 38.3–44.2 | The drone takes off, its props crackling, and drops | a tearing buzz-saw crackle, then the crash 0.25 s late | DRONE PROPELLER TIPS MACH 2.6 · "Small propellers would go supersonic too." |
| 8 | 44.2–49.1 | A landing airliner overhead, shuddering, flames surging, smoke, a cone of shocked air — in silence | nothing from it | AIRLINER · 260 KM/H MACH 2.1 / AT CRUISE MACH 6.9 · "Even a landing airliner would be supersonic." · "And you can't hear it. Not yet." |
| 9 | 49.5–54.4 | Look down the avenue: the shock sweeps toward you — dust lifts, pigeons burst off the roofs, brake lights, a few panes crack | the bed thins; then the boom (54.36), rumble, car alarms, wings | "You'd see its shock wave before you heard it." |
| 10 | 55.6–60.0 | A police car at 160 km/h comes straight up the near lane, lights flashing, silent | silence, then its shock (59.41): the hardest hit; hands to ears; glass bursting along the street; its siren, low, after it has gone | POLICE CAR · 160 KM/H MACH 1.30 · "A police car you'd never hear coming." |
| 11 | 60.2–62.7 | Turn to the shopfronts: glitter on the pavement, some windows gone, most intact | glass still falling, alarms | "Only the weakest windows gave way." |
| 12 | 62.8–71.0 | Step back, look up the avenue; brake lights, hazards, people looking around | alarms falling away, a low chord | SPEED OF SOUND 123 KM/H / 34.3 M/S · "You wouldn't need a fighter jet…" / "…to break the sound barrier." · FICTIONAL SIMULATION note · fade 70.35–70.75 |

## 4. Hero shots (screenshot-worthy; cover candidate that doesn't spoil the payoff)

- **Cover candidate (~46 s)**: the airliner overhead, shuddering in its own cone of shocked air, flames at the engines,
  with "MACH 2.1" on screen. It spoils nothing about the street payoff.
- The sports car on the highway with its faint Mach cone and dust lifting (~35 s).
- The pigeon wave and dust sweeping up the avenue ahead of the airliner's boom (~53 s).
- The shopfronts after the police car: glitter carpets in front of a few burst windows (~61 s).

## 5. Escalation check (a new consequence every 5–8 s; nothing static for 3 s)

Delayed voice (4.2) → delayed bangs at 100 m (11.0) → bangs after it stops (16.5) → Doppler octave (19.0) → almost
supersonic at highway speed (24.4) → a car breaks the barrier (27.9) and its boom (36.5) → supersonic propellers (38.4) →
a silent supersonic airliner (44.2) → its shock arrives (54.4) → a silent police car (55.6) and the glass (59.4) → the
line (64.3). Longest gap between new consequences: 5.6 s. People, then machines, then infrastructure, then the street.

## 6. Sound

`films/slow-sound/audio.js` (`SndAudio`, an AudioEngine subclass; the engine file is untouched). Every source is timed
by `SoundArrival`: one-shots are scheduled at their arrival time; moving sources (ambulance, highway cars, drone, airliner,
police car, the avenue's own cars) are played through a delay line whose delay follows `SoundArrival.delayCurve`, which
gives the late arrival, the Doppler pitch and the "everything at once" compression of a supersonic approach exactly. The
booms are N-waves (two cracks ~0.09/0.075 s apart) with a thump, rumble and window rattle. Glass is placed pane by pane at
the time each pane's breaking is heard. The mix is about −17 LUFS integrated, peaks under −0.5 dBFS. Licence-safe:
everything is synthesised.

One deliberate liberty: at 400–1,100 m the supersonic car's squeezed approach would be faint; the film puts a rising floor
under it (never louder than the boom) so you hear it build.

## 7. Systems / files

- `js/audio/soundArrival.js` — **new shared helper** (engine commit, additive): `arrivalTime`, `delayCurve`,
  `firstArrival`, `mach`, `coneHalfAngle`, `boomDelay`.
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
