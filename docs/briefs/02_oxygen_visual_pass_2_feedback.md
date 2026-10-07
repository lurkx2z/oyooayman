# Oxygen — owner feedback + VISUAL PASS 2 brief

> Verbatim owner brief, archived so later developers can check the rules and quotes in `docs/`. Owner's words, unedited
> (chat-only lines like "send the video when done" kept as written). Where a newer brief or `docs/` disagrees, the newer one wins.

````text
The biggest thing I would NOT let Claude change is its environment complexity. That is its advantage.
Look at Claude's 0-second frame versus the Astra build: Claude already has buildings with windows, storefronts, road construction, a vendor stall, pedestrians, traffic lights, parked/moving vehicles, birds, signs, props, etc. That's much closer to the richness in the original creator's videos.
So right now my ranking is:
Best world/assets: Claude 🥇
Best atmosphere: Astra 🥇
Best potential overall: Claude + the reference-style atmosphere
If Claude nails the next visual pass, I think I'd stop spending time on the Astra implementation and build the full oxygen video using Claude's codebase.

Bro — Claude’s first try is actually a much stronger foundation than Astra’s first try. I inspected the full 15-second sequence.
It already has things Astra struggled with after several passes: a dense city, actual storefronts, multiple building shapes, people, vehicles, street props, signs, grill, sparks, fire, a visible POV hand, foreground/midground/background layers. It feels like somebody built a scene rather than just generated some boxes.
For matching the reference video specifically, though, I’d rate Claude around 6.5/10 right now.
Area	Claude v1
Asset quality	7.5/10
World density	8/10
Low-poly style	7/10
Composition	6.5/10
Atmosphere	5/10
Palette	5/10
Lighting	5.5/10
Reference-style match	6–6.5/10


Claude vs Astra
Claude wins: models, city density, silhouettes, authored-looking environment, variety, street detail, actual “game world” feeling.
Astra currently wins: fog, muted palette, seriousness, atmospheric mood.
So I would use Claude as the primary build and give it Astra’s atmospheric treatment.
That combination is probably our best route.
The main problem with Claude right now is that it looks too bright, clean and informational. Look at the frames: blue sky, colorful buildings, clean sidewalks, bright red grill, green round trees, high contrast everywhere.
The reference looks like everything is being viewed through a layer of grey atmosphere.
And Claude has WAY too much text. At some points we have:
OXYGEN 0.0%
YOU BLACK OUT IN 00:13.3
SPARKS DIM — NO O₂
BREATHE
EACH BREATH PULLS O₂ OUT OF YOUR BLOOD
all on one phone screen.
That's making it look like an infographic/game HUD instead of the cinematic POV videos you showed me.

VISUAL PASS 2 — MATCH THE PROVIDED REFERENCE GRAPHICS

The underlying scene/world you created is significantly closer to what I want.
DO NOT rebuild it.

KEEP:

- current city density
- building variety
- people
- vehicles
- street props
- grill
- sparks/fire event
- POV hand
- existing oxygen simulation
- current event timeline

The geometry/world is a good foundation.

The next goal is to make THIS SAME WORLD visually resemble the graphical
language of my provided reference video much more closely.

The biggest remaining difference is ART DIRECTION.

==================================================
TARGET
==================================================

The reference looks like:

DARK / ATMOSPHERIC / MUTED LOW-POLY CINEMATIC SIMULATION

NOT:

bright modern low-poly game
cartoon city
clean web demo
educational infographic

The reference achieves quality through:

FOG
LIGHTING
PALETTE
SILHOUETTES
DEPTH
COMPOSITION

not high polygon counts.

==================================================
1. KEEP YOUR ASSETS
==================================================

Unlike previous attempts, your actual city geometry and asset density are good.

DO NOT replace everything with simpler procedural primitives.

Preserve:

- buildings
- people
- vehicles
- street objects
- grill
- intersection
- urban density

We are changing how the world is RENDERED.

==================================================
2. OVERCAST SKY
==================================================

Remove the bright blue sky.

Use a cloudy pale grey/blue atmosphere.

No cheerful sunlight.

Target:

cold cloudy morning
soft sky
slightly ominous
low contrast

The horizon and distant buildings should blend into atmospheric haze.

==================================================
3. STRONGER ATMOSPHERIC FOG
==================================================

The current scene is too clear.

Use substantial fog.

Foreground:
clear

midground:
slightly faded

background:
washed out

far buildings:
mostly silhouettes merging with sky

Fog must match sky color.

The viewer should immediately perceive atmospheric depth.

Do NOT hide the whole environment.

==================================================
4. COLOR GRADE
==================================================

Desaturate the complete image approximately 20–30%.

Current colors are too bright.

Especially reduce saturation of:

greens
reds
blues
building colors

Vegetation:
dark muted green.

Concrete:
dirty warm/cool grey.

Buildings:
grey
beige-grey
muted brick
dirty cream.

Cars:
desaturated colors.

The red grill/fire may remain somewhat warmer because it becomes an important
visual contrast.

==================================================
5. USE WARM FIRE AS CONTRAST
==================================================

Before oxygen disappears, the fire/grill should be one of the few warm saturated
elements in the scene.

Everything around it:

cool
grey
muted

Fire:

orange
warm
alive

When oxygen falls:

FIRE DISAPPEARS.

Therefore the entire image should subconsciously become colder.

This is visual storytelling.

==================================================
6. LIGHTING
==================================================

Use soft overcast directional lighting.

No harsh bright sunny shadows.

Allow deeper shadows.

Foreground architecture may be dark but must retain readable shape.

Use cinematic tone mapping such as ACES Filmic if applicable.

Slightly lower exposure.

Do not crush blacks completely.

==================================================
7. TREES
==================================================

Current trees still feel somewhat generic low-poly/mobile-game.

Keep low polygon counts but alter:

- darker foliage
- less saturated green
- irregular asymmetric clusters
- different sizes
- different rotations

Do not make every tree look like the same green sphere.

==================================================
8. FILMIC IMAGE
==================================================

Add VERY subtle:

- vignette
- film grain
- mild softness/color grade

Possibly subtle SSAO/contact shading.

Do not add:

strong bloom
chromatic aberration
heavy blur
neon effects

Reference feels slightly imperfect and cinematic.

==================================================
9. REDUCE TEXT BY AT LEAST 50%
==================================================

This is CRITICAL.

The current version has too much simultaneous informational text.

It feels like an infographic.

The reference lets the WORLD tell the story.

Keep one PRIMARY HUD:

ATMOSPHERIC OXYGEN
21.0%

then:

0.0%

A second temporary counter such as:

TIME WITHOUT OXYGEN

may appear when important.

REMOVE most floating labels such as:

BREATHE
SPARK — NO FLAME
ELECTRIC CAR STILL DRIVING
ENGINE DEAD
AIR PRESSURE DOWN 21%
etc.

The simulation should demonstrate those facts visually.

If narration/subtitles are needed, use ONE restrained caption at a time.

Example:

"The flames went out first."

then remove it.

Later:

"Then the engines began to die."

Do NOT label every object.

==================================================
10. TYPOGRAPHY
==================================================

The giant bold WHAT IF text currently makes the opening feel like social-media
infographic content.

Reduce it.

Use reference-like cinematic typography.

Potential opening:

small:

WHAT IF...

then elegant centered text:

oxygen disappeared?

Or:

"What if the oxygen vanished?"

Use off-white rather than pure #FFFFFF.

Story captions should use restrained serif or elegant light-weight typography.

HUD numbers can remain sans-serif.

==================================================
11. CAMERA / FOREGROUND
==================================================

Your world has good density.

Use it more cinematically.

Create layers:

FOREGROUND:
partial person / grill / car / wall

MIDGROUND:
main oxygen event

BACKGROUND:
traffic and pedestrians

FAR:
foggy buildings

Allow things to partially block the frame.

Do not frame everything like a perfectly readable game level.

==================================================
12. POV HAND
==================================================

Keep the POV hand.

But improve its integration.

Currently it is extremely clean/simple and draws attention to itself.

Make:

slightly darker
less saturated
better shaded
less dominant

It should reinforce first-person perspective, not become the visual subject.

==================================================
13. REMOVE "WEB DEMO" FEEL
==================================================

At every frame ask:

Could this be mistaken for a browser coding demonstration?

If yes, reduce:

UI
labels
perfect clean colors
overly readable game-state explanations

The viewer should think:

"3D simulation / game cinematic"

not:

"interactive educational website."

==================================================
14. DO NOT CHANGE THE STORY YET
==================================================

Do NOT extend beyond the current 15 seconds.

Do NOT rewrite the oxygen simulation.

Do NOT add new major events.

Do NOT rebuild the city.

This is strictly a visual/art-direction pass.

==================================================
15. REFERENCE MATCH REVIEW
==================================================

Produce representative frames after the changes.

Compare:

PROVIDED REFERENCE VIDEO
CLAUDE V1
CLAUDE V2

Score honestly:

ASSET QUALITY
LOW-POLY STYLE
FOG
PALETTE
LIGHTING
ATMOSPHERE
COMPOSITION
CINEMATIC FEEL
SERIOUSNESS
REFERENCE GRAPHICS MATCH

The important question:

Does V2 feel like it could plausibly come from the same GENERAL graphical
medium/style family as the provided reference?

Do not inflate the score.

==================================================
SUCCESS CONDITION
==================================================

I want your strong existing city/assets combined with:

Astra-style atmospheric depth
+
reference-style muted rendering.

Do NOT simplify your world.

Your asset density is currently one of the project's strengths.

The change should be immediately obvious when V1 and V2 are placed side-by-side.
````
