# Production workflow — from brief to publish-ready MP4

> This is the workflow that actually shipped 11 episodes in this repo. Commands are exact; run them from the repo root.
> Environment assumed: the cloud container (4 cores, no GPU), Node 22 with **Playwright installed globally**, ffmpeg, Python 3 + PIL.
> Always prefix Node tools with `NODE_PATH=$(npm root -g)`. Never `npm install` Playwright browsers (Chromium is preinstalled).

## 0. Stage overview

| # | Stage | Output | Typical share of time |
|---|---|---|---|
| 1 | Brief intake + concept check | notes; questions only if truly blocked | small |
| 2 | Plan | `films/<slug>/PLAN.md` (rules, shot list with times, hero events, systems, reuse map) | small |
| 3 | Branch + skeleton | `<slug>.html`, `films/<slug>/script.js` (all beats), `film.js`, `audio.js` stub; boots | small |
| 4 | Build in blocks (A/B/C ≈ 20 s each) | each block checked with stills | **largest** |
| 5 | Full low-res preview | 270×480 @ 15 fps MP4 + contact sheets | ~15–40 min render |
| 6 | Independent reviews | 2–4 reviewer reports with scores and timestamped swipe points | ~10 min (parallel) |
| 7 | Fix round(s) + cut (`CONFIG.edit`) | v2 (maybe v3) | medium |
| 8 | Sound pass | levels checked, ≈ −16 to −17 LUFS | medium |
| 9 | Bake + check | `films/<slug>/soundtrack.js`; `check-page` passes | ~5 min |
| 10 | Final render | 1080×1920 @ 30 fps JPEG frames (4 workers) | **1–3 h** in the background |
| 11 | Encode + deliver | one MP4 < 30 MiB + a runnable ZIP; README + PLAN review log | ~10 min |

**Golden rules:**
- **Finish the whole video before polishing any part of it.**
- Keep the owner informed with one-line status updates.
- Never block on a long wait. Run renders in the background and keep working.

## 1. Brief intake

- Briefs are long "MASTER BUILD PROMPT"s and sometimes an extra "OVERRIDE" message (retention, hype). The override wins
  where they conflict. If a brief references another prompt you didn't receive, say so once, proceed with stated
  defaults, and integrate it if it arrives (this happened with the Crossover).
- Run the concept filter (`RETENTION_RULES.md` § 3) and the physics checklist (`PHYSICS_EPISODE_RULES.md`). If the
  science in the brief is wrong, build the correct version and tell the owner why in one line (e.g. Oxygen: holding your
  breath buys time, so the viewer can plausibly stay conscious until ~55 s).
- Map every brief system to existing engine pieces (`ENGINE_ARCHITECTURE.md` § 8) before writing code.
- The owner prefers autonomous completion. Default to *build everything, review with agents, deliver the finished
  video* unless the brief explicitly says to stop after a phase.

## 2. Plan (`films/<slug>/PLAN.md`)

Copy the structure of `films/slip/PLAN.md` or `films/friction/PLAN.md`:
1. **Rules:** the exact fictional rule, what stays constant, honesty notes (see `PHYSICS_EPISODE_RULES.md`).
2. **The places** (world layout in metres, camera path).
3. **Shot list** with times, as a table: *Time | What we SEE | What we HEAR | Caption / HUD*.
4. **Hero events / hero shots** (the screenshot-worthy frames; cover candidate).
5. **Escalation check:** a new link every 3–7 s.
6. **Sound plan.**
7. **Systems / files.**
8. **Review log** (filled in later, honestly).

## 3. Branch + skeleton

```bash
git checkout -b episode/<slug>            # or the branch your session was assigned (see GITHUB_WORKFLOW.md)
tools/new-episode.sh <slug> "WHAT IF …?"  # copies templates/episode/ → films/<slug>/ + <slug>.html (prefix TPL → your tag)
NODE_PATH=$(npm root -g) node tools/check-page.cjs <slug>.html   # must boot with no errors
```

Write **all beat times into `script.js` first** (a `SL`/`FR`-style constants object + `SCRIPT.events`), even if most
beats are placeholders. Everything else keys off those constants, so retiming later is one edit.

## 4. Build in blocks

- Work in blocks of ~20 s (Slip: A 0–19, B 19–40, C 40–end; Friction phases 0–20 / 20–40 / 40–60 / 60–end).
- After each meaningful change, render **stills at the beats** and look at them:

```bash
NODE_PATH=$(npm root -g) node tools/stills.cjs --page <slug>.html --t 0.5,2,4,6,8,10 --out /tmp/<slug>_a
# story times (when CONFIG.edit is set):  --story --t 12.9,16.2
# judge the 3D alone:                     --nohud
# try a value without editing files:      --eval "SL.nudge = 13.2"
tools/contact-sheet.sh /tmp/<slug>_a 6 /tmp/<slug>_a_sheet.jpg     # then Read the sheet
```

- Use a **new output directory per round** (e.g. `/tmp/<slug>_a2`). The sandbox blocks `rm` of relative globs, and
  stale frames mislead.
- Debug positions numerically in the page with `--eval`. `SIM.renderAt(t)` and the globals (`SCRIPT`, `FILM`, film
  constants) are all reachable. Many bugs were "the object exists but is behind a tree / under the ground / outside the
  9:16 frame". Project its position to screen to check.
- The `D` debug panel (in a normal browser) shows `FILM.debug(app, t)` text, draw calls and the camera position.

## 5. Full low-res preview

```bash
# 15 fps, 270×480: fast enough for a whole-film review (~15–40 min with 4 workers)
tools/render-parallel.sh <slug>.html /tmp/<slug>_prev 270 480 4 15
# when all workers print DONE:
NODE_PATH=$(npm root -g) node tools/render-wav.cjs <slug>.html /tmp/<slug>_prev.wav
ffmpeg -y -framerate 15 -i /tmp/<slug>_prev/f_%05d.jpg -i /tmp/<slug>_prev.wav -c:v libx264 -pix_fmt yuv420p -crf 23 \
  -c:a aac -b:a 128k -shortest /tmp/<slug>_prev.mp4
# contact sheets: 1 frame per second, ~11 per sheet
```

## 6. Independent reviews

The owner asks for reviewers on every episode. Launch 2–4 `general-purpose` agents **in the background, in parallel**.
They are read-only and must not modify project files. Give them:
- a **review brief file**: the intended timeline per second, what the sound does (they can't hear it), the style target
  (template: the brief in § 6.1);
- **contact sheets** (1 fps) and the frame directory (`f_NNNNN.jpg`, frame = seconds × fps);
- the preview MP4 path (they can extract frames with ffmpeg into a NEW dir).

Roles used: **retention/short-form**, **cinematography/3D visual**, **normal viewer**, **science/physics plausibility**
(or the brief's own: comedy, aura, game design, historical, respectfulness).

Ask for:
- scores out of 10 on the brief's categories;
- **exact swipe timestamps**;
- top 3 problems;
- what looks cheapest;
- the highest-impact fix;
- a prioritised fix list with timestamps.

Tell them not to inflate and to be blunt.

Then **fix the top issues**, re-preview, optionally re-review (Slip went 5 / 5.5 → 6.5 / 6.5 in round 2). Record every
round in PLAN.md § Review log: scores as given, what changed. Report scores to the owner honestly, including "not
re-scored after the last fixes".

### 6.1 Review brief template (the one used for Slip)

```
# Review brief — "<title>" (<length> s vertical short, 9:16)
<one paragraph: genre, tone, comedy/science rule>
## The intended chain (film seconds)
- 0–3.3 …   (one line per beat with captions/HUD in quotes)
## Sound (you cannot hear it; this is what it does)
<one paragraph per section>
## Style target
Polished low-poly cinematic (stylised, not photoreal). Serious tone, minimal captions. <the hero element> must be excellent.
```

### 6.2 Reviewer prompt pattern (verbatim structure used for Slip)

> You are an independent visual/cinematography reviewer for a 66-second vertical (9:16) stylised low-poly 3D short
> called "…". Judge the image quality, composition, readability on a phone, and especially whether <hero element> is
> excellent. Be blunt and specific. Materials (all local files; read-only — do not modify any project files): brief …;
> contact sheets …; individual frames … (frame number = seconds × 15); the preview video …. Use the Read tool to inspect
> the sheets and many individual frames (list the key ranges). You may extract extra frames with ffmpeg into a NEW
> directory under the scratchpad. Answer: 1. Scores out of 10: … 2. The 3 strongest and 5 weakest shots (timestamps)
> with what exactly is wrong. 3. <hero element> specifically: … 4. A prioritised list of the 10 most valuable concrete
> fixes, each with timestamp and a precise suggestion feasible in a stylised low-poly WebGL engine. Keep the report
> under 900 words.

## 7. Cut with `CONFIG.edit`

Author the story long and continuous, then remove dead time:

```js
CONFIG.edit = [[0, 20.6], [24.6, 39.3], [39.3, 39.9, 1/3], [39.9, 53.0], [54.5, 74.6]];   // friction: 74.6 → 70.3 s
```

- Cuts on music bar boundaries keep the score musical (Crossover cut on 120 BPM bars).
- After a cut, the HUD clock keeps story time, so a countdown can jump. Hide or design around it.
- The title window must start before the first kept second if the title should show on frame 0
  (Slip: title in 1.2, cut from 1.29).

## 8. Sound pass

```bash
NODE_PATH=$(npm root -g) node tools/render-wav.cjs <slug>.html /tmp/<slug>.wav
# loudness per 4 s window and integrated (target ≈ −16 to −17 LUFS integrated; true peak < −1 dBTP)
for t in $(seq 0 4 76); do printf "$t "; ffmpeg -hide_banner -ss $t -t 4 -i /tmp/<slug>.wav -af volumedetect -f null - 2>&1 \
  | grep -E "mean_volume|max_volume" | awk '{printf $5" "}'; echo; done
ffmpeg -hide_banner -i /tmp/<slug>.wav -af ebur128 -f null - 2>&1 | grep -A3 "Integrated"
```

Listen-free checks matter because nobody can listen in the container: look for silent stretches that should have
sound, sub-bass-only sections (phones can't play them; Andromeda's sub drone had to go), single-sample spikes
(Chrome offline renderer, see `SOUND_GUIDE.md`), and the deliberate silences.

## 9. Bake the soundtrack and check the page

```bash
NODE_PATH=$(npm root -g) node tools/bake-soundtrack.cjs --page <slug>.html --out films/<slug>/soundtrack.js
#   (or reuse a WAV you already rendered from the CURRENT code:  --wav /tmp/<slug>.wav)
NODE_PATH=$(npm root -g) node tools/check-page.cjs <slug>.html      # → "sound: SOUND READY after 0s", no errors
```

The page must load `films/<slug>/soundtrack.js` **before** `js/main.js`. Any later change to `SCRIPT`, the audio class,
`fingerprintData()` data or CONFIG duration/seed/edit makes the bake stale. Re-bake as the last step before committing.
The owner noticed when a page had no sound (*"the web version dosent have sound"*); that is why baking exists.

## 10. Final render (1080 × 1920, 30 fps)

```bash
tools/render-parallel.sh <slug>.html /tmp/<slug>_full 1080 1920 4 30      # returns immediately
ls /tmp/<slug>_full/f_*.jpg | wc -l                                         # progress (total = film s × 30 + 1)
grep -c DONE /tmp/<slug>_full/worker_*.log                                  # finished workers
```

- Speed: ≈ 0.3–0.6 frames/s per worker at 1080×1920 on SwiftShader (heavier scenes slower). A 60 s film is about
  1–2.5 h with 4 workers. Don't run two full renders at once; they share 4 cores.
- **Resumable:** if the container restarts or a worker dies, re-run the same command; existing frames are skipped.
- Wait for completion with a background job or monitor (an `until` loop on the frame count, run in the background), not
  foreground `sleep`. Give the owner a status line when asked ("frames 846/2040, about an hour left").
- **Don't edit the film's files while its final render runs.** Workers load the page once, but a restarted worker would
  pick up your edits.

## 11. Encode and deliver

```bash
NODE_PATH=$(npm root -g) node tools/render-wav.cjs <slug>.html /tmp/<slug>_final.wav
tools/encode-final.sh /tmp/<slug>_full /tmp/<slug>_final.wav <film_seconds> /tmp/<slug>.mp4 27
#  → two-pass H.264 + AAC 160k sized to ~27 MiB, plus /tmp/<slug>_check.jpg (8 frames): look at it
```

- `<film_seconds>` = `Edit.duration()` (`render-parallel.sh` prints it).
- **Deliver ONE MP4 under 30 MiB** with `SendUserFile`. Never split into parts.
- **"Run on computer" ZIP:** the page + `style.css` + `fonts/` + `lib/` + `js/` + `films/<slug>/` + any cross-film file
  the page loads (e.g. `films/xover/fx.js` for Slip) + a `HOW TO RUN.txt`. Test it before sending:

```bash
D=/tmp/zip/<slug>-film; mkdir -p $D/films/<slug>
cp <slug>.html style.css $D/ && cp -r fonts lib js $D/ && cp films/<slug>/*.js films/<slug>/PLAN.md $D/films/<slug>/
printf 'WHAT IF …? — run it on your computer\n\n1. Unzip this folder anywhere.\n2. Double-click <slug>.html (Chrome works best).\n3. Click, or press Space, to play. The sound is built in.\n\nKeys: Space play/pause · R restart · F fullscreen · H hide the buttons · M mute · arrows step\n' > "$D/HOW TO RUN.txt"
(cd /tmp/zip && zip -qr /tmp/<slug>_film.zip <slug>-film)
mkdir -p /tmp/ziptest && (cd /tmp/ziptest && unzip -qo /tmp/<slug>_film.zip)
NODE_PATH=$(npm root -g) node tools/check-page.cjs /tmp/ziptest/<slug>-film/<slug>.html
```

- Then: README entry (*"Nth film: … — open `<slug>.html` (N s)"* + file list); PLAN.md status and review log; commit and
  push.

## 12. How the owner runs and records it

- Double-click `<slug>.html` → Chrome. Click or press Space to play (the click also enables sound). If a browser
  refuses local files: `python -m http.server 8000` in the folder, then open `http://localhost:8000/<slug>.html`.
- **Recording Mode (H)** hides the dev UI and rewinds; the take is deterministic, so every recording is identical.
  The README mentions screen recorders (OBS, Win+Alt+R, Cmd+Shift+5) as an option. **NEEDS VERIFICATION:** whether the
  owner uploads our encoded MP4 or a screen recording. Everything delivered from this repo has been the frame-exact
  encoded MP4.
- `?t=12.5` starts at a time, `?record` starts in recording mode, `?res=1` forces a 1080×1920 internal render.

## 13. Status-update etiquette (owner preferences)

- Short progress lines during long work ("Stills look right; starting the full render, about 90 minutes").
- When only rendering remains, say so explicitly (the owner asked: *"tell me when you are done and you are only waiting
  for the render"*).
- Send deliverables as soon as they exist (the MP4, the ZIP), with a one-line caption.
- Never claim a render finished, or that something was reviewed, unless it was.
