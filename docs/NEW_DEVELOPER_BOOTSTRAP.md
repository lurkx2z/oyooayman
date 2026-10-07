# New developer bootstrap — do this before writing any code

> For a brand-new Claude instance with no memory of this project. Budget about 20–40 minutes of reading and looking.
> It pays for itself: every rule here exists because ignoring it cost hours before.

## Step 1 — Read, in this order

1. `CLAUDE.md` (root): the safety rules.
2. `docs/CONTEXT_SNAPSHOT.md`: the 2-page orientation.
3. `docs/PROJECT_CONTEXT.md`: what the channel is, who the owner is, why HTML/Three.js.
4. `docs/STYLE_BIBLE.md`: the look, with real values. Then skim `docs/art-direction.md` (the measured calibration).
5. `docs/VIDEO_FORMAT.md`: **the Oxygen/Friction structure** (the default) and when exceptions apply.
6. `docs/RETENTION_RULES.md`: real performance data and the concept filter.
7. `docs/ENGINE_ARCHITECTURE.md`: every shared system's API.
8. `docs/LOCKED_SYSTEMS.md`: what you must reuse and must not rewrite.
9. `docs/PRODUCTION_WORKFLOW.md`: stages, tools, commands, reviews, render, delivery.
10. `docs/PHYSICS_EPISODE_RULES.md`: how to define the rule and stay credible.
11. `docs/LESSONS_LEARNED.md`: the mistakes not to repeat.
12. As needed: `docs/CAMERA_GUIDE.md`, `docs/SOUND_GUIDE.md`, `docs/ASSET_GUIDE.md`, `docs/GITHUB_WORKFLOW.md`,
    `docs/EPISODE_HISTORY.md`, `docs/REFERENCE_INDEX.md`, and `docs/briefs/` (the owner's verbatim briefs: read the
    Friction one, `08_friction_master_prompt.md`, to see what a brief looks like).

## Step 2 — Inspect the benchmark episodes

- **Friction** (the format benchmark):
  - read `films/friction/PLAN.md` fully;
  - skim `films/friction/script.js` (beats, camera, hands, HUD) and `films/friction/film.js` (FILM hooks, grade);
  - look at `docs/reference/sheets/friction.jpg`.
- **Oxygen** (the original; the best-known performer):
  - the beat table in `README.md`;
  - `docs/reference/sheets/oxygen.jpg`.
  - Its wiring (`js/scene/*`) is legacy; don't copy it.
- **Slip** (the newest; the top-performing parody):
  - `films/slip/PLAN.md`, `films/slip/script.js` (it shows `CONFIG.edit` and multi-scene `FILM.view`);
  - `docs/reference/sheets/slip.jpg`, `docs/reference/sheets/slip_story_times.jpg`.

## Step 3 — Look at the approved frames

Open (Read) the images in `docs/reference/frames/`, at least:
- `oxygen_00.6_title_fire.jpg`;
- `friction_01.0_title_hud_hands.jpg`, `friction_12.0_no_brakes.jpg`, `friction_63.0_return_rollover.jpg`;
- `slip_01.0_title_wet_street.jpg`, `slip_08.0_underground_readout.jpg`, `slip_story55.8_tsunami.jpg`.

`docs/REFERENCE_INDEX.md` says what each teaches. The external reference videos are described there (not stored).

## Step 4 — Inspect the reusable engine (10 minutes)

- `js/main.js` (the frame pipeline), `js/camera/cameraController.js`, `js/ui/storyHud.js`, `js/fx/postprocessing.js`
  (the params object), `js/world/people.js` (LOOKS / ACTIONS / Person spec), `js/audio/audioEngine.js` (head of the file).
- `templates/episode/` (a minimal working episode) and `tools/` (each file's header explains its use).

## Step 5 — Confirm your environment and branch

```bash
cd <repo> && git status && git branch -a && git log --oneline -5
node --version && ffmpeg -version | head -1 && ls "$(npm root -g)" | grep playwright   # Playwright is global
NODE_PATH=$(npm root -g) node tools/check-page.cjs friction.html    # proves the toolchain works (≈ 30 s)
```

- If your session names a branch, use exactly that. Otherwise create `episode/<slug>` from the trunk (the repo's default
  branch, today `claude/intelligent-archimedes-dgu7zi`). **Never develop on the trunk or `main`.** No PRs or merges unless
  the owner asks.

## Step 6 — Report before implementing

Post a short report to the owner (or the coordinating instance), **in your own words and specific to this episode**
(which lighting family, which consequences, which engine pieces). The bullets below say what to cover; they are not text
to paste:

1. **Style summary** (3–5 lines): polished low-poly POV, the 70/30 hybrid, muted world + few accents, uneven grey-green
   fog, selective gloss, serif title/captions, top-left label/value HUD, rounded vignette, authored silhouettes, no bad
   hands.
2. **Pacing summary** (3–5 lines): 60–72 s; centred title on frame 1 over a moving normal world; the rule changes ≤ 3 s;
   a new consequence every 5–8 s; an open loop; a mid-film reset; the biggest payoff last; a short line; a small note.
3. **Reusable systems you'll use** (e.g. CameraController, ViewerHands, StoryHUD, PostProcessing, installFog,
   Environment subclass, Person rig, VehicleFactory, AudioEngine subclass, Edit, the tools).
4. **Locked systems you will not touch**, and any engine change you think you need, with a justification (default:
   none).
5. **New requirements** of this episode: new world pieces, simulation, VFX, characters, sound.
6. **Episode plan:**
   - the concept-filter check (rule / ≥ 5 consequences / surprise / commentable / escalation / payoff);
   - the physics rule table;
   - a beat list with times;
   - the hero shots;
   - the block plan (A/B/C);
   - risks.

**Then begin implementation.** The owner usually wants the whole film delivered without stopping. If the brief says
"build the first block and stop", stop there. Otherwise finish it all (reviews included) and deliver one MP4 + a
runnable ZIP.

## Step 7 — The build loop (summary of `PRODUCTION_WORKFLOW.md`)

```
tools/new-episode.sh <slug> <TAG> "WHAT IF … / … / …?"     # skeleton that boots
→ films/<slug>/PLAN.md   → all beats in script.js            # plan first
→ block A/B/C: build → tools/stills.cjs → tools/contact-sheet.sh → look → fix
→ low-res preview (render-parallel 270×480 @15) → 2–4 reviewer agents → fix → cut (CONFIG.edit)
→ sound pass (render-wav + loudness) → bake-soundtrack → check-page
→ final render (render-parallel 1080×1920 @30, background) → render-wav → encode-final (< 30 MiB, one file)
→ ZIP (tested) → README entry + PLAN review log → commit + push → report honestly
```
