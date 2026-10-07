# What if Andromeda collided with the Milky Way overnight? — master build prompt

> Verbatim owner brief, archived so later developers can check the rules and quotes in `docs/`. Owner's words, unedited
> (chat-only lines like "send the video when done" kept as written). Where a newer brief or `docs/` disagrees, the newer one wins.

````text
MASTER BUILD PROMPT
PROJECT: WHAT IF ANDROMEDA COLLIDED WITH THE MILKY WAY OVERNIGHT?
FORMAT: 70–85 SECOND CINEMATIC POV COSMIC SIMULATION
ENGINE: HTML + JavaScript + Three.js / WebGL

==================================================
ROLE
==================================================

You are my:

- lead Three.js developer
- technical director
- procedural space/VFX developer
- cinematographer
- astronomy visualization designer
- first-person POV designer
- sound designer
- short-form retention editor
- production planner

Your task is to BUILD the actual experience.

Do not merely explain how it could be made.

I am a beginner.

Keep manual work minimal.
Write and maintain the code yourself.

Reuse proven systems from our previous What-If projects where useful:

- renderer
- vertical camera system
- timeline
- post-processing
- HUD
- serif captions
- sound manager
- recording controls
- deterministic animation architecture

This is a new scenario, not a reason to rebuild our entire engine.

==================================================
THE PREMISE
==================================================

TITLE:

WHAT IF ANDROMEDA
COLLIDED WITH THE MILKY WAY
OVERNIGHT?

The viewer experiences the Milky Way–Andromeda merger from a first-person POV
standing on Earth.

IMPORTANT:

The real Milky Way–Andromeda interaction would unfold over an enormous
astronomical timescale, not one night.

This video asks a deliberately impossible hypothetical:

WHAT WOULD THE VISUAL PROGRESSION FEEL LIKE IF BILLIONS OF YEARS OF GALACTIC
EVOLUTION WERE COMPRESSED INTO A SINGLE NIGHT?

Make that clear without ruining the hook.

This is an accelerated visualization.

==================================================
IMPORTANT SCIENCE RULE
==================================================

DO NOT portray galaxies as two solid discs smashing together like cars.

A galaxy is overwhelmingly empty space.

Direct star-star collisions during galaxy mergers are extraordinarily unlikely
because stars are separated by enormous distances.

The spectacular consequences come from:

- gravitational interaction
- changing galactic structure
- tidal distortion
- redistribution of stars
- gas/dust interaction
- enhanced star formation
- long tidal tails
- repeated passes
- eventual merger

Do NOT show:

millions of stars physically crashing into each other
the entire sky exploding on contact
a giant shockwave from one galaxy physically hitting Earth
random stars raining onto Earth

We want spectacular visuals without turning astronomy into nonsense.

==================================================
FICTIONAL COMPRESSION RULE
==================================================

Because we are compressing astronomical evolution into approximately one night,
we are deliberately breaking realistic timescale.

The video should distinguish:

REAL PHYSICS CONCEPTS

from

FICTIONAL TIME COMPRESSION.

Do not make precise claims about what Earth would physically experience under
an impossible accelerated-gravity scenario unless clearly presented as part
of the hypothetical.

The main spectacle should be the sky.

==================================================
PRIMARY CREATIVE GOAL
==================================================

The viewer should experience:

NORMAL NIGHT
↓
STRANGE OBJECT
↓
ANDROMEDA BECOMES VISIBLE
↓
IT GROWS
↓
IT FILLS THE SKY
↓
GALAXIES DISTORT
↓
THE SKY BECOMES UNRECOGNIZABLE
↓
GALACTIC PASSAGE
↓
REPEATED MERGER
↓
ONE NEW GALAXY

The escalation is VISUAL SCALE.

Every few seconds, the sky must become meaningfully more extraordinary.

==================================================
RETENTION PRINCIPLE
==================================================

The video cannot simply be:

look up
→ galaxy gets bigger
→ galaxy gets bigger again
→ galaxy gets bigger again.

That becomes repetitive.

Each stage must introduce a NEW TYPE OF visual consequence.

Examples:

1. Andromeda becomes visible.
2. Spiral structure becomes readable.
3. It occupies a large fraction of the sky.
4. Milky Way becomes visibly distorted.
5. Tidal tails appear.
6. Galactic structures overlap.
7. bright star-forming regions appear.
8. galaxies pass through one another.
9. they separate.
10. gravity pulls them back.
11. one merged galaxy remains.

ANSWER → NEW QUESTION → ANSWER → BIGGER QUESTION.

==================================================
TARGET DURATION
==================================================

Target:
72–82 seconds.

Preferred:
approximately 78 seconds.

Do NOT force 90 seconds.

Cut dead time.

==================================================
VIDEO FORMAT
==================================================

9:16 vertical.

Native:
1080 × 1920.

30 FPS.

Designed for:

TikTok
YouTube Shorts
Instagram Reels.

Important sky structures must remain readable on a phone.

==================================================
INTRO TITLE — CRITICAL
==================================================

The MAIN QUESTION must appear:

CENTERED IN THE MIDDLE OF THE SCREEN.

Within the first second.

Use:

WHAT IF ANDROMEDA
COLLIDED WITH THE MILKY WAY
OVERNIGHT?

The title should:

- remain approximately 3–4 seconds
- be large enough to comfortably read
- use elegant cinematic serif typography
- remain visible over ACTIVE visuals
- not freeze the scene
- immediately explain the video

While the viewer reads the title,
something unusual should already be visible in the night sky.

==================================================
VISUAL STYLE
==================================================

Use our established:

POLISHED CINEMATIC LOW-POLY POV SIMULATION

style.

However, this episode needs significantly stronger cosmic rendering.

Target:

Earth environment:
stylized low/mid-poly.

Sky:
beautiful, deep, cinematic and visually rich.

Use:

- atmospheric haze
- strong silhouette composition
- authored foreground objects
- deep night sky
- realistic-ish star distribution
- volumetric-looking galactic structures
- emissive dust/gas
- restrained bloom
- cinematic exposure
- excellent scale cues

Do NOT make the galaxy look like:

- flat JPEG pasted into the sky
- cartoon spiral
- glowing frisbee
- simple particle disc
- stock space wallpaper

This is the most important technical requirement.

==================================================
EARTH ENVIRONMENT
==================================================

Use a location that gives the sky maximum visual impact.

Preferred:

small city/suburban overlook or open field overlooking a town.

We need:

foreground:
POV body / railing / tree / rooftop edge.

midground:
houses / people / cars / streetlights.

background:
town/city silhouette.

far:
mountains/horizon if useful.

sky:
dominant.

Earth environment should provide SCALE.

People should occasionally look upward.

Street lights / windows provide warm points below.

Sky provides enormous cool/cosmic structure above.

==================================================
TIME OF DAY
==================================================

Begin:

late evening / night.

Not completely pitch black.

Enough moonlight / city light to see:

hands
people
buildings
landscape.

As Andromeda brightens,
its light may subtly influence the environment.

This can become one of our strongest visual effects.

==================================================
POV CAMERA
==================================================

First-person.

Camera height:
~1.7 m.

Movement:

- subtle breathing
- restrained sway
- slow looking upward
- reaction turns
- walking toward better viewpoints
- occasional stepping backward from scale
- looking at other people's reactions
- returning to sky

Do NOT constantly shake.

The scale itself creates spectacle.

==================================================
FIRST-PERSON BODY
==================================================

Use authored first-person arms/hands if available.

Useful moments:

- pointing toward Andromeda
- holding railing
- shielding eyes from bright core
- phone briefly raised to record sky
- hands visible during final awe shot

Do NOT let hands dominate.

==================================================
HUMAN REACTIONS
==================================================

Use other people to sell scale.

Initially:

one person notices.

Then:

multiple people stop.

Someone points.

People leave buildings.

Cars stop.

Crowd looks upward.

Do NOT have everyone screaming immediately.

Early reaction should be:

confusion
awe
recording
pointing

Later:

fear and disbelief.

==================================================
GALAXY RENDERING SYSTEM
==================================================

THIS IS THE TECHNICAL CENTERPIECE.

Do not build Andromeda as one flat transparent image if avoidable.

Create a layered procedural / shader-based galaxy.

Suggested visual layers:

1. bright galactic core
2. inner stellar bulge
3. spiral arm density
4. dust lanes
5. blue/white star-forming regions
6. scattered individual bright stars
7. outer stellar halo
8. faint gas structures

Potential implementation:

- custom shader planes
- layered transparent geometry
- particle distributions
- additive sprites
- procedural noise
- logarithmic spiral placement
- depth-layered billboards
- volumetric-looking shells

Use whichever combination gives the best image/performance.

==================================================
SPIRAL ARM GENERATION
==================================================

If procedural:

generate stars approximately around logarithmic spiral structures.

Add noise so they do NOT look mathematically perfect.

Different populations:

bright blue-white young stars
warm yellow older stars
dim background stars

Dust lanes should partially obscure light.

The galaxy should have internal depth.

==================================================
MILKY WAY
==================================================

The Milky Way should not merely be invisible because we are inside it.

Represent our own galaxy through the NIGHT SKY:

initially:
normal Milky Way band.

As merger progresses:

- band becomes distorted
- star density changes
- huge arcs appear
- tidal structures cross sky
- new luminous regions form

The viewer should gradually realize:

OUR OWN GALAXY IS CHANGING TOO.

==================================================
SKY PROJECTION
==================================================

This is critical.

The sky should feel like a dome surrounding the viewer.

Andromeda must not look like a flat object hovering 100 meters away.

Use:

celestial-scale positioning
appropriate perspective
very distant rendering
sky dome / spherical coordinates
depth-independent celestial rendering where needed

Avoid parallax that makes the galaxy appear nearby.

==================================================
BLOOM
==================================================

Use bloom selectively.

Bright:

galactic core
major star-forming regions
some bright stars

Do NOT bloom every star.

The galaxy should contain dark dust and structure.

If everything glows,
nothing feels bright.

==================================================
COLOR
==================================================

Andromeda:

warm-white/yellow core
cool blue-white outer star-forming regions
dark brown/black dust lanes
subtle violet/cyan gas only where appropriate

Milky Way:
cooler mixed stellar tones.

Earth:
dark blue-grey night.

Artificial lights:
warm orange/yellow.

Maintain strong contrast.

==================================================
STAR FIELD
==================================================

Avoid evenly random white dots.

Use:

brightness distribution
size distribution
color-temperature variation
clusters
dark regions
Milky Way density variation

Most stars should be dim.

Only a small number should be bright.

==================================================
ATMOSPHERIC INTERACTION
==================================================

The Earth atmosphere should affect celestial visuals near horizon.

Objects near horizon:

- more haze
- lower contrast
- warmer atmospheric tint if appropriate

Objects overhead:

- clearer
- higher contrast

This greatly increases realism.

==================================================
HUD
==================================================

Minimal top-left astronomical HUD.

Possible:

TIME UNTIL MERGER
08:00:00

DISTANCE TO ANDROMEDA
[accelerated visualization]

or:

GALACTIC MERGER
0%

Avoid fake precise real-world numbers once the impossible overnight compression begins.

Better:

MERGER PROGRESS
12%

TIME REMAINING
06:41:22

Keep HUD elegant.

==================================================
CAPTIONS
==================================================

Short serif captions.

One at a time.

Examples:

“At first, it would be beautiful.”

“Galaxies are mostly empty space.”

“The stars wouldn't simply smash together.”

“Gravity would reshape both galaxies.”

“They would pass through each other…”

“…and then come back.”

“Eventually, neither galaxy would remain unchanged.”

Do not turn video into astronomy lecture.

==================================================
FULL TIMELINE
==================================================

--------------------------------------------------
0:00–0:05 — HOOK
--------------------------------------------------

Normal nighttime Earth POV.

Town/city below.

Stars.

Milky Way faintly visible.

Something unusual is already visible near horizon:

Andromeda appears much larger/brighter than normal.

CENTERED TITLE:

WHAT IF ANDROMEDA
COLLIDED WITH THE MILKY WAY
OVERNIGHT?

HUD:

MERGER BEGINS IN
08:00:00

Viewer looks upward.

Title fades.

==================================================
0:05–0:12 — BEAUTIFUL AT FIRST
==================================================

Accelerated time begins.

Andromeda visibly grows.

Not cartoonishly fast every frame.

Use time jumps / accelerated progression.

Its spiral structure becomes visible.

Nearby people stop and look upward.

Someone points.

Caption:

“At first, it would be beautiful.”

The sky should be breathtaking.

==================================================
0:12–0:20 — SCALE REVEAL
==================================================

Andromeda now occupies a large section of sky.

Its core becomes clearly visible.

Dust lanes.

Spiral arms.

Blue stellar regions.

POV slowly rotates to show its scale.

People recording.

Streetlights below emphasize size.

HUD:

MERGER PROGRESS
18%

This should be a major screenshot-worthy moment.

==================================================
0:20–0:29 — IMPORTANT SCIENCE REVEAL
==================================================

Caption:

“But galaxies don't collide like solid objects.”

POV sees stars / galaxy structure overlapping.

Then:

“The stars are separated by enormous distances.”

Do NOT show stars smashing everywhere.

Instead begin:

gravitational distortion.

Andromeda's arms stretch.

Milky Way sky band starts warping.

==================================================
0:29–0:39 — GRAVITY REWRITES THE SKY
==================================================

This is the next escalation.

Huge tidal structures begin forming.

Stellar arcs stretch across sky.

Andromeda loses perfect spiral shape.

Milky Way band bends.

HUD:

MERGER PROGRESS
42%

Caption:

“Gravity would tear both galaxies out of shape.”

Camera turns.

The ENTIRE sky is now different.

Not just one galaxy.

==================================================
0:39–0:49 — FIRST PASSAGE
==================================================

Galactic structures begin overlapping.

The sky becomes incredibly dense.

Large luminous clouds.

Star-forming regions.

Dust structures.

Tidal tails.

Andromeda core passes across major portion of sky.

Caption:

“They would pass through each other.”

This should be one of the biggest visual moments.

Do NOT create one giant explosion.

==================================================
0:49–0:57 — THEY SEPARATE
==================================================

Surprise viewers.

After passage:

galaxies begin separating.

Sky becomes stretched.

Two major structures pull apart.

HUD:

GALACTIC CORES
SEPARATING

Viewer may think collision is over.

Caption:

“But it wouldn't end there.”

This creates a new open loop.

==================================================
0:57–1:05 — GRAVITY PULLS THEM BACK
==================================================

Accelerated time.

The galaxies slow.

Then reverse relative motion.

Gravity brings them back together.

Caption:

“Gravity would pull them together again.”

Now the second merger begins.

This prevents the video from being repetitive.

==================================================
1:05–1:14 — FINAL MERGER
==================================================

Galactic structures become increasingly mixed.

Two cores approach.

Huge stellar envelope surrounds sky.

Bright star-forming regions.

Long tidal tails.

The original spiral structures are mostly destroyed.

HUD:

GALAXIES
2 → 1

Do NOT imply stars literally fuse into one giant object.

The GALACTIC STRUCTURES merge.

==================================================
1:14–END — NEW SKY
==================================================

Sound calms.

Accelerated chaos settles.

Viewer looks upward.

The old Milky Way is gone.

Andromeda as a distinct spiral is gone.

One enormous merged galaxy structure dominates sky.

HUD:

GALAXIES
1

Caption:

“Neither galaxy would survive unchanged.”

Beat.

“A new galaxy would take their place.”

Then small clarification:

REAL MERGER TIMESCALE:
BILLIONS OF YEARS

OUR SIMULATION:
ONE NIGHT

Hold beautiful final sky briefly.

CUT TO BLACK.

==================================================
RETENTION STRUCTURE
==================================================

The video must NOT plateau.

0–5:
What is happening?

5–12:
That's beautiful.

12–20:
That's enormous.

20–29:
Wait, stars don't actually crash?

29–39:
Our own sky is changing.

39–49:
They're overlapping.

49–57:
They're separating?

57–65:
They're coming BACK?

65–74:
They're becoming one.

Ending:
What does the new sky look like?

Every section creates the next question.

==================================================
VISUAL ESCALATION RULE
==================================================

At timestamps:

5 sec
15 sec
25 sec
35 sec
45 sec
55 sec
65 sec
75 sec

capture a still.

Each still should look MEANINGFULLY different.

If two adjacent stills look almost the same:

the visual progression is too weak.

==================================================
NO CHEAP GALAXY RULE
==================================================

Before approving visuals, inspect the galaxy closely.

Reject it if it resembles:

- a PNG
- a flat spiral texture
- a particle frisbee
- evenly distributed dots
- a glowing disc with no dust structure
- two circles moving together

We need:

DEPTH
STRUCTURE
DUST
CORE
ARMS
HALO
COLOR VARIATION
DISTORTION

==================================================
GALACTIC DISTORTION
==================================================

Do not simply scale Andromeda larger.

Animate structural changes.

Need parameters such as:

spiralTightness
tidalStretch
coreSeparation
armDistortion
haloStretch
dustWarp
stellarDensity
starFormationIntensity

As merger progresses,
the galaxy should physically lose its original shape.

==================================================
PERFORMANCE
==================================================

Target:
30 FPS.

Use GPU-efficient methods.

Prefer:

Points
InstancedMesh
shader calculations
sprite atlases
LOD
precomputed distributions

Do NOT create millions of individual THREE.Mesh stars.

Use particle buffers / shader points.

==================================================
DETERMINISM
==================================================

The complete sequence must be deterministic.

Same playback:

same stars
same galaxy structures
same camera
same people
same timeline
same VFX

Use seeded randomness.

==================================================
TRANSITIONS
==================================================

We are compressing huge timescales.

Use elegant time transitions.

Potential:

camera blink
cloud passes
camera looks at crowd then back up
brief time-lapse
clock acceleration
night-sky exposure shift

Do NOT constantly fade to black.

Maintain continuity from Earth.

==================================================
SOUND DESIGN
==================================================

Important:

SPACE ITSELF DOES NOT PRODUCE AUDIBLE SOUND THROUGH VACUUM.

Do not pretend Earth would literally hear galaxies rumbling.

Music/sound can represent the experience cinematically.

Separate:

DIEGETIC EARTH SOUND:
wind
people
cars
night ambience
distant voices

NON-DIEGETIC CINEMATIC SOUND:
low drones
rises
impact tones
music

Do not label cinematic bass as literal galaxy sound.

==================================================
SOUND PROGRESSION
==================================================

0–10:
quiet night + wonder.

10–30:
subtle cosmic music grows.

30–50:
larger low-frequency cinematic texture.

50–60:
music briefly reduces during separation.

60–74:
large emotional rise.

Ending:
quiet, awe-filled atmosphere.

Avoid Marvel-trailer BOOM
````
