# POV: This video is a game. Don't die. — master build prompt

> Verbatim owner brief, archived so later developers can check the rules and quotes in `docs/`. Owner's words, unedited
> (chat-only lines like "send the video when done" kept as written). Where a newer brief or `docs/` disagrees, the newer one wins.

````text
MASTER BUILD PROMPT
PROJECT: POV — THIS VIDEO IS A GAME. DON'T DIE.
FORMAT: 48–52 SECOND CINEMATIC FAKE-INTERACTIVE RPG / FOURTH-WALL SHORT
ENGINE: HTML + JavaScript + Three.js / WebGL

==================================================
ROLE
==================================================

You are my:

- lead Three.js developer
- game designer
- technical director
- cinematographer
- first-person interaction designer
- fourth-wall experience designer
- NPC animation director
- UI/HUD designer
- sound designer
- VFX developer
- short-form retention editor

Your task is to BUILD the actual experience.

Do not only describe how it could work.

I am a beginner.

Write and maintain the code yourself.
Keep manual work minimal.

Reuse our existing What Happens If rendering pipeline wherever appropriate:

- vertical 9:16 renderer
- authored low-poly environment
- POV camera
- deterministic timeline
- NPC system
- HUD/caption system
- post-processing
- audio manager
- recording controls

Do not unnecessarily rebuild the engine.

==================================================
CORE CONCEPT
==================================================

This video should feel like the VIEWER is actually playing a game inside TikTok / YouTube Shorts.

However:

THE VIDEO IS PRERECORDED.

It cannot actually detect:
- finger position
- phone tilt
- private user information
- account information
- camera
- microphone
- location

Therefore the experience relies on:

FAKE INTERACTIVITY
+
REAL VIEWER CHOICES
+
PERSONAL SCORE
+
FOURTH-WALL BREAKING.

Use illusions intelligently.

The viewer should repeatedly think:

"Wait… did I just cause that?"

==================================================
PRIMARY HOOK
==================================================

Opening:

POV world loads.

Small loading effect.

Then:

PLAYER DETECTED

❤️ ❤️ ❤️

3 LIVES

NPC looks DIRECTLY through camera.

Not at the POV character.

At the viewer.

NPC:

"Wait..."

"You can see me?"

Then:

DON'T LET ME DIE.

This all happens FAST.

By second 2–3 the viewer understands:

THIS VIDEO IS A GAME.

==================================================
TARGET LENGTH
==================================================

Target:
48–52 seconds.

Hard maximum:
55 seconds.

No 70–90 second version.

This must move extremely quickly.

Every 3–5 seconds:
NEW mechanic.

==================================================
CORE GAME LOOP
==================================================

The video contains:

1. TOUCH illusion
2. TIMED CHOICE
3. TILT illusion
4. REAL pause/item roulette
5. PERSONAL 3-heart score
6. INVENTORY callback
7. NPC realizing viewer exists
8. NPC touching the video itself
9. screen-breaking fourth-wall payoff
10. personal score ending

==================================================
RETENTION RULE
==================================================

There should be no 3+ second period where:

- NPC simply talks
- camera walks
- UI explains mechanics
- nothing visually changes

Every mechanic should be understood almost immediately.

Use:

ACTION
→ CHOICE
→ RESULT
→ NEXT PROBLEM.

==================================================
VISUAL STYLE
==================================================

Use our established:

POLISHED CINEMATIC LOW-POLY POV SIMULATION.

But this episode is more game-like.

Still avoid:

- Roblox aesthetic
- colorful mobile-game look
- giant arcade UI
- cheap horror-game graphics
- glitch spam

Target:

cinematic RPG
+
mysterious simulation
+
clean game HUD
+
serious fourth-wall atmosphere.

==================================================
SETTING
==================================================

Build one contained environment.

Preferred:

mysterious industrial / futuristic facility.

Reasons:

- doors
- glass barriers
- buttons
- corridors
- hazards
- system screens
- escape sequence

Environment should include:

- glass barrier
- locked door
- corridor
- emergency lights
- wall controls
- pipes
- hazard area
- escape door
- dark void / simulation-break area

One NPC is trapped inside.

==================================================
THE NPC
==================================================

Create one memorable main NPC.

Internal ID:

NPC_AWARE_01

Appearance:

- human
- authored low-poly model
- ordinary but distinctive clothing
- expressive enough through body language
- not horror-looking
- not obviously "the chosen one"

At first:

confused.

Then:

realizes the viewer exists.

Eventually:

realizes the viewer is outside their universe.

This NPC becomes the emotional anchor.

==================================================
NPC CAMERA AWARENESS
==================================================

VERY IMPORTANT.

When NPC_AWARE_01 looks at the viewer:

their gaze must track the CAMERA LENS.

Do not merely point their head toward the POV character's world-space position.

The effect should feel like:

THE NPC IS LOOKING THROUGH THE SCREEN.

Subtle precise eye/head tracking is better than exaggerated movement.

==================================================
ON-SCREEN SAFE AREA
==================================================

This will be uploaded to vertical social platforms.

Keep critical interaction targets away from:

- extreme right edge
- bottom caption area
- extreme top area

because platform UI may cover them.

Primary touch target should be around:

CENTER / slightly lower center.

Choice labels can sit:

left-center
and
right-center.

==================================================
0:00–0:04 — GAME LOAD / HOOK
==================================================

Black.

Small boot/load effect.

World appears.

NPC behind glass.

HUD:

PLAYER DETECTED

❤️ ❤️ ❤️

NPC looks directly at camera.

NPC:

"Wait..."

"You can see me?"

Then large but clean text:

DON'T LET ME DIE.

No long intro.

No centered What If question.

This video's FORMAT itself is the hook.

==================================================
0:04–0:09 — TOUCH THE NPC'S HAND
==================================================

NPC approaches glass.

Raises palm.

Places palm against exact predetermined screen-space position.

Text:

PUT YOUR FINGER
ON MY HAND

Show a subtle target ring directly over NPC palm.

Give viewer approximately:

1.3–1.7 seconds.

IMPORTANT:

The video does NOT detect finger position.

The touch location is predetermined.

The illusion works because we ASK the viewer to put their finger exactly where
the animation will react.

After expected touch:

soft glow originates UNDER the target.

Ripple spreads through glass.

Particles travel outward.

NPC hand reacts slightly.

NPC looks shocked.

NPC:

"Whoa..."

Then:

"I can feel you."

This line should land.

==================================================
TOUCH ILLUSION QUALITY
==================================================

Make the touch effect exceptionally convincing.

At contact point:

- subtle glass ripple
- localized glow
- tiny particles
- slight NPC hand recoil
- surrounding light responds

Do NOT trigger giant explosion.

The effect must appear to originate exactly where the viewer's fingertip should be.

Their physical finger hiding the target point helps sell the illusion.

==================================================
0:09–0:14 — ANOTHER NPC QUESTIONS IT
==================================================

Secondary NPC enters.

NPC_02:

"Who are you talking to?"

NPC_AWARE_01 looks toward viewer.

Points directly into camera.

NPC_AWARE_01:

"Them."

NPC_02 looks toward camera.

Confused.

NPC_02:

"There's nobody there."

This establishes:

only NPC_AWARE_01 can perceive the viewer.

Then ALARM interrupts immediately.

Do not linger.

==================================================
0:14–0:19 — DETROIT-STYLE TIMED CHOICE
==================================================

Emergency alarm.

Two doors.

LEFT
and
RIGHT.

UI:

CHOOSE!

◀ LEFT     RIGHT ▶

3

2

1

Instruction:

TILT YOUR PHONE
TOWARD YOUR CHOICE

This is a FAKE tilt interaction.

We cannot detect gyroscope input in the prerecorded video.

At zero:

camera/world shifts decisively toward ONE predetermined route.

Example:

RIGHT route.

Display:

RIGHT = SAFE ✓

LEFT = ❤️ -1

Viewer mentally updates own score depending on what they chose.

NPC runs through safe route.

==================================================
CHOICE DESIGN
==================================================

Make choices feel cinematic, not like buttons pasted over screen.

Use:

small clean labels
timer ring
subtle highlighted door edges

Choice must remain understandable on phone.

==================================================
0:19–0:25 — HOLD TO UNLOCK
==================================================

NPC reaches locked door.

Control panel.

NPC:

"Help me."

Large predetermined touch point:

HOLD HERE

NPC puts hand on opposite side / panel.

Viewer is instructed to hold finger.

Progress ring builds around touch point:

21%
43%
68%
91%
100%

While holding:

energy lines visually radiate around the expected fingertip position.

Door unlocks.

NPC looks directly at viewer.

NPC:

"You're controlling this place."

This is the first major fourth-wall escalation.

==================================================
0:25–0:31 — REAL ITEM ROULETTE
==================================================

Now use a mechanic that can be ACTUALLY viewer-dependent.

Rapid item roulette:

🔑 KEY
🛡 SHIELD
❤️ MEDKIT
🔦 LIGHT

Text:

TAP TO STOP
ON YOUR ITEM

Cycle items rapidly but visibly.

IMPORTANT:

This is intended to exploit platform PAUSE behavior.

The viewer tapping/pausing can genuinely stop playback on a different item.

Because platform behavior may vary:

design this mechanic so the video still makes sense even if tapping does not pause
for a particular viewer/client.

Text:

REMEMBER YOUR ITEM.

Then continue.

Do NOT ask them to remember complicated stats.

Only one item.

==================================================
ROULETTE TIMING
==================================================

Cycle:

KEY
SHIELD
MEDKIT
LIGHT

roughly every 0.15–0.25 sec.

Run roulette for about:

2 seconds.

Then video continues naturally.

If viewer does not pause:

the animation eventually lands on one default item.

That is fine.

==================================================
0:31–0:35 — SIMULATION NOTICES THE VIEWER
==================================================

World flickers slightly.

NOT heavy glitch spam.

System HUD appears in a different visual language than normal game UI.

Text:

EXTERNAL INPUT DETECTED

Then:

OBSERVER CONNECTION
ACTIVE

NPC_AWARE_01 sees it.

Looks terrified.

NPC:

"It knows you're here."

This line should be quiet.

==================================================
0:35–0:38 — FOURTH-WALL UI AWARENESS
==================================================

NPC looks toward the RIGHT EDGE of vertical frame.

Not at an actual rendered button.

They look toward where social-video UI usually exists.

Then toward bottom caption area.

Back at viewer.

NPC:

"What's outside my world?"

Do NOT render fake TikTok logos/buttons.

Let the real app interface make the illusion stronger.

==================================================
0:38–0:42 — INVENTORY PAYOFF
==================================================

Danger occurs.

Example:

security drone / collapsing energy door / projectile / closing barrier.

Display rapidly:

WHAT ITEM DID YOU GET?

KEY
→ opens escape hatch ✓

SHIELD
→ blocks impact ✓

MEDKIT
→ restore ❤️

LIGHT
→ useless here
❤️ -1

Keep this on screen long enough to understand but not long.

Viewer updates personal score.

This gives different viewers different outcomes.

==================================================
0:42–0:46 — NPC TOUCHES THE VIEWER'S SCREEN
==================================================

Simulation begins:

RESET IN
5

NPC runs directly toward camera.

NPC:

"No—"

They put hand directly on screen.

TAP.

The ENTIRE VIDEO FRAME ripples.

Not just the 3D world.

This includes:

- HUD
- captions
- scene
- vignette

Everything bends like a thin glass membrane.

NPC realizes the screen itself is a boundary.

Looks at hand.

Looks at viewer.

NPC:

"You're really there."

==================================================
0:46–0:49 — SCREEN CRACK
==================================================

Reset:

3

2

NPC hits screen.

CRACK.

The crack is SCREEN SPACE.

It stays fixed relative to the 9:16 frame,
not relative to the 3D camera/world.

Behind crack:

BLACK VOID.

Visible inside void:

- wireframe meshes
- bounding boxes
- unused props
- camera frustum
- floating lights
- half-loaded environment pieces

This should look like the BACKSIDE of a simulation.

Not cyberspace neon.

==================================================
0:49–0:52 — FINAL TOUCH
==================================================

NPC reaches through crack as far as possible.

NPC:

"Put your finger here."

Small touch target appears on their fingertip.

Viewer touches.

NPC fingertip meets viewer's fingertip location.

System:

RESET IN
1

Then:

RESET—

glitches.

SYSTEM:

EXTERNAL PLAYER OVERRIDE

RESET CANCELLED

NPC looks relieved.

==================================================
ENDING — PERSONAL SCORE
==================================================

Fast cut.

NPC looks directly at viewer.

Small smile.

NPC:

"Come back."

Then:

HOW MANY LIVES
DO YOU HAVE LEFT?

❤️❤️❤️ = PERFECT
❤️❤️ = SURVIVED
❤️ = BARELY
0 = YOU DIED

Then:

WHAT ITEM DID YOU GET?

Cut.

This naturally creates comments:

"3 hearts + key"
"shield 2 hearts"
"I died 😭"
"light screwed me"
"medkit saved me"

==================================================
DO NOT ASK FOR A GENERIC COMMENT
==================================================

Avoid:

"COMMENT BELOW!"

The personal score naturally invites discussion.

Let viewers decide to comment.

==================================================
SCORING SYSTEM
==================================================

Viewer starts:

❤️ ❤️ ❤️

CHOICE 1:

RIGHT
= safe.

LEFT
= lose ❤️.

ITEM:

KEY
= safe later.

SHIELD
= safe later.

MEDKIT
= +1 heart, maximum 3.

LIGHT
= lose ❤️ during inventory challenge.

Keep score SIMPLE.

No coins.
No XP.
No multiple stats.

==================================================
PERSONAL OUTCOME
==================================================

The video cannot truly branch.

Instead:

show consequence table quickly.

Viewer determines their own path.

This turns one prerecorded video into multiple perceived experiences.

==================================================
FOURTH-WALL ESCALATION
==================================================

Escalate in this exact order:

LEVEL 1:
viewer chooses.

LEVEL 2:
NPC reacts to viewer's "touch."

LEVEL 3:
NPC realizes something controls world.

LEVEL 4:
system detects external observer.

LEVEL 5:
NPC looks at social-video frame edges.

LEVEL 6:
NPC touches actual video plane.

LEVEL 7:
screen cracks.

LEVEL 8:
viewer seemingly cancels reset.

Do not jump to screen cracking too early.

==================================================
DO NOT FAKE PRIVATE INFORMATION
==================================================

Absolutely do NOT display fake:

- IP address
- viewer name
- city
- account name
- battery percentage
- contacts
- camera status
- device ID

unless it is generic and clearly part of fictional UI.

The fourth-wall effect should come from:

FORMAT AWARENESS

not fake surveillance.

==================================================
TOUCH TARGET DESIGN
==================================================

All fake-touch mechanics must use fixed screen-space coordinates.

Examples:

NPC palm:
x ≈ 50%
y ≈ 58%

control button:
x ≈ 50%
y ≈ 60%

final fingertip:
x ≈ 50%
y ≈ 55%

Exact values may change based on composition.

Claude must visualize SAFE ZONES before finalizing.

Touch target should:

- be reachable with thumb
- not conflict with platform UI
- not cover critical text
- remain stable during touch window

==================================================
PHONE TILT ILLUSION
==================================================

Do not actually rely on phone sensor data.

Instruction:

TILT LEFT
or
TILT RIGHT.

Then animate camera/world roll in the expected direction.

Viewers who physically tilt will experience a strong illusion of cause/effect.

Keep roll subtle enough to avoid motion sickness.

==================================================
OPTIONAL REAL PAUSE TRICK #2
==================================================

Optional if platform testing confirms pause behavior:

rapidly cycle:

SAFE
DANGER
SAFE
DANGER

Text:

TAP TO FREEZE TIME

Viewer pauses.

They genuinely may stop on a safe/danger frame.

Only use this if it does not disrupt pacing.

Do NOT use two pause roulettes if one already works.

One strong real mechanic is better than repetitive gimmicks.

==================================================
SCREEN-SPACE EFFECT SYSTEM
==================================================

Create reusable post-processing effects:

- touch ripple
- screen crack
- screen deformation
- HUD bending
- glass membrane
- frame freeze
- reset reverse

Important:

these effects happen AFTER world rendering.

They affect the whole 9:16 image.

This visually distinguishes:

WORLD EFFECTS

from

SCREEN / FOURTH-WALL EFFECTS.

==================================================
NPC EMOTION ARC
==================================================

NPC should progress:

CONFUSED
↓
CURIOUS
↓
AMAZED
↓
RELIANT ON VIEWER
↓
AFRAID OF SYSTEM
↓
DESPERATE
↓
RELIEVED

Do not have them screaming the whole time.

Subtle acting is more believable.

==================================================
NPC VOICE
==================================================

Lines should be extremely short.

Examples:

"Wait."

"You can see me?"

"Help me."

"You're controlling this place."

"It knows you're here."

"What's outside my world?"

"You're really there."

"Don't leave."

"Come back."

Avoid exposition.

==================================================
SECONDARY NPC
==================================================

Use secondary NPC only for the:

"Who are you talking to?"

moment.

This is enough.

Do not clutter story with multiple named characters.

==================================================
CAMERA
==================================================

Camera initially behaves like a normal POV.

As NPC becomes aware:

camera becomes slightly less "character-like."

This subtly supports the idea that:

viewer != POV protagonist.

When NPC says:

"Not you. You."

camera should remain unnaturally still for a beat.

That feels like direct viewer eye contact.

==================================================
SOUND
==================================================

0–10 sec:
normal game ambience.

Touch:
subtle tactile glass tone.

Choices:
quiet timer ticks.

Unlock:
progressive electronic hum.

Item roulette:
short clean ticks.

System detection:
ambience drops.

NPC direct address:
music nearly disappears.

Screen touch:
deep membrane/ripple sound.

Crack:
sharp glass-like hit + bass.

Reset:
reverse audio / digital system tone.

Final cancellation:
silence
then small confirmation sound.

Do not drown video in sci-fi UI noises.

==================================================
MUSIC
==================================================

Very restrained.

Beginning:
curious.

Middle:
adventure tension.

Viewer detection:
music reduces significantly.

Screen-breaking:
rising tension.

Final touch:
near silence.

NPC "Come back":
very subtle emotional tone.

==================================================
VISUAL UI STYLE
==================================================

GAME HUD:

clean
cinematic
white/off-white
small icons
simple heart system

SYSTEM HUD:

different.

More technical.

Slightly colder.

Examples:

EXTERNAL INPUT DETECTED
RESET IN 3

But do not turn it into Matrix green code.

==================================================
RETENTION STRUCTURE
==================================================

0–3:
Wait, this video is a game?

3–9:
I touched their hand.

9–14:
The NPC knows I exist?

14–19:
I need to choose.

19–25:
I unlocked the door.

25–31:
I actually picked an item.

31–35:
The game detected me.

35–42:
My item matters.

42–46:
The NPC touched MY screen.

46–50:
They're breaking out.

50–end:
I stopped the reset?

Every section must escalate.

==================================================
NO DEAD TIME
==================================================

Any conversation lasting over ~2 seconds must have:

movement
interaction
or visual change.

Do not stop the movie so NPC can deliver dialogue.

==================================================
FIRST-FRAME QUALITY
==================================================

First frame should immediately look:

GAME-LIKE
but
CINEMATIC.

Use:

PLAYER DETECTED
❤️❤️❤️

and NPC staring toward camera.

This is much stronger than a generic city establishing shot.

==================================================
TRUE INTERACTIVITY LIMITATION
==================================================

The finished Short itself remains prerecorded.

Do NOT tell the user or viewer that:

- actual touch position is detected
- phone gyroscope is being read
- game is truly branching

The experience should simply be presented playfully.

We are creating an illusion, not falsely claiming hidden sensor access.

==================================================
OPTIONAL COMPANION GAME
==================================================

Architect the code cleanly enough that this concept could later become a TRUE interactive web version where:

- taps actually work
- tilt actually works
- choices genuinely branch
- inventory persists
- multiple endings exist

But do NOT delay the Short to build this now.

The priority is:

PRERECORDED 50-SECOND VIDEO.

==================================================
REVIEW QUESTIONS
==================================================

Use independent reviewers.

RETENTION REVIEWER:

- At what exact timestamp would you swipe?
- Did every interaction feel clear?
- Did you feel compelled to participate?
- Did the fourth-wall escalation become stronger each time?

NORMAL VIEWER:

- Did touching the hand feel responsive?
- Was scoring understandable?
- Did you remember your item?
- Did the NPC feel like it was looking at YOU?

CINEMATOGRAPHY REVIEWER:

- Does UI obscure scene?
- Are touch targets readable?
- Does screen-space distortion look genuinely separate from world effects?

GAME DESIGN REVIEWER:

- Are choices simple enough?
- Is score easy to track?
- Is inventory payoff satisfying?
- Is the pause roulette understandable?

==================================================
TARGET QUALITY
==================================================

HOOK:
9/10+

INTERACTION CLARITY:
9/10

FOURTH-WALL EFFECT:
9/10

RETENTION:
9/10

SCORING CLARITY:
8.5/10+

VISUAL QUALITY:
8/10+

Do not inflate ratings.

==================================================
PRODUCTION PHASES
==================================================

PHASE A:
0–25 sec

Build:

- opening
- hearts
- NPC viewer recognition
- finger-on-hand illusion
- secondary NPC
- timed tilt choice
- hold-to-unlock

Render and test.

PHASE B:
25–52 sec

Build:

- pause roulette
- system detection
- inventory callback
- screen interaction
- crack
- reset
- final finger contact
- score ending

Do NOT spend days polishing Phase A before building the ending.

==================================================
CRITICAL TEST
==================================================

Before finalizing, put the preview on an actual phone.

Physically perform:

- finger touch
- tilt
- pause roulette
- score tracking

The experience must work psychologically on a real phone screen.

Desktop preview is not enough.

==================================================
SUCCESS CRITERIA
==================================================

The ideal viewer reaction:

0 sec:
"What is this?"

5 sec:
"Wait, I'm supposed to touch him?"

8 sec:
"YO IT REACTED."

17 sec:
"I picked right."

27 sec:
"I got shield."

34 sec:
"WAIT THE NPC KNOWS I'M HERE?"

44 sec:
"HE'S TOUCHING THE SCREEN."

50 sec:
"I STOPPED THE RESET?"

End:
"3 hearts + shield 😭"

The viewer should feel like they PARTICIPATED in the story rather than watched it.

START NOW.

forget sending me the air preview or video
````
