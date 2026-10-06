# What if friction disappeared for 60 seconds? — production plan

A 70.3-second vertical (9:16, rendered 540×960, 30 fps) first-person film on the shared engine. 70 % POV what-if, 30 %
spectacle: polished low-poly city, serif captions, a minimal top-left HUD. Friction drains from 1.0 to 0.0 under the
title and is gone at **1.5 s**; it comes back **60 seconds later** (story 61.5 s) and the return is the biggest payoff
(6 s of 4× slow motion).

**Story clock and the cut.** Everything (camera, script, simulation, sound) runs on one continuous 74.6 s story clock —
the times in this plan are story times. `CONFIG.edit` cuts that take into the film: story 20.6–24.6 (the slow start of the
truck's slide) and 53.0–54.5 (the montage's tail) are dropped, and 39.3–39.9 (the knock) plays at a third of real speed.
Film time = story time up to 20.6; story − 4 from 24.6 to 39.3; the knock fills film 35.3–37.1; story − 2.8 from 39.9 to
53.0; story − 4.3 from 54.5 to the end (film 70.3). The HUD clock keeps story time, so it jumps at the two cuts.

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
| **5** | **16.6–20.6** | **The hill.** A squint up the hill (the hill's right-hand trees slimmed, the low signal head removed so the line is clear): the box truck has stopped near the top. A drone rides behind it as it starts to slide back, the whole street below. — *cut* — | Distant horns, alarms. | *Up the hill, the truck had stopped…* / *…and started sliding back.* · SLOPE 7° · TRUCK SLIDING BACK · n km/h |
| **6** | **24.6–29.0** | **Even a small hill.** Back in your eyes: the truck coming down backwards at 40–57 km/h, telephoto widening as it comes. | The rumble growing. | *Even a small hill becomes dangerous.* |
| **7** | **29.0–34** | **Everything comes loose.** Cutaway, low in the lane beside the parked cars (tagged HELD ONLY BY THE BOLLARDS): the truck slams into the last of them at 59 km/h (29.4); the stack shunts, the bollards give (29.6), the roll-up door bursts. Back in your eyes, the hill pours down; a spinning car slides straight at you and clips the car beside you (33.75). | A boom, metal, glass, then the whole street sliding. | SLOPE 7° · NOTHING ON THE HILL CAN HOLD |
| **8** | **34–42.5** | **Now you're part of it.** The truck reaches the junction, smashes through two cars (36.6) and comes out spinning — at you. The car beside you nudges you and your grip slides (35.7); a runaway cart rings off your pole (39.27); in slow motion (39.3–39.9) the truck hits the car beside you (39.53) and its nose knocks you off the pole (39.67). You sit down hard and slide backwards across the sidewalk into a shopfront (42.03), then along it, your legs out in front. | Your shout, the thud (deep, slowed), a pane wobbling. A warning yell. | FRICTION RETURNS IN 00:24 (from 37.5) · *Now you're part of it.* |
| **9** | **46.5–53.0** | **Meanwhile** (1.3 s each, a reason under each label). Conveyor belt under groceries that don't move · a cyclist sliding, falling and sliding on · a crane's hoist brake letting go, the load dropping at nearly g · glasses sliding off a tilted tray · an ambulance seen from above, pointing one way and sliding another. — *cut* — | Each its own bite. | MEANWHILE / CONVEYOR BELTS — *The belt moves. The groceries don't.* · BIKES — *No grip to steer — so no way to balance.* · CRANE BRAKES — *Brake pads can't grip the drum.* · GRIP — *Tilt anything and it slides off.* · AMBULANCES — *Sirens on. No way to steer or stop.* |
| **10** | **54.5–58.4** | **Realisation.** Back with you, sitting against the shopfront, still drifting; cars slide past; across the street the truck still slides. A ride-along with the spinning car down the avenue (tagged NO GRIP · SPINNING · n km/h). | The world low-passes and narrows; a rising tone; the clock. | *And then you realize…* → *…it's coming back.* |
| **11** | **58.5–61.5** | **3 · 2 · 1.** A slow push-in on the truck across the street (tagged STILL SLIDING SIDEWAYS · n km/h); big numbers, the frame tunnelling in, heartbeat vignette. | Heartbeat, booms, a held breath. | 3 · 2 · 1 |
| **12** | **61.5–67.6** | **Friction returns.** A 2-frame flash and your jolt as you stop; the truck starts to lift. 4× slow motion: high over the street — the truck rocks onto two wheels, every skidding car smokes and lays black marks, carts and boxes tip. Then the same moment down the avenue: the spinning car, sliding sideways, catches the end kerb of a bus island and barrel-rolls over it, sparks and dust on each landing. | One hit: boom, a screech chord pitched down, groans of tyres biting, the kerb bang, landings, glass. | FRICTION 100 % · EVERYTHING GRIPS AT ONCE |
| **13** | **67.6–74.6** | **Aftermath.** Back in your eyes: tyre smoke hanging over the stopped cars, the truck back on its wheels. You stand (69.6–71.0), look down and take one step — the sole grips with a squeak (71.5). Fade to black. | Ringing, a long shaky breath, one crisp step; the final chord. | *You'd never notice friction…* → *…until it was gone.* · SURFACE FRICTION NORMAL |

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
| 61.5 | Friction returns: every slider skids (P1, P2, P6, P7, Q3–Q5…); T (1.4 m/s sideways) lurches onto two wheels; you stop at (12.2, −2.2) |
| 61.7 | B4, still sliding sideways at 6 m/s, trips on the bus island's end kerb at z 193.6 and rolls 3 quarter turns (shown on the second angle, story 63.6–67.6) |

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

**Full cut v1 (75.5 s).** Retention: HOOK 5 · FIRST 5 SEC 6 · PHYSICS 6 · PACING 4 · DESTRUCTION 4 · POV 6 · VISUAL 5 ·
ESCALATION 4 · FINAL PAYOFF 4 · RETENTION 4. Physics: 5 · 6 · 4 · 4 · 4 · 5 · 5 · 5 · 5 · 4. Cinematography: 5 · 5 · 4 · 3 · 4 ·
4 · 5 · 4 · 4 · 3. Normal viewer: 5 · 6 · 5 · 3 · 3 · 5 · 5 · 4 · 5 · 4. They agreed on: a 13 s hill stretch where the truck
hides behind trees and a signal; the 29.4 s hit and the lamp post too far away to see; montage labels missing (a bug: the
label code was handed the camera instead of the shot) and the montage too quiet; a static lull before 3-2-1; a return
that was only two vehicles for 3 s, with see-through smoke discs; an 11 s aftermath of a clean street; a placeholder
shoe; captions washing out on light ground; a sedan rolling from tyre grip alone (not physical at μ 0.8 — needs a trip).
The retention reviewer suggested 55–60 s; the brief asks for 70–78 s, so the cut is 70.3 s.

**v2 (70.3 s)** addresses those: the edit (cuts + slowed knock), the hill drone and the impact cutaway, slimmer hill trees
and no low signal head in the sightline, the sideways lamp-post fall seen through a squint, the rebuilt 6 s return with
a physical roll (bus-island kerb trip) and rocking instead of rolling elsewhere, skid marks and hanging smoke, tags on
the things that matter, a 7 s aftermath, a real trainer, montage labels with reasons, a near-g crane drop, set dressing,
the ambulance from above, caption plates and a HUD backing.

**Full cut v1 notes.** The second half was rebuilt around a new chain (spinning car → the truck through the junction → the car
beside you → you), a shopfront instead of the cross street, the slow-motion drone shots for the return, and fixes found in
test frames: a tree hiding the falling lamp post (removed), a frozen pedestrian and a pipe ending up in your face for the
finale (moved / parked while the montage is on), the bike shot's camera looking the wrong way, the waiter's tray placed
760 m away (a world/local mix-up), the drone shots blocked by a tree trunk or framing empty road.
