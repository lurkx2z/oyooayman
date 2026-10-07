# The owner's developer-handoff request that produced docs/ (contains the latest performance observations)

> Verbatim owner brief, archived so later developers can check the rules and quotes in `docs/`. Owner's words, unedited
> (chat-only lines like "send the video when done" kept as written). Where a newer brief or `docs/` disagrees, the newer one wins.

````text
MASTER CONTEXT EXTRACTION / DEVELOPER HANDOFF

You are the original long-running developer for the What Happens If project.

You have accumulated substantial context from:

- this conversation
- the GitHub repository
- previous episode development
- visual reviews
- user feedback
- production mistakes
- successful workflows
- failed approaches
- architecture decisions
- asset choices
- rendering decisions
- camera decisions
- analytics/performance feedback

We are about to start MULTIPLE FRESH CLAUDE DEVELOPER INSTANCES.

Those new chats will NOT have access to this conversation.

Your task is therefore to EXTERNALIZE EVERYTHING IMPORTANT YOU KNOW into the
GitHub repository so that a brand-new Claude instance can become productive
without needing this conversation.

DO NOT simply summarize the repository.

Capture the knowledge that currently exists in YOUR CONTEXT but may not yet
exist in the repo.

==================================================
PRIMARY OBJECTIVE
==================================================

Turn the GitHub repository into the complete institutional memory of the project.

After you finish, a fresh Claude developer should be able to:

1. clone/read the repository
2. read the handoff documentation
3. understand the channel's visual identity
4. understand how videos are structured
5. understand the engine architecture
6. understand which systems are reusable
7. understand the development workflow
8. understand what approaches failed
9. understand what approaches succeeded
10. understand the user’s quality expectations
11. build a new episode in the correct style
12. push it to an independent branch

WITHOUT access to this chat.

==================================================
DO NOT LOSE TACIT KNOWLEDGE
==================================================

I specifically want information that might currently exist only in this
conversation or in your assumptions.

Examples:

- why certain visual decisions were made
- which renderer settings finally looked right
- which fog experiments failed
- which character styles looked cheap
- which camera approaches looked robotic
- how HUD typography evolved
- why we use certain title positioning
- how the Oxygen/Friction pacing differs from abandoned formats
- which code is considered stable
- which systems should NOT be rewritten
- what file structures work best
- how previews are rendered
- how final video capture is done
- common Three.js problems encountered
- performance bottlenecks
- asset-loading conventions
- GLB conventions
- sound workflow
- timeline conventions
- deterministic randomness
- debugging practices
- branch workflow
- any weird fixes that future developers would otherwise rediscover

Do not assume this information is obvious.

WRITE IT DOWN.

==================================================
REPOSITORY AUDIT FIRST
==================================================

Before writing documentation:

1. inspect the entire repository
2. inspect all completed episodes
3. identify shared engine modules
4. identify duplicate systems
5. inspect current docs
6. inspect reference assets
7. inspect scripts/tooling
8. inspect render/export workflow
9. inspect Git structure where possible

Compare what is already documented against what you know from this conversation.

Then fill the gaps.

==================================================
CREATE / UPDATE THESE DOCUMENTS
==================================================

Use existing equivalents if they already exist.

Do not create duplicate documentation unnecessarily.

--------------------------------------------------
1. docs/PROJECT_CONTEXT.md
--------------------------------------------------

This is the high-level project brain.

Include:

- what What Happens If is
- target platforms
- technology stack
- overall content strategy
- why Three.js/HTML is used
- overall production philosophy
- what the final videos should feel like
- what differentiates the channel
- current content direction

A fresh developer should understand the project after reading this first.

--------------------------------------------------
2. docs/STYLE_BIBLE.md
--------------------------------------------------

Document the visual identity in detail.

Include:

- graphical target
- low/mid-poly philosophy
- approved visual references
- POV reference influence
- Omaha reference influence
- palette
- fog
- lighting
- materials
- shadows
- post-processing
- vignette
- grain
- bloom
- trees
- vehicles
- people
- first-person hands/body
- environment density
- composition
- foreground/midground/background layering
- phone readability

Also include:

WHAT NOT TO DO.

Examples:

- Roblox look
- primitive Three.js demo
- bright mobile-game visuals
- photoreal mismatch
- overly grey image
- excessive fog
- cheap procedural hands
- sphere-on-stick trees
- perfectly clean streets
- inconsistent asset styles

Use actual code/settings/examples from the working project when useful.

--------------------------------------------------
3. docs/VIDEO_FORMAT.md
--------------------------------------------------

Document the CURRENT preferred storytelling structure.

IMPORTANT:

The current default is the OXYGEN / FRICTION format.

Not the abandoned ultra-short cold-open/rewind experiment.

Document:

- typical duration
- centered title behavior
- normal-world opening
- change of physics rule
- consequence progression
- escalation timing
- destruction payoff
- ending
- caption philosophy
- HUD philosophy

Include approximate timeline templates.

Explain WHEN exceptions make sense.

--------------------------------------------------
4. docs/RETENTION_RULES.md
--------------------------------------------------

Capture what we learned from actual uploads.

Include real known performance observations where supplied by the user.

Important historical lessons:

- Friction became the strongest serious physics performer
- Oxygen also performed very strongly
- Slip-and-Fall parody performed extremely strongly
- grounded surprising physics generally outperformed predictable spectacle
- Moon underperformed relative to stronger physics concepts
- Air-density short-format experiment did not perform as hoped
- ultra-short cold-open/rewind format is no longer the default

Explain the current concept filter:

GOOD IDEAS usually have:

simple understandable rule
+
many distinct consequences
+
surprising physics
+
commentable edge cases
+
visual escalation
+
major payoff.

Do not invent statistics not supplied in conversation/repo.

--------------------------------------------------
5. docs/ENGINE_ARCHITECTURE.md
--------------------------------------------------

Create a technical map of the codebase.

Document every important reusable system.

Examples:

Renderer
CameraController
Timeline
HUD
Caption system
AudioManager
Vehicle system
NPC system
Particle system
Physics helpers
Post-processing
Water
Weather
Destruction
Recording/debug controls

For each:

- file path
- purpose
- public API
- expected inputs
- expected outputs
- dependencies
- whether considered stable
- whether episode developers may modify it
- example usage

A new developer should NOT need to reverse engineer the engine.

--------------------------------------------------
6. docs/LOCKED_SYSTEMS.md
--------------------------------------------------

This is extremely important.

List systems that future developers should normally REUSE rather than rewrite.

Example format:

SYSTEM:
POV Camera

STATUS:
LOCKED / STABLE

LOCATION:
...

DO:
reuse and configure

DO NOT:
create POVCameraV2 unless genuinely required

WHY:
existing system already matches established channel style.

Do this for all mature systems.

--------------------------------------------------
7. docs/PRODUCTION_WORKFLOW.md
--------------------------------------------------

Document the actual workflow from:

idea
→ planning
→ branch
→ implementation
→ preview
→ review
→ polish
→ capture
→ publish-ready result.

Include:

- exact development stages
- preview resolutions
- final resolution
- FPS
- recording workflow
- OBS usage if relevant
- how localhost/project is launched
- how previews are produced
- how assets are packed
- how sound is handled
- how final screenshots/contact sheets are produced

Include any commands/scripts actually used.

--------------------------------------------------
8. docs/GITHUB_WORKFLOW.md
--------------------------------------------------

Document parallel developer rules.

Include:

- never work on main
- one episode = one branch
- suggested branch naming
- worktrees if used
- commit conventions
- pushing
- merging
- avoiding shared-engine conflicts
- what to do if multiple developers need engine changes

Example:

episode/gravity-2x
episode/no-air-resistance
episode/no-elasticity

Include safe instructions for fresh Claude developers.

--------------------------------------------------
9. docs/ASSET_GUIDE.md
--------------------------------------------------

Document:

- asset sources
- preferred file formats
- GLB/GLTF conventions
- scale conventions
- naming
- materials
- texture handling
- relative asset paths
- model triangle targets if relevant
- cloning/instancing
- character requirements
- vehicle requirements
- tree requirements
- first-person arm requirements

Also document bad asset patterns we've encountered.

--------------------------------------------------
10. docs/CAMERA_GUIDE.md
--------------------------------------------------

Document:

- POV height
- FOV
- breathing
- sway
- walking
- running
- reaction turns
- camera shake
- impact behavior
- human-feeling movement
- composition
- phone framing

Include actual working configuration values where known.

--------------------------------------------------
11. docs/SOUND_GUIDE.md
--------------------------------------------------

Document:

- ambience philosophy
- Foley
- physics-event sounds
- music
- silence
- layering
- temporary vs final audio
- audio synchronization
- spatial audio where relevant
- common mistakes

Include any actual audio implementation architecture.

--------------------------------------------------
12. docs/PHYSICS_EPISODE_RULES.md
--------------------------------------------------

Document the standard methodology for physics What-If videos.

Every episode should define:

- exact fictional rule
- variables held constant
- variables changed
- real consequences
- artificial simplifications
- common misconceptions
- physics formulas used internally
- what must NOT be claimed

Explain why this matters for comments and credibility.

--------------------------------------------------
13. docs/LESSONS_LEARNED.md
--------------------------------------------------

This should contain the most valuable institutional knowledge.

Create sections:

WHAT WORKED

WHAT FAILED

VISUAL MISTAKES

TECHNICAL MISTAKES

RETENTION MISTAKES

PERFORMANCE MISTAKES

GOOD SHORTCUTS

BAD SHORTCUTS

THINGS WE SHOULD NEVER HAVE TO REDISCOVER

Be candid.

Examples may include:

- procedural primitive hero assets looked cheap
- good GLBs dramatically improved quality
- fog helped but could not hide bad assets
- first-person body improves immersion when quality is high
- bad hands are worse than no hands
- repeated art-direction iterations can waste time
- complete video earlier, then polish
- serious scientific presentation made parody funnier

Include everything relevant from this conversation.

--------------------------------------------------
14. docs/EPISODE_HISTORY.md
--------------------------------------------------

Create a concise historical record of episodes.

For each completed/attempted episode:

TITLE
FOLDER
BRANCH if known
DURATION
NEW SYSTEMS
REUSED SYSTEMS
WHAT WORKED
WHAT DIDN'T
AUDIENCE RESULT if known
REUSABLE LESSONS

Episodes may include:

Oxygen
Friction
Kids before screens
Depersonalization
Andromeda
Moon
Air density
Slip and fall
and other repository episodes.

Do not fabricate unknown data.

--------------------------------------------------
15. docs/NEW_DEVELOPER_BOOTSTRAP.md
--------------------------------------------------

Create the definitive startup procedure for a brand-new Claude chat.

It should say:

Before coding:

1. read CLAUDE.md
2. read PROJECT_CONTEXT
3. read STYLE_BIBLE
4. read VIDEO_FORMAT
5. read RETENTION_RULES
6. read ENGINE_ARCHITECTURE
7. read LOCKED_SYSTEMS
8. read PRODUCTION_WORKFLOW
9. read PHYSICS_EPISODE_RULES
10. read LESSONS_LEARNED
11. inspect Oxygen and Friction
12. inspect approved reference frames
13. inspect the reusable engine
14. confirm assigned branch

Then report:

- style summary
- pacing summary
- reusable systems
- locked systems
- new requirements
- episode plan

Only then begin implementation.

==================================================
CREATE CLAUDE.md
==================================================

If the repository does not already have a suitable root CLAUDE.md,
create/update one.

CLAUDE.md should be SHORT.

It should NOT contain the entire encyclopedia.

It should act as the bootloader.

Example purpose:

“Before working on this repository, read docs/NEW_DEVELOPER_BOOTSTRAP.md.”

Also include critical safety rules:

- repository is source of truth
- never develop directly on main
- reuse engine systems
- do not redesign established visual style
- episode-specific work belongs in episode folder
- push to assigned branch
- build complete episode

==================================================
REFERENCE INDEX
==================================================

Create:

docs/REFERENCE_INDEX.md

Map each important reference image/video to what it teaches.

Example:

POV reference:
- polished low-poly rendering
- POV body
- HUD
- emissive materials
- clean simulation style

Omaha:
- fog
- depth
- dark foreground
- atmosphere
- silhouette composition

Oxygen approved:
- channel-specific environment
- HUD
- typography
- lighting

Friction approved:
- benchmark pacing / physics progression

Do not make new developers guess why each reference exists.

==================================================
CODE EXAMPLES
==================================================

Where helpful, document small ACTUAL code examples from the repo.

Do not invent APIs.

Examples:

how to create episode timeline
how to invoke POV camera
how to add HUD metric
how to schedule caption
how to play audio cue
how to create deterministic seeded event
how to load GLB
how to instantiate vehicles/NPCs
how to switch to recording mode

==================================================
CONTEXT SNAPSHOT
==================================================

Also create:

docs/CONTEXT_SNAPSHOT.md

This should be a concise ~1–3 page summary for fast onboarding.

Include:

PROJECT
STYLE
FORMAT
TOP PERFORMANCE LESSON
ENGINE PHILOSOPHY
GITHUB RULE
WHAT TO READ
CURRENT PRIORITIES

This is for models that need a fast orientation before reading deeper docs.

==================================================
UNKNOWN INFORMATION
==================================================

Do NOT invent missing details.

If something is uncertain, label:

UNKNOWN

or:

NEEDS VERIFICATION

Do not transform assumptions into project facts.

==================================================
REMOVE CONTRADICTIONS
==================================================

Our direction evolved over time.

Do not preserve obsolete decisions as current rules.

Examples:

The ultra-short 45–50 second cold-open/rewind format was tested but is no longer
the default.

The CURRENT default is the Oxygen/Friction structure.

Mark obsolete approaches in:

LESSONS_LEARNED.md

not as current instructions.

==================================================
KEEP DOCUMENTATION PRACTICAL
==================================================

Do not produce vague corporate documentation.

Future Claude developers need:

specific paths
specific APIs
specific values
specific workflow
specific examples
specific mistakes
specific rules.

Write for another developer who must ship an episode today.

==================================================
FINAL VALIDATION
==================================================

After documentation is created:

simulate being a completely fresh Claude instance.

Pretend you know NOTHING from this conversation.

Read only:

CLAUDE.md
+
the docs you created
+
the repository.

Then ask yourself:

Could I reproduce the established channel style?

Could I make a new episode?

Would I know what not to rewrite?

Would I know what succeeded with viewers?

Would I know how to render/capture it?

Would I know how to use Git safely?

If any answer is NO:

improve the documentation.

==================================================
COMMIT AND PUSH
==================================================

Commit the handoff documentation.

Suggested commit:

docs: add complete multi-developer production handoff

Push it to the appropriate repository branch.

If you are currently working on an episode branch and should not modify main,
create/push a dedicated documentation branch such as:

docs/developer-handoff

Do not merge without authorization.

==================================================
FINAL RESPONSE
==================================================

After finishing, give me:

1. List of documents created/updated.
2. Branch pushed.
3. Commit hash.
4. Any important context that could NOT be captured.
5. Any repo architecture problems that may affect multiple parallel developers.
6. The exact single sentence I should give a fresh Claude developer to onboard it.

Your objective is:

NO IMPORTANT PROJECT KNOWLEDGE SHOULD DIE WITH THIS CHAT.
````
