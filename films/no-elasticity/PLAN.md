# WHAT IF EVERYTHING LOST ITS ELASTICITY? — production plan

A 60.6-second vertical (9:16, 1080×1920, 30 fps) first-person film on the shared engine, in the Oxygen/Friction format:
centred serif title over a moving scene, a top-left readout, short serif captions, a new consequence every 5–8 s.
Brief: `docs/briefs/` (Developer 3, 2026-10-07).

**v2 (2026-10-08, the owner's creative direction override):** the street, car, truck, footbridge and crash beats are gone.
The film now runs: a Newton's cradle that stops passing the hit along → everyday things that keep every dent → the
trampoline → a bow whose arrow drops → a tuning fork that goes "tk" → your watch stopped one second into the video → inside
it, the quartz tuning fork is still → every quartz clock stopped → a time-lapse of the plaza that keeps the shape of the
whole day while its clock never moves → night on the stopped clock. Why and how: `REDESIGN.md`. The v2 shot list is §3b;
§2–§7 below describe the v1 cut (its code is still in the repository, switched off by `NE_STREET`). Film time = story
time in v2 (no `CONFIG.edit`).

**Status (2026-10-08):** v1 delivered in the morning (60.2 s). v2 redesign built, reviewed (§8, round 5) and rendered;
delivery details in `EPISODE_REPORT.md`.

**Story clock and the cut.** Camera, script, props, cars and sound all run on one 73.6 s story clock (the times in this
plan are story times unless marked "film"). `CONFIG.edit` drops the waits (story 18.2–21.6, 26.9–33.6, 40.8–42.2,
47.6–52.8) and plays the crash, story 53.35–55.0, at a third of real speed. Film length 60.2 s. Film time = story time up
to 18.2, −3.4 s to 26.9, −10.1 s to 40.8, −11.5 s to 47.6, −16.7 s to 53.35, (slow motion: film 36.65 + 3 × (story − 53.35))
to 55.0, and −13.4 s after 55.0.

## 1. Rules

| Item | This episode |
|---|---|
| Exact fictional rule | Solids lose **elastic recovery**: they still resist being deformed (stiffness and strength are unchanged), but once deformed they never spring back. Every solid behaves as perfectly plastic. |
| Held constant | Gravity, mass, momentum, air, water, **living tissue** (muscles, tendons, bones, skin behave normally), engines, electricity. **Gases are still springy**: tyres stay round and the bus's air suspension still works. |
| Changed | Rubber, foam, steel springs, strings, fabric webbing, structural steel and concrete: any deformation beyond what they already have becomes permanent. |
| Real consequences (one per beat) | Ball lands and stays down with a flat spot · racket strings stay stretched · shoe foam stays crushed · cushion keeps the dent · rubber band stays long and slack · trampoline springs stay stretched, the mat stays down · car springs ratchet lower at each bump · a loaded truck's rear springs end on their bump stops · a footbridge keeps the deepest dip a running club gave it · a collision is perfectly inelastic: the cars crumple, stay locked and slide off as one · even a 5 km/h tap leaves a bumper pushed in · the street ends tired and low. |
| Simplifications | A load no bigger than one already taken adds nothing (the deformation is the running maximum); only a larger or dynamic load adds permanent set. Spring set per table event is a fixed amount × a load factor (climb 4.2 cm, land 3.4 cm; the loaded truck's rear axle ×1.45, its front ×0.35), capped at the bump stop (hatch 10 cm, truck 12.5 cm). Bumps are displacement-driven, so each one ratchets the set further (the wheel is forced up by the table whatever the spring did before); the footbridge is force-driven, so it keeps the running maximum of its load. The ball is solid rubber (no air inside), so it is honest that it stays flat; its flat spot is 10 % of its diameter. The footbridge sag is the running max of Σ 0.23 mm × (1 − (x/11)²) per person (×1.8 for a runner's footfalls), real values shown in the readout, the picture drawn 300× deeper and labelled so. Engines are spared (valve springs would set too): the closing note says so. Closed-cell shoe foam holds gas, which still pushes back a little: the plate says the foam *mostly* stays crushed. |
| Misconceptions to avoid | Elasticity is **not** bounciness: it is returning to shape. Rigid things do not turn soft; buildings do not liquefy; engines do not explode; bodies do not go limp. A crash without elasticity is not "safer": nothing springs back, so the cars stay jammed. Real crashes only rebound a little (e ≈ 0.1–0.2), so the counter-intuitive kicker is the 5 km/h tap, a speed bumpers are built to shrug off. |
| Formulas / numbers used | Perfectly inelastic collision: one common velocity after contact, momentum and angular momentum conserved (SUV 2000 kg at 34 km/h into a 1450 kg sedan at 36 km/h; a 2100 kg van at 43 km/h piles in at story 54.86; 30 % of the spin lost to tyre scrub, 6.2 m/s² tyre drag afterwards). Coefficient of restitution e = 0. The tap: 1.4 m/s (5 km/h) at contact after braking from 10 m/s at 6 m/s²; hatch front pushed in 5 cm, van tail 2 cm; then the hatch backs off 45 cm so the gap shows. Ride height loss shown live. |
| Must NOT claim | That tyres go flat (the air inside is still springy). That the bus kneels (air suspension). That people collapse. That buildings fall. That this could really happen (the closing note says it is a fictional rule). |

Open comment questions we leave on purpose: mattresses, bones, tyres, watch springs, rubber seals, earthquakes, bridges.

## 2. The place

One sunny avenue (14 m, two lanes each way, kerbs 0.15 m), a raised **speed table** (brick crosswalk, 9 cm) at z −10.4 …
−17.6, a junction at z −39 … −53 with signal masts, a steel **footbridge** at z −86 (deck 6.2 m, 22 m span between two
stair towers). On your side (x > 7) a small paved plaza: a round **trampoline** at (19, −12.5), a hoop, planters, a café
front with a cushioned bench at (12.08, 3.2).

You stand by the plaza at (11.4, −2.9) for the ball, the montage and the trampoline; at the kerb (8.3, −2.1) for the traffic
(the move is inside a cut), then step back toward the plaza (9.7, −1.5) for the ending.

## 3. v1 shot list (the first delivered cut; story seconds, film seconds in brackets)

| # | Time | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|---|
| 1 | 0–5.6 [0–5.6] | **Hook.** A teenager bouncing a solid rubber ball on the plaza; recovery drains under the title; the next landing (1.45) stays down. Cut low beside the ball, just above the paving (1.75): its flat bottom on the ground, a dashed arc over its old round top. | Rubber thocks, a hit as the rule bites, a dip, one dead thud. | **TITLE** (to 3.5) · SHAPE RECOVERY 100 % → 0 % · NOTHING SPRINGS BACK · tag WHERE ITS TOP USED TO BE · *A solid rubber ball hits… and doesn't come back up.* · *It squashes. It stays squashed.* |
| 2 | 5.6–13.4 [same] | **Everyday things** (four close inserts, ~2 s each): racket strings stay stretched; a shoe's foam stays crushed under a dashed line; a cushion, seen from above, keeps the dent; your hands stretch a rubber band once and it stays slack. | Thup, foam squelch, bench creak, rubber creak (no snap). | Label plate on each. |
| 3 | 13.4–18.2 [same] | **Trampoline.** A kid jumps on: the mat stays down in a funnel; his second hop is an ordinary hop on his own legs that lands dead. | The mat sinks with one dull whump, no boing; the kid's "oh?". | *Even things built to bounce back…* · tag SPRINGS STRETCHED · MAT STAYS DOWN · *Bodies are fine. Their gear isn't.* |
| 4 | 21.6–26.9 [18.2–23.5] | **The red hatch.** It comes toward the table; cut low beside its front wheel (23.3): up, up, down, down; the body settles below a dashed line that tilts with the road. | Engine, thumps on the climbs, clunks on the landings. | RIDE HEIGHT LOST 0 → 8 cm · NEARLY ON ITS BUMP STOPS · tags WHERE THE BODY USED TO SIT, SPRING STAYS SQUASHED · *Suspension is mostly springs…* / *…so every bump leaves it lower.* |
| 5 | 33.6–40.8 [23.5–30.7] | **Low cars, then the truck.** From the kerb (tighter lens) two low cars crawl over the table, sparks spraying from under them; a loaded box truck comes past; side-on beside its rear axle (36.5), the box drops below a dashed line and ends on its bump stops; it drives off tail-low. | Scrapes, engines, the truck's heavy landing. | *A few bumps later, they scrape on every one.* · *A loaded truck runs out of travel even sooner.* · TRUCK'S REAR DROP 0 → 6 → 11 cm · tags WHERE THE BOX USED TO SIT, REAR SPRINGS · ON THE STOPS |
| 6 | 42.2–47.6 [30.7–36.1] | **The footbridge**, face-on from high over the avenue, the whole span and both stair towers in frame, a slow push: a running club crosses; the deck dips and keeps the dip. | Dull thumps of feet on the deck. | FOOTBRIDGE SAG → 7.2 mm · IT KEEPS ITS DEEPEST DIP · tags WHERE THE DECK WAS, SAG DRAWN 300× LARGER · *Bridges flex a little, all day…* / *…now each one keeps the shape of its worst day.* |
| 7 | 52.8–59.4 [36.1–46.0] | **Payoff: the crash**, from 5.5 m up behind the SUV: it runs the red into the sedan's flank (1/3 speed, film 36.65–41.6), they crumple, lock and slide off as one. At the van's hit (54.7) cut to a slow high arc round the wreck from the side the van comes in. | Dry tyre scrub (no horn), slowed crunch, dry glass, the van's hit, steam. | *Crashed cars normally rebound a little…* / *…these don't. They stay jammed together.* · SEPARATION SPEED 0 m/s · NORMALLY ABOUT 1 m/s · *Three cars. One wreck.* (on the arc) |
| 8 | 59.4–63.4 [46.0–50.0] | **The tap.** Wider at first: a late hatch brakes behind the wreck and touches the van at 5 km/h, backs off; the camera pushes in, centred on its nose, a dashed line where its front was. | Tyre scrub, a small dull crunch. | IMPACT SPEED 5 km/h · NORMALLY: IT SPRINGS BACK · tag BUMPER PUSHED IN · STAYS IN · *Now even a tap leaves a dent.* |
| 9 | 63.4–73.6 [50.0–60.2] | **The tired street** for a beat, then low beside the flat ball again (65.3 [51.9]), the same pose as the opening insert, its dashed arc back, slowly pushing in to the end (the opening, looped). | Quiet air, the closing chord. | SHAPE RECOVERY 0 % · *Without elasticity…* / *…almost nothing gets a second chance to return to shape.* · note *Fictional rule: solids never spring back. People, air, water and engines work as normal.* |

## 3b. v2 shot list (as built; film seconds)

| # | Time | What we SEE | What we HEAR | Caption / HUD |
|---|---|---|---|---|
| 1 | 0–1.75 | **Hook.** Seated at a café table under the title: a Newton's cradle clacks (0.15, 0.62, 1.09); a red quartz desk clock beside it takes its last step at 1.0 (3:41:51 → 3:41:52). At 1.56 the end ball swings back and nothing flies out: the row shoves along together. | Three bright clacks, two ticks (the second the last), a low hit and a slack, falling tone as the rule bites, then one dead "tock". | **TITLE** (to 3.5) · SHAPE RECOVERY 100 % → 0 % (1.0–1.45) · NOTHING SPRINGS BACK |
| 2 | 1.75–5.6 | Low insert beside the cradle: the five balls swing a little as one; from 3.3 a yellow ghost ball and dashed string where the far ball should have flown. | Café room tone. | *A Newton's cradle passes the hit along by springing back…* · *…so now the balls just shove together.* · tag NORMALLY, THIS ONE FLIES OUT |
| 3 | 5.6–13.4 | **Everyday things** (four close inserts): racket strings stay stretched (the ball barely leaves them); shoe foam stays crushed; a cushion keeps the dent; your hands stretch a rubber band once. | Thup, foam, bench, rubber rustle (no snap). | A label plate on each. |
| 4 | 13.4–18.2 | **Trampoline.** A kid lands; the mat stays down in a funnel. | One dull whump, no boing; "oh?". | *Even things built to bounce back…* · *Bodies are fine. Their gear isn't.* |
| 5 | 18.2–21.2 | **The bow**, first person at eye level: nock, draw, aim at a target 14 m away, let go. The string goes limp, the limbs stay bent, the arrow falls off the bow. | A soft creasing (no creak), a held breath, a soft "fwup" (no twang), one dry clatter. | *A bow is a spring you bend by hand…* / *…and nothing bends it back.* · LAUNCH SPEED 0 km/h · NORMALLY ABOUT 200 km/h |
| 6 | 21.2–23.4 | Low, just behind the fallen arrow's nock, along it to the untouched target. | A breath of wind. | *The arrow just falls.* |
| 7 | 23.4–27.3 | **The tuning fork**, at the café table: you slap its prong flat on the table top; bring it up: the prong stays bent in, a dashed line where it was. | Far voices; one dead "tk"; nothing. | *Tuning forks ring by springing back.* / *This one just goes “tk”.* · TUNING FORK 440 Hz → SILENT · tag STAYS BENT · DRAWN 10× BIGGER |
| 8 | 27.3–30.9 | **Your watch**: you raise your left wrist; it says 3:41:52. | The sleeve; no tick. | *Your watch stopped too…* / *…one second into this video.* |
| 9 | 30.9–37.3 | **Inside the watch** (macro): the dial lifts away; past the gears down to the quartz crystal in its can, cut open; yellow ghost prongs show its normal vibration, then stop. | A whoosh down, a low drone, a thin fast whine for the ghost that stops dead, a soft thump. | *Inside it: a quartz tuning fork, smaller than a grain of rice.* / *It keeps time by springing back 32,768 times a second.* · QUARTZ CRYSTAL 32,768 Hz → 0 Hz · *No spring-back. No tick.* |
| 10 | 37.3–40.9 | **The plaza clock** face-on, stopped at 3:41:52; the camera rises. | A low boom. | EVERY QUARTZ CLOCK 3:41:52 · *Every quartz clock on Earth stopped at the same instant.* · *So did every phone and computer.* |
| 11 | 40.9–55.6 | **Time-lapse** from above the plaza, the stopped clock in front: shadows sweep, people stream through. Inserts: the trampoline (44.9–47.3) sinks deeper only when someone heavier lands; a tree (47.3–49.6) leans further with each stronger gust, a dashed line where its trunk stood. Dusk: lamps and the clock's dial light up. | A rush into fast time, sped-up voices, gusts, dull landings, a pulse of plucked notes that climbs and slows at dusk, crickets. | THE CLOCKS SAY 3:41 PM · THE REAL TIME 3:42 → 9:05 PM · *The clocks stay at 3:41. The day doesn't.* · *And everything people use keeps the shape they leave it in.* · *The trees keep every gust.* · *Without elasticity…* / *…almost nothing gets a second chance to return to shape.* |
| 12 | 55.6–60.6 | **Night** on the lit plaza clock, still at 3:41:52, drifting in; fade at 60.6. | Crickets, the closing chord, one last quiet tick. | Note (fictional rule) · *Now watch the clock in the first second.* |

## 4. Hero shots

The low close-up of the flat ball with the dashed arc over its old top (cover candidate; doesn't spoil the payoff) · the
rubber band hanging slack between your fingers · the trampoline funnel · the wheel close-up below its tilted dashed line ·
the truck's box below its line · the footbridge face-on with its dashed original-deck line · the crash from high behind the
SUV · the high arc round the three-car wreck · the tapped bumper behind its line.

## 5. Escalation check (film seconds)

Consequences start at 1.45 (ball), 5.6, 7.55, 9.5, 11.45 (montage), 15.98 (trampoline), 20.2–23.1 (the hatch's four
events), 23.8–26.3 (scraping cars), 26.9 / 28.8 (truck), 31–34 (bridge), 37.4 / 41.2 (crash), 47.5 (tap), 50.6 (ending).
No gap is longer than ~4 s.

## 6. Sound

`films/no-elasticity/audio.js` (an AudioEngine subclass): street bed and birds, footsteps, the ball then the dead thud,
the rule hit with a slack-string glide, montage foley (a rubber-band rustle, no snap), one dull whump as the trampoline mat
sinks, engines per car, table thumps and clunks, scrape loops, the bus's air-brake hiss, dull feet on the bridge deck, the
crash layers (dry tyre scrub, no horns), the tap, music pads and a closing chord. Nothing rings, groans or creaks for long:
those are solids vibrating elastically. The bed and music dip for half a second before each dead hit. Mixed to about −16 LUFS, true peak under −1 dBTP.
Baked to `soundtrack.js`.

## 7. Systems / files

| File | What |
|---|---|
| `script.js` | Beats `NE`, camera, hands, captions, readouts, the cut. |
| `city.js` | `NeCity` (Environment subclass): avenue, speed table, plaza, footbridge, signal mast, lamps; vertex-shader bending (sag, droop, lean) driven by `neSag`, `neDroop`, `neLean`. |
| `props.js` | Ball, round trampoline (funnel mat + springs), racket, shoe, cushions, rubber band. |
| `cars.js` | `NeCar` (permanent spring set per axle event, coils, crush), `neLane`, the crash solver `NE_CRASH`, `NeTraffic`. |
| `cast.js` | People, film actions (`ne…`), shadows. |
| `film.js` | Build, cinematic shots, world-pinned tags, the sill and deck lines, grade. |
| `audio.js` / `soundtrack.js` | Sound and its bake. |

No engine files changed.

## 8. Review log

Scores exactly as given (out of 10).

**Round 1** (71.6 s first cut; four independent reviewers on 1 fps contact sheets + the brief): retention 4.5, normal
viewer 5, cinematography/3D 5, physics 5. Main findings: weak, distant hook; the jogger beat unreadable; the wheel's drop
invisible; dead air at film 31–34.5 and 51.4–53.35; the footbridge sag invisible and its numbers wrong; the crash hidden
behind the sedan; the payoff not counter-intuitive (real crashes barely rebound); a basketball contradicts "air unchanged";
"springs stopped pushing back" contradicts the rule; the truck dragging was wrong; the signal arm wilted; engines would
stall; the closing note too small. All were addressed in the second cut (see §1 and §3).

**Round 2** (60.8 s second cut; same four roles, same method): physics 7, retention 5.5, normal viewer 5.5,
cinematography 5. Main findings: the hook ball too small and under the caption; the car and truck shots static and
repetitive; the bridge too long and "7 mm" kills the scare; the crash partly off-frame and hidden by dust; the tap's dent
invisible; a weak ending. Physics: the trampoline too deep, "NORMALLY: NO DAMAGE" wrong, dents too big, ringing deck
steps, a stuck horn and spring groans contradict the rule (a horn is a vibrating plate). All addressed in cut 3.

**Round 3** (60.4 s third cut): physics 8, retention 5.5, cinematography 5.5, normal viewer 5. Main findings: the ball
close-up looked round and floating (its camera was below the plaza paving); the crash's contact hidden and washed out by a
white flash; the bridge too small, dark and static; "cars scrape on everything" with no scraping visible (and an
overclaim); the tap's dent off-centre; the ending a static back view. Physics: "REBOUND SPEED 0 m/s" while the wreck slides
reads wrong (now SEPARATION SPEED); closed-cell foam would recover a little ("mostly stays crushed"); the ball should be
called solid; sustained groans and tyre squeals are solids ringing (now dull rumbles and dry scrubs). Addressed in cut 4.

**Round 4** (60.2 s fourth cut): physics 8, retention 6, cinematography 6, normal viewer 5. Main findings: the hook's
flat spot barely reads at phone size; the car, scraping cars and truck repeat one idea; the bridge is thin and "7.2 mm" is
an anticlimax; the crash camera, straight behind the SUV, hides the contact; the wreck arc is too tight and "Three cars.
One wreck." comes before the third car is visible; the tap's nose sits at the frame edge; the empty street at film 50–53
is dead air; the teenager's sitting legs look broken; the closing note in capitals reads like fine print ("ENGINES
SPARED?"); "Bouncing is only the beginning" is followed by more bouncing; a red tag sits on the red car; tags touch the
frame edge. Physics: a loaded truck does not sink faster, it runs out of travel sooner; creaks and long rumbles are solids
vibrating, so they should be dull whumps; sparks at crawling speed are debatable; "jammed together" is more exact than
"locked"; braking dive would also set the late hatch's springs.

Fixed in the final polish (not re-scored): the street shot cut short and the end moved to 65.3, back on the opening
insert's pose so the film loops (the legs out of frame); captions rewritten ("Even things built to bounce back…", "runs out
of travel even sooner", "They stay jammed together"); "Three cars. One wreck." moved onto the arc; the crash camera moved
off-axis with its aim on the contact; the wreck arc wider and higher; the tap's nose centred; tags clamped inside the frame
with a dark plate on the red car; the trampoline groan is one short whump and the bridge's long groan is gone; the note is
in plain words and sits higher.

Still weak (honest): the ball's flat spot is subtle at phone size; the footbridge is still thin in the frame; the scraping
sparks are barely visible (and debatable at crawling speed); the montage reads as a list; the rubber-band hands look odd;
the van's tail is a blank slab; the late hatch shows no braking dive; an 18 cm solid rubber ball is heavy to dribble; the
car and truck beats feel alike. The sound has only been level-measured, never listened to.
