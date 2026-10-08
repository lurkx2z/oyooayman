# WHAT IF GRAVITY BECAME TWICE AS STRONG? — production plan

A 68.7-second vertical (9:16, 1080×1920, 30 fps) first-person "what if" on the shared engine. One sunny avenue, one
continuous take from your eyes (trimmed by `CONFIG.edit`). Gravity doubles at 1.6 s and stays doubled. Nothing gets
more massive: everything just weighs twice as much. The film escalates from things you feel (your bag, your knees, a
kid's jump, an old man who can't stand up) to things that fall (a pallet of bricks), things on springs (cars), things
rated for 1 G (a crane's outrigger, a scaffold, an awning, a water tank, an airliner), and ends with the biggest event:
the crane's hoist brake gives and a 12 t load free-falls 21.7 m at 2 G onto a flatbed.

Brief: the owner's "Gravity 2x" episode brief from the Studio Master Prompt (delivered to this thread by the project
coordinator; key lines quoted in § 1). Format: `docs/VIDEO_FORMAT.md` (Oxygen/Friction structure). Style:
`docs/STYLE_BIBLE.md` (sunny "ordinary day goes wrong" family, like Friction and Air).

## 1. Rules (the fictional rule, held constant, changed, simplifications, what we must not claim)

| Item | This episode |
|---|---|
| Exact fictional rule | At story 1.6 s Earth's surface gravity goes from 9.81 to 19.62 m/s² (smoothly over 0.25 s) and stays there. |
| Held constant | Every mass and every inertia; Earth's size; materials' strengths; the air (see simplifications); people's muscles. |
| Changed | Weight (m·g) ×2 · free-fall acceleration ×2 · potential energy m·g·h ×2 · spring sag (m·g/k) ×2 · hydrostatic pressure ρ·g·h ×2 · friction μ·N ×2. |
| Real consequences (one per beat) | your bag and your body weigh double · a kid's 30 cm hop becomes 6 cm · standing up from a bench fails · a pallet falls 9 m in 0.96 s (not 1.36 s) and hits at 68 km/h (not 48) · car springs sag twice as far (a low coupe bottoms out, an overloaded truck's leaf spring snaps) · a crane's outrigger pad presses twice as hard · a scaffold bay rated with a thin margin buckles · an old awning tears off · a water tank's hoop stress doubles · wings need twice the lift · a hoist brake that could hold 1.25× the load now has 160 % of what it can hold: it creeps from the change and slips · 12 t falls 21.7 m onto a flatbed in 1.49 s (not 2.10 s) at 105 km/h (not 74). |
| Simplifications | The change is instant (0.25 s), uniform, and only at Earth's surface. The atmosphere is left as it was (in reality the air column would weigh double and surface pressure would head toward 2 atm within tens of seconds to a minute, with ear pain, compression heating and denser air that would help wings: the end note says AIR PRESSURE CHANGES NOT SHOWN, and it is a question for the comments). Failures that come seconds after the change (outrigger, scaffold, awning, tank) are creep and progressive cracking under a load that doubled at 1.6 s. Orbits, tides, the Moon, Earth's interior: out of scope. People's bodies only show load (no blood-pressure or fainting beat). |
| Misconceptions to avoid | "Things got heavier because they got more massive" (no: same mass, double weight); "heavier things fall faster" (no: everything falls at 2 G, the ghost pallet shows the 1 G comparison); "everything collapses" (no: most buildings hold, the brief says failures are selective); "cars can't move" (no: horizontal motion still works, the cars drive; only their springs suffer); "the plane drops like a stone" (no: it keeps flying, nose high at full power, but sinks). |
| Formulas / numbers used | t = √(2h/g) → ×1/√2 = ×0.707 · v = √(2gh) → ×√2 = ×1.414 · E = m·g·h → ×2 · lift L = ½ρv²SC_L must equal 2·m·g → at the same C_L, v ×√2 (+41 %) · 70 kg: 687 N → 1,373 N · pallet: h 9.0 m, 0.958 s vs 1.355 s, 67.7 vs 47.8 km/h · load: 12 t, its underside 23.2 m up, 21.7 m down to the flatbed's deck (1.5 m): 1.487 s vs 2.103 s, 105.0 vs 74.3 km/h, 5.11 MJ vs 2.55 MJ · hoist brake able to hold 1.25× the 1 G load → 2/1.25 = 160 % (it creeps 2 cm/s from the change, then slips 0.5, 0.7, 0.9 m) · kid's hop: a push of ≈ 2.67 × his 1 G weight over 18 cm gives 30 cm at 1 G and 6 cm at 2 G (h = (F/(m·g) − 1)·d). |
| Must NOT claim | That mass changed (the HUD says MASS STILL 70 KG, MASS UNCHANGED; the crane readout says MASS 12 t / PULLS LIKE 24 t) · that this can really happen (end note: FICTIONAL INSTANT GRAVITY CHANGE · MASSES UNCHANGED · AIR PRESSURE CHANGES NOT SHOWN) · that every structure fails · exact engineering margins for real equipment (the ratings are plausible, not quoted). |

Open questions left for the comments (from the brief): birds, the ocean, planes over hours, astronauts and orbits, the
atmosphere, how bodies would adapt, bridges.

## 2. The places (layout in metres, camera path)

One avenue (`city.js`, subclassing `Environment`): road ±7 m, sidewalks to ±12.5 m, kerb 0.15 m. −Z is "down the
street". Sunny sky and light (the Air film's city look, owned here).
- **Your side (x > 0)**: you stand at x 9.35 (walking from z 3.6 to 1.3 as gravity changes; at the end you go down at
  z −0.4). A bench at (11.75, −2.4) with the old man; the HARDWARE shop (z −10 … −3.4) with its old awning (y 3.3, 2.1 m
  out); the stone building (z −26 … −10) with a six-lift scaffold and a cantilevered loading bay off the top lift
  (x 8.75–10.95, z −17.6 … −14.4, y 12); the builders' white pickup parked on the sidewalk under the bay.
- **Across (x < 0)**: the old red-brick building with a wooden water tank on the roof (−18.5, −3.0; roof at 17.6 m);
  the building site (a steel frame) with a mobile crane in the far lanes (slewing centre −4.4, −33.5, boom aimed at
  −2.0, −19.5) lifting a 12 t bundle of steel off a flatbed (deck middle at −0.75, −16.5, right under where the load
  ends up after the outrigger sinks and the crane leans).
- **In the road**: a raised crossing (speed table, z −8.6 … −5.4, 10 cm) right in front of you.
- **Camera**: always your eyes (1.7 m, then lower with bent knees under the double weight; down to 0.56 m on your
  hands; back up). The head is aimed at what matters by `GV_LOOK` (film.js): a list of world targets with blend
  windows and fovs (30–66°), following moving targets (the pallet, the coupe, the truck, the airliner, the load).

## 3. Shot list (story seconds → film seconds after the cut)

Cut: `CONFIG.edit = [[0, 12.6], [13.6, 20.5], [21.7, 43.3], [43.8, 50.6], [51.8, 55.8], [56.4, 73.2]]` (story 73.2 s →
film 68.7 s). The trims: the bay before it creaks, the wreck hold, the swing up to the roar, the airliner far away, your
hands on the pavement.

| # | Story | Film | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|---|---|
| 1 | 0–3.7 | 0–3.7 | the sunny street; the kid hops twice; you hold the bag; at 1.6 the bag yanks your hand down and your eyes go to the kid and his mum buckling | street bed, birds; at 1.6 a whump, sub drop, everything creaks | TITLE (centred, out at 3.1) · GRAVITY 1.0 G → 2.0 G |
| 2 | 4.3–5.4 | same | you squat and set the bag down | paper rustle, thump, a grunt | "Everything you lift feels twice as heavy." · 70 KG PERSON · WEIGHT 1,373 N · AT 1 G: 687 N · MASS STILL 70 KG |
| 3 | 7.1 | same | the kid tries again: a 6 cm hop | his little effort voice | KID'S JUMP · SAME LEGS 6 cm · AT 1 G: 30 cm |
| 4 | 9.2–12.6 | same | the old man pushes on his cane, can't stand, slumps back | his effort, the bench creak, a sigh | "Standing up becomes hard work." |
| 5 | 14.2–16.5 | 13.2–15.5 | the loading bay creaks, cracks, tips; the pallet falls 9 m (faint 1 G ghost alongside) | creak, crack, whistle | FALLING PALLET: the fall clock 0.96 s (AT 1 G: 1.35 s) |
| 6 | 16.5–20.5 | 15.5–19.5 | it smashes the pickup's cab: bricks, glass, dust; people recoil | crash, glass, pickup alarm | "And falling things hit twice as hard." · 68 km/h · IN 0.96 s · AT 1 G: 48 km/h · ENERGY ×2 |
| 7 | 21.7–25 | 19.5–22.8 | the low coupe drives past; its floor scrapes the crossing: sparks | engine, scrape | "Cars still drive. Their springs sag twice as far." |
| 8 | 26.2–28.3 | 24.0–26.1 | the loaded truck passes close; its rear spring snaps; it sags and stops | diesel, bang, air brake | — |
| 9 | 29.1–33.4 | 26.9–31.2 | the crane's outrigger pad punches into the road; look up at the 12 t load | crunch, overload beeps | "Every machine was built for 1 G. Some with thin margins." · CRANE LOAD · MASS 12 t / PULLS LIKE 24 t / OUTRIGGER PAD: 2× PRESSURE |
| 10 | 33.6–36.5 | 31.4–34.3 | the scaffold bows, then a section folds into the street | groans, tube clatter, crash | — |
| 11 | 36.8–39.5 | 34.6–37.3 | the HARDWARE awning sags and tears off; the shopkeeper backs off | rivets popping, tearing sheet | "Most buildings hold. The weak spots don't." |
| 12 | 39.3–43.3 | 37.1–41.1 | the rooftop water tank bursts; water pours over the cornice | burst, water | — |
| 13 | 43.8–50.6 | 41.1–47.9 | a roar: the airliner comes over at ≈ 130 m, nose high, and sinks ever faster down the avenue until it is below the rooftops | jet at full power, spatialised; the ambulance siren arriving under it | "Its wings now carry twice the weight." · AIRLINER ON APPROACH / NEEDS 2× LIFT / STALL SPEED NOW 41% HIGHER |
| 14 | 51.8–55 | 47.9–51.1 | exhausted people; the ambulance; paramedics barely carrying their kit | the siren dies away; effort voices, a dropped bag | — |
| 15 | 55–59.4 | 51.1–54.9 | your knee gives: palms flat on the pavement; you push back up | your fall, breathing, heartbeat | "Getting up is like lifting a second you." |
| 16 | 59.6–62.6 | 55.1–58.1 | held still on the load: the brake slips in three jerks (0.5, 0.7, 0.9 m) | clunks, beeps | HOIST BRAKE · OVERLOADED 160 % · OF WHAT IT CAN HOLD · SLIPPING |
| 17 | 62.6–64.09 | 58.1–59.59 | wide and locked: the 12 t load free-falls 21.7 m from the top of the frame onto the flatbed at the bottom | the brake bang, then the street drops to a hush under the rope's scream and the rushing air | FREE FALL · 21.7 m: 1.49 s (AT 1 G: 2.10 s) |
| 18 | 64.09–66.6 | 59.59–62.1 | white flash, shake; the deck folds into a V, the tyres burst, beams are thrown off, dust; the boom springs back up and shudders | the biggest impact of the film; the boom's groan; car alarms | 105 km/h · AT 1 G: 74 km/h · 12 t |
| 19 | 66.6–73.2 | 62.1–68.7 | down to the wreck in the dust; the paramedic kneels | pulse, tinnitus, a soft chord, two plucks | GRAVITY 2.0 G · MASS UNCHANGED · "Nothing became more massive." → "Everything just became twice as heavy." · FICTIONAL INSTANT GRAVITY CHANGE · MASSES UNCHANGED · AIR PRESSURE CHANGES NOT SHOWN |

## 4. Hero shots

- The pallet in mid-fall with its 1 G ghost above it (story ≈ 16.0).
- The scaffold folding into the street (≈ 35.5).
- The airliner overhead, nose high (≈ 45–47; cover candidate: it doesn't spoil the payoff).
- The 12 t load in free fall over the flatbed, broadside, paramedics small at the bottom (≈ 63.5).

## 5. Escalation check (a new consequence every 5–8 s; nothing static for 3 s)

Story: 0–2 title + change · 4 bag · 7 hop · 9.5 bench · 14 bay · 16.5 pallet hit · 22 coupe · 26 truck · 30 outrigger ·
33.6 scaffold · 38 awning · 41 tank · 43.8 airliner · 52.6 paramedics · 55 you go down · 60 brake slips · 62.6 the
drop · 64.1 impact · 67–72 the lines. Longest gap without a new consequence: the airliner (43.8–50.6),
which is itself moving and sinking the whole time.

## 6. Sound

`audio.js` (GvAudio, subclassing the locked AudioEngine; never edited): mixed into world / you / music buses with a
compressor and limiter. Every source is placed in the world and panned by where your head points (`_spatial` from the
look list). Sections: `_bed` (traffic, birds, hammer, crane diesel), `_you` (steps, bag, breathing that follows the
breath-rate track, grunts, the fall, heartbeats), `_change` (whump, sub, creaks, suspension clunks), `_people`,
`_pallet`, `_cars`, `_crane`, `_failures` (scaffold, awning, tank, water), `_plane` (jet in 3D), `_end` (pulse,
tinnitus, chord, plucks). Baked into `soundtrack.js` (see § 8).

## 7. Systems / files

| File | What it holds |
|---|---|
| `script.js` | GV beats, the cut, the fall maths (GV_FALL), where you stand, camera height/tilt/startles/shakes, hands, captions, readouts, closing lines, the airliner's path |
| `city.js` | GvCity (subclass of Environment): the avenue, buildings, bench, crossing table, trees, sunny sky |
| `site.js` | GvCrane (slew, hoist, outrigger, brake creep and slips, the fall, the boom's recoil), GvFlatbed (deck folds into a V), GvScaffold (bay, pallet, 1 G ghost, bow and fold), GvAwning, GvTank |
| `traffic.js` | the coupe and the truck (crushable profiles, sag, scrape and snap times), the pickup (dented by the pallet), the ambulance, background cars |
| `cast.js` | the people: looks, gv actions (buckle, heavy, bench try, carry, hands-and-knees …), who is where, the kid's hops |
| `fx.js` | dust (a lumpy puff texture), glints, chunks; every impact: pallet, coupe sparks, truck spring, outrigger, scaffold, awning, tank water, the load (beams thrown off) |
| `air.js` | GvAirliner (subclass of AircraftSystem): nose-high attitude, wing rock, no distance haze |
| `audio.js` | GvAudio (see § 6) |
| `film.js` | FILM hooks: build, the look list, your hands, their contact shadows and the bag, shadows following the view, the dust haze, the grade |

Engine: reused, not edited (CameraController, ViewerHands, StoryHUD, Post, Environment, People, Vehicles,
AircraftSystem, particles, AudioEngine/SoundKit, Edit, tools).

## 8. Review log (scores as given, swipe timestamps, what changed — never inflated)

### Round 1: four independent reviewers on the 69.7 s preview (270×480, 15 fps), film seconds

| Reviewer | Overall | Other scores (as given) |
|---|---|---|
| Retention / short-form | **5** | hook 5 · first 5 s 4 · pacing 5 · clarity sound-off 6 · payoff 4 · ending 4 · rewatch 4 |
| Cinematography / 3D | **5.5** | image 6.5 · composition 5 · light/grade 7 · effects 4.5 · characters 4 · final drop 5 |
| Normal viewer | **5** | hooked 5 · easy to follow 6 · most surprising 6 · ending 4 · would share 3 |
| Physics | **7** | numbers 8 · faithful to the rule 9 · plausibility 6 · clarity 7 |

Swipe points they named: 1.9–3.7 (nothing visible after the change; title still up over empty pavement) · 4.0–4.4 and
≈ 6 (blank pavement) · 9–13.6 (static old man; caption late) · ≈ 26 (truck fills the frame) · 38.7–40.7 (static wall
before the tank bursts) · 45–49 (the airliner just gets smaller) · 52.3–55 (grey pavement and two hands) ·
56.4–59.1 (static sky; the slips a few pixels) · 64–69.7 (static end card).
Top problems: the final drop was not the biggest thing on screen (camera followed the load, impact small and blocked,
one-frame flash, no hush before the hit); a camera jump at 17.27; hands on the pavement looked like "surrender";
physics: the hoist brake should creep from the change and the boom can't whip back and fall; the fall height must be
to the deck (21.7 m: 1.49 s, 105 km/h); "LIFT ×2" reads as if lift doubled and the sink must grow; "Their springs give
up" is wrong (they bottom out); the atmosphere would change fast (say so); the kid-hop derivation in this plan was wrong.

### What changed after round 1 (v2, 68.7 s)
- **The final drop**: held still on the load for the slips, now 0.5/0.7/0.9 m jerks after a 2 cm/s creep from the
  change; then a locked wide shot, the load at the top of the frame and the flatbed (moved under it) at the bottom;
  the street ducks to a hush under the rope's scream and the rushing air; a 3-frame 0.8 white flash, the deck folds
  into a V, tyres burst, four beams thrown off; dust that settles faster; the boom only recoils (no fall); the
  paramedic recoils, steps back and kneels, out of the line of sight; the camera goes down to the wreck for the lines.
- **Physics wording**: 1,373 N with "AT 1 G: 687 N"; "FREE FALL · 21.7 m" (1.49 s / 105 km/h, at 1 G 2.10 s / 74 km/h);
  "HOIST BRAKE · OVERLOADED 160 % · OF WHAT IT CAN HOLD · SLIPPING"; "NEEDS 2× LIFT / STALL SPEED NOW 41% HIGHER" and
  an airliner path whose sink grows until it is below the rooftops; "Cars still drive. Their springs sag twice as
  far."; "Every machine was built for 1 G. Some with thin margins."; end note adds "AIR PRESSURE CHANGES NOT SHOWN";
  the kid-hop derivation fixed (2.67× over 18 cm).
- **Opening and lulls**: at the change your eyes go to the kid and his mum buckling; the bag's yank is slower; the
  title leaves at 3.1; a KID'S JUMP readout (6 cm, at 1 G 30 cm); the bench beat shortened to 9.2–12.6 with its
  caption at 9.5; two more trims (12.6–13.6 and 55.8–56.4); contact shadows under your palms.
- **Glitches**: the 17.27 camera jump fixed (the pallet is placed every frame); the dust puff stuck at the truck shot
  removed; scaffold debris now falls down from the fold instead of popping up; the dust uses a lumpy puff texture
  instead of round discs; every frame checked to be a pure function of time.
- **Sound**: mix brought to −17.1 LUFS integrated, −1.7 dBTP peak; the fall's hush (≈ −30 dB) before the hit (≈ −7.5 dB
  RMS over 0.3 s), the loudest moment of the film.

Not re-scored after these fixes. Still weak (not addressed): the truck shot still fills the frame, the outrigger punch
is small, the tank shot holds about 1.5 s before the burst, the 1 G ghost pallet is not labelled, people's animation
is stiff.
