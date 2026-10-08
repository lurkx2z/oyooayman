# What if air resistance suddenly disappeared? — production plan

A ~70-second vertical (9:16, 1080×1920, 30 fps) first-person physics film on the shared engine, in the Oxygen/Friction
format: a centred serif question over a normal, windy, sunny avenue; the rule changes under the title at 2.0 s; then a
new, different consequence every 5–8 s; an open loop planted early (a plane far overhead) that pays off as the biggest
event at the end. (Shot list as built in § 3; § 1 numbers match the code.)

Branch: `episode/no-air-resistance-y6gxpi` (the branch this session was assigned). Prefix `NR` / `Nr` / `nr`.

## 1. The rule (defined once, here)

| Item | This film |
|---|---|
| **Exact fictional rule** | From story 2.0 s, **solid objects feel zero aerodynamic force from relative motion through air**: drag = 0 and aerodynamic lift = 0, for every solid (paper, people, birds, wings, canopies, debris, cars, leaves, dust). |
| **Artificially preserved** | atmospheric pressure, breathable air, temperature, ordinary gas behaviour, **sound** (generation and propagation), buoyancy (it comes from static pressure, not from relative motion). |
| **Not covered by the rule** | liquids: water droplets (clouds, steam, spray, a water column) still move with the air. Stated in the plan, never on screen. This is what lets the film *show* that the air is still moving. |
| **Real consequences of the rule** (each one a beat) | the wind stops pushing things (flags fall limp, bent trees spring upright, flying paper and leaves drop); a sheet of paper falls exactly like a ball; a skydiver never reaches a top speed and an opened canopy can't inflate or slow him; a coasting car loses speed only to its tyres; anything thrown from a car keeps the car's speed; birds can't take off; a cruising airliner has no lift from the moment of the change and falls on a ballistic arc for 48 s; a 100 km/h wind moves nothing solid; a helium balloon (buoyancy kept, drag gone) accelerates upward at ~2 g; debris from the airliner's impact flies more than a kilometre and lands at hundreds of km/h. |
| **Artistic overrides** | sound kept (the brief); after the change the wind is still heard as a hollow rush of moving air, but nothing solid flaps, rustles or whooshes (falling things are heard only when they hit); the supersonic airliner's sonic boom and far rumble are heard; the plane's attitude stays nose-level (no aerodynamic moments, so nothing can pitch it); hero timings are scripted from the formulas, not simulated live. |
| **Misconceptions avoided** | "everything floats away" (no: gravity is unchanged); "cars go infinitely fast" (no: a coasting car still slows on its tyres); "the plane glides down" (no: with zero lift it is a thrown object); "the parachute pops open but doesn't work" (an unpressurised canopy can't inflate: it spills out and floats beside him). |
| **What we do not claim** | that this could happen; exact crash dynamics; what happens to weather, helicopters, fans, sails, jet engines (left open for comments). |

### Numbers used (computed in `physics.js`, checked by hand)

| Beat | Model | Numbers on screen |
|---|---|---|
| Paper vs ball | free fall from 1.33 m, no drag | both land in **0.52 s** (normal-air paper ghost: ~0.55 m/s, fluttering) |
| Skydiver | in freefall at 55 m/s (normal top speed ≈ 200 km/h) at 3,100 m when the rule changes; v = 55 + g·t | ≈ 570 km/h at 2,000 m (story 12.4) → canopy out at 1,250 m and **714 km/h** → 850 km/h at 430 m (cut) |
| Car | 1,500 kg, C_dA 0.65 m², rolling 0.012·g; throttle off at 90 km/h at story 12.4 (off screen) | passes you at **86 km/h** vs **80 km/h** in normal air (ghost 7.7 m behind); coasting from 90 km/h: **2.7 km** vs 1.7 km |
| Leaflets thrown from that car | keep the car's speed; fall from the window; slide on the road (μ 0.4) | keep pace with the car, then skid along the lane |
| Pigeons | wings make no lift; legs only (≈ 2 m/s jump, ~20 cm); the ledge pigeon falls 3.5 m in 0.84 s | LIFT 0 N |
| Airliner | 11,400 m, 240 m/s, level, zero lift from 2.0 s; y = H − ½gt²; flies up the line of the avenue towards you | supersonic from story ≈ 27 (sonic boom heard at 33.4); 6,190 m · 1,440 km/h (story 34.6) → 4,240 m · 1,600 km/h (40.2); impact at **story 50.21** in the river **2.1 km** away at ≈ 1,910 km/h, ~63° down |
| Balloon | 30 cm, helium; net buoyancy ÷ mass | **≈ 2 g up** (21 m/s²), ≈ 125 km/h after 1.6 s |
| Wind | air moving at 40, then 100 km/h | force on solids: 0 N; steam, clouds and the impact's spray still ride it |
| Impact sound | 2.1 km at 343 m/s | the boom arrives **6.1 s** after the flash (countdown on screen) |
| Impact debris | thrown from the impact point, no drag; aimed to land along the avenue 9.7–12 s later | horizontal 140–216 m/s, peak ≈ 115–150 m, arrives at **≈ 710 km/h** on average (584–795) |
| Sign board | knocked off 12 m up by a piece of debris; no drag | falls in **1.55 s**, hits at **55 km/h** (normal-air ghost board sails down at ~4 m/s) |

## 2. The place

The Air film's avenue (copied and owned here, not shared): a 14 m avenue with shops, a café terrace with umbrellas and
an awning, street trees, flags, a bus shelter, traffic. Sunny breezy afternoon (Friction/Air lighting family), wind
40 km/h at the start. You stand on the right-hand sidewalk. The avenue runs straight to a far skyline; beyond it (out of
sight) a river, where the plane comes down. A separate aerial scene (`FILM.view`) for the skydiver: sky, a city grid
1–3 km below.

## 3. Shot list (as built; film seconds, story in brackets where they differ)

The edit (`CONFIG.edit`): story 10.9–12.4 is cut (straight from the drop to the sky), and story 48.35–49.35 (the
plunge) plays at 0.25×. Story 68.0 → film **69.5 s**.

| Film s | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|
| 0–2.0 | **Hook.** The windy avenue: a big flag on a kerb pole flying, trees leaning, the awning rippling, litter streaming, umbrellas shaking | the breeze through what it moves (flag cracks, leaves, awning, litter), city, café, curious plucks | TITLE (frame 1 → 3.4) · AERODYNAMIC FORCE 100 % |
| 2.0–5 | 0 %: the flag drops limp mid-flap, litter drops, trees spring upright and ring down; steam and clouds keep moving | all of the flapping stops dead (a low hit); only the hollow rush of the air remains; the shop sign keeps creaking | 0 % · ON EVERY SOLID OBJECT · WIND 40 KM/H · *The wind didn't stop.* |
| 5–10.9 | **Paper vs ball** in your hands; released 7.6, land together 8.12; a dashed NORMAL AIR ghost sheet flutters | one slap+thud, the ball bounces on | BOTH LAND IN 0.52 S · *Nothing would be slowed by the air.* |
| 10.9–18.9 (12.4–20.4) | **Parachute.** MEANWHILE, 2 KM ABOVE THE CITY: the skydiver; speed climbs; he pulls at 15.1 (16.6): the canopy spills out and floats crumpled; the airliner far above at the start; cut before the ground | near silence (no wind on him), altimeter beeps, a velcro rip and rustle, no inflation crack | speed · altitude · DRAG 0 N · *His speed just keeps climbing.* · *The parachute opens…* / *…and changes nothing.* |
| 18.9–26.4 (20.4–27.9) | **Car.** Looking back: the red car coasts past at 86 km/h; the NORMAL AIR ghost car behind; leaflets out of the window keep pace; telephoto follow | tyres and idle only, the leaflets' riffle | COASTING · km/h vs NORMAL AIR · km/h · *Anything thrown keeps up with it.* · *And a car would coast much further.* · 2.7 KM vs 1.7 KM |
| 26.9–31.9 (28.4–33.4) | **Birds.** Pigeons startled: they flap, hop, can't lift; one steps off a ledge and drops | wing claps, a thump, an indignant coo | *Birds couldn't get off the ground.* · LIFT 0 N |
| 31.9–38.7 (33.4–40.2) | **The plane.** A sonic boom; you look up; crash zoom to an extreme telephoto: the airliner, nose level, falling, dotted trail of its arc | a double sonic boom, a growing far rumble, a tension drone | LIFT 0 N · altitude · km/h · FALLING SINCE THE AIR LET GO · *Its wings stopped lifting it…* / *…when the air let go.* |
| 38.7–43.1 (40.2–44.6) | **Wind does nothing.** 100 km/h: clouds race, steam streams sideways; the flag hangs, trees still, people unbothered | the air's roar swells; nothing rattles | WIND 100 KM/H · *The air still moves.* · *It just can't push anything.* |
| 43.1–45 (44.6–46.5) | A child's balloon slips and shoots straight up | a string squeak, the child's "oh!" | BUOYANCY, NO DRAG · km/h |
| 45–51.7 (46.5–50.2) | **The plunge.** You turn: the airliner comes down at the end of the avenue (slow motion 46.9–50.9) and drops out of sight | the rumble, two octaves down in the slow motion; the pulse | LIFT 0 N · 1,850 KM/H |
| 51.7–57.8 (50.2–56.3) | A flash; a white spray column over the far blocks | music cuts out; the far rumble still coming; a heartbeat, a tick a second | IMPACT · 2.1 KM AWAY · ITS SOUND ARRIVES IN 5…1 S |
| 57.8–63.9 (56.3–62.4) | **Falling danger.** The boom; you run; debris lands along the avenue; a piece hits the building above where you stood and knocks off a sign board: it drops in 1.55 s and slams down where you were | the boom, car alarms, breath and steps, the hits (each delayed by distance), the board's slam, a ringing ear | *Nothing slows it down.* · THROWN 2.1 KM · ARRIVING AT ≈ 710 KM/H · SIGN BOARD · NO DRAG · 55 KM/H vs NORMAL AIR |
| 63.9–69.3 (62.4–67.8) | You look up: clouds racing; a few last pieces pass silently overhead | the air's rush (held back), far alarms, one held chord | AIR RESISTANCE 0 % · *The air would still be there.* / *It just couldn't catch you.* · note: Fictional physics · sound and breathing kept for this simulation |
| 69.3–69.5 | black | true silence | — |

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
Air film and owned here; a wider gap in the far skyline down the avenue) · `wind.js` (flags, awning, umbrellas, blade sign,
bins, litter, steam) · `actors.js` (people, pigeons, traffic and the coasting car with its ghost, leaflets, the balloon) ·
`sky.js` (the airliner, its impact, the debris, the sign board, the aerial skydiver scene) · `audio.js` · `film.js`
(props, hands, HUD tags, grade). Engine: unchanged.

## 8. Review log
(filled in after each review round)
