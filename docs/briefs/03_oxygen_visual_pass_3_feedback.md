# Oxygen — owner feedback + VISUAL PASS 3 brief

> Verbatim owner brief, archived so later developers can check the rules and quotes in `docs/`. Owner's words, unedited
> (chat-only lines like "send the video when done" kept as written). Where a newer brief or `docs/` disagrees, the newer one wins.

````text
Yeah — now that I can compare Claude V2 directly against the actual reference video, Claude is definitely the better base.
But Claude’s 7.5/10 “reference match” is still too high. I’d put it around 6.5/10 right now.
It has the same general family now, but not yet the same graphical feel.
What Claude nailed
The city density is much better than Astra’s. There are actual storefronts, varied buildings, cars, people, props, foreground objects, traffic lights, activity, and depth. The fog/desaturation pass also helped enormously.
The serif captions are now much closer to the reference, and the scene no longer screams “Three.js demo.”
So I would continue with Claude and stop developing the Astra branch for now.
The main difference I see now
The reference isn't merely foggy low-poly.
It's more like:
dark PS2/Source-era cinematic simulation + low-resolution materials + heavy atmospheric dirt + strong shadow shapes.
Claude is currently:
clean modern low-poly scene + grey filter/fog.
That's why they still don't quite match.
The reference has much darker blacks. Look at the interior/bunker areas: huge portions of the screen are almost black. But the fog outside is still readable.
Claude currently lifts everything toward milky grey. There's fog, but it washes the whole world evenly.
That's the next thing to fix.
Biggest differences
Claude V2	Reference
Pale/white fog	Grey-green dirty fog
Clean textures/materials	Rough, slightly low-res materials
Bright pavement	Darker ground
Evenly lit scene	Strong dark/bright separation
Modern clean rendering	Older-game cinematic rendering
Smooth/clean image	Grainy/soft/dirty image
Mannequin people	Crude but stronger silhouettes
Simple contact with ground	Strong grounding/shadow/AO
Lots of visible details	Details partially swallowed by atmosphere


The people and hand are probably the biggest remaining “this was coded by AI” giveaway.
And I would NOT increase the fog anymore. The fog amount is already enough.
We need to improve what is inside the fog.

VISUAL PASS 3 — TRUE REFERENCE MATCH

I have now compared V2 directly against the ACTUAL reference frames.

V2 is substantially improved and we are keeping this codebase.

DO NOT rebuild the city.
DO NOT add more story.
DO NOT simply add more fog or desaturation.

The remaining mismatch is now very specific:

V2 looks like:
"modern clean low-poly + grey atmospheric filter"

The actual reference looks like:
"dark older-game / PS2-Source-era cinematic simulation with dirty atmospheric depth"

Target the second description.

==================================================
1. STOP MAKING THE FOG WHITER
==================================================

Current fog quantity is sufficient.

Do NOT significantly increase fog density.

The problem is the CHARACTER of the fog.

Current:
milky / pale / white-grey.

Reference:
darker grey-green / blue-grey atmospheric haze.

Make fog slightly darker and dirtier.

It should integrate with the environment rather than turning the background white.

Far objects should fade into a DARK GREY-GREEN atmosphere, not bright white.

Preserve silhouettes longer.

==================================================
2. MUCH STRONGER VALUE CONTRAST
==================================================

The actual reference contains very dark areas.

Do not be afraid of near-black foreground/interior shapes.

Reference structure often looks like:

VERY DARK FOREGROUND
→ readable middle distance
→ foggy grey background

V2 currently compresses too much of the image into similar medium-grey values.

Increase separation.

Example:

foreground facade / pole / vehicle:
dark

midground humans and grill:
medium

distant buildings:
foggy/light

This creates cinematic depth.

Do not crush everything to pure black.

Retain subtle detail inside dark areas.

==================================================
3. DARKEN THE GROUND
==================================================

The current pavement is too bright and clean.

Reference ground surfaces are significantly darker and dirtier.

Reduce sidewalk/road brightness.

Add subtle low-frequency variation:

patchiness
stains
roughness
uneven darkness

Do not use photoreal textures.

Keep stylized low-poly rendering.

But remove the "fresh concrete" appearance.

==================================================
4. OLDER-GAME MATERIAL FEEL
==================================================

The reference does NOT have modern polished low-poly materials.

Create a slightly older-game visual character.

Materials should feel:

matte
simple
slightly coarse
low-detail
not physically perfect

Use intentionally modest texture resolution if textures exist.

Subtle texture softness is acceptable.

Avoid:
ultra-sharp surfaces
perfect procedural gradients
clean physically-based presentation

Think:

PS2 / early Source-engine visual simplicity
+
modern atmospheric composition.

Do NOT add pixel-art effects.

==================================================
5. CONTACT SHADOWS / AO
==================================================

This is now one of the highest-priority technical changes.

People, grill, cars, bins and street props currently feel slightly pasted onto the environment.

Add restrained SSAO/GTAO or equivalent contact shading.

We need:

darkness underneath vehicles
feet grounded to pavement
grill grounded
objects contacting walls/curbs
depth in building recesses

Keep AO subtle.

Do not create thick black outlines.

This alone may significantly increase visual cohesion.

==================================================
6. PEOPLE
==================================================

Current human models are one of the biggest giveaways.

Do NOT make them high-poly or realistic.

Instead improve SILHOUETTE.

Reference characters are simple, but they read clearly.

Improve:

shoulder shape
torso proportions
legs
head size
arm pose
clothing silhouette

Reduce mannequin/stick-figure appearance.

Use darker, more muted clothing.

We only need 2–4 better reusable body variants.

Faces are unnecessary.

==================================================
7. FIRST-PERSON HAND
==================================================

The current hand looks like a blocky procedural object.

It breaks immersion.

Either:

A) replace it with a better low-poly GLB hand/arm,

or

B) remove the hand from most shots until a good model is available.

A bad first-person hand is worse than no hand.

If retained:

proper wrist
recognizable fingers
more natural pose
muted material
stronger shadowing

Do NOT let it dominate the frame.

==================================================
8. FIRE / SPARKS
==================================================

The fire as the only warm color is GOOD.

Keep this concept.

However, current sparks look slightly too clean/game-like.

Make them:

smaller
less numerous
less uniformly bright
shorter lived
slightly less perfect

Fire should feel like one small warm region surrounded by a cold environment.

At oxygen = 0:

its disappearance should produce a noticeable visual mood change.

==================================================
9. IMAGE IMPERFECTION
==================================================

The actual reference has a slightly dirty recorded/rendered character.

V2 is still too digitally clean.

Increase VERY subtly:

film grain
softness
atmospheric particulate
uneven contrast

Optional:
very mild temporal noise/grain variation.

Do NOT:

add VHS distortion
heavy chromatic aberration
fake scanlines
strong film scratches

We want "slightly imperfect rendered footage", not a retro filter.

==================================================
10. COLOR
==================================================

V2 may now be slightly TOO desaturated.

Do not return to V1 saturation.

But allow a little more muted color.

Try moving global saturation from the current value toward approximately:

0.80–0.85 relative to original

while keeping individual world materials desaturated.

Important distinction:

REFERENCE IS MUTED,
NOT MONOCHROME.

Maintain subtle:

green vegetation
red/brown objects
blue-grey environment
skin/clothing variation

The fire remains the strongest warm color.

==================================================
11. SKY
==================================================

The sky is currently too uniformly bright.

Add subtle vertical/value structure.

Upper sky:
slightly darker/cooler.

Horizon:
slightly brighter through fog.

No visible bright sun.

This should help silhouettes read against the sky.

==================================================
12. DISTANT GEOMETRY
==================================================

Do not let distant buildings simply disappear into a white wall.

Reference distance often still contains readable silhouettes.

Maintain broad dark shapes through fog:

roof lines
building blocks
street lamps
vehicles

Lose DETAIL first.

Lose SILHOUETTE later.

==================================================
13. CAPTION STYLE
==================================================

The restrained serif captions are now GOOD.

Keep them.

However:

avoid placing captions too low where TikTok interface elements may obscure them.

Reference uses small elegant captions integrated into the image.

Keep:
off-white
thin
subtle

Do not add more UI.

==================================================
14. OXYGEN HUD
==================================================

The oxygen HUD is currently slightly too clean/modern compared with the reference.

Keep the information, but reduce its visual dominance.

Try:

smaller label
less saturated red
off-white/grey label
slightly thinner typography

The number may change color during the oxygen drop.

At 0% it can be muted dark red rather than bright coral.

The world should remain the main visual element.

==================================================
15. COMPOSITION
==================================================

V2 still feels slightly like a camera looking straight down a generated street.

Use the existing environment to create stronger compositions.

At different moments use:

foreground human crossing frame
street pole partially occluding
car entering/leaving frame
grill on one side rather than centered
camera turn revealing another depth layer

Reference frequently has asymmetric framing.

Do not center every event.

==================================================
16. REFERENCE STYLE TEST
==================================================

For every comparison frame, temporarily ignore the subject matter.

Ask:

If the Omaha Beach objects were replaced with city objects,
could these two frames plausibly come from the SAME RENDERING PIPELINE?

Judge:

value structure
fog color
material simplicity
darkness
atmospheric dirt
silhouette quality
grain
grounding
typography

This is a stricter test than simply asking whether both are "low-poly".

==================================================
17. DO NOT CHASE EXACT CONTENT
==================================================

We are matching the general rendering language.

Do NOT copy:

military assets
gun composition
Omaha environment
exact typography positions
exact camera shots

Our oxygen city remains original.

==================================================
18. OUTPUT
==================================================

Produce V3 of the SAME 15 seconds.

Also produce a three-column comparison using actual frames now provided:

REFERENCE | V2 | V3

Choose approximately equivalent visual situations when possible:

1. atmospheric wide shot
2. strong foreground silhouette
3. people/environment shot
4. fog-depth shot
5. action/VFX shot

Score honestly:

VALUE STRUCTURE
FOG CHARACTER
MATERIAL STYLE
GROUNDING / AO
LOW-POLY SILHOUETTES
PALETTE
ATMOSPHERE
CINEMATIC FEEL
REFERENCE GRAPHICS MATCH

Do not inflate scores.

==================================================
CRITICAL PRIORITY ORDER
==================================================

1. contact shadows / grounding
2. darker value structure
3. darker/greener fog character
4. people silhouette
5. hand quality/remove hand
6. pavement/material roughness
7. image imperfection
8. minor color adjustment

Do NOT redesign the city.

Do NOT increase model complexity everywhere.

This is a rendering cohesion pass.

I would also finally give Claude the actual reference frames
Claude literally told you it only had our description. That's holding it back.
Give it 4 frames from the Omaha video:

1. Inside the bunker looking through the fog.
2. Binocular ocean view.
3. Beach full of soldiers.
4. Dark explosion/debris frame.

Tell it:
“These are the actual reference frames. Analyze them pixel-for-pixel stylistically before touching the project. Do not recreate their content; extract lighting, fog, palette, materials, contrast, geometry simplicity and post-processing.”
That will be significantly more useful than us continuing to describe the reference in words.
And based on what I see now, I would officially choose Claude's version over Astra's. We're past proving whether HTML works. It does. Now it's basically an art-direction problem.
````
