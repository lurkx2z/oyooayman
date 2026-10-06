# What if friction disappeared for 60 seconds? — production plan

A 75.5-second vertical (9:16, rendered 540×960, 30 fps) first-person film on the shared engine. 70 % POV what-if, 30 %
spectacle: polished low-poly city, serif captions, a minimal top-left HUD. Friction drains from 1.0 to 0.0 under the
title and is gone at **1.5 s**; it comes back at **61.5 s** — exactly 60 seconds — and the return is the biggest payoff
(in 3× slow motion, 61.6–64.6 s).

## 1. Physics rules (deterministic, `films/friction/slide.js`)

Only **solid-on-solid friction** disappears (static and kinetic, μ → 0 between solid surfaces). Air resistance, liquids,
structure, gravity, electricity and biology stay normal.

| Rule | In the film |
|---|---|
| Nothing moves without a force. A still object on level ground stays still. | People standing still stay standing; the parked bench, the bins on the flat, the stopped cars all stay put. |
| Things that were moving keep their velocity (only air drag slows them, ½ρC<sub>d</sub>A v²). | Walkers glide on at walking speed after they fall; cars keep sliding at the speed they had at 1.5 s. |
| Slopes push things downhill with F = m·g·sin θ (7° → 1.2 m/s²). Drag caps light, boxy things (a bin tops out near 8 m/s, a car doesn't). | Parked cars on the hill are held by the car in front and the bollards at the bottom; tethered carts, bins, bikes and pipes by their chains and rails — until the truck's hit at 29.4 s sets the whole hill sliding. |
| Tyres can't push, brake or steer: wheels spin freely; brake pads can't grip the discs either, so a braked wheel keeps turning; steering turns the wheels, not the car. | The electric car beside you floors it: its wheels blur (spoke decals and a blur disc) while it stays put; the red sedan slides at you with brake lights on and wheels still turning; the steering SUV goes straight. |
| A car coasting up a slope slows at 1.2 m/s², stops, and slides back down. | The box truck climbing the hill at 17 m/s stops near the top at ~15 s and comes back down backwards. |
| Only normal forces hold anything: hooks, chains, kerbs, rails, closed doors, wrapped arms. | You hit a sign pole chest-first and wrap both arms round it, a foot jammed against the kerb face; bins chained, carts in a corral, cargo behind the truck's closed door. |
| Collisions still happen (impulse-based, restitution 0.1–0.3, impulses clamped). | Cars bump, spin and carry on together; things knocked loose start sliding. |
| Sliding is almost **silent** (scraping *is* friction). Only impacts, engines, horns, voices and air make sound. | The sound design: an eerie, quiet glide; then the return is a wall of screech, scrape and thud. |
| Friction returns (μ → 0.8 over 0.1 s): moving things stop hard. Tyres sliding along their heading skid to a stop (~7 m/s²) with smoke; a car sliding sideways faster than ~2.8 m/s (truck 2.2) trips and rolls whole quarter turns; slower sideways slides lurch up onto two wheels; anything tall and sliding tips over and tumbles. | The payoff at 61.5 s: the spinning car barrel-rolls, two more cars far down the avenue roll, the truck across from you lurches onto two wheels, carts and people tumble. You were sliding at 0.7 m/s — you jolt to a stop. |

Everything is precomputed once at load (240 Hz) and sampled by time, so the film stays a pure function of time
(scrubbing, rendering and playback agree frame for frame). Hero moments are tuned by initial conditions (positions,
speeds, driver inputs) plus scripted impulses (the truck's hit, the knock that frees you), not by hand-animation.

## 2. World

One avenue (14 m, two lanes each way, kerbs 0.15 m) and a cross street at z = −30 (z −37…−23). **Beyond the intersection
the avenue climbs a 7° hill** (from z −44, smoothed over 12 m, 280 m long) — visible behind the intersection from the
first frame. On the hill both kerb lanes are parking (P1–P7 facing uphill on the right, Q1–Q5 downhill on the left), the
right lane ending at a bollard bar at z −48.45. Shops and stepped rowhouses line both sides; a bus shelter, a bench, bins,
trees, lamp posts, signal masts; a shopping-cart corral, a bike rack and a pipe rack on the hill sidewalk.

You walk down the right-hand sidewalk toward the junction, slip at 1.5 s, glide into a NO PARKING sign pole at
(7.38, −16.4) and hold on beside the teal electric car K, parked at the kerb.

## 3. Shot list (as built)

| # | Time | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|---|
| **1** | **0–3.6** | **Hook.** Walking toward the junction, phone (map) in your left hand, the hill rising behind. Friction drains under the title; at 1.5 your right foot shoots forward, the phone squirts away, people ahead fall and keep gliding. You slide on, arms out, and hit the sign pole chest-first at 3.56. | City air, steps; a skid at 1.05; at 1.5 the slip, a gasp — then no more scuffs or steps, just voices, horns, air. The pole rings. | **TITLE (centred, 0.1–3.25):** WHAT IF FRICTION / DISAPPEARED / FOR 60 SECONDS? · SURFACE FRICTION 1.0 → 0.6 → 0.2 → 0.0 · BACK IN 0:60 |
| **2** | **3.6–7.5** | **Walking is impossible.** Arms round the pole, foot against the kerb. You try a step: the foot slides away, your hands slip down the pole. At the corner a man holding a signal mast does the splits. | Strained breath, a grunt, a soft ring as your hands stop; "no no no". | *You couldn't even take a normal step.* |
| **3** | **7.6–9.7** | **Wheels spin, the car doesn't.** The electric car beside you floors it: front wheel a blur, car not moving. | An EV motor whining up, no tyre noise at all. | TIRE GRIP 0 % · WHEELS n km/h · CAR 0 km/h |
| **4** | **9.8–16.4** | **No brakes, no steering.** Horn: the red sedan coming at you, brakes on, 30+ km/h. The taxi clips the steering SUV in the junction and the sedan slams in (11.96 / 12.27). The SUV slides past you, still turning nothing, and snaps a lamp post (14.95). | Horn, crunch, glass; the lamp post's crack, the long fall, the clang. | RED CAR · BRAKES ON · km/h · *Brakes and steering depend on friction too.* · *Things only stop when they hit something.* |
| **5** | **16.6–22.5** | **The hill.** A long squint up the hill: the box truck has stopped near the top… and starts sliding back. The EV still spinning its wheels; a coasting car glides past and hits the taxi. | Distant horns, alarms; the EV whine. | *Up the hill, the truck had stopped…* / *…and started sliding back.* / *The wheels spin. The car doesn't move.* |
| **6** | **22.7–29.5** | **Even a small hill.** The truck, backwards, gaining speed, telephoto narrowing as it comes. | The rumble growing. | *Even a small hill becomes dangerous.* · SLOPE 7° · DOWNHILL PULL 1.2 m/s² |
| **7** | **29.4–34** | **Everything comes loose.** The truck smashes the parked cars at the foot of the hill; the bollards give way (29.6); its roll-up door bursts and the cargo slides out; carts, bins, bikes, pipes and cars start down. A spinning car slides straight at you and clips the car beside you (33.75). | A boom, metal, glass, then the whole street sliding. | SURFACE FRICTION 0.0 |
| **8** | **34–42.5** | **Now you're part of it.** The truck reaches the junction, smashes through two cars (36.6) and comes out spinning — at you. The car beside you nudges you and your grip slides (35.7); a runaway cart rings off your pole (39.27); the truck hits the car beside you (39.53) and its nose knocks you off the pole (39.67). You sit down hard and slide backwards across the sidewalk into a shopfront (42.03), then along it. | Your shout, the thud, a pane wobbling. A warning yell. | FRICTION RETURNS IN 00:24 (from 37.5) · *Now you're part of it.* |
| **9** | **46.5–54.5** | **Meanwhile.** Conveyor belt running under groceries that don't move · a cyclist sliding, falling and sliding on · a crane's hoist brake slipping, the load dropping · glasses sliding off a tilted tray · an ambulance sliding sideways through a junction, lights on. | Each its own bite; the world bus drops away. | MEANWHILE / CONVEYOR BELTS · BIKES · CRANE BRAKES · GRIP · AMBULANCES |
| **10** | **54.5–58.4** | **Realisation.** Back with you, sitting against the shopfront, still drifting; across the street the truck still slides. A tracking shot with the spinning car still flying down the avenue. | The world low-passes and narrows; a rising tone; the clock. | *And then you realize…* → *…it's coming back.* |
| **11** | **58.5–61.5** | **3 · 2 · 1.** Big numbers, the frame tunnelling in, heartbeat vignette. | Heartbeat, booms, a held breath. | 3 · 2 · 1 |
| **12** | **61.5–64.6** | **Friction returns** (flash, then 3× slow motion). Drone: the truck across from you trips onto two wheels; the spinning car caught sideways barrel-rolls end over end with smoke and sparks. | One hit: boom, a screech chord pitched down, landings, glass, ringing. | FRICTION 100 % · EVERYTHING GRIPS AT ONCE |
| **13** | **64.6–75.5** | **Aftermath.** Back in your eyes, the street settling. You stand (67.6–69.6), look down and take one step — the sole grips with a squeak. Fade to black. | Ringing, a long shaky breath, one crisp step; the final chord. | *You'd never notice friction…* → *…until it was gone.* · SURFACE FRICTION NORMAL |

## 4. Hero events (from the simulation; film clock)

| t | Event |
|---|---|
| 1.5 | μ = 0. Your phone leaves your hand; W1, W2, J slip and glide on; W3 grabs a signal mast |
| 3.56 | You hit the sign pole chest-first; a scripted 0.6 s swing round it to your hold at (7.12, −16.1) |
| 2.05 → | K (electric) floored in gas windows: wheels up to ~50 rad/s, car still |
| 11.96 / 12.27 | Taxi C1 clips the steering SUV B2; the braking sedan B1 slams in |
| 14.95 | B2 (12.6 m/s) snaps lamp post R10 |
| ~15 | Truck T (17 m/s uphill at 1.5 s) stops near the top; slides back down |
| 29.40 / 29.60 | T hits the parked stack; the right bollard bar breaks; the hill releases (tethers ~30–31) |
| 33.75 | B4, spinning at 7.7 m/s down the middle of the road, clips K |
| 35.68 | K, nudged, breaks your grip (you creep at 0.09 m/s) |
| 36.5–36.9 | T smashes P4/P5 at the junction and spins out toward you |
| 39.27 / 39.53 / 39.67 | The hero cart hits your pole; T hits K; K's nose knocks you loose at 2.1 m/s |
| 42.03 | You hit the shopfront (x 12.5) and slide along it at ~0.7 m/s |
| 61.5 | Friction returns: B4 (7.3 m/s sideways) rolls 3 quarter turns; P6, P7 roll; P1, P2 skid; T (1.4 m/s sideways) lurches onto two wheels; you stop at (12.2, −2.2) |

## 5. Assets (all procedural)

Reused: city materials, facades, shops, trees, lamp posts and bench builders (`js/world/environment.js`, subclassed),
the car factory (`js/world/vehicles.js`: sedan, SUV, van, hatch, taxi, pickup + a new box truck), the adult rig and
looks (`js/world/people.js`, new slip / slide / splits / tumble actions), first-person hands, StoryHUD, post, fog,
AudioEngine/SoundKit, the bake and render tools. New: the hill and its stepped buildings, the slide simulator, bins,
carts, bikes, cargo boxes, pipes, bollards, a box truck, a phone, sparks/dust/glass particles.

Optional upgrades (drop-in, not required):

| Asset | Format | Search terms | Used in |
|---|---|---|---|
| Recorded tyre screech / skid | WAV, 48 kHz, mono | "tire screech skid CC0", "car skid stop freesound CC0" | the return at 61.5 s |
| Car crash / metal crunch | WAV | "car crash metal impact CC0" | collisions, the return |
| City ambience bed | WAV, stereo, ≥ 60 s | "city street ambience daytime CC0" | under the whole film |
| Ambulance siren | WAV | "ambulance siren pass by CC0" | montage shot 5 |

## 6. Phases and review

| Phase | Seconds | Content | Status |
|---|---|---|---|
| 1 | 0–20 | city + hill, simulation, hook, title, walking impossible, brakes / steering | done (preview reviewed) |
| 2 | 20–40 | wheel spin, the hill release, the truck, the knock | done |
| 3 | 40–60 | your slide, montage, realisation | done |
| 4 | 60–75.5 | countdown, return (slow motion, drone), aftermath | done |

After each preview: independent reviews (retention, physics plausibility, cinematography / 3D, normal viewer) scoring
HOOK, FIRST 5 SEC CLARITY, PHYSICS READABILITY, PACING, DESTRUCTION, POV IMMERSION, VISUAL QUALITY, ESCALATION, FINAL
PAYOFF, OVERALL RETENTION (out of 10). Scores are never inflated; low scores mean changing the film.

### Review log

**Preview (0–20 s, friction gone at 3.0 s).** Cinematography / retention: HOOK 4 · FIRST 5 SEC 5 · PHYSICS READABILITY 4 ·
PACING 4 · DESTRUCTION 3 · POV IMMERSION 5 · VISUAL QUALITY 5 · ESCALATION 3 · OVERALL RETENTION 4. What changed because
of the preview reviews:

- **Late hook** → the whole film moved 1.5 s earlier (friction 0 at 1.5 s; the simulation is authored on the old clock and
  shifted), the title shortened and centred, the action composed lower in the frame.
- **Unreadable HUD** → bigger labels and numbers with a dark halo.
- **Physics** → brakes no longer lock wheels without friction (the pads can't grip the discs); the wheel-spin car is
  electric (no engine roar); you hit the pole chest-first and brace a foot on the kerb instead of hooking an arm;
  people don't hop kerbs; *Things only stop when they hit something.*; no smoke or sparks from frictionless hits.
- **Readability** → spoke decals so a spinning wheel reads, a telephoto squint on the crash, the shop-window shot cut,
  longer and slimmer sleeves, less motion smear.

**Full cut.** The second half was rebuilt around a new chain (spinning car → the truck through the junction → the car
beside you → you), a shopfront instead of the cross street, the slow-motion drone shots for the return, and fixes found in
test frames: a tree hiding the falling lamp post (removed), a frozen pedestrian and a pipe ending up in your face for the
finale (moved / parked while the montage is on), the bike shot's camera looking the wrong way, the waiter's tray placed
760 m away (a world/local mix-up), the drone shots blocked by a tree trunk or framing empty road.
