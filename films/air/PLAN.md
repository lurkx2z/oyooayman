# What if air became 10× denser? — production plan

A 48.6-second vertical (9:16, 1080×1920, 30 fps) first-person physics film on the shared engine. One invisible property
changes — the air's density, ×10 — and keeps changing things you didn't expect: a throw, a bike ride, a car, a falling
sheet, and then the wind. Structure: mystery → answer → new mystery → answer → bigger consequence → destruction.

## 1. The hypothetical (stated once, small, at the end)

Air density = 10 × normal (1.225 → 12.25 kg/m³). Gravity, temperature, breathing, pressure effects and chemistry are
held normal: a fictional override that isolates **aerodynamics**. Sound propagation stays normal. No aircraft.
End note: *Aerodynamic effects isolated for this simulation.*

## 2. The model (physics.js) and the numbers it gives

Drag F = ½ ρ C_d A v² (so 10× the force at the same speed); terminal speed ∝ 1/√ρ (≈ 0.32×); wind pressure q = ½ ρ U²
(so a wind U pushes like √10·U ≈ 3.16·U in normal air). Every hero motion below is integrated from these, not keyed by hand.

| Beat | Object (mass, C_d·A) | Normal air | 10× air (what the film shows) |
|---|---|---|---|
| Throw | ball 0.27 kg, r 10.5 cm, C_d 0.47; 15 m/s at 32° | lands 15.4 m away in 1.67 s | lands **4.9 m** away in 1.33 s (the catcher is 15 m off) |
| Cyclist | 85 kg, 250 W, C_dA 0.40 m² | tops out at 36 km/h | tops out at **≈ 17 km/h**, flat out, leaning |
| Car | 1500 kg, C_dA 0.65 m², coasting from 90 km/h | 86 km/h after 4 s | **≈ 70 km/h** after 4 s; holding 90 needs 66 kW vs 10 kW (**≈ 7×**) |
| Fall, 12 m | plywood sheet 18 kg, 2.9 m², tumbling | 1.9 s | **3.8 s**, drifting, lands at 3.3 m/s |
| Fall, 12 m | steel scaffold clamp 1.2 kg | 1.57 s | **1.66 s** — barely slower |
| Wind | 30 / 50 / 60 km/h | 43 / 118 / 170 Pa | 425 / 1182 / **1701 Pa ≈ a 190 km/h wind in normal air** (hurricane force) |

What fails at ~1.7 kPa: things with a lot of area for their mass or their anchoring — umbrellas, awnings, light signs, a
pole sign, a sheet-metal roof panel, branches, wheelie bins, a temporary fence, and the rooftop billboard. Not buildings.
Order of response as the wind rises: leaves and paper → fabric → small objects → branches and signs → structures.

## 3. Shot list (film seconds; story time = film time from 4.7 s)

| Time | Beat | Picture | Text |
|---|---|---|---|
| 0.0–3.0 | **Cold open (story 35–38)** | Your street in a gale: trees bent hard toward the road, café umbrellas tearing loose, people braced, debris streaming left, the rooftop billboard ahead shuddering on its frame | Title (centred) to 2.9 s. HUD **WIND 60 KM/H · AIR DENSITY 10×** — why is *60 km/h* doing this? |
| 3.0–4.7 | Rewind | Everything runs back: umbrellas, signs, trees straighten, the wind drops | 33 SECONDS EARLIER |
| 4.7–8.4 | Density | An ordinary afternoon (the billboard, scaffold, café, cyclist, trees all in shot); you walk | AIR DENSITY 1.0× → 2× → 5× → 10×. "The air would still look normal." / "But moving through it wouldn't." |
| 8.4–12.2 | Throw | Across the street two people play catch: the ball leaves the hand fast, stalls, drops 4.9 m out; a faint dotted arc shows where it would have gone | AIR DRAG ↑ ~10× · "Anything moving fast would fight far more air." |
| 12.2–16.0 | Cyclist | Passes you, standing on the pedals, leaning — speed creeps to 17 km/h and stays | live km/h tag · "The faster you move…" / "…the worse it gets." |
| 16.0–20.8 | Car | Passes at 90 km/h, lifts off: no brake lights, it sheds speed; then powers on | SPEED 90 → 70 KM/H (live) · TO HOLD 90 KM/H: ≈ 7× THE POWER |
| 20.8–25.6 | Fall | A creak above: off the scaffold's top deck, a steel clamp and a plywood sheet; the clamp hits in 1.7 s, the sheet sways down for 3.8 s | tags STEEL CLAMP 1.2 kg / PLYWOOD 18 kg · "Even falling changes." |
| 25.6–29.0 | Wind rises | Trees lean further than a 30 km/h wind should make them, fabric snaps, paper lifts | WIND 30 → 50 KM/H · "Then comes the real problem." / "The wind." · 10× DENSITY ≈ 10× THE FORCE AT THE SAME SPEED |
| 29.0–34.0 | The number | Awnings strain, people brace, a hanging shop sign tears half loose | WIND 60 KM/H → **NORMAL-AIR EQUIVALENT ≈ 190 KM/H** · "A normal gale would hit like a hurricane." |
| 34.0–40.0 | Escalation | One at a time, sweeping across the street: a wheelie bin goes over into the road (34.2), a café umbrella rips away across the street (35.2), the pole sign's mount fails (36.2), the cyclist is shoved sideways and stops (37.2), a branch snaps (38.2), the site hut's roof sheet peels off and flies (39.2) | |
| 40.0–45.0 | Billboard | Back to the billboard from frame one: frame flexing, bolts letting go — it tears free (42.6) and the wind sails it across the street (in air this dense a 14 × 5 m panel is half kite); a car brakes and swerves under it; it smashes the far bus shelter (44.15); you flinch | |
| 45.0–48.6 | Final | Down the avenue: the whole street battered, people sheltering, traffic crawling; a dark panel sweeps across the lens — cut | "Same wind speed." / "Ten times the air." · small: *Aerodynamic effects isolated for this simulation.* |

The cold open is a moment from the escalation (story 35–38: the umbrella in flight, the trees bent, the billboard
shuddering) seen down the street, so the billboard that fails at the end is the one in frame one; the cut on the dark
panel loops back into frame one.

## 4. Hero assets and events

Billboard (rooftop, your side, ahead; 12 × 4.5 m on a steel frame) · scaffold tower with the falling sheet and clamp ·
café terrace with three umbrellas and an awning · hanging blade sign · pole sign · site hut with a sheet roof · street
trees (bend in the vertex shader, shadows too) with one breakable branch · wheelie bins · bus shelter (glass) · the ball
players, the cyclist, the coasting car, the swerving car · people who walk, then lean into the wind, then shelter.
Every hero event is scripted on the timeline (same every playback); leaves and paper are procedural, on the same wind.
The wind blows from your buildings toward the road (−X), so what lets go goes into the street.

## 5. Retention review (each interval: new physics · new visual · why stay)

| Interval | New idea | New visual | Hook to stay |
|---|---|---|---|
| 0–3 | 60 km/h shouldn't do this | a city in a gale | the contradiction in the HUD |
| 3–5 | it starts normal | rewind | how did we get there? |
| 5–9 | density rises, nothing visible | numbers climbing | "but moving through it wouldn't" |
| 9–13 | drag ×10 | the throw that dies | what else moves fast? |
| 13–17 | drag grows with speed | the cyclist who can't go faster | cars go faster… |
| 17–21 | big mass still loses | a car shedding speed | what about falling? |
| 21–25 | mass and area decide | clamp vs sheet | (the sheet still drifting) |
| 25–29 | wind = moving air | trees over-reacting | "the real problem" |
| 29–34 | 60 ≈ 190 km/h | the number + damage | it is getting worse |
| 34–40 | area/mass/anchoring | one failure per second | the billboard from frame one |
| 40–45 | structural load | the billboard goes | — |
| 45–48.6 | same wind, ten times the air | the battered street | the loop |

Questions left open on purpose: aircraft, skydivers and parachutes, birds, running, fuel use, sound, helicopters, rain.

## 6. Systems

`physics.js` (the model, integrated tables) · `script.js` (story clock, wind, density, camera, HUD, captions) ·
`city.js` (the street) · `wind.js` (bending, flutter, debris, the hero failures) · `actors.js` (people, cyclist, cars,
ball players) · `audio.js` · `film.js`.
