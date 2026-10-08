# WHAT IF GRAVITY BECAME TWICE AS STRONG? — production plan (v3, the leisure centre)

A vertical (9:16, 1080×1920, 30 fps) first-person "what if" on the shared engine, 60.3 s. One continuous take
from your eyes (trimmed invisibly by `CONFIG.edit`) through a leisure centre: a gym, a sports hall seen through glass,
an open stair down into a pool hall, the pool itself and, at the end, under the water. Gravity doubles at 1.6 s and
stays doubled. Nothing gets more massive: everything just weighs twice as much. The film is about how weight FEELS:
on a scale, a barbell, a treadmill, a free throw, a flight of stairs; and about the one place where doubling gravity
changes nothing: water.

v3 replaces the v2 street film (sunny avenue, crane, scaffold, airliner, a 12 t load onto a flatbed; delivered
2026-10-08, kept in git at commit `99692f2`) after the owner's creative direction override of 2026-10-08: stop the
"normal city → person reacts → car → machinery → airplane → destruction" template; for GRAVITY 2× "make viewers
physically FEEL the weight. Show unusual everyday situations such as lifting objects, sports, stairs, a swimming pool,
gym equipment and suspended loads." Working systems were kept (see § 7). Format: `docs/VIDEO_FORMAT.md`. Style:
`docs/STYLE_BIBLE.md` (sunny "ordinary day goes wrong" family; interior).

## 0. Creative redesign (the override)

### 0.1 The five identity questions

1. **What can this episode show that none of our previous videos have shown?** The inside of a building where your
   own body is the measuring instrument: a scale, a barbell, a treadmill, a free throw, a staircase. And the one place
   where doubling gravity changes nothing: a swimming pool. No other episode goes into a gym, onto a court, into a pool
   or under water.
2. **The most surprising physical consequence?** Swimmers float exactly as before. The water weighs twice as much
   too, so buoyancy doubles with your weight and cancels it.
3. **The most visually unusual consequence?** A free throw whose arc peaks below the rim while its 1 G ghost drops in;
   and a 10 m dive seen from inside the water.
4. **The strongest scene viewers will remember?** The diver on the 10 m tower who can't face climbing down: she steps
   off, hits the water at 71 km/h (a 20 m dive at 1 G), drives deep in a column of bubbles and floats back up, as
   if nothing had changed.
5. **With every HUD label removed, could someone tell this from our other videos?** Yes. It is indoors (gym, court,
   stair, pool, under water), with no street, no car, no aircraft, no crane and no collapse. Every beat is a human
   body against a weight everybody knows.

### 0.2 Ten genuine consequences, ranked (surprise · visual clarity · emotion, each /10)

| # | Consequence | Surprise | Clarity | Emotion | Used |
|---|---|---|---|---|---|
| 1 | Swimmers float exactly as before (buoyancy ×2 with weight ×2) | 9 | 8 | 8 | **B** |
| 2 | A 10 m platform drop hits like a 20 m one: 1.01 s, 71 km/h | 8 | 9 | 9 | **C** |
| 3 | A free throw never reaches the rim (peak 2.90 m, rim 3.05 m); the 1 G throw scores | 8 | 9 | 6 | yes |
| 4 | Climbing out of a pool: your weight comes back double as you leave the water | 7 | 8 | 8 | yes (with B) |
| 5 | The scale reads 140.0 kg; your mass is still 70 kg | 6 | 10 | 7 | **A** |
| 6 | A treadmill runner can't hold the pace: carried off the back of the belt | 6 | 8 | 8 | yes |
| 7 | An 80 kg bar lifts like 160 kg: two people can't get it off the safety arms | 5 | 9 | 7 | yes |
| 8 | One flight of stairs takes the work of two | 5 | 6 | 7 | yes |
| 9 | Water pressure doubles: 3 m deep feels like 6 m | 7 | 4 | 5 | readout under water |
| 10 | Waves, ripples and swings run 41 % faster (the splash ring races out) | 6 | 4 | 3 | in the motion only |

Also considered and dropped: a heavy bag sagging twice as far on its spring (too small), a pull-up that turns into a
dead hang (in the background at the change), bubbles rising faster (in the motion only), a hanging scoreboard (reads
as "building damage", which the override rules out).

Selected (7): the scale → the treadmill → the barbell → the free throw → the stairs → the pool (floating swimmers, the
ladder) → the dive. Escalation: what you feel → what you can't lift or keep up with → what you throw → where you
walk → the surprise that the water doesn't care → the payoff that uses both (a fall at 2 G into water at 2 G).

### 0.3 Three signature moments (unique to this episode)

- **A, first surprise (0–6 s):** looking down at a gym scale under your own hands, 70.0 kg; at 1.6 s it runs up to
  140.0. "You didn't gain a gram."
- **B, impossible-looking consequence (≈ 30–40 s):** in the pool hall everyone on the deck is flattened, while the
  swimmers float and swim as if gravity never changed; then a man tries to climb out and can't.
- **C, final payoff (story ≈ 45–60 s):** you float at the deep end; the diver on the 10 m tower steps off with a 1 G
  ghost beside her; 1.01 s, 71 km/h; you duck under and watch her plume drive deep and her float back up. Then you try
  to climb out yourself and can't: the water was the only place gravity didn't win.

### 0.4 What was wrong with v2 (from the override's checklist)

- **The three most repetitive sequences:** (1) 41.1–47.9 the tilt up to the airliner sinking over the rooftops
  (Oxygen, Air and No Air Resistance all have the airliner); (2) 26.9–41.1 the chain of street-construction failures
  (outrigger, scaffold, awning, water tank), which is the city-destruction template; (3) 55.1–68.7 the final drop onto
  a vehicle, the white flash and the look down at the dusty wreck.
- **The three most boring timestamps:** 19.5–22.8 (a low coupe makes a small spark far away), 47.9–51.1 (tired people
  and paramedics walk; nothing new happens), 37.1–41.1 (a static wall for 1.5 s before the tank bursts); 51.1–54.9
  (two hands on grey pavement) is close behind.
- **The weakest visual demonstration:** the truck's spring snap (24.0–26.1): the truck fills the frame, so the snap
  is heard, not seen.
- **The weakest part of the ending:** 62.1–68.7 a long look down at grey dust over a wreck: no person, nothing new,
  the closing lines on generic destruction.

### 0.5 Revised shot list (v2 → v3)

| v2 film s | Original shot | Why it feels repetitive | Proposed replacement | Why the replacement is more interesting |
|---|---|---|---|---|
| 0–3.1 | Sunny avenue; a kid hops; you hold a shopping bag | A street POV opening, like Oxygen, Friction, Air, Slow Sound, No Air Resistance, No Elasticity | Looking down at a gym scale between your hands, 70.0 kg, the title over it; it runs to 140.0 at the change | One number everyone knows doubles under your own hands: the rule in one picture in the first second |
| 4.2–12.6 | You set the bag down; the kid's 6 cm hop; an old man can't get up from a bench | Pedestrians buckling on a pavement (Oxygen's fainting crowd, Friction's slipping walkers); mostly static | A runner hanging on to the treadmill rails is carried off the back of the belt; a lifter and his spotter can't get an 80 kg bar off the safety arms | Gym machines are built around body weight; both are actions with a visible failure, one of them funny |
| 13.2–19.5 | A pallet of bricks falls 9 m onto a pickup | An object dropping onto a car: nearly every episode smashes a car | Through the glass, on the court: a free throw peaks below the rim and lands short; its 1 G ghost arc scores | A sport everyone has seen; the trajectory itself is the effect, with a direct 1 G comparison and no destruction |
| 19.5–26.1 | A low coupe scrapes a speed table; a truck's spring snaps | Cars on a street (Friction, Air, Slow Sound, No Air Resistance); the truck filled the frame | Down the open stair into the pool hall: every step jolts; a man halfway up has sat down on the steps | Stairs everyone climbs, made twice as hard; it also reveals the pool hall and the tower |
| 26.9–41.1 | Crane outrigger, scaffold, awning, water tank fail one by one | The city-destruction chain the override bans | The pool: everyone on the deck is flattened while the swimmers float exactly as before; a man on the ladder can't get out | The most counterintuitive physics in the film: gravity doubled and the water doesn't care |
| 41.1–47.9 | Tilt up to an airliner sinking over the rooftops | The airliner beat is in Oxygen, Air and No Air Resistance | You slide into the deep end: the weight is gone and your breathing slows; you look up at the 10 m tower | Relief instead of disaster, and it sets up the payoff |
| 47.9–54.9 | Tired people, paramedics; your knee gives, palms on the pavement | Exhausted pedestrians again; the hands read as "surrender" | The diver on the 10 m platform who can't face the stairs down | A person with a decision, at the height that matters |
| 55.1–62.1 | The hoist brake slips; 12 t falls 21.7 m onto a flatbed; a white flash | A big thing falls on a vehicle, flash, destruction | She steps off: 10 m in 1.01 s, 71 km/h, like a 20 m dive; you duck under: her plume drives deep and she floats back up | A human, not a machine, seen from inside the water; no destruction |
| 62.1–68.7 | Looking down at the wreck in the dust; the closing lines | "Camera looking down after the final impact" (banned) | You surface beside her; the pool settles; the closing lines over the water, the last one "Even the water." | A new image; the last line explains the pool |

Kept from v2: the rule and its numbers style, the opening title, the HUD's GRAVITY 1.0 → 2.0 G readout, the closing
pair of lines (with a third added), first-person hands (re-posed), the cast rig and the 2 G actions, the dust/particle
systems (now splashes and bubbles), the look list, the sound engine set-up.

## 1. Rules

| Item | This episode |
|---|---|
| Exact fictional rule | At story 1.6 s Earth's surface gravity goes from 9.81 to 19.62 m/s² (smoothly over 0.25 s) and stays there. |
| Held constant | Every mass and inertia; muscles; materials; the water's density; the air (see simplifications). |
| Changed | Weight m·g ×2 · free fall ×2 (times ×0.71, impact speeds ×1.41) · work against gravity m·g·h ×2 · hydrostatic pressure ρ·g·h ×2 · buoyancy ρ·V·g ×2 · wave and pendulum speeds ×1.41. |
| Real consequences (one per beat) | scale 70.0 → 140.0 kg (load cells measure force; calibrated for 1 G) · an 80 kg bar takes 1,570 N to hold (like 160 kg) · running: every stride lifts twice the weight; she can't hold the belt's pace · free throw (release 2.13 m, 6.99 m/s at 52°, 3.95 m to the rim): peak 3.68 m at 1 G (it scores), 2.90 m at 2 G, below the 3.05 m rim; it lands 3.5 m out · one floor (3.2 m): 4,390 J for 70 kg, the work of two floors at 1 G · floating: weight and buoyancy both double, the waterline stays where it was · leaving the water: your arms lift the full doubled weight · 10 m drop: 1.01 s (1.43 s at 1 G), 19.8 m/s = 71 km/h (50 km/h), the speed of a 20 m drop at 1 G · at 3 m depth the water pressure is what 6 m was. |
| Simplifications | The change is instant (0.25 s) and uniform. The atmosphere is left as it was (in reality the air would weigh twice as much and surface pressure would climb toward 2 atm: end note AIR PRESSURE CHANGES NOT SHOWN). Bodies only show load (no blood-pressure or fainting beat). The diver enters feet first and is unhurt (competitive high divers enter from 20 m and more). |
| Misconceptions to avoid | "You got heavier because you gained mass" (no: MASS STILL 70 kg) · "everything sinks in water now" (no: buoyancy doubles too) · "heavier things fall faster" (no: everything falls at 2 G) · "the diver hits concrete-hard water" (no: same water, twice the speed²/energy of a 10 m dive, like 20 m). |
| Must NOT claim | that mass changed · that this can happen (end note: FICTIONAL INSTANT GRAVITY CHANGE · MASSES UNCHANGED · AIR PRESSURE CHANGES NOT SHOWN) · exact running physiology (the treadmill is a plausible failure, not a measured one). |

## 2. The place (layout in metres)

`centre.js` (GvCentre, subclassing `Environment`): one leisure centre, sun from the left (−X), −Z is "ahead".
- **Gym (upper level, floor y 0)**: x −7 … 6, z 5 … −6, ceiling 3.4. Left wall: floor-to-ceiling windows (sun shafts
  on the floor). Right wall (x 6): glass onto the sports hall, posts at z −6, −3.0, 0.6, 5 (clear of the free throw's
  line of sight). Ahead (z −6): a glass balustrade over the pool hall and the head of the open stair. The body-scan
  scale at (0.6, 0.66) facing +Z, you on its platform at z 1.8; the treadmills along the windows (x −6.55 / −4.45);
  the bench-press rack at x 2.4, bar at z −2.4, the lifter's feet toward +Z (you look along the bench from his feet).
- **Sports hall (same level)**: x 6 … 24, z 10 … −6, ceiling 7.5; a basket on the far end wall (rim x 13, z −4.8,
  3.05 m); the shooter at z −0.55. You watch from the glass at (3.6, −0.6).
- **Pull-up bar (gym, by the court glass)**: a free-standing frame at (4.75, 0.6), bar 2.25 m up, running along Z.
- **Pool hall (lower level, deck y −3.2)**: x −14 … 14, z −6 … −38, roof at y 13; glazed left wall; the outside lawn
  only round the building (it used to run under the pool). The open stair (x 2.9 … 4.7) runs from the gym (z −6.0)
  down 16 risers to the deck (z −10.5); you hug the right rail (x 4.45), the seated man is on the left (x 3.3, z −8.4).
  The pool: x −12 … 2, z −8 … −30, water at y −3.32; 1.6 m deep to z −19, sloping to 5 m by z −21.5. The tower
  (x −7.4 … −1.6, z −34.6 … −30.6) stands beyond the far end; its 10 m platform edge at z −28.6, the diver at x −4.5.
  The lifeguard chair at (2.75, −16.6) facing −X; the ladder at (2.0, −22.6); you walk the deck at x 4.6 and slide in
  at (1.15, −20.6) (trimmed), float, duck under at (0.95, −20.9), surface near (0.6, −27.4), swim to the deep-end
  wall at (1.3, −29.48) and try to press out; a man kneels on the deck at (1.55, −32.5). The 5 m platform is
  cantilevered (its column was removed so it doesn't block the press-out).
- **Camera**: always your eyes. Height drops under the doubled weight; each stair step jolts; in the water your head
  rides the waves, then goes under.

## 3. Shot list (story seconds → film seconds after the trims)

`CONFIG.edit = [[0, 21.75], [23.45, 31.3], [34.0, 40.05], [42.85, 67.5]]`: three invisible trims (the walk to the
stair, the walk along the deck, the slide into the water) take the 67.5 s story to a 60.3 s film. Film = story up to
21.75, story − 1.7 to 31.3, story − 4.4 to 40.05, story − 7.2 after.

| # | Story | Film | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|---|---|
| 1 | 0–3.3 | 0–3.3 | Looking down at the scale between your hands: 70.0 kg; a woman curling dumbbells ahead. 1.6: gravity doubles, your knees dip, her dumbbells hit the floor, the scale runs to 140.0 | gym music, a treadmill; at 1.6 a deep whump, every weight in the room clangs down, gasps | TITLE · GRAVITY 1.0 → 2.0 G (live m/s²) |
| 2 | 3.3–6.3 | 3.3–6.3 | The display at 140.0, "HOLD STILL…" | scale beeps, your breath | THE SCALE 140.0 kg · YOUR MASS: STILL 70 kg · "You didn't gain a gram." |
| 3 | 6.0–9.3 | 6.0–9.3 | The runner clinging to the treadmill rails; she slips at 7.5, is carried off the back and sits down hard | belt whine, her effort, a thud | TREADMILL · 2× THE LOAD · "Every stride lifts twice the weight." |
| 4 | 9.3–15.4 | 9.3–15.4 | Along the bench from the lifter's feet: he and his spotter heave the 80 kg bar off the safety arms (11.0); it drops back with a clang and chalk (12.55) | strain voices, the bar trembling, the crash | BARBELL 80 kg · LIFTS LIKE 160 kg · AT 1 G 785 N · NOW 1,570 N · "Every weight in the gym just doubled." |
| 5 | 15.4–17.3 | 15.4–17.3 | Through the glass: a free throw peaks below the rim and lands short; the dotted 1 G ghost arc scores | the ball's thuds through glass, a groan | PEAK 2.90 m · RIM 3.05 m · AT 1 G 3.68 m · "The same throw falls short." |
| 6 | 17.3–21.75 | 17.3–21.75 | **New: the pull-up bar.** You reach up and hang (18.55): the camera sinks under your doubled weight, your arms shake as you try to pull up (19.55), your left hand peels off the chrome (20.55), you drop and land hard (21.05) | hands on chrome, the frame creaking, a long strain, the slip, the landing thud | DEAD HANG · YOUR GRIP HOLDS 140 kg · AT 1 G: 70 kg · "Just hanging on is like holding two of you." |
| 7 | 23.45–28.3 | 21.75–26.6 | Down the open stair, a man sat halfway with his hand on the rail; at 25.9 your knee gives on a step | heavy steps, the treads ringing, his breath | HIS CLIMB · ONE FLOOR · WORK OF TWO · 4,400 J · AT 1 G 2,200 J · "Every step down lands twice as hard." |
| 8 | 28.3–31.3 | 26.6–29.6 | From the stair foot: swimmers lying on the water exactly as before; everyone on the deck is flattened | the hall's echo, lapping water | FLOATING · SAME AS BEFORE · "But in the water, you float exactly as before." |
| 9 | 34.0–40.05 | 29.6–35.65 | Close (fov 40) on the ladder: a man climbs; slower and slower as he leaves the water; he stalls shaking at the top, his grip goes and he drops back in | his strain, water pouring off, the splash | LEAVING THE WATER · BUOYANCY GONE · HE LIFTS HIS FULL 2× WEIGHT · "Until you try to get out." |
| 10 | 42.85–44.6 | 35.65–37.4 | You're floating at the deep end (you've just slid in) | water off your face, a gasp | YOU, FLOATING · FEELS WEIGHTLESS · BUOYANCY = WEIGHT = 1,373 N |
| 11 | 44.6–47.9 | 37.4–40.7 | Up at the 10 m platform: the diver gets up off her knees, looks back at the stairs, walks to the edge | a low drone and a riser | "She climbed up before the change." · "So she jumps." |
| 12 | 47.9–48.91 | 40.7–41.71 | She steps off; a pale 1 G "ghost" diver falls beside her and is only halfway (5.0 m) when she hits | the hall hushes, air | FALL · 10 m · GHOST: 1 G · clock to 1.01 s · AT 1 G 1.43 s |
| 13 | 48.91–49.45 | 41.71–42.25 | Entry: a crown splash and white water; the wave rocks you | a heavy slap, the roar, the hall answering | 71 km/h · LIKE A 20 m DIVE AT 1 G · AT 1 G 50 km/h |
| 14 | 49.45–54.3 | 42.25–47.1 | You duck under: her bubble plume drives deep, then she floats back up through it | muffled roar, bubbles, your heartbeat | HER DEPTH 3 m · WATER PRESSURE ×2 · LIKE 6 m AT 1 G |
| 15 | 54.3–60.5 | 47.1–53.3 | **New ending: you try to get out.** You surface, swim to the deep-end wall, put both hands on the deck and press: you rise, shaking, a man kneeling on the deck ahead; at 59.15 your arms give and you drop back under, then up with a gasp | strokes, a rising strain, water pouring off you, the splash, muffled, the gasp | ON YOUR ARMS 0 → 98 kg (live) · AT 1 G: half |
| 16 | 60.5–67.5 | 53.3–60.3 | Floating again; you turn to her floating on her back; the hall, the windows | lapping water, a soft chord, plucks | "You didn't gain a gram." → "Everything just weighs twice as much." → "Even the water." · end note · GRAVITY 2.0 G · MASS UNCHANGED · fade |

## 4. Hero shots
- The scale at 140.0 between your hands (≈ 2.5).
- The free throw's two arcs, the real one below the rim (≈ 18).
- The swimmers floating beside people flattened on the deck (≈ 33).
- The diver in mid-fall against the tower, the water below (≈ 49; cover candidate).
- Under water: her plume and her rising toward the light (≈ 53).

## 5. Escalation check (a new event every 4–8 s; film seconds)
1.6 the change · 2.4 the scale at 140.0 · 7.5 the runner is carried off · 11.0 the heave · 12.6 the crash · 15.6 the
throw falls short · 18.6 you hang · 20.6 your hand peels · 21.2 you land · 22.4 the stair · 24.2 your knee gives ·
26.7 the floaters · 30.6 the ladder climb · 34.6 he drops back · 35.65 you float · 37.4 the diver · 40.7 she steps off ·
41.7 the hit · 42.3 under water · 47.1 surface · 49.7 you press · 52.0 your arms give · 53.4 the closing lines.
Longest gap between new events: 3.9 s (26.7 → 30.6).

## 6. Sound
`audio.js` (GvAudio, subclassing the locked AudioEngine; `audioEngine.js` untouched). Gym: music from ceiling
speakers, a treadmill belt, plates; at the change a deep whump and every weight hitting the floor. The court through
glass (muffled thuds). Your efforts: hands on the chrome bar, the frame creaking, a long strain, the slip and the
landing; the knee giving on the stair; the press-out (a rising strain, water pouring off you, the give, the splash,
a muffled half-second under, the gasp). The pool hall: long reverb, water lapping, voices, a lifeguard's whistle.
Under water: a low-passed world, the plume's roar, bubbles, your heartbeat. A drone and riser while the diver walks
to the edge, cut dead as she steps off. Closing: lapping water, one soft chord, plucks on the lines. Measured on the
spliced film mix: −16.5 LUFS integrated, true peak −1.3 dBFS, LRA 6.1 LU.

## 7. Systems / files

| File | What it holds |
|---|---|
| `script.js` | GV beats, the cut, the physics numbers (GV_FALL, GV_THROW), where you are, camera height/tilt/startles/shakes, hands, captions, readouts, closing lines |
| `centre.js` | GvCentre (subclass of Environment): the gym, the sports hall, the pool hall, the stair, the pool basin, the tower, the outside seen through the windows, sunny sky |
| `props.js` | GvScale (the display), GvTreadmill, GvBench (bar on the safety arms), GvHoop + the ball and its 1 G ghost, GvWater (the pool surface, ripples, the splash ring; seen from above and below), caustics |
| `cast.js` | people: looks (gym, swimwear, lifeguard), the 2 G actions (kept) plus new ones (run, cling, carried off, bench heave, spot, shoot, stair sit, float, swim, ladder, platform, fall), who is where |
| `fx.js` | splashes, spray, droplets, bubbles, light shafts under water, chalk dust (kept: puff texture, chunks, throw maths) |
| `audio.js` | GvAudio (see § 6) |
| `film.js` | FILM hooks: build, the look list, your hands on the grips / the pool edge / sculling, the floor under you (stairs), the water line, the under-water mode, the grade |

Dropped from the page (kept in git at `99692f2`): `city.js`, `site.js`, `traffic.js`, `air.js`. Their shared helpers
(`gvMesh`, `gvBox`, …) moved to `props.js`.

## 8. Review log (scores as given — never inflated)
**v3 round 1** (low-res preview of the first v3 cut, 62.8 s; five independent reviewers; scores as given):
- Retention: pacing 5 · escalation 4 · payoff 4 · overall **5**/10. Weakest: the dead walk to the stair, the slide in,
  a static text-only ending reusing v2's lines.
- Cinematography: composition 5 · camera motion 5 · lighting/grade 6 · VFX 5 · character animation 4 · phone
  readability 6 · overall visual **5**/10. Weakest: the hook, the bench and the basket hard to read on a phone.
- Normal viewer: keep watching 6 · understood 7 · would share 4 · overall **6**/10. Most likely swipe: 19–25 s.
- Physics: **8**/10 physics, 7/10 clarity of science (fixes: the floaters must lie passively, "weight ≈ 0" →
  "feels weightless", "pressure ×2" → "water pressure ×2", stair wording, the free throw is "the same throw").
- Creative differentiation vs Oxygen, Friction and the four sibling episodes: distinctiveness **6**/10, keep-watching
  5/10. Nothing recycled from the banned template; closest echoes were the v2 closing lines and a "walk + look" rhythm.

**Top 3 problems and the fixes (v3 final):**
1. *Dead stretches and a static ending* → three trims (`CONFIG.edit`, −7.2 s: the walk to the stair, the deck walk,
   the slide in); a new first-person ending where you try to press yourself out of the pool and fail (live "ON YOUR
   ARMS" readout 0 → 98 kg); new closing lines ("You didn't gain a gram." / "Everything just weighs twice as much." /
   "Even the water.").
2. *Key gym beats unreadable on a phone* → the hook reframed (the scale display larger and fully in frame),
   the bench rack simplified and the viewpoint moved, the hoop kept in frame (fov 62), "LIFTS LIKE 160 kg".
3. *A small climax and no "suspended load"* → a new first-person dead hang on a pull-up bar (your grip holds 140 kg,
   your hand peels, you drop); the dive pushed in with a 1 G ghost diver falling alongside (she hits while the ghost
   is halfway) and a bigger crown splash.
Plus the physics wording fixes above. The final was not re-scored by the reviewers after these fixes.


## 9. v2 (superseded): the street film
Full v2 plan, shot list and review log: `git show 99692f2:films/gravity-2x/PLAN.md`. Round-1 scores of the v2
preview (as given): retention 5, cinematography 5.5, normal viewer 5, physics 7. The v2 final (68.7 s) was delivered
on 2026-10-08 and not re-scored after its fixes.
