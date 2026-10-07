# What if air became 10× denser? — master build prompt (short-format experiment; contains the "best-performing so far" note)

> Verbatim owner brief, archived so later developers can check the rules and quotes in `docs/`. Owner's words, unedited
> (chat-only lines like "send the video when done" kept as written). Where a newer brief or `docs/` disagrees, the newer one wins.

````text
MASTER BUILD PROMPT
PROJECT: WHAT IF AIR BECAME 10× DENSER?
FORMAT: 42–50 SECOND CINEMATIC POV PHYSICS SIMULATION
ENGINE: HTML + JavaScript + Three.js / WebGL

==================================================
ROLE
==================================================

You are my:

- lead Three.js developer
- physics simulation designer
- technical director
- cinematographer
- first-person POV designer
- VFX designer
- sound designer
- short-form retention editor
- scientific reviewer
- production director

Your job is to BUILD the actual experience.

Do not merely describe how it could be made.

I am a beginner.

Keep manual work minimal.
Write and maintain the code yourself.

Reuse our established What Happens If production systems wherever possible:

- renderer
- POV camera
- deterministic timeline
- HUD
- serif captions
- atmosphere/fog
- vehicles
- NPCs
- post-processing
- sound manager
- recording controls
- low-poly city assets

Do NOT rebuild the engine unnecessarily.

==================================================
WHY THIS VIDEO IS DIFFERENT
==================================================

We have learned something important from previous uploads.

The best-performing video so far was:

WHAT IF OXYGEN DISAPPEARED?

That concept worked because:

ONE invisible physical property changed

and then caused MANY DIFFERENT surprising consequences.

The weaker cosmic videos were visually large,
but more predictable.

Therefore this video must NOT simply be:

dense air
→ strong wind
→ destruction.

Instead it must constantly reveal:

“WAIT, DENSER AIR CHANGES THAT TOO?”

The viewer should discover at least FIVE distinct consequences.

==================================================
CORE QUESTION
==================================================

WHAT IF AIR
BECAME 10× DENSER?

The scenario isolates aerodynamic effects.

We are NOT attempting to realistically simulate every thermodynamic consequence
of making atmospheric air ten times denser.

For this hypothetical:

AIR DENSITY = 10× NORMAL

while:

- gravity stays normal
- temperature stays approximately normal
- breathing remains survivable during the simulation
- atmospheric pressure consequences are intentionally excluded
- chemical composition remains usable

This is a fictional physics override designed to isolate aerodynamic effects.

Do not pretend this constraint could naturally exist.

At the end, if needed:

“Aerodynamic effects isolated for this simulation.”

Keep that small.

==================================================
CORE PHYSICS
==================================================

Aerodynamic drag:

F_drag ≈ 1/2 ρ Cd A v²

Therefore:

if density becomes 10× larger,

at the SAME speed and same object orientation,

aerodynamic force becomes approximately 10× larger.

IMPORTANT:

Do NOT turn this into:

“everything moves 10× slower.”

That is wrong.

Actual motion depends on:

- speed
- mass
- shape
- frontal area
- drag coefficient
- applied forces

==================================================
SECOND IMPORTANT PHYSICS RULE
==================================================

Terminal velocity roughly scales as:

v_terminal ∝ 1 / sqrt(ρ)

Therefore:

10× air density

would reduce terminal velocity to roughly:

1 / sqrt(10)
≈ 0.316×

for the same object / posture.

Do not put the equation on screen.

Use it to guide animation.

==================================================
THIRD IMPORTANT PHYSICS RULE
==================================================

Wind force uses the same dynamic-pressure principle.

A wind of:

60 km/h

in air 10× denser

can exert approximately the same aerodynamic pressure as normal-density wind
moving about:

190 km/h

because:

v_equivalent ≈ sqrt(10) × v.

THIS is one of the strongest surprising facts in the video.

Use it.

==================================================
TARGET LENGTH
==================================================

Target:

44–48 seconds.

Hard maximum:

52 seconds.

Do NOT make another 70–90 second film.

Every second must earn its place.

==================================================
RETENTION PHILOSOPHY
==================================================

Do NOT structure this as:

hook
→ explanation
→ destruction.

Structure it as:

MYSTERY
→ ANSWER
→ NEW MYSTERY
→ ANSWER
→ BIGGER CONSEQUENCE
→ DESTRUCTION

Every 3–5 seconds:

NEW physical consequence.

The viewer should repeatedly think:

“Wait, that changes too?”

==================================================
OPENING STRATEGY
==================================================

Do NOT begin with random catastrophic destruction.

The Moon video taught us that spectacle alone does not guarantee retention.

Instead use a COUNTERINTUITIVE COLD OPEN.

Frame one should contain something physically surprising.

==================================================
0:00–0:03 — COLD OPEN / MYSTERY
==================================================

POV standing on a city street.

HUD:

WIND SPEED
60 KM/H

AIR DENSITY
10×

But the environment looks like it is being hit by a violent hurricane.

Trees bent heavily.

Large sign flexing.

Umbrellas flying.

Pedestrians bracing.

Loose street objects moving.

A billboard mount visibly straining.

CENTERED:

WHAT IF AIR
BECAME 10× DENSER?

The viewer should immediately think:

“Why is only 60 km/h wind doing this?”

That is the hook.

Title stays visible approximately 2.5–3 seconds.

==================================================
0:03–0:05 — REWIND
==================================================

Fast cinematic rewind.

Signs straighten.

Objects return.

Wind calms.

Text:

15 SECONDS EARLIER...

Normal city.

Do not spend more than ~2 seconds here.

==================================================
0:05–0:08 — DENSITY CHANGE
==================================================

Normal city.

HUD:

AIR DENSITY
1.0×

then:

2×
5×
10×

No giant fog explosion.

No magical visual wave.

The air itself remains visually ordinary.

The strange consequences reveal the change.

Caption:

“The air would still look normal.”

Beat.

“But moving through it wouldn’t.”

==================================================
0:08–0:12 — THROWN OBJECT
==================================================

Someone throws a lightweight ball / frisbee / paper object.

It launches normally.

Then rapidly loses speed.

Falls far shorter than expected.

POV tracks it.

HUD briefly:

AIR DRAG
↑ ~10×

Caption:

“Anything moving fast would fight far more air.”

This is the first satisfying physics demonstration.

==================================================
0:12–0:16 — RUNNER / CYCLIST
==================================================

A cyclist accelerates.

At low speed:
looks mostly normal.

At higher speed:
they struggle hard.

Body leans forward.

Pedaling increases.

Speed barely rises.

Show the difference visually.

Do NOT make them freeze in place.

Caption:

“The faster you move…”

“…the worse it gets.”

This teaches the v² relationship without saying v².

==================================================
0:16–0:21 — CAR
==================================================

A car is already moving fairly quickly.

Driver lifts off the accelerator.

The vehicle loses speed far faster than expected.

Then engine accelerates again.

It can still move,
but sustaining high speed requires dramatically more power.

HUD:

SPEED
90 → 65 → 45 KM/H

AIR DENSITY
10×

Do NOT make the engine die.

Do NOT make the vehicle stop instantly.

This is aerodynamic drag,
not invisible glue.

==================================================
0:21–0:25 — FALLING OBJECT
==================================================

Camera hears something above.

Looks up.

A large lightweight panel / sheet / cardboard box falls from construction.

But it falls strangely slowly.

Its terminal velocity is much lower.

It drifts strongly.

A dense metal object falls beside it much faster.

THIS IS IMPORTANT.

Show two objects with different area-to-mass ratios.

Viewer learns:

shape and mass matter.

Caption:

“Even falling changes.”

This should generate comments.

==================================================
0:25–0:29 — THE REALIZATION
==================================================

Wind begins picking up.

Not huge.

HUD:

WIND
30 KM/H

Tree movement already looks stronger than expected.

Then:

WIND
50 KM/H

Street objects react dramatically.

Caption:

“And then there’s wind.”

Small secondary HUD:

10× DENSITY
≈ 10× AERODYNAMIC FORCE
at the same speed.

Keep this brief.

==================================================
0:29–0:34 — THE SURPRISING NUMBER
==================================================

HUD:

WIND
60 KM/H

Then:

NORMAL-AIR FORCE EQUIVALENT
≈ 190 KM/H

This is the main “WAIT WHAT?” moment.

Do NOT make it an infographic.

Show destruction behind the number.

Awnings strain.

People brace.

Branches bend.

A light sign tears partly loose.

Caption:

“A normal gale could hit like a violent storm.”

==================================================
0:34–0:40 — DESTRUCTION ESCALATION
==================================================

Now escalate rapidly.

Hero events:

1. large umbrella ripped away
2. street sign bends / mount fails
3. cyclist blown sideways / forced to stop
4. roof panel lifts
5. tree branch breaks
6. trash/bin/debris moves dangerously

Do NOT animate everything at once.

Sequence events clearly.

Each should follow from:

high area
low mass
weak anchoring.

==================================================
0:40–0:45 — BIG PAYOFF
==================================================

Return to the billboard seen at frame one.

This is important continuity.

Earlier:

it was harmless.

Now:

mount bolts / structure visibly strain.

Wind:

60 KM/H.

Air:

10× DENSITY.

Billboard finally tears loose.

Large panel swings/falls across street.

Car swerves/brakes.

Glass / debris.

POV reacts.

The same 60 km/h wind from the opening now makes sense.

==================================================
0:45–0:49 — FINAL SHOT
==================================================

POV looks down the avenue.

The whole city is being battered.

Trees.

Signs.

Fabric.

Loose debris.

People sheltering.

Vehicles slowed.

HUD:

AIR DENSITY
10×

WIND
60 KM/H

Caption:

“Same wind speed.”

Beat.

“Ten times the air.”

Large object/debris crosses close to camera.

CUT.

==================================================
OPTIONAL LOOP
==================================================

Use the debris crossing frame to hide a seamless loop.

End:

dark panel sweeps across entire screen.

Beginning:

panel clears,
revealing the original chaotic cold-open shot.

No obvious “subscribe for part 2” ending.

No cheesy unfinished sentence.

==================================================
WHY THIS STRUCTURE WORKS
==================================================

The escalation is:

1. Wind mystery
2. Thrown object
3. Cyclist
4. Car
5. Falling object
6. Wind-force realization
7. Structural damage
8. Billboard failure

Every consequence is DIFFERENT.

This matches the successful Oxygen format:

one simple rule
→ many surprising physical effects.

==================================================
COMMENT-BAIT WITHOUT MISINFORMATION
==================================================

Do NOT intentionally include errors.

But leave natural questions unanswered.

The video should make viewers wonder:

- What about airplanes?
- What about skydivers?
- Could you still run?
- Would cars use more fuel?
- Would birds fly better or worse?
- What about bullets?
- What happens to sound?
- What happens to helicopters?
- Would parachutes become insanely effective?

Do not answer all of those.

We want scientifically defensible core content that naturally creates discussion.

==================================================
DO NOT INCLUDE AIRPLANES IN THIS VIDEO
==================================================

Aircraft aerodynamics in 10× denser air become complicated because both:

LIFT
and
DRAG

change.

Propulsion also changes.

Do not casually show planes crashing.

Save aircraft for comment discussion or a separate follow-up.

==================================================
DO NOT INCLUDE SOUND-SPEED CHANGES
==================================================

Our hypothetical isolates aerodynamic density.

Do not randomly change:

speed of sound
voice pitch
sound delay

unless separately derived from the defined thermodynamic scenario.

Keep sound propagation normal for this simulation.

==================================================
VISUAL STYLE
==================================================

Use the established channel style:

POLISHED CINEMATIC LOW-POLY POV SIMULATION.

Target:

70% polished POV reference
30% atmospheric/gritty reference.

Need:

- authored assets
- coherent low-poly world
- atmospheric depth
- strong silhouettes
- subtle vignette
- cinematic lighting
- good contact shadows
- restrained fog
- serif title/captions
- minimal HUD

DO NOT:
- rebuild the art direction
- spend multiple passes changing fog saturation
- make it Roblox
- make it photorealistic
- make the street empty

The production priority is:

PHYSICS
PACING
MOTION
DESTRUCTION
CLARITY.

==================================================
ENVIRONMENT
==================================================

One city street should contain nearly everything.

Include from the FIRST NORMAL SHOT:

- billboard
- cyclist
- cars
- construction area
- falling-object source
- trees
- signs
- awning
- umbrellas
- bins
- pedestrians
- taller buildings
- road intersection

This allows later destruction to feel like consequences of an existing world,
rather than new props being spawned for spectacle.

==================================================
FORESHADOWING
==================================================

Critical:

show the hero billboard in the normal scene.

Do NOT draw attention to it.

Later:

it fails.

Similarly:

show construction panel before it falls.

Show cyclist before air becomes difficult.

Show trees before wind intensifies.

Continuity makes the simulation more believable.

==================================================
OBJECT RESPONSE MODEL
==================================================

Classify major objects using:

MASS
FRONTAL AREA
DRAG COEFFICIENT
ANCHOR STRENGTH

Use approximate physical behavior.

Example:

PAPER:
very responsive.

UMBRELLA:
extremely responsive.

CYCLIST:
significant high-speed drag.

CAR:
high drag at high speed but high mass.

TREE:
large area, strong anchor, flexible.

BILLBOARD:
huge area, rigid mounting, major load.

BUILDING:
enormous structural strength; do NOT make skyscrapers fly away from 60 km/h wind.

==================================================
CRITICAL REALISM RULE
==================================================

Do NOT exaggerate to the point of nonsense.

With air density 10×:

a 60 km/h wind produces roughly the aerodynamic pressure of ~190 km/h wind in
normal air.

That is extremely destructive to vulnerable structures.

But it is NOT:

a tornado that picks up skyscrapers.

Show:

- signs failing
- roof pieces
- trees
- windows under stress
- lightweight debris
- awnings
- temporary structures
- vulnerable facades

rather than entire concrete buildings flying away.

==================================================
CAR MODEL
==================================================

Drag force rises strongly with speed.

At city speeds:
noticeable but manageable.

At highway-type speeds:
much more severe.

Do NOT show a 20 km/h car being stopped instantly.

Use a vehicle initially around:

80–100 km/h

for the most readable effect.

The car should:

- decelerate strongly off throttle
- require more power to maintain speed
- remain steerable
- not randomly skid because density changed

==================================================
CYCLIST MODEL
==================================================

Cycling is a great human-scale example.

At low speed:
movement still possible.

At higher speed:
aerodynamic drag dominates much more.

Show:

pedaling effort rises
body leans
speed plateaus.

Do not make bicycle wheels behave incorrectly.

==================================================
FALLING OBJECT MODEL
==================================================

Use contrast.

Object A:
large lightweight panel.

Object B:
small dense object.

At 10× density:

Object A slows dramatically.

Object B remains comparatively fast.

This demonstrates why terminal velocity depends on:

mass
area
shape

not only air density.

==================================================
WIND SYSTEM
==================================================

Wind direction must remain coherent.

Particles/debris should not move randomly.

Use:

global wind vector
gust variation
turbulence layer
object-specific aerodynamic response

As wind increases:

leaves first
then fabric
then small objects
then branches/signs
then structural failures.

This gives natural escalation.

==================================================
DESTRUCTION SYSTEM
==================================================

Use SCRIPTED HERO DESTRUCTION.

Do not rely on uncontrolled physics for important moments.

Hero events:

- umbrella
- awning
- sign
- branch
- construction panel
- billboard

These must occur reliably every playback.

Background debris can be procedural.

==================================================
POV CAMERA
==================================================

Camera follows curiosity.

Example:

ball slows
→ look at ball.

cyclist struggles
→ track cyclist.

car slows
→ turn toward road.

noise above
→ look at falling panel.

wind begins
→ look at tree/sign.

billboard creaks
→ camera notices.

billboard fails
→ flinch / dodge.

Do NOT use a predetermined camera spline that ignores action.

==================================================
FIRST-PERSON BODY
==================================================

Use authored hands only if quality is acceptable.

Good uses:

- feeling the air with hand
- shielding face
- grabbing railing
- bracing during final wind

Do not let arms dominate the shot.

==================================================
HUD STYLE
==================================================

Keep HUD minimal.

Primary:

AIR DENSITY
1.0×

→
10.0×

Later:

WIND
60 KM/H

One major surprising comparison:

NORMAL-AIR EQUIVALENT
~190 KM/H

Do NOT show:

five equations
ten gauges
constant stats.

==================================================
TITLE
==================================================

Opening title must be centered:

WHAT IF AIR
BECAME 10× DENSER?

Approximately:

2.5–3 seconds.

Clear and prominent.

Active visuals behind it.

==================================================
CAPTIONS
==================================================

One short thought at a time.

Good:

“The air would still look normal.”

“The faster you move, the worse it gets.”

“Even falling changes.”

“Then comes the real problem.”

“The wind.”

“Same wind speed. Ten times the air.”

Avoid textbook paragraphs.

==================================================
SOUND DESIGN
==================================================

This video's sound should escalate as much as the visuals.

NORMAL:
city ambience
traffic
people
light wind

BALL:
whoosh becomes stronger / abrupt slowdown

CYCLIST:
wind noise
chain/pedals

CAR:
engine
wind roar
rapid aerodynamic deceleration

PANEL:
air flutter
fall
impact

WIND:
progressively stronger roar

STRUCTURAL:
metal strain
awning fabric
branch crack
mount bolts
billboard failure

FINAL:
major wind/debris impact
then cut.

Do not use constant cinematic booms.

==================================================
MUSIC
==================================================

Keep restrained.

0–10:
curiosity.

10–25:
rhythmic tension.

25–35:
music starts building.

35–45:
high tension.

45–end:
payoff.

SFX should dominate over music.

==================================================
FIRST-FRAME TEST
==================================================

Frame one must communicate:

SOMETHING ABOUT THIS WIND IS WRONG.

Not just:

generic destruction.

The HUD must help:

WIND
60 KM/H

AIR DENSITY
10×

That contradiction is the visual mystery.

This is more important than simply showing a huge explosion.

==================================================
RETENTION REVIEW
==================================================

Review exact intervals:

0–3
3–5
5–9
9–13
13–17
17–21
21–25
25–29
29–34
34–40
40–45
45–end

For EVERY interval answer:

1. What NEW physics idea appears?
2. What NEW visual occurs?
3. Is this meaningfully different from the previous beat?
4. Why should someone watch another 3 seconds?
5. Could the section lose one second?
6. Is the physics defensible?

If #1 or #2 has no answer:

CUT OR REWRITE.

==================================================
SWIPE-RISK REVIEW
==================================================

Ask independent reviewers:

“At what EXACT timestamp would you swipe?”

Do not accept generic:

“Good pacing.”

Require:

timestamp
reason
specific fix.

==================================================
COMMENT-POTENTIAL REVIEW
==================================================

Before finishing, ask:

What reasonable questions might viewers ask after watching?

Target at least 5 natural questions.

If the video explains literally every edge case,
it may be over-explaining.

==================================================
NEW SHORT-FORM TARGET
==================================================

We are intentionally testing:

45-ish second physics videos

instead of:

70–90 second explanations.

The goal is:

higher APV
better completion
better rewatchability
while preserving actual physics.

==================================================
DO NOT FORCE A LOOP
==================================================

A visual loop is welcome if natural.

Do NOT damage the ending with a cheesy sentence fragment just to create a loop.

Story first.

==================================================
SUCCESS CRITERIA
==================================================

By 1 second:
viewer notices the weird contradiction:
60 km/h wind looks catastrophic.

By 3 seconds:
premise understood.

By 12 seconds:
viewer has seen first surprising physics consequence.

By 20 seconds:
viewer understands fast movement is dramatically affected.

By 27 seconds:
falling-object surprise.

By 32 seconds:
viewer realizes WIND is the big danger.

By 40 seconds:
destruction is escalating.

By ~47 seconds:
billboard payoff.

The desired reaction:

“Wait… air density affects ALL of that?”

==================================================
PRODUCTION PLAN
==================================================

Do NOT spend another multi-day art-direction cycle.

STYLE IS LOCKED.

Build in two blocks.

BLOCK A:
0–25 sec.

Includes:

cold-open mystery
rewind
density change
thrown object
cyclist
car
falling object

Render preview.

Review:

HOOK
PHYSICS
CLARITY
PACING.

BLOCK B:
25–48 sec.

Includes:

wind realization
60 vs ~190 km/h comparison
street destruction
billboard payoff
ending

Then review full video.

==================================================
FIRST TASK
==================================================

1. Create exact timestamped 45–48 second shot list.
2. Define simplified aerodynamic model.
3. Verify the ~190 km/h normal-air-equivalent comparison.
4. Define all hero assets/events.
5. Reuse existing city assets.
6. Build BLOCK A.
7. Ensure opening mystery is understandable immediately.
8. Ensure the centered title stays ~2.5–3 sec.
9. Render preview.
10. Run independent physics + retention reviews.
11. Continue to Block B unless a major flaw exists.

START NOW.
````
