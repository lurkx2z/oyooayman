# What if air resistance suddenly disappeared? — production plan

A 63-second vertical (9:16, 1080×1920, 30 fps) first-person physics film on the shared engine, in the Oxygen/Friction
format: a centred serif question over a normal, windy, sunny avenue; the rule changes under the title at 2.0 s; then a
new, different consequence every 5–8 s; an open loop planted early (a plane far overhead) that pays off as the biggest
event at the end. (Shot list as built in § 3; § 1 numbers match the code.)

Branch: `episode/no-air-resistance-y6gxpi` (the branch this session was assigned). Prefix `NR` / `Nr` / `nr`.

## 1. The rule (defined once, here)

| Item | This film |
|---|---|
| **Exact fictional rule** | From story 2.0 s, **solid objects feel zero aerodynamic force from relative motion through air**: drag = 0 and aerodynamic lift = 0, for every solid (paper, people, birds, wings, canopies, debris, cars, leaves, dust). |
| **Artificially preserved** | atmospheric pressure, breathable air, temperature, ordinary gas behaviour, **sound** (generation and propagation), buoyancy (it comes from static pressure, not from relative motion). |
| **Not covered by the rule** | liquids: water droplets (clouds, steam, spray) still move with the air. Stated on screen once in the storm (STEAM IS WATER · STILL BLOWN) and in the closing note. This is what lets the film *show* that the air is still moving. |
| **Real consequences of the rule** (each one a beat) | the wind stops pushing things (flags fall limp, bent trees spring upright, flying paper and leaves drop, pigeons in flight fall out of the air); a sheet of paper falls exactly like a ball; a skydiver never reaches a top speed and an opened canopy can't inflate or slow him; a coasting car loses speed only to its tyres; anything thrown from a car keeps the car's speed; birds can't take off; a cruising airliner has no lift from the moment of the change and falls on a ballistic arc for 48 s; a 100 km/h wind moves nothing solid; a helium balloon (buoyancy kept, drag gone) accelerates upward at ~2 g; debris from the airliner's impact flies more than a kilometre and lands at hundreds of km/h. |
| **Artistic overrides** | sound kept (the brief). Followed through, the rule also means solids push no air: so after the change nothing solid flaps, rustles or whooshes, the wind leaves only a faint hiss and the 100 km/h storm is silent, and the airliner falls **without a sound** (supersonic from story ≈ 20.5, but it pushes no air aside: no roar, no sonic boom). A bystander's "Look… up there!" is what makes you look up. Mix choices: the street is held back between the flash and the boom (the countdown and your heartbeat stay clear). The plane's attitude stays nose-level (no aerodynamic moments, so nothing can pitch it); hero timings are scripted from the formulas, not simulated live. |
| **Misconceptions avoided** | "everything floats away" (no: gravity is unchanged); "cars go infinitely fast" (no: a coasting car still slows on its tyres); "the plane glides down" (no: with zero lift it is a thrown object); "the parachute pops open but doesn't work" (an unpressurised canopy can't inflate: it spills out and floats beside him). |
| **What we do not claim** | that this could happen; exact crash dynamics; what happens to weather, helicopters, fans, sails, jet engines (left open for comments). |

### Numbers used (computed in `physics.js`, checked by hand)

| Beat | Model | Numbers on screen |
|---|---|---|
| Paper vs ball | free fall from 1.33 m, no drag | both land in **0.52 s** (normal-air paper ghost: ~0.55 m/s, fluttering) |
| Skydiver | in freefall at 55 m/s (normal top speed ≈ 200 km/h) at 3,100 m when the rule changes; v = 55 + g·t | ≈ 570 km/h at 2,000 m (story 12.4) → canopy out at 1,250 m and **714 km/h** → 850 km/h at 430 m (cut) |
| Car | 1,500 kg, C_dA 0.65 m², rolling 0.012·g; throttle off at 90 km/h at story 12.4 (off screen) | passes you at **86 km/h** vs **80 km/h** in normal air (ghost 8.0 m behind); coasting from 90 km/h: **2.7 km** vs 1.7 km |
| Leaflets thrown from that car | keep the car's speed; fall from the window; slide on the road (μ 0.4) | keep pace with the car, then skid along the lane |
| Pigeons in flight (hook) | at 3.2–3.9 m/s, 5.0–6.2 m up when the air lets go; no lift, wings can't push: they keep their speed and fall ½gt² (≈ 1.0 s), skid (μ 0.9), lie stunned, get up | — |
| Pigeons on the pavement | wings make no lift; legs only (≈ 2 m/s jump, ~20 cm); the ledge pigeon falls 3.5 m in 0.84 s | LIFT 0 N |
| Airliner | 11,400 m, 240 m/s, level, zero lift from 2.0 s; y = H − ½gt²; flies up the line of the avenue towards you | supersonic from story ≈ 20.5 (speed of sound ≈ 300 m/s up there), heard never (it pushes no air); found by eye at story 33.6 (≈ 6,500 m · 1,410 km/h) and followed on a telephoto to story 38.2 (≈ 5,000 m · 1,540 km/h), with a side-view inset of its arc; impact at **story 50.21** in the river **2.1 km** away at ≈ 1,910 km/h, ~63° down |
| Balloon | 30 cm, helium; net buoyancy ÷ mass | **≈ 2 g up** (21 m/s²), ≈ 125 km/h after 1.6 s |
| Wind | air moving at 40, then 100 km/h | force on solids: 0 N; steam, clouds and the impact's spray still ride it |
| Impact sound | 2.1 km at 343 m/s | the boom arrives **6.1 s** after the flash (countdown on screen) |
| Impact debris | thrown from the impact point, no drag; aimed to land along the avenue 9.7–12 s later | horizontal 140–216 m/s, peak ≈ 115–150 m, arrives at **≈ 710 km/h** on average (584–795) |
| Sign board | knocked off 12.4 m up by a piece of debris; no drag | falls in **1.61 s**, hits at **≈ 55 km/h** where you stood |

## 2. The place

The Air film's avenue (copied and owned here, not shared): a 14 m avenue with shops, a café terrace with umbrellas and
an awning, street trees, flags, a bus shelter, traffic. Sunny breezy afternoon (Friction/Air lighting family), wind
40 km/h at the start. You stand on the right-hand sidewalk. The avenue runs straight to a far skyline; beyond it (out of
sight) a river, where the plane comes down. A separate aerial scene (`FILM.view`) for the skydiver: sky, a city grid
1–3 km below.

## 3. Shot list (as built; film seconds, story in brackets where they differ)

The edit (`CONFIG.edit`): the paper drop plays at 0.4× (story 6.85–7.45); story 9.3–12.4 is cut (straight from the drop
to the sky); story 25.4–28.2 (the car rolling away) and 42.6–43.8 (the end of the storm) are cut; story 48.6–49.0 (the
plunge) plays at 0.25×. Story 68.0 → film **63.0 s**.

| Film s | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|
| 0–2.0 | **Hook.** The windy avenue: a big flag above the title flying, trees leaning, awning, litter, umbrellas; five pigeons flying up the street towards you | the breeze through what it moves (flag cracks, leaves, awning, litter), wingbeats, city, café, curious plucks | TITLE (frame 1 → 3.4) · AERODYNAMIC FORCE 100 % |
| 2.0–5.5 | 0 %: the flag drops limp mid-flap, the pigeons fall out of the air and skid on the pavement, litter drops, trees spring upright; steam from a grate keeps streaming | everything that flapped stops dead (a low hit); frantic wings, five thumps; only a faint hiss of air is left | 0 % · ON EVERY SOLID OBJECT · WIND 40 KM/H · *The wind still blows…* / *…it just can't push anything.* |
| 5.5–10.2 (5.5–9.3) | **Paper vs ball** in your hands; released 7.0, land together 8.3 (in 0.4× slow motion); a NORMAL AIR ghost sheet flutters | one slap+thud, the ball bounces on | BOTH LAND IN 0.52 S · *Nothing would be slowed by the air.* |
| 10.2–18.2 (12.4–20.4) | **Parachute.** MEANWHILE, 2 KM ABOVE THE CITY: the skydiver; speed climbs; he pulls at 14.4 (16.6): the bag and pilot chute spill out on slack lines; a NORMAL AIR ghost canopy opens and falls away above him | near silence, altimeter beeps, a velcro rip and rustle, no inflation crack | speed · altitude · DRAG 0 N · *His speed just keeps climbing.* · *He pulls the parachute…* / *…but it can't even open.* |
| 18.2–23.2 (20.4–25.4) | **Car.** The red car coasts past at 86 km/h, the NORMAL AIR ghost car behind; leaflets thrown out of the window keep pace | tyres and idle only, the leaflets' riffle | COASTING 85 KM/H vs NORMAL AIR 79 KM/H · *Thrown things keep their speed…* / *…and cars coast much further.* · ROLLS 2.7 KM · NORMAL AIR 1.7 KM |
| 23.2–27.4 (28.2–32.4) | **Birds.** Pigeons startled: they flap, hop, can't lift; one steps off a ledge and drops 3.5 m | wing claps, a thump, an indignant coo | *Birds couldn't get off the ground.* · LIFT 0 N |
| 27.4–33.2 (32.4–38.2) | **The plane.** A man turns and points up; you look: crash zoom to an extreme telephoto: the airliner, nose level, falling in silence; side-view inset of its arc | "Look… up there!", a low hit, a tension drone (the plane makes no sound) | LIFT 0 N · altitude · km/h · SIDE VIEW · *Its wings stopped lifting it…* / *…the moment the air let go.* |
| 33.2–37.6 (38.2–42.6) | **Wind does nothing.** WIND 40 → 100 KM/H: the steam streams flat, clouds race; the flag hangs, trees still, people unbothered | near silence: the faint hiss, the drone, no pulse | WIND 100 KM/H · STEAM IS WATER · STILL BLOWN · *Storm-force wind…* / *…and nothing moves.* |
| 37.6–41.7 (43.8–47.9) | A child's balloon slips and shoots straight up | a string squeak, the child's "oh!" | BUOYANCY, NO DRAG · km/h · *Floating still works…* / *…nothing holds it back.* |
| 41.7–45.2 (47.9–50.2) | **The plunge.** Telephoto down the avenue: the airliner sinks through the frame behind the skyline (slow motion ×¼, 42.4–44.0) | the pulse doubling, a riser, two octaves down in the slow motion | LIFT 0 N · km/h · SLOW MOTION ×¼ |
| 45.2–51.3 (50.2–56.3) | A flash, a fireball, a dark column over the far blocks; pull back to the street, push in | the music cuts; the street held back; a heartbeat, a tick a second | IMPACT · 2.1 KM AWAY · ITS SOUND ARRIVES IN 5…1 S |
| 51.3–57.2 (56.3–62.2) | **Falling danger.** The boom; you run; debris lands along the avenue; a piece knocks a sign board off the building above where you stood: it drops in 1.61 s and slams down there, beside the paper and ball | the boom, car alarms, breath and steps, the hits (each delayed by distance), the board's slam, a ringing ear | *Everything it threw is still flying…* / *…and nothing slows it down.* · THROWN 2.1 KM · ≈ 710 KM/H · SIGN BOARD · NO DRAG · 55 KM/H |
| 57.2–62.8 (62.2–67.8) | You look back at the limp flag and the streaming steam (the opening shot again) | faint hiss, far alarms, one held chord | AIR RESISTANCE 0 % · *The air would still be there.* / *It just couldn't catch you.* · note: Fictional physics: only solids lose air resistance (water droplets still ride the wind) · sound and breathing kept |
| 62.8–63.0 | black | true silence | — |

## 4. Hero shots
Paper and ball hitting together (cover candidate: the flag hanging dead in a 40 km/h wind under the title) · the canopy
floating uselessly · pigeons that can't lift off · the airliner nose-level in a steep fall · steam streaking past a
limp flag · the balloon rocketing up · the impact column over the skyline · debris raining in.

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

**Round 1** (69.5 s preview at 270×480, four independent reviewers; scores as given):
- Retention 4.5/10 (hook 5, middle 4, clarity 5, escalation 4, payoff 4). Main notes: the limp flag was a sliver at the
  edge under the title; the middle sagged (car, pigeons); the airliner climax read as a distant speck and then a cloud;
  the last 5 s were a static sky.
- Normal viewer 5/10 (hook 5, understanding 6, wow 5, ending 4, rewatch/share 3).
- Visual 5.5/10 (image 6.5, composition 5.5, camera 6, phone readability 5, hero visuals 4.5). Notes: pure-black
  objects, heavy haze over the plunge, blob clouds in the sky dive, small text.
- Physics 6.5/10 (consequences 7, numbers 9, consistency with the rule 5, misconceptions 7). Numbers recomputed and
  right; main flag: a plane that pushes no air cannot make a sonic boom or roar, and a wind that can't touch solids
  shouldn't roar either; liquids exemption should be said on screen.

**Fixes after round 1:** re-cut to 63 s (car roll-away and storm tail cut, paper drop in 0.4× slow motion); pigeons
fall out of the air in the hook; flag moved above the title; a bystander points up and the plane falls silently (sonic
boom and rumble removed, near-silent wind, silent storm); telephoto hold on the plane with a side-view inset;
the plunge framed tighter with a SLOW MOTION ×¼ label; flash, fireball and a dark column that reads on the pale sky;
a big countdown; street ducked until the boom; NORMAL AIR ghost canopy; HUD tags kept inside the safe area; the end
looks back at the limp flag and steam (loops to the opening) with the paper and ball beside the board; liquids
exemption on screen.
