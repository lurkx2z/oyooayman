# Oxygen — master build prompt (2026-10-05)

> Verbatim owner brief, archived so later developers can check the rules and quotes in `docs/`. Owner's words, unedited
> (chat-only lines like "send the video when done" kept as written). Where a newer brief or `docs/` disagrees, the newer one wins.

````text
MASTER BUILD PROMPT — THREE.JS / HTML WHAT-IF SIMULATION

PROJECT:
WHAT IF OXYGEN SUDDENLY DISAPPEARED?

You are my lead developer, 3D technical director, cinematographer, simulation designer, VFX artist, sound planner, and short-form content director.

Your task is to BUILD the actual experience, not merely explain how it could be built.

We are creating a cinematic vertical 3D first-person "What If?" video using:

- HTML
- JavaScript
- Three.js / WebGL
- procedural animation
- procedural/simple 3D assets
- browser-based rendering

The finished result will run in Chrome and be screen-recorded/exported for TikTok, YouTube Shorts, Instagram Reels, etc.

I am a beginner.

Do not expect me to manually program major systems.

You should write and maintain the code.

==================================================
CORE PREMISE
==================================================

Scenario:

WHAT IF ALL MOLECULAR OXYGEN (O₂) SUDDENLY DISAPPEARED FROM EARTH'S ATMOSPHERE?

IMPORTANT SCIENCE RULE:

This does NOT mean all oxygen atoms in existence disappear.

Water stays water.
Buildings do not magically disintegrate.
The human body does not atomically fall apart.
The oceans do not vanish.

ONLY breathable atmospheric O₂ suddenly falls from approximately 21% to 0%.

Avoid viral misinformation based on "all oxygen atoms disappearing."

Consequences should be visually dramatic but broadly scientifically plausible.

==================================================
FORMAT
==================================================

Target duration:

75–90 seconds.

Target first version:
approximately 80 seconds.

Aspect ratio:
9:16 vertical.

Design directly for:
1080 × 1920.

Target:
30 FPS.

Browser should scale responsively while maintaining vertical framing.

The project should feel like a polished 3D simulation/game cinematic, NOT an AI-generated video.

==================================================
VISUAL STYLE
==================================================

Desired style:

- polished low/mid-poly 3D
- stylized but believable
- clean geometry
- strong atmospheric lighting
- readable silhouettes
- game-like but cinematic
- vibrant enough for mobile
- realistic proportions
- visually coherent
- consistent world geometry

Do NOT chase photorealism.

Do NOT make it look:

- Roblox-like
- childish
- overly blocky
- like raw developer primitives
- like a coding demo
- like generic AI imagery

Reference quality should resemble a polished interactive simulation where the viewer feels physically present.

==================================================
FIRST-PERSON POV
==================================================

The viewer is experiencing the event.

Camera height:
approximately 1.70 m.

Build reusable POV behavior:

- idle breathing
- subtle head sway
- walking
- running
- head turns
- reaction turns
- small startle motions
- controlled camera shake
- smooth acceleration/deceleration

The camera must NOT float robotically.

Create reusable parameters such as:

cameraHeight
walkSpeed
runSpeed
bobStrength
bobFrequency
breathingStrength
shakeStrength
fov

==================================================
CORE RETENTION PRINCIPLE
==================================================

Something meaningful should happen approximately every 2–4 seconds.

Do not create long walking sections.

Every event should either:

1. answer a question,
2. create a new question,
3. increase danger,
4. increase scale,
5. reveal a consequence.

Story structure:

NORMAL WORLD
↓
OXYGEN VANISHES
↓
SMALL SIGNS
↓
REALIZATION
↓
SYSTEM FAILURES
↓
PHYSICAL DANGER
↓
CITY-WIDE CONSEQUENCES
↓
GLOBAL CONSEQUENCES
↓
PERSONAL FAILURE
↓
FINAL POV PAYOFF

==================================================
OPENING — 0 TO 3 SEC
==================================================

DO NOT begin with an explanation.

Begin outside on a normal active city/suburban street.

First-person POV.

Beautiful ordinary day.

Traffic moving.

People in the distance if technically practical.

Cars.

Birds.

A construction worker welding or cutting metal nearby.

Restaurant/grill/flame visible somewhere.

HUD:

ATMOSPHERIC OXYGEN
21.0%

Text:

WHAT IF OXYGEN
SUDDENLY DISAPPEARED?

At approximately 2 seconds:

HUD begins dropping extremely rapidly:

21%
15%
8%
3%
0%

Do not instantly reveal every consequence.

==================================================
3–8 SEC — SOMETHING IS WRONG
==================================================

When oxygen reaches 0%:

Several things happen almost simultaneously.

Show, do not lecture.

- open flame instantly extinguishes
- welding/cutting stops working correctly
- grill/fire goes dark
- car engines begin failing
- motorcycles / combustion engines sputter
- city traffic begins behaving abnormally

Sound design:

normal city
↓
engines stuttering
↓
flames disappear
↓
strange silence begins

HUD:

OXYGEN
0.0%

Keep camera reacting naturally.

==================================================
8–15 SEC — VEHICLES FAIL
==================================================

Gasoline/diesel combustion needs oxygen.

Show:

moving cars beginning to lose power.

One vehicle coasts.

Another stops awkwardly in an intersection.

A bus slows.

A motorcycle dies.

Do NOT have every car violently crash at once.

Electric vehicles may continue moving.

This contrast is useful.

If possible:

one EV passes through the stalled combustion traffic while other vehicles die.

That subtly communicates the mechanism without narration.

POV looks around, confused.

==================================================
15–22 SEC — HUMAN EFFECT BEGINS
==================================================

The POV character starts breathing faster.

IMPORTANT:

Do NOT make the character instantly collapse at 0.1 seconds.

Loss of atmospheric oxygen causes catastrophic hypoxia, but the brain still has a small remaining oxygen reserve.

Create a countdown feeling.

Visual effects gradually begin:

- slight tunnel vision
- subtle desaturation
- peripheral darkness
- tiny camera instability
- faster breathing
- heartbeat

HUD can appear:

TIME WITHOUT OXYGEN
00:12

People in distance begin:

stumbling
stopping
sitting/falling

Keep this tasteful and simulation-like rather than graphic.

==================================================
22–30 SEC — FIRE AND MACHINES
==================================================

Cut/transition to a wider urban area.

Show consequences rapidly.

Examples:

- industrial flames disappear
- fireplaces/fires extinguish
- gas-powered generators stop
- aircraft engines begin losing combustion
- helicopters using combustion engines lose power

Introduce aircraft overhead.

Viewer hears engine spool-down / strange aircraft sound.

Camera looks up.

Passenger aircraft is descending abnormally.

Do not immediately crash it.

Create anticipation.

==================================================
30–38 SEC — AIRCRAFT CONSEQUENCE
==================================================

The aircraft continues descending.

Because turbine combustion requires oxygen, jet engines cannot continue operating normally.

Show:

engines silent / failing
plane gliding
banking
losing altitude

It disappears behind city buildings or distant terrain.

Pause.

Then:

distant impact flash
delayed low boom
smoke column

Do NOT spend huge effort simulating a detailed aircraft crash.

Use cinematic illusion:

flight path
→ disappearance
→ flash
→ sound delay
→ smoke.

==================================================
38–47 SEC — THE CITY BECOMES STRANGE
==================================================

POV is becoming severely hypoxic.

City now contains:

- stalled traffic
- abandoned vehicles
- people collapsing or motionless in distance
- fires mostly gone
- quiet machinery
- electrical systems still functioning where powered independently
- traffic signals still running
- electric lights still working
- EVs/electrical machinery may still briefly function

This is important:

ELECTRICITY DOES NOT MAGICALLY DISAPPEAR JUST BECAUSE OXYGEN DOES.

Do not turn the entire city black instantly unless there is a logical secondary power failure.

The eerie visual idea is:

many ELECTRICAL systems still work,
while living organisms and combustion systems fail.

==================================================
47–56 SEC — PERSONAL POV FAILURE
==================================================

Breathing becomes desperate.

HUD:

BLOOD OXYGEN

Do NOT pretend to calculate medically exact SpO₂ values unless the simulation model supports it.

Instead, if uncertain, use:

HYPOXIA
CRITICAL

or:

TIME WITHOUT OXYGEN
00:52

Visual effects increase:

- narrower FOV
- peripheral blackness
- blur only at edges
- reduced saturation
- unstable balance
- heartbeat
- muffled audio
- delayed head reactions

Do not overuse blur.

Viewer must still understand what is happening.

POV falls to knees.

Camera height lowers.

==================================================
56–64 SEC — APPARENT END
==================================================

POV collapses.

Camera lands partially sideways.

Street visible from ground level.

Audio heavily muffled.

Heartbeat slows.

Screen almost black.

For approximately 0.5–1 second:

complete silence.

It should feel like the video might end here.

But do NOT end yet.

==================================================
64–75 SEC — SCALE EXPANDS
==================================================

Transition away from personal POV.

This is one of the few moments where we can leave strict first-person perspective.

Show a cinematic pullback:

street
→ city
→ atmosphere / Earth.

Use a stylized Earth if needed.

HUD:

ATMOSPHERIC OXYGEN
0%

Then communicate that oxygen-dependent life across the planet is undergoing the same catastrophe.

Do NOT make oceans disappear.

Do NOT make buildings spontaneously crumble.

Do NOT use fake "all concrete instantly turns to dust" claims.

Possible global imagery:

- stalled transport
- extinguished wildfire regions
- grounded aircraft
- silent combustion infrastructure
- dark smoke from secondary accidents
- cities still partly electrically illuminated

==================================================
75–82 SEC — FINAL PAYOFF
==================================================

We need a memorable ending.

Preferred ending:

Earth from above.

Text:

YOU WOULD ONLY HAVE
SECONDS TO REACT.

Then:

ATMOSPHERIC OXYGEN
0%

Long atmospheric pause.

Alternative stronger cinematic ending:

Return briefly to the collapsed POV.

Everything quiet.

Then the oxygen HUD flickers:

0.0%

0.1%

0.3%

Viewer hears a sudden breath.

CUT TO BLACK.

This would create a mystery for a potential continuation:

"Why is oxygen coming back?"

Use this ONLY if we deliberately want a fictional mystery ending.

If the video is intended to remain purely scientific, use the global Earth ending instead.

==================================================
HUD DESIGN
==================================================

Create a reusable HTML/CSS HUD layered over the WebGL canvas.

Style:

minimal
clean
cinematic
white text
subtle shadows
small label
large numerical value

Examples:

ATMOSPHERIC OXYGEN
21.0%

TIME WITHOUT OXYGEN
00:34

HYPOXIA
CRITICAL

Do not fill the screen with game UI.

HUD should feel like informational simulation graphics.

==================================================
THREE.JS ARCHITECTURE
==================================================

Create clean modular systems.

Suggested architecture:

SceneManager
CameraController
Timeline
Environment
TrafficSystem
Vehicle
PedestrianSystem
AircraftSystem
ParticleSystem
AudioManager
HUD
PostProcessing
EventManager

Even if implemented in one HTML file initially, organize code into clearly separated classes/functions.

Do NOT create one unreadable wall of JavaScript.

==================================================
TIMELINE SYSTEM
==================================================

Create a deterministic timeline based on seconds.

Example concept:

const events = [
    { time: 0, event: "normal_world" },
    { time: 2, event: "oxygen_drop" },
    { time: 4, event: "flames_out" },
    { time: 6, event: "engines_fail" },
    { time: 12, event: "hypoxia_begin" },
    { time: 24, event: "aircraft_failure" },
    { time: 34, event: "aircraft_impact" },
    { time: 48, event: "critical_hypoxia" },
    { time: 58, event: "collapse" },
    { time: 66, event: "global_pullback" },
    { time: 80, event: "ending" }
];

Implement this professionally rather than necessarily using exactly this syntax.

Events should be deterministic so each playback looks identical for recording.

==================================================
DETERMINISTIC RANDOMNESS
==================================================

Use a seeded pseudo-random generator.

Traffic, props, vegetation and particles may look random but must reproduce identically on every run.

This is critical for debugging and recording.

==================================================
WORLD BUILDING
==================================================

Build a convincing stylized city/suburban street.

Needed:

- road
- sidewalks
- curbs
- intersection
- buildings
- trees
- street lights
- traffic lights
- vehicles
- street signs
- vegetation
- distant skyline
- atmospheric haze

Avoid completely flat empty geometry.

The world needs depth.

Use instancing where practical.

==================================================
VEHICLES
==================================================

Create several visually different vehicle variants.

Do not use identical cars everywhere.

Use:

different body proportions
different colors
different orientations
different speeds

At least distinguish:

combustion vehicles
electric vehicle(s)

Combustion cars should:

sputter
lose acceleration
coast
stop

They do not need realistic drivetrain simulation.

Animation illusion is enough.

==================================================
HUMANS
==================================================

If human models are difficult, use simple stylized low-poly people.

They can be distant.

Do not waste enormous effort on facial animation.

Their purpose is scale and storytelling.

Simple animations:

walk
stand
stumble
collapse
sit/fall

Keep events non-graphic.

==================================================
AIRCRAFT
==================================================

Create/import/code a simple stylized passenger jet.

It only needs to look convincing at distance.

Animate using a scripted spline/path.

Requirements:

high altitude initial appearance
engine failure cue
descending path
bank
disappear behind geometry
delayed explosion/smoke

Do not build a full flight simulator.

==================================================
PARTICLES / VFX
==================================================

Reusable systems:

smoke
dust
small sparks
impact flash
atmospheric haze

Keep particles efficient.

Avoid thousands of expensive transparent sprites unless performance remains good.

==================================================
POST PROCESSING
==================================================

Use only if stable/performance-friendly.

Potential effects:

subtle vignette
color grading
mild bloom
hypoxia tunnel vision
desaturation

Do NOT drown the video in post-processing.

The 3D scene itself must look good.

==================================================
LIGHTING
==================================================

Begin with pleasant daylight.

Use:

directional sunlight
hemisphere/environment light
soft shadows
ambient depth/fog

Avoid flat default Three.js lighting.

Use atmospheric perspective to make distant buildings feel larger and more cinematic.

==================================================
SOUND SYSTEM
==================================================

Build an AudioManager even if final sounds are replaced in editing.

Temporary synchronized sound cues should include:

city ambience
birds
traffic
engine sounds
flame/welding
oxygen event tone
engine sputtering
car impacts
breathing
heartbeat
aircraft
distant explosion
muffled collapse audio

Allow audio to be muted with a key/button.

Final sound design can be replaced during editing.

==================================================
RECORDING CONTROLS
==================================================

Add developer controls that can be hidden before recording.

Required:

PLAY
PAUSE
RESTART
SCRUB TIMELINE
CURRENT TIME
FPS
HIDE DEBUG/UI
FULLSCREEN

Keyboard shortcuts preferred:

SPACE = play/pause
R = restart
D = debug toggle
F = fullscreen

Also create a:

RECORDING MODE

that hides all development controls but preserves the cinematic HUD.

==================================================
PERFORMANCE
==================================================

Target smooth playback on a normal desktop browser.

Prefer:

InstancedMesh
shared materials
low-poly assets
reasonable shadow distances
LOD where useful
limited transparent effects

Do not sacrifice browser stability for invisible detail.

==================================================
IMPLEMENTATION RULE
==================================================

DO NOT respond with only:

"Here is how I would make it."

BUILD IT.

Create the actual project files.

Primary deliverable:

index.html

If separate files make development substantially cleaner, you may use:

index.html
style.css
main.js

But prefer a simple structure that I can run locally easily.

Tell me exactly how to launch it.

If local browser restrictions require a server, create the simplest possible launcher and explain it.

==================================================
ASSET RULE
==================================================

If you can make a convincing asset procedurally, do it.

If an external asset is truly necessary:

tell me exactly what is needed
what format
what search terms
and where it will be used.

Do not stop development because we lack the perfect asset.

Use placeholders and make the complete experience functional first.

==================================================
BUILD PROCESS
==================================================

DO NOT try to perfect all 80 seconds immediately.

PHASE 1:

Build the first 15 seconds only:

0–3:
normal world + oxygen counter

3–6:
oxygen reaches zero + flames die

6–10:
combustion vehicles fail

10–15:
hypoxia begins + city reaction

Make this section actually playable.

Then render/capture screenshots and review it.

Only after the first 15 seconds look convincing should we expand the timeline.

==================================================
MULTI-AI REVIEW
==================================================

When the first 15-second build is functional, use available independent AI reviewers if possible.

Reviewer 1:
SHORT-FORM RETENTION

Reviewer 2:
3D / CINEMATOGRAPHY

Reviewer 3:
NORMAL VIEWER

Reviewer 4:
SCIENTIFIC PLAUSIBILITY

Give reviewers the actual captured frames/video when possible.

Do not tell them the result is good.

Ask them to actively find problems.

Score:

HOOK
CURIOSITY
VISUAL QUALITY
POV IMMERSION
PACING
CLARITY
SCIENTIFIC PLAUSIBILITY
ENVIRONMENTAL STORYTELLING
RETENTION POTENTIAL

Each reviewer must identify:

TOP 3 PROBLEMS
MOST LIKELY SWIPE-AWAY MOMENT
WHAT LOOKS CHEAPEST
HIGHEST-IMPACT FIX

Do not inflate scores.

==================================================
VERY IMPORTANT
==================================================

Do NOT spend hours creating technically sophisticated systems that the viewer will never notice.

This is short-form content.

The viewer cares about:

WHAT HAPPENS NEXT?

IS THAT ACTUALLY WHAT WOULD HAPPEN?

THAT LOOKS INSANE.

HOW BAD DOES THIS GET?

The final result should look like a polished simulation created intentionally by a 3D artist/game developer, even though AI is writing much of the code.

==================================================
START NOW
==================================================

Begin by BUILDING Phase 1.

Do not ask me to manually create the scene unless absolutely necessary.

1. Create the HTML/Three.js project.
2. Create the vertical renderer.
3. Build the environment.
4. Build the POV camera.
5. Build the oxygen HUD.
6. Build normal traffic/activity.
7. Animate the oxygen drop.
8. Extinguish combustion/flames.
9. Animate combustion vehicle failures.
10. Begin hypoxia POV effects.
11. Add development playback controls.
12. Give me exact instructions to run it.
13. Produce the first 15-second functional version before expanding further.
````
