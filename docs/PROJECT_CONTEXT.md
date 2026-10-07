# Project context — What Happens If

> Read this first. It explains what the project is, who it is for, and why it is built the way it is.
> Everything here comes from the owner's briefs and feedback (Oct 2026) and from the repository itself.
> Anything not confirmed is marked **UNKNOWN** or **NEEDS VERIFICATION**.

## 1. What this is

**What Happens If** is a short-form video channel. Each episode is a **vertical first-person 3D simulation** of one
"what if" question ("What if oxygen suddenly disappeared?", "What if friction disappeared for 60 seconds?").

- **Platforms:** TikTok, YouTube Shorts, Instagram Reels.
- **Format:** 9:16, designed natively at **1080 × 1920, 30 fps**. Target length **≈ 60–72 s** (shipped cuts range 57–90 s; see `VIDEO_FORMAT.md`).
- **Look:** polished, cinematic, low/mid-poly, atmospheric. Serif captions, a minimal HUD. It must look like a
  deliberately art-directed game or simulation cinematic, **not** a coding demo, not Roblox, not a mobile game,
  not photoreal (see `STYLE_BIBLE.md`).
- **Each episode is a real-time Three.js program** that runs in Chrome from a double-clicked HTML file. It is rendered
  frame-by-frame to an MP4 for upload.

## 2. Who you are working for

- The owner is **a beginner programmer**. They write long "MASTER BUILD PROMPT" briefs (structure, beats, captions,
  HUD values, review instructions). **Claude writes and maintains all code.** Manual steps for the owner must be minimal
  and spelled out exactly.
- The owner wants **finished videos, not plans**. Prefer finishing the whole episode autonomously. The owner's words on
  the Friction brief: *"instead of sending me the preview and pausing your work, when you are done with the preview let
  the ai reviewers rate it and continue all the way to the full video without stop."*
- The owner reports **real upload performance** back. These numbers are the only analytics that exist (see
  `RETENTION_RULES.md`). Do not invent others.
- The owner's typical follow-ups:
  - **"run on computer"** means *send me a ZIP of the runnable film folder*;
  - **"send me the video"** means *one MP4 under 30 MiB*. The owner said: *"bro drop sending me parts make the
    video i prompted"*. Never split a video into parts.
  - **"how long left?" / "progress?"** means *give a short status*. Never sit silently in a long blocking wait.

## 3. Technology stack (and why)

| Piece | Choice | Why |
|---|---|---|
| Rendering | Three.js r186, bundled as a classic global script (`lib/three.bundle.min.js`, includes `mergeGeometries` and `RoundedBoxGeometry`; **no GLTFLoader, no OrbitControls, no EffectComposer**) | Runs from `file://` with a double-click; no build step, no server, no npm for the owner |
| Language | Plain JS classic `<script>` files sharing one global scope | Same reason. One HTML page per episode lists its scripts in order |
| Assets | **100 % procedural**: geometry, canvas textures, Web Audio synthesis | No downloads, no licensing, no asset pipeline, works offline. A GLB was requested twice (people, first-person arm) but never supplied; procedural "authored" versions were built instead (see `ASSET_GUIDE.md`) |
| Time | Every frame is a **pure function of time t** (deterministic, seeded) | Scrubbing, identical recordings, frame-exact headless rendering, reproducible bugs |
| Sound | Web Audio graph rendered **offline** into one buffer, baked to MP3-in-JS per film | Perfect sync; the page plays instantly (`SOUND READY`) |
| Capture | Playwright + headless Chromium (SwiftShader software WebGL) → JPEG frames → ffmpeg | Runs in the cloud container; no GPU needed |
| Fonts | Inter, Lora, Oswald, JetBrains Mono bundled as data URIs in `fonts/fonts.css` (SIL OFL) | Google Fonts failed headless and from `file://`; the look must not change offline |

**Why HTML/Three.js at all:** the owner first compared builds from two AI tools, Claude and "Astra". Claude's
Three.js build won on world density (storefronts, people, traffic, props, layering). The owner then committed to it:
*"We're past proving whether HTML works. It does. Now it's basically an art-direction problem."*

## 4. Content strategy (current)

1. **One simple rule change → many distinct, surprising consequences → escalating destruction → one big payoff.**
   This is the formula of the best performers: Oxygen, Friction and the Slip-and-Fall parody.
2. **Grounded, checkable physics beats spectacle.** Viewers comment on accuracy. The science must survive the comments
   (see `PHYSICS_EPISODE_RULES.md`).
3. **Default structure = the Oxygen / Friction format** (see `VIDEO_FORMAT.md`):
   - centred title over a normal world;
   - the rule changes within the first ~2–3 s;
   - a new consequence every ~5–8 s;
   - a destruction payoff near the end;
   - a short ending line.
4. **The ultra-short (~45–50 s) cold-open + rewind format is NOT the default.** It was tested on Moon (80 s with a cold
   open) and Air (48.6 s) and did not perform as hoped.
5. **The audience has a running joke: "every scenario ends in a tsunami."** The Slip-and-Fall parody leaned into it
   and performed extremely well. Self-aware parody that keeps a dead-serious production works.
6. Other genres were made (history, psychological "what it feels like", fourth-wall, fake-interactive, anime crossover).
   Their performance is **UNKNOWN**. Treat them as experiments, not templates.

## 5. Production philosophy

- **Complete the video early, then polish.** Endless art-direction loops on the first 15 s wasted time on Oxygen.
  The owner: *"I would not wait for a 9/10 graphics match … Then we need to start making the actual video insane."*
- **Reuse the engine; never rebuild it.** Every brief since film 2 says so. New episode = new `films/<slug>/` folder
  plus a page; the shared `js/` engine stays (see `LOCKED_SYSTEMS.md`).
- **Deterministic everything.** Seeded RNG, stateless hashes, precomputed simulations sampled by time.
- **Independent reviewers.** The owner asks for 2–4 reviewer agents (retention, cinematography/3D, normal viewer,
  science/physics) who are told to find problems, give timestamped swipe points, and not inflate scores. Their first
  scores are usually 4–5/10. That is normal, and the fixes they drive are real (see `PRODUCTION_WORKFLOW.md`).
- **Honesty in reports.** Report scores as given. State what is still weak. The owner explicitly asked: *"Do not
  inflate scores."*

## 6. What the final videos should feel like

- **0–1 s:** the viewer already knows the question (a big centred serif title over a living scene).
- **Every few seconds:** "wait, THAT changes too?". A new consequence, not a new number.
- **Physically present:** first-person camera at eye height with breathing and restrained sway. Hands and legs appear
  when they are good enough.
- **Serious, documentary tone.** Short serif captions (4–9 words), a small top-left HUD with precise numbers.
- **Escalation of scale:** personal → street → city → planet, ending on the biggest event, then a short line and black.

## 7. Repository map (one line each)

```
CLAUDE.md                 bootloader for any Claude instance (read first)
docs/                     this handoff: start at docs/NEW_DEVELOPER_BOOTSTRAP.md
docs/reference/           frames from the shipped episodes (what "on-style" looks like)
docs/art-direction.md     the measured calibration against the two external references (Omaha, POV What If)
docs/briefs/              the owner's original briefs and feedback, verbatim (source of every quote in docs/)
index.html                episode 1: Oxygen (older wiring: js/scene/*, js/ui/hud.js)
<slug>.html               one page per later episode (before-screens, depersonalization, friction, andromeda, moon,
                          sim, air, game, xover, slip)
films/<slug>/             everything specific to one episode (+ PLAN.md = brief, shot list, review log)
js/                       the shared engine (main loop, camera, hands, HUD, post, fog, people, vehicles, audio)
lib/                      three.js bundle      fonts/  bundled fonts      style.css  shared stage + HUD styles
tools/                    render / bake / check scripts (see docs/PRODUCTION_WORKFLOW.md)
templates/episode/        a minimal working episode to copy (tools/new-episode.sh)
```

## 8. Open questions (NEEDS VERIFICATION with the owner)

- Upload performance of Before Screens, Depersonalization, Andromeda, Simulation, Game, Crossover: **UNKNOWN**.
- Whether a `main` branch will be created. Today the repo's default branch is `claude/intelligent-archimedes-dgu7zi`
  (see `GITHUB_WORKFLOW.md`).
- Whether external GLB assets are now acceptable or wanted. Historically: procedural only, because none were supplied.
- The repository is **public**. Keep third-party reference material and anything private out of it.
