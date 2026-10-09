# WHAT IF MEN SUDDENLY DISAPPEARED FROM THE WORLD? — production plan

A 67-second vertical (9:16, final 1080×1920, 30 fps) first-person film on the shared engine. You are a woman standing in
the front car of a commuter train on a harbour viaduct, late afternoon. At 1.8 s every adult man on Earth vanishes. The
film is about **systems, not people**: what keeps running when the person operating it is gone. Tone is neutral and
respectful: men simply vanish (no bodies, no gore, no jokes about either sex).

No edit: story time = film time (0–67 s).

## 1. Rules

| Item | This episode |
|---|---|
| Exact fictional rule | At one instant every man aged 18+ vanishes, with whatever he is wearing. Anything he was holding falls. Boys stay. |
| Held constant | Physics, machines, software, every woman and child. Machines keep doing whatever they were last told to do. |
| Changed | 2.92 billion people are gone from wherever they were: driving, steering, flying, on shift. |
| Real consequences (one per beat) | 1. A train driver's dead man's switch is released → warning, then an automatic emergency brake: the train stops itself. 2. A car with no foot on the pedals coasts and drifts; a car on (plain, non-adaptive) cruise control holds its speed into a parked van. 3. 98.7 % of merchant seafarers are men: ships at sea are suddenly crewless, engines running, on autopilot. 4. Airliners fly on on autopilot with nobody in either seat. 5. ~95 % of US firefighters are men: an alarm rings in an empty bay. 6. ~90 % of nurses are women: the wards keep running. 7. A ship can't stop like a train: tens of thousands of tonnes at 6 knots, nobody at the helm, hits a viaduct pier (the 2024 Francis Scott Key Bridge collapse is the real precedent: a container ship that lost control hit a pier and brought the spans down). |
| Simplifications | Events are compressed: the ship is already on a bad line when the film starts and reaches the pier 46 s after the vanish. Many modern cars have adaptive cruise / automatic emergency braking that would stop before the van; our SUV is an older one with plain cruise control. Ships have watch alarms (BNWAS) and autopilots that hold a heading, not a destination; we show a ship holding a heading that happens to cross the pier. The collapse is staged (precomputed rigid-body rotation of one 60 m span), not simulated. |
| Misconceptions to avoid | Cars don't "speed up" when the driver vanishes; they coast. Trains don't run on: almost every train has a vigilance / dead man's device. Autopilots don't land the plane at the destination by themselves (most can autoland, but only when a crew sets it up); the film only says the autopilot "doesn't know". |
| Formulas / numbers used | Train 16 m/s (58 km/h) → coasts at 0.05 m/s² → emergency brake builds to 1.4 m/s² from 4.6 s → stops at ~16.3 s, 4 m short of the span that later falls (`MD_TRAIN` in script.js). Cars coast at 0.72 m/s² (engine braking + rolling resistance); women drivers brake at 3 m/s² after a 0.9 s reaction. Ship 3.2 m/s = 6.2 knots; after the hit it drives on ~7 m (decaying, τ 1.9 s). Span fall: a rigid rod pivoting on its near bearing (α = 1.5 g cos θ / L), then on its far contact (the bow) until the near end reaches the water. |
| Must NOT claim | That this would happen everywhere at once in this exact way; any death toll; anything about what men or women are "like". The note says: EVENTS COMPRESSED FOR THIS SIMULATION. NOT A PREDICTION. |

### Numbers on screen and their sources

| Readout | Value | Source |
|---|---|---|
| World population | 8,301,468,210 → 5,379,867,7xx | UN World Population Prospects 2024 (medium variant, late 2026 ≈ 8.30 billion). Men 18+ ≈ 35.2 % of everyone (≈ 50.4 % male × ≈ 70 % adults, derived from WPP 2024 age structure) ≈ 2.92 billion: an estimate, rounded. |
| Merchant seafarers | 98.7 % men · 1.89 million seafarers | ICS/BIMCO Seafarer Workforce Report 2021 (women ≈ 1.28 % of the global seafarer workforce, rounded down to 98.7 % men). |
| Airline pilots | ≈ 95 % men | International Society of Women Airline Pilots (ISWAP) estimates: women ≈ 5–6 % of airline pilots worldwide. |
| Firefighters (US) | ≈ 95 % men | US Bureau of Labor Statistics, Current Population Survey (women 5.1 % of firefighters). |
| Nurses worldwide | ≈ 90 % women | WHO, State of the World's Nursing 2020. |

## 2. The place (world metres)

Water at y 0. A two-track viaduct runs along z (rail head y 24, deck x −7.4…3.2, open railings), spans of 60 m on piers
at z = k·60 with a 120 m navigation span between z −60 and −180. **Our train runs on the left (land-side) track, x −4.4**,
toward −z, and stops with its nose at z 4. The span from z −0.6 to −59.4 is the one that falls; its far pier (z −60) is
the one the ship hits. Land (seawall, promenade, waterfront road at x −30, buildings) is on the left for z > 22. The
harbour is on the right: the ship comes from +x on a heading 10° off straight across, a container terminal, hills, a
lighthouse and three ships at anchor beyond. The camera is written in train-local coordinates (`SCRIPT.camera`) and
carried by the train (`film.js`); `MD_LOOK` turns your head toward things.

## 3. Shot list (as built)

| # | Time | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|---|
| 1 | 0–4.5 | **Hook.** The car, full: a man standing at the strap in front of you, men and women on both benches. At 1.8 every man is gone in one frame: the strap swings, a coffee cup falls out of nobody's hand, a newspaper flutters down, a phone drops onto a seat. | Chatter with men's voices; at 1.8 the men's voices stop dead; a beat, then the women's sharp questions, a child. | **TITLE (centred, to 3.9):** WHAT IF MEN / SUDDENLY DISAPPEARED / FROM THE WORLD? · WORLD POPULATION 8,301,468,210 → 5,379,867,7xx · 2.92 BILLION MEN (18+) · GONE |
| 2 | 4.5–9.3 | **Signature A: the train stops itself.** The emergency brake bites (you grab the pole, everyone lurches); through the cab door's window the driver's seat is empty, his handle sprung up, the brake lamp blinking. | The dead man's buzzer, then the air brake and a long squeal. | TRAIN · DRIVER GONE · km/h · DEAD MAN'S SWITCH → EMERGENCY BRAKE · *Every adult man. The same second.* · *The driver let go of the controls…* |
| 3 | 9.3–16.6 | **The road.** At the left window: the waterfront road below. Cars coast and drift to the kerb with no brake lights; women brake and put hazards on; the silver SUV (old, plain cruise control, no automatic braking) holds 50 km/h, drifts across and slams into a parked van (14.6), shoving it 3 m. | Through the glass: horns, the crunch, a car alarm. | *Most cars have no dead man's switch.* · *With no foot on the pedal, they coast.* · *Unless an older car was on cruise control.* · SILVER SUV · NOBODY INSIDE · km/h · OLD CRUISE CONTROL · NO AUTO-BRAKE · tag NO DRIVER · CRUISE CONTROL |
| 4 | 16.6–24 | **Signature B: the ghost ship.** At the right window: a 180 m container ship crossing toward the viaduct. Telephoto (fog thinned): its wheelhouse lit and empty (tag WHEELHOUSE · NOBODY ON WATCH). | A slow diesel beat through the glass. | MERCHANT SEAFARERS 98.7 % ARE MEN · 1.89 MILLION SEAFARERS / THIS SHIP · 6.2 KNOTS · CREW 0 · *Nobody is steering that ship.* · *Almost every merchant seafarer is a man.* |
| 5 | 24–31.7 | **MEANWHILE** (2.5 s each): a cockpit over the Atlantic, both seats empty, autopilot on · a fire station: the turnout alarm, engines ready, nobody comes · a hospital ward at night: the nurses carry on. | Engine roar + chime · the alarm in an empty bay · monitors beeping. | AIRLINE PILOTS ≈ 95 % ARE MEN · FIREFIGHTERS (US) ≈ 95 % · NURSES WORLDWIDE ≈ 90 % ARE WOMEN · *The autopilot doesn't know.* · *The alarm rings. Nobody comes.* · *But the wards keep running.* |
| 6 | 31.7–36.6 | **Back:** the bow is much closer. The women take the children to the back of the car (a glance back). You walk up the car; the cab door slides open. | A tightening low pulse. | *A ship can't stop like a train.* |
| 7 | 36.6–41.4 | **The cab**, behind the empty driver's desk: the bow comes in through the windscreen and grows (fog thinned, slow push-in). | The pulse tightens, the diesel grows. | PIER IMPACT IN 00:xx · SHIP n m AWAY · 6.2 KNOTS · *Thirty thousand tonnes, heading for a pier.* |
| 8 | 41.4–44.15 | **Inside the ship's wheelhouse:** empty chairs, the wheel making the autopilot's small corrections, a radar display, the viaduct coming up ahead. | Diesel, a watch alarm. | *Autopilot on. Nobody at the helm.* |
| 9 | 44.15–46.4 | Back in the cab: the bow right beside the viaduct. | The pulse at its tightest, then it stops; the whole mix sinks for 0.6 s (a held breath). | countdown |
| 10 | 46.4–48.6 | **Signature C, outside:** low on the water by the pier, the bow slides in and hits it at 47.6; the column breaks apart. | Steel into concrete, a deep boom, the steel shriek. | — |
| 11 | 48.6–51.5 | **The cab:** dust rolls up ahead; the span's far end drops onto the bow, then the deck in front of you falls away into the water. | Second crunch; the splash. | — |
| 12 | 51.5–54.4 | High behind the train, stopped at the edge, the span lying from the bow into the water. | Rumble, water. | — |
| 13 | 54.4–58.4 | The cab: the rails end in the air. | Quiet: water, a far alarm on the ship. | TRAIN STOPPED 4 m SHORT OF THE FALLEN SPAN · *The train stopped itself. The ship couldn't.* |
| 14 | 58.4–67 | A slow rising crane shot over the train, the gap and the ship. Fade to black at 67. | A soft chord. | END LINE: *They were gone in an instant. / Some machines were built to notice. Most weren't.* · NOTE: sources · FIGURES ARE ESTIMATES. EVENTS COMPRESSED FOR THIS SIMULATION. NOT A PREDICTION. |

## 4. Hero shots

- 1.95 s: the half-empty car one frame after the vanish (cover candidate: the swinging strap where a man stood).
- 21.8 s: telephoto of the lit, empty wheelhouse.
- 46.8 s: the bow a metre from the pier, low on the water.
- 50.4 s: from the cab, the span ahead tilted down into the water with the ship beyond.

## 5. Escalation check

Vanish (1.8) → brake (4.6) → road / SUV crash (9.3–14.6) → ship (16.6) → telephoto (20.4) → montage cuts (24, 26.6,
29.15) → back, closer (31.7) → cab (36.6) → empty wheelhouse (41.4) → cab (44.15) → impact (47.6) → span lands (48.9) → near end into the water (~50.8)
→ aftermath (51.5–58.6) → line. Longest stretch without a new event: the closing crane 58.4–67, carried by the end line and the note.

## 6. Sound (films/men-disappear/audio.js)

Train rumble and rail joints follow the train's real speed; chatter with men's voices that stop on the vanish frame;
cup, paper, a ringing phone; the dead man's buzzer and the brake squeal; outside sounds through a low-pass (the glass)
that opens for the outside angles; the ship's diesel grows as the gap closes; montage beds; the impact (boom, crunch,
steel shriek, a long rumble), the span landing, the splash; quiet; a closing chord.

## 7. Systems / files

`script.js` (beats, train braking table, camera, hands, HUD) · `harbour.js` (MdHarbour: sky, water shader with the
ship's wake and the impact rings, the waterfront, far shores) · `bridge.js` (viaduct, the breaking pier, the falling
spans) · `ship.js` (the container ship, falling containers) · `train.js` (the three cars, the front car's interior and
cab) · `cast.js` (passengers, dropped objects) · `road.js` (cars, cruise control) · `montage.js` (cockpit, fire station,
ward) · `film.js` (camera carry, look list, outside angles, hands, effects, grade) · `audio.js`.

## 8. Review log

Scores as given by independent reviewers.

**Preview review (4 reviewers, 270×480 preview at 1 fps, before fixes):** retention 6, viewer 5.5, clarity on a phone 5,
cinematography 6, visual quality 6.5, physics / accuracy 8, differentiation ("what feels recycled") 5.

Recycled moments flagged: the road / car crash beat (9.3–16.6) and the MEANWHILE montage (24–31.7) echo earlier films; the
cab countdown and outside-drone collapse felt like the generic climax.

Fixed after that review: seafarer share corrected to 98.7 % of *merchant* seafarers; "Most cars" and "an older car" with
no auto-brake; "Thirty thousand tonnes" (a 180 m feeder ship); FIGURES ARE ESTIMATES in the note; end line rewritten so it
no longer contradicts the train stopping; the countdown cut to 4.8 s and broken by a new shot inside the empty
wheelhouse (the recycled reviewer's suggestion); the impact reframed low by the pier; a TRAIN STOPPED 4 m readout; a
closing crane shot; brake shot pushed in; telephoto fog thinned; spray reduced; mix trimmed to −16.7 LUFS.

Not changed (still weak): the road / SUV beat and the montage stay (replacing them was a rebuild of a third of the film);
"boys stay" is never shown; the sound has only been level-measured, never listened to.

**Final 1080×1920 audit (v1 final):** retention 6.5, viewer 6, clarity on a phone 6, cinematography 6, visual quality 6,
physics / accuracy 8. Top 3 fixed: a passenger standing up into the camera on the cut back at 31.70 s (her retreat now
starts during the montage); the countdown now shows the ship and the countdown is the main number; the pulse stops early
and the mix dips before the hit, so the impact lands ~11 dB above the moment before it (it was ~5 dB). Also a slow
push-in on the ship at 17–20 s. These fixes were not re-scored. See `EPISODE_REPORT.md`.
