# Context snapshot — read in 3 minutes

**PROJECT.** *What Happens If* is a short-form channel (TikTok / YouTube Shorts / Reels): vertical 1080×1920 @ 30 fps,
first-person 3D "what if" simulations, ~60–72 s. Each episode is a deterministic Three.js page (`<slug>.html` +
`films/<slug>/`) on a shared engine (`js/`). It runs from a double-click (no server, no build, no external assets) and
is rendered headless to MP4. The owner is a beginner and writes long "MASTER BUILD PROMPT" briefs; **Claude builds,
reviews and delivers everything.** 11 episodes exist (see `docs/EPISODE_HISTORY.md`).

**STYLE.** A polished cinematic low-poly first-person simulation: ~70 % "POV What If" (polish, selective gloss,
first-person body, clean HUD, serif narration, rounded vignette, localised strong colour) + ~30 % Omaha atmosphere (fog
depth, dark foregrounds, grounding, irregularity).
- Muted world, few strong accents.
- Uneven, capped, grey-green fog. Silhouettes survive.
- Authored low-poly silhouettes (people with real shoulders, clothing, accessories; faceted tree crowns).
- **No hand is better than a bad hand.**
- Not Roblox, not a demo, not a mobile game, not photoreal, not grey sludge, not an infographic.
- See `docs/reference/frames/`.

**FORMAT (default = Oxygen / Friction structure).**
1. A centred serif question on **frame 1**, over a moving normal world.
2. The rule changes visibly under the title (≤ 3 s).
3. A new, different consequence every ~5–8 s (never just a bigger number).
4. An open loop (countdown / something coming); a mid-film reset (montage / scale jump).
5. **The biggest destruction payoff last.**
6. A short aftermath + one serif line + a tiny honesty note after the payoff.
7. Captions: one 4–9-word line at a time. HUD: a top-left label → big serif number → small sub-line.

The 45–50 s cold-open/rewind format is **obsolete**.

**TOP PERFORMANCE LESSON (owner-reported).**
- Friction was the strongest serious-physics performer; Oxygen also very strong (22.4 s average on 91 s); the
  Slip-and-Fall parody performed extremely strongly.
- Moon underperformed; the 48.6 s Air experiment didn't perform as hoped; cosmic spectacle read as predictable.
- **Simple rule + many distinct surprising consequences + commentable physics + visual escalation + a big payoff** beats
  spectacle.
- The audience jokes that "every episode ends in a tsunami". Self-aware parody played dead-serious works.
- Everything else's performance: UNKNOWN.

**ENGINE PHILOSOPHY.**
- Every frame is a **pure function of time** (seeded RNG, stateless hashes, precomputed sims sampled by time).
- A film provides `SCRIPT` (beats, camera, hands, HUD, tracks), `SCRIPT_TRACKS` and `FILM` hooks
  (`build / update / view / grade / debug`).
- **Reuse, don't rewrite:** CameraController, ViewerHands, StoryHUD, PostProcessing, installFog, the Person rig,
  VehicleFactory, Environment (subclass it), AudioEngine (subclass it; never edit it — its source is in every baked
  soundtrack's fingerprint), Edit (`CONFIG.edit` cuts), dev controls, tools.
- Classic scripts share one global scope: **prefix your film's globals.**
- 100 % procedural; GLB loading isn't implemented.

**GITHUB RULE.**
- The repo is **public**. The default/trunk branch is `claude/intelligent-archimedes-dgu7zi` (there is no `main` today).
- One episode = one branch (`episode/<slug>`, or the branch your session assigns).
- Only touch `films/<slug>/`, `<slug>.html` and append-only README/doc lines. Engine changes: additive, separate,
  coordinated.
- Never develop on the trunk/main; no PRs or merges unless the owner asks. Commit and push often (the container is
  ephemeral).

**WHAT TO READ (in order).** `CLAUDE.md` → this file → `docs/NEW_DEVELOPER_BOOTSTRAP.md` (it lists the rest:
PROJECT_CONTEXT, STYLE_BIBLE, VIDEO_FORMAT, RETENTION_RULES, ENGINE_ARCHITECTURE, LOCKED_SYSTEMS, PRODUCTION_WORKFLOW,
PHYSICS_EPISODE_RULES, LESSONS_LEARNED) → `films/friction/PLAN.md` → `films/slip/PLAN.md`.

**DELIVERY.**
- Final = **one** two-pass MP4 under 30 MiB (`tools/encode-final.sh`) + a tested runnable ZIP.
- The soundtrack is baked (`tools/bake-soundtrack.cjs`); `tools/check-page.cjs` passes.
- PLAN.md review log updated; README entry added; pushed.
- Report scores honestly (first reviewer rounds are typically 4–5.5/10).

**CURRENT PRIORITIES.**
1. New episodes in the Oxygen/Friction format built around grounded rule changes with many consequences
   (parallel developers, one branch each).
2. Quality gaps that recur in every review:
   - people and characters in close-up still read as procedural;
   - water and the planet are good but "stylised";
   - keep subjects big and inside safe zones.
3. Ship complete videos early, then polish. No endless art-direction loops.
4. Known engine wish-list (owner approval needed): promote `films/xover/fx.js` to `js/fx/`; shared aim-hand and
   first-person legs helpers; GLTFLoader if external assets are ever supplied.
