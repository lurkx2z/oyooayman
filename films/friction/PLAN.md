# What if friction disappeared for 60 seconds? — production plan

A 77-second vertical (9:16, 1080×1920, 30 fps) first-person film on the shared engine. 70 % POV what-if, 30 % "Omaha"
spectacle: polished low-poly city, serif captions, a minimal top-left HUD. Friction goes at **3.0 s** and comes back at
**64.0 s** — exactly 60 seconds — and the return is the biggest payoff.

## 1. Physics rules (deterministic, `films/friction/slide.js`)

Only **solid-on-solid friction** disappears (static and kinetic, μ → 0 between solid surfaces). Air resistance, liquids,
structure, gravity, electricity and biology stay normal.

| Rule | In the film |
|---|---|
| Nothing moves without a force. A still object on level ground stays still. | People standing still stay standing; the parked bench, the bins on the flat, the stopped cars all stay put. |
| Things that were moving keep their velocity (only air drag slows them, ½ρC<sub>d</sub>A v²). | Walkers glide on at walking speed after they fall; cars keep sliding at the speed they had at 3.0 s. |
| Slopes push things downhill with F = m·g·sin θ (7° → 1.2 m/s²). Drag caps light, boxy things (a bin tops out near 8 m/s, a car doesn't). | Everything loose on the hill slides at 3.0 s and piles up against the kerb extension and bollards at the bottom of the hill. |
| Tyres can't push, brake or steer: wheels spin freely; brakes stop the wheels, not the car; steering turns the wheels, not the car. | The stopped car's wheels blur while it stays where it is; a braking car slides past with locked wheels and brake lights; a steering car goes straight. |
| A car coasting up a slope slows at 1.2 m/s², stops, and slides back down. | The truck and the red sedan climb the hill, stop, and come back down backwards. |
| Only normal forces hold anything: hooks, chains, kerbs, rails, closed doors, wrapped arms. | You hook your arm round a pole to stop; the hill pile-up is held by the kerb extension; bins chained to posts, carts in a corral, cargo behind a closed door. |
| Collisions still happen (impulse-based, restitution 0.1–0.3, impulses clamped). | Cars bump, spin and carry on together; things knocked loose start sliding. |
| Sliding is almost **silent** (scraping *is* friction). Only impacts, engines, horns, voices and air make sound. | The sound design: an eerie, quiet glide; then the return is a wall of screech, scrape and thud. |
| Friction returns (μ → 0.8 over 0.1 s): moving things stop hard. Tyres sliding along their heading skid to a stop (~7 m/s²); tyres sliding sideways trip the car and roll it; anything tall and sliding tips over and tumbles. | The payoff at 64 s. You were already nearly still — the jolt throws you a few centimetres. |

Everything is precomputed once at load (240 Hz) and sampled by time, so the film stays a pure function of time
(scrubbing, rendering and playback agree frame for frame). Hero moments are tuned by initial conditions (positions,
speeds, driver inputs) plus scripted impulses (the truck's hit, the knock that frees you), not by hand-animation.

## 2. World

One avenue (14 m, two lanes each way, kerbs 0.15 m) and a cross street at z = −30 (z −37…−23). **Beyond the intersection
the avenue climbs a 7° hill** (from z −44, smoothed over 12 m, 280 m long, ≈ 34 m high) — visible behind the intersection
from the first frame. On the hill the right lane is parking, ending at a kerb extension (bulb-out) with bollards at the
bottom. Shops and stepped buildings line both sides; a bus shelter, benches, bins, trees, lamp posts, signals.

You walk down the right-hand sidewalk toward the intersection and end up holding a lamp post at (7.55, −16.4), beside
the cars queued at the stop line.

## 3. Shot list

| # | Time | What we SEE (works with sound off) | What we HEAR | Caption / HUD |
|---|---|---|---|---|
| **1** | **0–5** | **Hook.** Walking toward the intersection on a sunny afternoon, phone in the left hand; the hill rising behind the junction. The light goes green, the queue starts to roll. At 3.0 your foot shoots forward (lurch), the phone squirts out of your hand and skates away along the sidewalk; the woman ahead slips onto her back and *keeps gliding*; the man walking toward you windmills and drops to his knees; across the road a jogger goes down. The car next to the kerb spins its wheels and doesn't move. | City air, steps, birds, a horn. At 3.0: a scuff, a gasp, the phone's clack — and then the street goes oddly quiet: no steps, no scrapes, just revs, yelps, air. | **TITLE (centred, 0.15–3.9):** WHAT IF FRICTION / DISAPPEARED / FOR 60 SECONDS? · SURFACE FRICTION 1.0 → 0.6 → 0.2 → 0.0 (1.4–3.0) |
| **2** | **5–12** | **Walking is impossible.** You glide into the lamp post and hook it with your left arm, swing, grab it with both hands. You try a step: the foot slides away, your hands slip down the pole, you haul yourself back up. The woman on her knees slides past you; the man at the corner tries to step, does the splits and slides down his signal pole; the woman on her back glides off the kerb into the junction; your phone skates on into the road. | Your breath, a grunt, clothing; people shouting, a laugh of disbelief; revs. | *You couldn't even take a normal step.* · SURFACE FRICTION 0.0 |
| **3** | **12–22** | **Cars can't stop or turn.** A red sedan comes up behind in the inside lane, brake lights on, wheels locked — and slides past at the same speed. An SUV rolls down the hill with its wheels turned hard — and goes straight, past you on the far side. A taxi on the cross street slides through its red and clips the slow car in the junction: both spin away together. The red sedan carries on *up the hill*. | Horns, a locked-wheel *silence*, engines, the crunch, glass. | *Brakes and steering depend on friction too.* · TIRE GRIP 0 % |
| **4** | **22–30** | **Wheels spin, cars don't move.** Close on the car beside you: the driver floors it, the wheels blur, the car sits still; a van glides past it at 9 m/s. Up the hill the red sedan stops… and starts sliding back. | Revving to the limiter, a tyre whir with no screech, a long horn. | *The wheels spin. The car doesn't move.* · WHEEL SPEED 60 km/h · CAR SPEED 0 km/h |
| **5** | **30–39** | **The hill.** Look up the hill: the box truck that climbed it at the start is sliding back down, backwards, gaining speed. It slams the kerb extension and the pile-up behind it: parked cars, bins, bikes, carts, pipes and the truck's own cargo come loose and start down the hill together, accelerating. | A low boom, metal, glass; then the rumble of a whole street sliding. | *Even a small hill becomes dangerous.* · SLOPE 7° |
| **6** | **39–48** | **Chain reaction.** The slide hits the queue; the car beside you is shunted into your lamp post; you're knocked loose, sit down hard and start sliding — camera low — down the sidewalk among sliding carts, a bin, a man spinning on his back, cars gliding past in the road. You slide into a bench and stop against it. | Impacts all round, your shout, your heart. | *Now you're part of it.* · FRICTION RETURNS IN 00:24 (from 40.0) |
| **7** | **48–56** | **Meanwhile, everywhere** (1.6 s each): a checkout conveyor running under groceries that don't move; a cyclist pedalling, wheels spinning, gliding straight; a crane's brake slipping, the load sinking; glasses sliding off a waiter's tray; an ambulance, lights on, sliding sideways through a junction. | Each with its own sound bite; the siren last. | small labels: CONVEYOR · BIKE · CRANE BRAKE · GRIP · AMBULANCE |
| **8** | **56–63** | **Realisation.** Back with you at the bench: everything around you is still moving — cars at speed, the truck, carts, people. The countdown. | The world narrows (low-pass), a rising tone, the clock. | *And then you realize…* → *…it's coming back.* · FRICTION RETURNS IN 00:08 … |
| **9** | **61–64** | **3 · 2 · 1.** Short cuts of things in motion; the frame tightens. | Heartbeat, silence growing, a breath held. | 3 · 2 · 1 (big) |
| **10** | **64–71** | **Friction returns.** Every tyre bites at once: the sliding sedan skids to a stop; the car going sideways trips and rolls; the truck jackknifes over; carts and bins tip and tumble; people tumble; cargo flips; sparks, dust, glass — no explosions. You jolt to a stop. | One synchronised hit: screech, scrape, thud, metal, glass — then silence and ringing. | FRICTION 100 % |
| **11** | **71–77** | **Aftermath.** Settling dust, a hubcap rolling to a stop, people sitting up. You stand; your foot plants and grips. Cut to black. | Silence, ringing, a distant alarm, one crisp step. | *You'd never notice friction…* → *…until it was gone.* · SURFACE FRICTION NORMAL |

## 4. Hero events (all from the simulation, tuned by initial conditions)

| t | Event |
|---|---|
| 1.4 | Avenue light green; the queue starts rolling (lead car L1 at ~1 m/s by 3.0; K beside you hasn't moved yet) |
| 3.0 | μ = 0. Your phone leaves your hand; walker W1 slips (back), W2 (forward), jogger J (side, across the road) |
| 3.5 | K's driver accelerates: wheels spin, K stays put (until the shunt at ~40) |
| 5.2 | You hook the lamp post |
| 12.6 | Red sedan B1 (brakes locked since 9.5) slides past you in the inside lane at 9 m/s, through the junction, up the hill |
| 14.5 | SUV B2 (steering hard right since 10) comes off the hill at ~13 m/s and passes you on the far side |
| 17.6 | Taxi C1 (cross street, slid through its red) T-bones the slow lead car L1 in the junction; both rotate away |
| 25 | Van B3 glides past stuck K; B1 stops on the hill (~26 s) and starts sliding back |
| 31 | Box truck T, backwards down the hill, hits the kerb extension: the parked-car stack, bins, carts, bikes, pipes and cargo are released |
| 39.5 | The first released car hits the queue; K is shunted into your lamp post; you're knocked loose (40.1) |
| 46 | You slide into the bench and stop |
| 64.0 | Friction returns: skid, roll-over (sideways car), truck tips, tumbles, your jolt |

## 5. Assets (all procedural)

Reused: city materials, facades, shops, trees, lamp posts and bench builders (`js/world/environment.js`, subclassed),
the car factory (`js/world/vehicles.js`: sedan, SUV, van, hatch, taxi, pickup + a new box truck), the adult rig and
looks (`js/world/people.js`, new slip / slide / splits / tumble actions), first-person hands, StoryHUD, post, fog,
AudioEngine/SoundKit, the bake and render tools. New: the hill and its stepped buildings, the slide simulator, bins,
carts, bikes, cargo boxes, pipes, bollards, a box truck, a phone, sparks/dust/glass particles.

Optional upgrades (drop-in, not required):

| Asset | Format | Search terms | Used in |
|---|---|---|---|
| Recorded tyre screech / skid | WAV, 48 kHz, mono | "tire screech skid CC0", "car skid stop freesound CC0" | the return at 64 s |
| Car crash / metal crunch | WAV | "car crash metal impact CC0" | collisions, the return |
| City ambience bed | WAV, stereo, ≥ 60 s | "city street ambience daytime CC0" | under the whole film |
| Ambulance siren | WAV | "ambulance siren pass by CC0" | montage shot 5 |

## 6. Phases and review

| Phase | Seconds | Content | Status |
|---|---|---|---|
| 1 | 0–20 | city + hill, simulation, hook, title, walking impossible, brakes / steering | building |
| 2 | 20–40 | wheel spin, the hill release | — |
| 3 | 40–60 | chain reaction + your slide, montage, realisation | — |
| 4 | 60–77 | countdown, return, aftermath | — |

After each preview: a retention audit (0–3, 3–7, 7–12, 12–20, 20–30, 30–40, 40–50, 50–60, 60–70, end) and independent
reviews (retention, physics plausibility, cinematography / 3D, normal viewer) scoring HOOK, FIRST 5 SEC CLARITY, PHYSICS
READABILITY, PACING, DESTRUCTION, POV IMMERSION, VISUAL QUALITY, ESCALATION, FINAL PAYOFF, OVERALL RETENTION. Scores
are never inflated; low scores mean changing the film.
