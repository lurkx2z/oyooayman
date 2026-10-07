# CLAUDE.md — start here

This repo is the **What Happens If** channel's video factory: vertical first-person Three.js "what if" films, one page
per episode on a shared engine. **Before working, read `docs/NEW_DEVELOPER_BOOTSTRAP.md`** (and
`docs/CONTEXT_SNAPSHOT.md` for a 3-minute overview).

## Non-negotiable rules
- **The repository is the source of truth.** Docs in `docs/`, per-episode plans in `films/<slug>/PLAN.md`. If something
  you know conflicts with the docs, the latest owner instruction wins; then update the docs.
- **Never develop directly on the trunk** (the default branch, today `claude/intelligent-archimedes-dgu7zi`) **or on
  `main`.** One episode = one branch: the branch your session assigns, else `episode/<slug>` (follow the decision
  tree in `docs/GITHUB_WORKFLOW.md` § 2 if your session put you on the trunk). Push only to your branch. No pull requests and no merges unless the owner asks.
- **Reuse the engine** (`js/`): camera, hands, StoryHUD, post, fog, people, vehicles, Environment (subclass), AudioEngine
  (subclass), Edit, tools. See `docs/LOCKED_SYSTEMS.md`. Don't fork or rewrite them. Engine changes must be additive,
  separate (`engine:` commits) and coordinated. **Never edit `js/audio/audioEngine.js`** (it would invalidate every
  film's baked soundtrack).
- **Don't redesign the established visual style** (`docs/STYLE_BIBLE.md`) or the default format
  (`docs/VIDEO_FORMAT.md`: the Oxygen/Friction structure, centred title on frame 1, 60–72 s).
- **Episode work lives in `films/<slug>/` + `<slug>.html`.** Prefix every film-level global (classic scripts share one
  scope). Don't edit other episodes' folders or pages.
- **Build the complete episode**: plan → blocks → stills → preview → independent reviews → fixes → sound → bake →
  final 1080×1920 render → one MP4 under 30 MiB (never split into parts) + a runnable ZIP → README/PLAN updates → commit
  and push. Commands: `docs/PRODUCTION_WORKFLOW.md`.
- Everything must stay a **pure function of time** (seeded; no `Math.random()`, no wall clock).
- Honest reporting: give reviewer scores as given, say what is still weak. No model names in code, docs or commits.
  The repo is **public**: no secrets, no third-party reference media.
- The owner is a beginner. You write all code; keep the owner's manual steps minimal and exact; give short status updates
  during long renders. Never block silently.

## Quick commands
```bash
NODE_PATH=$(npm root -g) node tools/check-page.cjs <slug>.html                              # boot + sound check
NODE_PATH=$(npm root -g) node tools/stills.cjs --page <slug>.html --t 1,5,10 --out /tmp/s     # look at frames
tools/new-episode.sh <slug> <TAG> "WHAT IF … / … / …?"                                       # new episode skeleton
```
