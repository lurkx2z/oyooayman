# Oxygen — owner feedback, real reference frames (images not stored), V4 brief and the 70/30 art-direction update

> Verbatim owner brief, archived so later developers can check the rules and quotes in `docs/`. Owner's words, unedited
> (chat-only lines like "send the video when done" kept as written). Where a newer brief or `docs/` disagrees, the newer one wins.

````text
ep — I watched the actual V3, and this is the first version where I’d say we’re genuinely in the same broad visual family as the reference.
Claude’s ~7/10 estimate is fair now. I’d put it around 6.8–7/10 against the actual Omaha clip.
The important thing is that fog/color grading are no longer the main problem. Don’t let Claude keep endlessly tweaking saturation and darkness. The remaining difference is mostly authored 3D assets + composition.
What still gives V3 away
The biggest one is the people. They still look AI-procedural: tube-like limbs, simple heads, awkward hands and very basic clothing shapes. The reference soldiers are low-poly too, but their silhouettes contain backpacks, helmets, weapons, jackets, straps, etc. They feel like actual game assets.
The architecture is second. Claude has good city density, but the window grids and facades are very regular. The reference has simple geometry, but lots of little silhouette interruptions—ledges, beams, bunker openings, terrain, obstacles, boats, debris.
The composition is third. Your first 15 seconds are visually centered around that grill for too long. The reference frequently has huge dark foreground shapes, a readable middle event and a hazy distant layer. Claude has the fog now, but it needs more deliberate framing.
I agree with Claude that ground-level fog variation would help, but I would rank that below the characters and architecture.
I also solved Claude's missing-reference problem
I extracted four useful frames directly from the Omaha video you sent me: dark interior/window contrast, fog depth, the binocular atmospheric view and the dense beach shot.

These are the ACTUAL reference frames.

Before changing any code, visually analyze all four reference images against
the current V3 build.

Do not rely on our previous written descriptions anymore.

Do NOT copy the subject matter, military content, layout, assets or exact shots.
We are extracting the rendering/art-direction language only.

FIRST: produce a strict calibration report comparing:

1. VALUE STRUCTURE
   - darkest areas
   - midtones
   - brightest fog/sky
   - foreground/background separation

2. FOG
   - fog hue
   - fog brightness
   - distance falloff
   - whether silhouettes survive through haze
   - local/uneven fog versus uniform global fog

3. MATERIAL CHARACTER
   - roughness
   - texture sharpness
   - amount of surface variation
   - modern PBR vs older-game appearance

4. GEOMETRY / SILHOUETTES
   - how simple the reference models actually are
   - where silhouette complexity comes from
   - why our characters/buildings still appear procedural

5. COMPOSITION
   - foreground occlusion
   - midground subject placement
   - distant atmospheric layers
   - amount of empty space
   - asymmetry

6. COLOR
   - vegetation greens
   - concrete
   - sky
   - fog
   - warm accent colors
   - overall saturation

7. IMAGE CHARACTER
   - grain
   - softness
   - contrast
   - atmospheric dirt
   - sharpness

8. TYPOGRAPHY
   - size
   - weight
   - positioning
   - dominance relative to the scene

Then compare:

REFERENCE
vs
CURRENT V3

Identify the FIVE largest remaining visual mismatches.

Do not modify anything until this analysis is complete.

After the analysis, implement a narrowly targeted V4.

==================================================
V4 PRIORITIES
==================================================

DO NOT substantially increase fog density.
DO NOT simply darken or desaturate the entire image again.
DO NOT rebuild the city.
DO NOT extend past 15 seconds.

The V3 atmosphere is already approximately correct.

Focus on:

1. CHARACTER SILHOUETTES

Our people are currently one of the clearest procedural tells.

Either:

- replace the visible foreground/midground people with proper low-poly GLB
  character assets,

OR substantially redesign them so they have stronger authored silhouettes.

We need:

real shoulder shapes
better torso/hip relationship
better limbs
shoes/feet
jackets or clothing layers
different body proportions
better arm poses

No detailed faces required.

Use approximately 3–5 reusable variants.

Low-poly is GOOD.
Mannequin-like is NOT.

2. ARCHITECTURAL IRREGULARITY

Keep the existing buildings.

Break the perfectly procedural facade feeling using:

window recesses
different window spacing on selected buildings
awnings
roof equipment
sign frames
vents
ledges
doorways
pipes
balconies where appropriate

Do this mainly on the buildings most visible to camera.

Far buildings can remain simple.

3. MATERIAL VARIATION

Reference surfaces are visually simple but imperfect.

Add restrained:

wall grime
subtle stains
slight color variation
darker bases
pavement patches
roughness variation

Avoid photoreal textures.

The goal is older-game texture character, not realism.

4. LOCAL ATMOSPHERIC LAYERS

Current global fog is good.

Add a small amount of NON-UNIFORM atmospheric structure.

Examples:

very soft ground haze
large transparent fog cards
slow drifting haze volumes

Extremely subtle.

Do not turn this into smoke.

The atmosphere should have depth instead of one mathematically uniform fog field.

5. COMPOSITION

The grill remains the visual anchor for too much of the sequence.

Use the existing camera/event timeline but create stronger visual progression.

For example:

start with grill/fire as foreground event
→ oxygen loss
→ camera attention shifts away
→ vehicles/street become the visual subject
→ deeper city is revealed

Use foreground objects crossing or partially framing the screen.

Reference principle:

DARK FOREGROUND
+
CLEAR MIDGROUND EVENT
+
HAZY BACKGROUND

6. CONTACT SHADOWS

Keep AO/contact shading.

Tune it if the actual reference shows stronger grounding.

People should visibly connect with pavement.

Cars should feel heavy on the road.

Do not create black halos.

==================================================
CRITICAL RULE
==================================================

V4 IS NOT "MORE DETAIL."

It is:

MORE AUTHORED SILHOUETTES
+
MORE AUTHORED COMPOSITION
+
LESS PROCEDURAL REGULARITY.

The Omaha reference proves that the polygon count can remain low.

The goal is for a screenshot to look like it came from a deliberately art-directed
3D game/simulation, not code that procedurally generated a city.

After V4, produce:

REFERENCE | V3 | V4

using the ACTUAL supplied frames.

Then score:

VALUE STRUCTURE
FOG
MATERIAL CHARACTER
CHARACTER SILHOUETTES
ARCHITECTURE
COMPOSITION
ATMOSPHERIC DEPTH
LOW-POLY STYLE
OVERALL REFERENCE GRAPHICS MATCH

Be strict and do not inflate scores.
One other thing: I would not wait for a 9/10 graphics match before making the rest of the oxygen video. If V4 fixes the mannequin people and procedural-building feeling and gets us to something like a genuine 7.5–8/10, that's enough. Then we need to start making the actual video insane, because the reference succeeds from its scenario/pacing just as much as its graphics.
Right now Claude has already proven the HTML approach works. The remaining question isn't “can HTML make it?” anymore. It's how far we want to polish the art direction before we build seconds 15–90.

Yes — this changes the target in a useful way. I inspected the full new reference. This is actually closer to the core “POV What If” look you want than the Omaha clip.
I’d now target roughly:
70% this new POV What If style + 30% Omaha atmosphere/grit.
So we should not push Claude toward a full dark PS2/Source look anymore. That would overshoot.
What this new reference adds
It has a much more polished stylized simulation look:

* clean low/mid-poly models, but clearly artist-designed
* stronger material highlights and specular reflections
* smooth white/metallic surfaces
* controlled bright orange/yellow emissive effects
* first-person body/arms constantly grounding the viewer
* strong centered perspective and scale
* very simple but excellent HUD
* small serif narration captions
* cinematic vignette/lens treatment
* cleaner image than Omaha
* dramatic color changes based on the environment
* fog/haze, but not everything is dirty and desaturated
* huge contrast between dark geometry and glowing effects

The Omaha reference should mainly contribute:
fog depth + darker foregrounds + stronger grounding + irregularity + serious atmosphere.
The new reference should contribute:
overall polish + materials + POV presentation + UI + color + VFX + cleaner stylized graphics.
I extracted six useful frames for Claude:

IMPORTANT ART-DIRECTION UPDATE

I am adding a SECOND actual reference video/frame set.

The desired final style is now a BLEND of the two references.

Do NOT simply copy either reference.

TARGET MIX:

approximately 70% NEW "POV What If / fall-through-Earth" reference
approximately 30% OMAHA reference

The new POV reference should define the PRIMARY graphical language.

The Omaha reference should provide supporting atmosphere, depth and grounding.

==================================================
PRIMARY TARGET — NEW POV REFERENCE
==================================================

From the new reference, extract:

- polished stylized low/mid-poly rendering
- clearly authored assets
- smooth but still simplified geometry
- convincing first-person body presence
- strong scale
- restrained clean HUD
- elegant serif narration
- controlled vignette
- readable specular highlights
- dramatic but tasteful emissive effects
- cinematic color transitions
- strong foreground/body silhouette
- centered/deep perspective when appropriate
- cleaner image than the Omaha reference
- environments that feel like a professional simulation/game cinematic

IMPORTANT:

This reference is NOT extremely gritty or monochrome.

It uses substantial color when the environment calls for it.

Examples:
orange/red mantle
bright gold center
cool surface tones
white/metal body materials

Therefore do NOT desaturate our oxygen video into grey sludge.

==================================================
SECONDARY TARGET — OMAHA REFERENCE
==================================================

From Omaha, keep:

- atmospheric fog depth
- strong foreground / midground / background separation
- darker value structure
- soft distant silhouettes
- contact shadows
- grounded objects
- environmental irregularity
- slightly coarse older-game simplicity
- serious tone

Do NOT inherit:

- military palette
- extremely dark bunker interiors everywhere
- excessive grime
- full PS2-style dirtiness

Our city should still feel visually polished.

==================================================
FINAL STYLE DESCRIPTION
==================================================

The oxygen project should look like:

A POLISHED CINEMATIC LOW-POLY FIRST-PERSON SIMULATION

with:

modern stylized rendering
+
older-game simplicity
+
strong atmospheric depth.

NOT:

a browser coding demo.

NOT:

a colorful mobile game.

NOT:

an extremely dirty PS2 game.

NOT:

photorealistic.

==================================================
MATERIAL BALANCE
==================================================

Previous instructions made nearly everything extremely matte.

Adjust this.

ENVIRONMENT:
mostly matte / rough.

Concrete:
roughness ~0.75–0.95

Buildings:
roughness ~0.7–0.9

Road:
roughness ~0.9+

Vegetation:
matte.

BUT selected assets may have stronger highlights.

Cars:
roughness approximately 0.45–0.7

glass:
clear dark reflections

metal props:
controlled specular highlights

Important POV objects:
can have clean readable highlights.

The new reference gains visual polish from selective reflective surfaces.

Do not make everything equally matte.

==================================================
COLOR
==================================================

Do NOT push saturation back to V1.

But V3 should not become almost monochrome either.

Target:

muted world
+
strong purposeful accent colors.

For the oxygen video:

grey-blue sky
muted buildings
dark green vegetation
charcoal road
desaturated vehicles

BUT:

fire = strong warm orange
sparks = bright warm points
traffic lights = controlled red/green
emergency/hazard lights = readable color

This is very similar to how the new reference allows intense warm mantle colors
inside an otherwise controlled palette.

==================================================
POV BODY LANGUAGE
==================================================

The new reference proves that visible first-person body parts can add enormous
immersion when executed properly.

Our previous procedural hand looked poor.

Do NOT restore that primitive hand.

Instead, eventually use an authored low-poly first-person arm/hand GLB asset.

Target characteristics:

- simple
- recognizable hand/fingers
- proper wrist/forearm
- good silhouette
- slightly stylized
- well shaded
- appropriate clothing/sleeve

It should provide the same grounding function as the body/arms in the new reference:

"This is happening to ME."

Until a suitable asset exists, no hand is better than a bad hand.

==================================================
HUD STYLE
==================================================

Study the new reference carefully.

Its information hierarchy is excellent.

Small label:

DEPTH

larger number:

2,498 km

small contextual secondary information.

Use this philosophy for oxygen:

ATMOSPHERIC OXYGEN
21.0%

then:

ATMOSPHERIC OXYGEN
0.0%

Possibly:

TIME WITHOUT OXYGEN
00:18

Keep HUD near an edge.

Minimal.

Small enough that the 3D scene remains dominant.

Do not create large web-app UI panels.

==================================================
NARRATION TEXT
==================================================

The new reference's serif captions are particularly relevant.

Use:

small elegant serif
off-white
subtle shadow
center-lower area

ONE short sentence at a time.

Examples:

"The flames went out first."

"Then the engines began to fail."

"You still have oxygen in your blood."

Do not describe every visible event.

Narration should add tension/context.

==================================================
CAMERA CHARACTER
==================================================

The new reference camera feels:

stable
intentional
immersive
physical

not constantly shaky.

Use restrained:

head movement
breathing
reaction motion

Allow the environment itself to create spectacle.

Avoid exaggerated FPS bobbing.

The body/foreground can move more than the camera when appropriate.

==================================================
VIGNETTE / LENS
==================================================

The new reference uses noticeable edge darkening/optical framing.

Use a subtle-to-moderate cinematic vignette.

It can help:

focus the center
hide weak peripheral geometry
increase first-person immersion

Do NOT make it look like binoculars unless story-specific.

Do not create a giant obvious black circle.

==================================================
LIGHTING
==================================================

Our oxygen surface scene should be brighter than Omaha but moodier than V1.

Target:

overcast daylight
+
clear readable shapes
+
deep foreground shadow
+
hazy distant city.

Avoid both extremes:

not bright sunny mobile-game lighting
not dark bunker lighting.

When the warm flame disappears, the scene should become perceptually colder.

==================================================
ASSET QUALITY
==================================================

Use the new reference as the asset-quality benchmark.

Notice:

models remain relatively simple,
but silhouettes look intentionally created.

This reinforces the V4 priority:

AUTHORED LOW-POLY ASSETS
rather than procedural cylinders/boxes.

People, cars and important foreground props should have recognizable,
designed silhouettes.

Distant objects can remain cheap.

==================================================
VFX
==================================================

The new reference uses strong VFX without looking like an arcade game.

Principles:

- bright effects are localized
- particles have direction
- emissive objects illuminate nearby forms
- effects reinforce motion/scale
- background stays relatively controlled

For oxygen:

fire
sparks
engine sputter
distant smoke
aircraft lights
hypoxia visual effects

may be visually strong.

Do not cover the screen with particles.

==================================================
STYLE PRIORITY
==================================================

Going forward, use this order:

1. NEW POV WHAT-IF REFERENCE — overall look/polish
2. OMAHA REFERENCE — atmosphere/depth/grit
3. our original design — city/scenario/story

If the two references conflict:

prefer the NEW POV reference.

==================================================
STRICT V4 GOAL
==================================================

Do not try to make the oxygen city look like Omaha Beach.

Instead:

Imagine the same creator/rendering philosophy behind the NEW POV reference
made a surface-level modern city scene,

then gave it approximately 30% of Omaha's atmospheric depth and darker grounding.

That is the target.

==================================================
REFERENCE REVIEW
==================================================

You now have ACTUAL image references from BOTH videos.

Before coding, inspect them visually.

Compare them against V3.

Identify what BOTH references share.

Those shared traits are especially important.

Likely shared traits include:

- simple authored geometry
- very clear silhouettes
- strong atmospheric depth
- minimal HUD
- readable first-person scale
- restrained typography
- dramatic lighting
- consistency
- objects that look intentionally modeled rather than procedurally assembled

Then identify where they differ.

Do NOT blindly average every property.

Create a coherent hybrid.

After V4 provide:

OMAHA REFERENCE
NEW POV REFERENCE
V3
V4

and score:

AUTHORED ASSET QUALITY
POV IMMERSION
MATERIAL QUALITY
FOG / DEPTH
COLOR
LIGHTING
COMPOSITION
VFX STYLE
HUD / TYPOGRAPHY
OVERALL "POV WHAT IF" GRAPHICS MATCH
And this is actually a better target for the oxygen video. The Omaha-only direction was beginning to make it too grey and dirty.
The new target is closer to:
clean enough to look polished, simple enough to render fast, atmospheric enough to look cinematic.

That is basically exactly what these What If videos are doing.
````
