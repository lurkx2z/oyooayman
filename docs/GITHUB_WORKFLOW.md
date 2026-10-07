# GitHub workflow — rules for parallel Claude developers

> Repo: `lurkx2z/oyooayman` (**public**). Facts checked Oct 2026: the default branch is
> **`claude/intelligent-archimedes-dgu7zi`**, and there is **no `main` branch**. Every episode so far was built
> sequentially on that one branch by one developer.

## 1. Branch model

| Branch | Role | Who writes to it |
|---|---|---|
| `claude/intelligent-archimedes-dgu7zi` (the default branch) | **Trunk / integration.** What a fresh clone gets. Contains the engine, all shipped episodes and these docs | Only the owner, or a developer the owner explicitly assigns to it. Merges into it only with the owner's authorisation |
| `main` | Doesn't exist today. **If the owner creates it, it becomes the trunk** and the rules above apply to it instead. NEEDS VERIFICATION | the owner |
| `episode/<slug>` | **One episode = one branch**, branched from the trunk | the one developer building that episode |
| `engine/<topic>` | A shared-engine change (see § 5) | one developer, coordinated |
| `docs/<topic>` | Documentation-only changes | anyone, coordinated |

Suggested episode names: `episode/gravity-2x`, `episode/no-air-resistance`, `episode/no-elasticity`,
`episode/moon-gravity-off`. Lowercase, hyphens, and the same slug as the folder `films/<slug>/` and the page
`<slug>.html`.

**Claude Code cloud sessions are often assigned a branch name by the harness (e.g. `claude/<adjective>-<name>-xxxx`).
If your session's instructions name a branch, develop and push on exactly that branch.** It plays the role of your
episode branch. Never push to a branch you weren't assigned.

## 2. Safe startup for a fresh Claude developer

```bash
git status                       # clean? which branch?
git branch -a                    # what exists
git log --oneline -5             # where you are
git fetch origin <trunk>         # trunk = the repo's default branch (today: claude/intelligent-archimedes-dgu7zi)
# if you have no assigned branch:
git checkout -b episode/<slug> origin/<trunk>
```

- Never develop directly on the trunk (or on `main`, if it appears).
- Never force-push a branch someone else uses. Never rewrite trunk history.
- Never create a pull request unless the owner asks for one. Never merge without the owner's authorisation.

## 3. What goes where (the conflict-avoidance contract)

| You may freely add/edit | Only with § 5 coordination | Never in an episode branch |
|---|---|---|
| `films/<your-slug>/**` | anything in `js/**` | other episodes' folders `films/<other>/**` |
| `<your-slug>.html` | `style.css` (shared classes) | other pages `*.html` |
| a README entry for your episode (append-only; see below) | `tools/**`, `lib/**`, `fonts/**` | `films/xover/fx.js`, `films/before-screens/children.js` (other films load them) |
| `docs/` additions about your episode (e.g. a line in `EPISODE_HISTORY.md`) | `templates/**` | baked soundtracks of other films |

- **Page-level CSS goes in your page's `<style>` block**, not in `style.css`.
- **Global names:** every top-level identifier in your film files must carry your film's prefix (pick 2–3 letters,
  e.g. `GV_` for gravity). All films share one global scope when a page loads several films' files.
- **README:** add your entry at the end of the films list and your file list at the end of the layout section. Two
  developers appending at the same spot will conflict, but the conflict is trivial; resolve it by keeping both.
- **PLAN.md lives in your film folder**, never in a shared place.

## 4. Commits and pushes

- Small, frequent commits; push after each meaningful step (the container is ephemeral; unpushed work is lost when it
  is reclaimed).
- Message style used in this repo: `<Episode> film: <what changed, in plain words>`, e.g.
  *"Slip film v3: round-2 review fixes — …"*, *"Friction: rebalance the soundtrack and bake it"*.
  Prefix shared-engine commits with `engine:` and docs with `docs:`.
- End every commit message with the attribution lines your session's instructions specify (the owner's sessions use
  a `Co-Authored-By:` line and a `Claude-Session:` URL line). Never put model names in code or docs.
- Push: `git push -u origin <your-branch>`. On a network failure retry up to 4 times with backoff (2 s, 4 s, 8 s, 16 s).
- Don't commit renders, frames, MP4s, WAVs or ZIPs (`renders/` is git-ignored; use `/tmp` or your scratchpad).
  **Do** commit `films/<slug>/soundtrack.js` (the baked MP3-in-JS, ~1.3–2.5 MB); the page needs it.
- Before each push of a film change: `NODE_PATH=$(npm root -g) node tools/check-page.cjs <slug>.html`.

## 5. When more than one developer needs an engine change

The engine (`js/**`) is shared by 11 shipped episodes. Two parallel engine edits will conflict and can silently break
other films.

1. **Avoid it.** Solve it from your film: subclass (Environment, EarthScene), override after `cam.update` in
   `FILM.update`, add DOM elements in `build`, copy a module into your folder under your prefix ("copy-then-own").
2. If it's truly needed, make it **additive with unchanged defaults** (a new optional option), on its own branch
   `engine/<topic>` or as a separate `engine:` commit, so it can be reviewed and cherry-picked alone.
3. **Never edit `js/audio/audioEngine.js` (AudioEngine or SoundKit) in an episode branch.** Its source is part of every
   film's baked-soundtrack fingerprint. Any change makes all 11 baked soundtracks stale (pages fall back to slow live
   rendering) until each is re-baked.
4. Run `tools/check-page.cjs` on **every** `*.html` after an engine change.
5. Tell the owner in your report which engine files you touched and why. If two developers both need engine work, the
   owner decides the order. The second developer rebases onto the merged change.
6. Shared-file conflicts on merge: keep both sides' additions; never drop another film's behaviour. If unsure, ask.

## 6. Merging (owner-authorised only)

- Episode branches merge into the trunk only when the owner says so. Prefer a merge commit (keeps branch history).
- After a merge, other developers bring the trunk into their branch with `git merge origin/<trunk>` (not a rebase of
  shared history).
- If your episode needed an engine change that isn't merged yet, mention it at the top of your report. Your episode
  branch will need it merged first.

## 7. Worktrees (optional)

One developer working on two things locally can use `git worktree add ../oyooayman-<slug> episode/<slug>`. Cloud
sessions normally get one clone per session, so worktrees haven't been used in this project.
