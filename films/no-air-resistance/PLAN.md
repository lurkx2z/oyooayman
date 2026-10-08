# What if air resistance suddenly disappeared? — production plan

A ~70-second vertical (9:16, 1080×1920, 30 fps) first-person physics film on the shared engine, in the Oxygen/Friction
format: a centred serif question over a normal, windy, sunny avenue; the rule changes under the title at 2.0 s; then a
new, different consequence every 5–8 s; an open loop planted early (a plane far overhead) that pays off as the biggest
event at the end.

Branch: `episode/no-air-resistance-y6gxpi` (the branch this session was assigned). Prefix `NR` / `Nr` / `nr`.

## 1. The rule (defined once, here)

| Item | This film |
|---|---|
| **Exact fictional rule** | From story 2.0 s, **solid objects feel zero aerodynamic force from relative motion through air**: drag = 0 and aerodynamic lift = 0, for every solid (paper, people, birds, wings, canopies, debris, cars, leaves, dust). |
| **Artificially preserved** | atmospheric pressure, breathable air, temperature, ordinary gas behaviour, **sound** (generation and propagation), buoyancy (it comes from static pressure, not from relative motion). |
| **Not covered by the rule** | liquids: water droplets (clouds, steam, spray, a water column) still move with the air. Stated in the plan, never on screen. This is what lets the film *show* that the air is still moving. |
| **Real consequences of the rule** (each one a beat) | the wind stops pushing things (flags fall limp, bent trees spring upright, flying paper and leaves drop); a sheet of paper falls exactly like a ball; a skydiver never reaches a top speed and an opened canopy can't inflate or slow him; a coasting car loses speed only to its tyres; anything thrown from a car keeps the car's speed; birds can't take off; a cruising airliner has no lift from the moment of the change and falls on a ballistic arc for 48 s; a 100 km/h wind moves nothing solid; a helium balloon (buoyancy kept, drag gone) accelerates upward at ~2 g; debris from the airliner's impact flies more than a kilometre and lands at hundreds of km/h. |
| **Artistic overrides** | sound kept (the brief); the plane's engine roar is kept as sound; the plane's attitude stays nose-level (no aerodynamic moments, so nothing can pitch it); hero timings are scripted from the formulas, not simulated live. |
| **Misconceptions avoided** | "everything floats away" (no: gravity is unchanged); "cars go infinitely fast" (no: a coasting car still slows on its tyres); "the plane glides down" (no: with zero lift it is a thrown object); "the parachute pops open but doesn't work" (an unpressurised canopy can't inflate: it spills out and floats beside him). |
| **What we do not claim** | that this could happen; exact crash dynamics; what happens to weather, helicopters, fans, sails, jet engines (left open for comments). |

### Numbers used (computed in `physics.js`, checked by hand)

| Beat | Model | Numbers on screen |
|---|---|---|
| Paper vs ball | free fall from 1.3 m, no drag | both land in **0.52 s** (normal-air paper ghost: ~2.4 s, fluttering) |
| Skydiver | in freefall at 55 m/s (normal top speed ≈ 200 km/h) at 3,100 m when the rule changes; v = 55 + g·t | 569 km/h at story 12.5 → canopy out at 1,250 m and **714 km/h** → 850 km/h at 400 m (cut) |
| Car | 1,500 kg, C_dA 0.65 m², rolling 0.012; coasting from 90 km/h for 10 s | **83 km/h** now vs **77 km/h** in normal air (≈ 8 m behind) |
| Paper cup thrown from that car | keeps the car's speed; falls 1.1 m in 0.47 s, skids on the road (μ ≈ 0.5) | skids for ~60 m (normal air: whipped back in a second) |
| Airliner | 11,400 m, 240 m/s, level, zero lift from 2.0 s; y = H − ½gt² | 6,377 m at story 34 · 1,423 km/h; impact at **story 50.2** at ≈ 1,900 km/h, 11.6 km downrange |
| Balloon | 30 cm, helium; net buoyancy ÷ mass | **≈ 2 g up**, ~60 m/s after 3 s |
| Wind | air moving at 100 km/h | force on solids: 0 N; steam and clouds race past |
| Impact debris | impact 1.25 km away, beyond the river; launch 12–25°, no drag | lands 7–11 s later at **450–630 km/h**; the boom arrives after 3.6 s |

## 2. The place

The Air film's avenue (copied and owned here, not shared): a 14 m avenue with shops, a café terrace with umbrellas and
an awning, street trees, flags, a bus shelter, traffic. Sunny breezy afternoon (Friction/Air lighting family), wind
40 km/h at the start. You stand on the right-hand sidewalk. The avenue runs straight to a far skyline; beyond it (out of
sight) a river, where the plane comes down. A separate aerial scene (`FILM.view`) for the skydiver: sky, a city grid
1–3 km below.

## 3. Shot list (story seconds; film = story except a 0.25× slow motion on the plunge)

| Time | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|
| 0–2.0 | **Hook.** The windy avenue: flags flapping, trees leaning, the awning rippling, paper and leaves streaming past, umbrellas shaking | wind, city, flags snapping | TITLE (frame 1 → 3.4): WHAT IF AIR RESISTANCE / SUDDENLY DISAPPEARED? · AERODYNAMIC FORCE 100 % |
| 2.0–5 | The readout falls to 0 %. The flag drops limp mid-flap; paper and leaves in mid-air drop like stones; the bent trees spring upright and keep swaying; the clouds keep racing | the wind keeps howling; the flapping stops dead | AERODYNAMIC FORCE 0 % · WIND 40 KM/H · *The wind didn't stop.* |
| 5–12.5 | **Paper vs ball.** Your hands: a sheet of paper and a tennis ball, released together; they hit the pavement in the same instant. A dashed ghost sheet flutters down slowly beside them | two taps at once | *Nothing would be slowed by the air.* |
| 12.5–20.5 | **Parachute** (cut to the sky above the city). A skydiver in freefall, the camera falling with him; the speed keeps climbing past his normal top speed; he pulls: the canopy spills out and just floats beside him, slack lines; the city rushes up; cut before the ground. A tiny airliner far overhead (the plant) | rushing air (kept), the pull, the canopy's rustle | SPEED (live) · NORMAL TOP SPEED ≈ 200 KM/H · DRAG 0 N · *The parachute opens…* / *…and changes nothing.* |
| 20.5–28.5 | **Vehicles.** A red car passes at 90 km/h and coasts (no brake lights); its normal-air ghost falls behind. A passenger flicks a paper cup out: it keeps pace, hits the road and skids on for 60 m | engine off, tyre roll; the cup's skitter | car tag (live km/h · NORMAL AIR km/h) · *A car would coast much further.* / *Anything thrown would keep up with it.* |
| 28.5–33.5 | **Birds.** Pigeons on the pavement, startled: they flap hard, hop, fall back; one steps off a ledge and drops straight down | wing claps, scrabbling | *Birds couldn't get off the ground.* |
| 33.5–41 | **The plane** (mid-film reset, scale jump). A roar overhead: you look up; long lens: the airliner from frame 12, nose level, falling steeply | a jet roar growing | tag: LIFT 0 N · altitude ↓ · km/h · *It had been falling for 32 seconds.* |
| 41–48 | **Wind becomes useless.** The wind rises to 100 km/h: steam from a vent streaks sideways, clouds race — the flag, the trees and the people don't react. A child's balloon slips its string and rockets straight up | a howling gale over a dead-still street | WIND 100 KM/H · *The air still moves. It just can't push.* |
| 48–50.2 (0.25×) | **The plunge.** The roar again: the plane comes down beyond the end of the avenue at ~1,900 km/h, in slow motion | the roar stretched, then a gap | — |
| 50.2–53.8 | A white flash behind the skyline; a huge water column rises; no smoke | silence… then the boom at 53.8, windows rattle, alarms | — |
| 53.8–61 | **Falling danger.** Dark specks arc up over the skyline and come down: debris thrown more than a kilometre. You turn and run; pieces slam into the road, a car, the bus shelter; a big panel lands where you stood | your breath, steps, impacts all around | tag: DEBRIS · NO AIR TO SLOW IT · ~500 KM/H |
| 61–67 | Aftermath: you look up; the clouds still racing in the wind; nothing else moving | the wind, a car alarm, then quiet | AIR RESISTANCE 0 % · *The air would still be there.* / *It just couldn't catch you.* · small: FICTIONAL PHYSICS · SOUND AND BREATHING KEPT FOR THIS SIMULATION |

## 4. Hero shots
Paper and ball hitting together (cover candidate: the flag hanging dead in a 40 km/h wind under the title) · the canopy
floating uselessly · pigeons that can't lift off · the airliner nose-level in a steep fall · steam streaking past a
limp flag · the balloon rocketing up · the water column over the skyline · debris raining in.

## 5. Escalation check
Wind → objects → a person in the sky → vehicles → animals → aircraft (reset) → the weather itself → the payoff that ties
back to frame 12. Each beat is a different mechanism (drag on light things, terminal velocity, rolling vs air
resistance, lift, wind load, buoyancy, ballistic range).

## 6. Comment questions left open
Helicopters? Bullets? Skydiving suits? Weather? Fans? Could cars go faster? Sailing boats? Jet engines?

## 7. Systems / files
`script.js` (beats, camera, hands, HUD) · `physics.js` (the formulas and tables) · `city.js` (the avenue, copied from the
Air film and owned here) · `wind.js` (flags, trees, awning, umbrellas, leaves/paper, steam, clouds) · `actors.js`
(people, pigeons, traffic, the coasting car, the cup, the balloon child) · `sky.js` (the airliner, the aerial skydiver
scene, the impact) · `audio.js` · `film.js`. Engine: unchanged.

## 8. Review log
(filled in after each review round)
