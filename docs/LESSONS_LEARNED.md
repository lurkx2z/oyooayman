# Lessons learned — the institutional memory

> Candid. Every item happened in this project (Oct 2026, 11 episodes). If you're about to do something listed under
> FAILED or MISTAKES, don't.

## WHAT WORKED

1. **A dense, authored world beat a sparse "correct" one.** The owner chose Claude's build over another AI tool's
   (Astra's) because it already had storefronts, people, traffic, props, signs and foreground/midground/background
   layers: *"It feels like somebody built a scene rather than just generated some boxes."* Keep world density.
2. **One shared engine + one folder per film** (since film 2). Each later episode reused the camera, hands, HUD, post,
   fog, audio engine and tools, and spent its time on the scenario. The owner asked for exactly this.
3. **Everything is a pure function of time.** Scrubbing, identical takes, 4 parallel render workers, resumable
   renders, baked audio and reproducible bugs all depend on it.
4. **Precomputed simulations sampled by time, with scripted nudges for hero beats.** Friction's 240 Hz slide sim,
   Air's drag tables, Andromeda's N-body, Before Screens' marbles. Real physics where viewers can judge it, steering
   only where cinema needs it.
5. **The edit layer (`CONFIG.edit`).** Author one continuous take, then cut dead time and add slow motion. The
   soundtrack follows automatically. Friction 74.6 → 70.3 s, Slip 67.4 → 57.3 s.
6. **Baked soundtracks.** After *"the web version doesn't have sound"* (the live render took minutes), every page plays
   sound instantly, and a fingerprint catches stale bakes.
7. **The centred serif title over an active scene, on frame 1.** Every later brief demanded it, and it works as a
   comprehension tool.
8. **A minimal top-left label/value HUD with precise numbers.** In the parody, the numbers *are* the jokes.
9. **Independent reviewer agents with timestamped swipe points.** First scores were 4–5.5/10 every time. The fixes
   they forced (late hooks, unreadable HUD, invisible key moments, dead stretches) were real and raised scores to
   6.5–7.
10. **Serious, documentary presentation made the parody funnier.** Slip performed extremely well because it looked as
    expensive as a real episode.
11. **Cheap tricks with big payoff:**
    - planar mirror + puddle mask for wet streets;
    - telephoto squints on distant events;
    - a camera-relative Moon (no parallax);
    - an analytic Milky Way band;
    - a match-cut ring (puddle → underground);
    - world tags explaining physics (`HELD ONLY BY THE BOLLARDS`);
    - a MEANWHILE montage as a mid-film reset;
    - a recap stack before the punchline.
12. **Separate scenes per segment** (`FILM.view`) for worlds at different scales (street / underground / fault /
    planet / coast). No giant shared scene.
13. **Contact sheets** (1 frame per second) as the main review medium, for reviewers and for yourself.
14. **Fonts bundled as data URIs**, so the look is identical offline, from `file://`, and in headless renders.
15. **Finishing autonomously.** The owner explicitly preferred "review with agents and continue to the full video
    without stopping" over pausing for approval.

## WHAT FAILED

1. **Four art-direction passes on the first 15 seconds** of Oxygen (v1 → V4) before the rest of the film existed.
   The owner had to say: *"Don't let Claude keep endlessly tweaking saturation and darkness"* and *"I would not wait
   for a 9/10 graphics match."* **Complete the video early, then polish.**
2. **Too much on-screen text.** v1 stacked `OXYGEN 0.0%`, `YOU BLACK OUT IN 00:13.3`, `SPARKS DIM — NO O₂`,
   `BREATHE`, `EACH BREATH PULLS O₂ OUT OF YOUR BLOOD`. It looked like an infographic. Text was cut ≥ 50 %.
3. **Over-correcting toward the Omaha reference**: grey, dark, dirty. *"The Omaha-only direction was beginning to make
   it too grey and dirty."* Muted, not monochrome.
4. **Primitive hands and capsule people.** *"The people and hand are probably the biggest remaining 'this was coded by
   AI' giveaway."* *"A bad first-person hand is worse than no hand."*
5. **90-second films.** Oxygen held 22.4 s average on 91 s.
6. **The cold-open + rewind format** (Moon: money shot then "24 HOURS EARLIER"; Air: "33 SECONDS EARLIER" at 48.6 s).
   Moon underperformed; Air didn't perform as hoped. Not the default anymore.
7. **Predictable cosmic spectacle** (Andromeda, Moon): *"visually large, but more predictable"*, *"spectacle alone does
   not guarantee retention."*
8. **Emergent physics chaos as choreography.** In Friction every tweak reshuffled the whole chain reaction. Hero beats
   had to be pinned with initial conditions plus scripted kicks and holds.
9. **Waiting for external assets.** GLBs were requested twice and never arrived. Don't block on them; build the
   authored procedural version.
10. **Splitting the final video into parts** to fit the 30 MiB send limit. *"bro drop sending me parts make the video i
    prompted."* Two-pass encode one file under 30 MiB.
11. **Long silent blocking waits.** The owner interrupted waits ("STOP", "how long left?", "yo brother progress?"). Run
    renders in the background, keep working, give one-line status updates.
12. **Sending previews and pausing for approval** when the owner wanted the finished film.

## VISUAL MISTAKES

- **Key events too small:** squeezed into the 50–70 % height band, with empty pavement in the bottom third and HUD over
  sky at the top. Keep the subject ≥ 15 % of frame height, in the central 50 %.
- **The title over the action** (Friction: it hid the falling people). Compose the action below the title.
- **Captions too low or near the right rail** (covered by platform UI) or washed out on bright ground. Use a dark
  plate, top ≈ 1300–1400 u, inside the safe zones.
- **Milky white smoke/fog** whitening the midground. Smoke darker, fewer and smaller; fog grey-green.
- **A white "firefly" disc** from one NaN/Inf specular pixel smeared by bloom (Oxygen 6.9 s). Clamp in the downsample
  (now in post); car glass roughness ≥ 0.14. Found by hiding scene objects one by one until the pixel cleared.
- **Uniform fog field.** Banks + ground haze + haze cards.
- **AO halos** around thin objects in interiors. `ao` 0.4–0.55.
- **A sepia grade** in Depersonalization read as nostalgic. Cool, flat grade with black lift.
- **Ghost thumbs / z-fighting finger joint spheres.** Overlapping segments, sensible thumb spread 0.35–0.5.
- **A hand pose outside the FOV** (a hand over the mouth is ~55° below the eye line). Choose visible poses.
- **A forearm rising toward the lens.** Recompute F/N; keep the wrist z −0.33…−0.45.
- **Pale nails**, a placeholder shoe. Skin-tone nails, a real trainer.
- **Objects hidden from the camera:** behind trees, umbrellas, awnings, signal masts, the grill smoke; a dynamic lamp
  post not visible; the camera inside a bunker, a taxi, the ground. **Verify sightlines numerically** (project the
  subject to screen space; raycast) for every hero beat.
- **The camera walked into a signal mast; a door opened into the camera.** Check the camera path against props.
- **Sky bands and seams:** a bright horizon line where terrain didn't meet the mountains; a hard-edged band from square
  smoke sprites; a cloud seam where storm spirals stopped at a fixed radius (fixed in `js/world/earth.js`); a hard polar
  cap.
- **An additive ghost/afterimage invisible on a bright sky.** Normal blending, opacity 0.8.
- **A long white-out "mush"** for lightning. ≤ 3 frames.
- **The Titan read as an "orange bodybuilder golem"**, and the crossover poster read as nude mannequins in grey mud.
  Signature features (dark mane, green eyes, lean deltoids), smoke cleared off the heroes, rim light. Characters with
  skin-coloured low-poly bodies read as naked. Give them clothing or dark material breaks.
- **Static frames repeating the same shot** (the same shot of a friend three times; the grill centred for 13 s).
- **The tsunami as a flat wall.** A GPU-deformed body + pitching lip from one profile, a vertical colour ramp, climbing
  bands, two-tone foam, mist, spray, debris, the ship on the face. Still judged "stylised" after v3, which remains the
  known weakest hero.

## TECHNICAL MISTAKES (gotchas you will hit)

**three.js r186**
- `PCFSoftShadowMap` was removed. Use `PCFShadowMap` (+ `shadow.radius`).
- `RoundedBoxGeometry` is `THREE.RoundedBoxGeometry` (bundled); `mergeGeometries` is `THREE.mergeGeometries`.
- `toNonIndexed()` on non-indexed geometry warns. Check `g.index` first.
- Euler order matters: `Geo.matrix` uses `'YXZ'`; XYZ gave wrong orientations.
- **Reversed winding = invisible** (curbs, storefronts, seabed, water, limb lofts). Fix the vertex/ring order.
- `THREE.Fog` (linear) has no `density`. With the patched chunks it produced NaN (black underground). Use `FogExp2` or
  `scene.fog = null`.
- Three overwrites fog uniforms every frame. To scale fog per material, inject your own uniform into the shader text.
- Concatenating `ShaderChunk` includes onto one line breaks `#ifdef`. Put newlines around includes.
- The fog chunk replacement must continue the existing `float ` declaration (`float float` syntax error).
- Ribbons/planes seen from behind need `side: THREE.DoubleSide`.
- `mesh.position` is read-only for `Object.assign(mesh, {position})`. Set components explicitly.
- Colours you write straight into shader uniforms are linear. Convert from sRGB (Slip's `SR()`), or the wave turns
  pale.
- `renderer.info.autoReset = false` + a manual reset to count all passes' draw calls.
- Camera-dependent HTML (anchors) must use `camera.updateMatrixWorld(true)` from the same frame.
- Planar mirror: nothing may stand behind the glass; an oblique near plane gave half-black renders. A material that
  samples the mirror texture while the mirror renders makes a feedback loop: swap in a dummy 1×1 target during the pass.
- Stale world matrices: when a camera or effect reads an actor's position, update that actor (or
  `root.updateMatrixWorld(true)`) first; tank muzzles and Killua's close-up jumped before this.
- Basis-matrix 2-bone IK (the elbow bends toward the target); naive IK bent in the wrong plane. Clamp head aiming
  inside a neck cone, or heads turn 180°.

**Engine / JS**
- Classic scripts share one scope. A `const` used in another file before that file loads is a TDZ error. A duplicate
  global name across loaded files is a SyntaxError that kills the page. Prefix film globals.
- JS precedence: `-x ** 2` is a SyntaxError. Write `-(x ** 2)`.
- `Person` with `spec.face` faces that way **while walking** too. Use `faceUntil` or omit it for walkers.
- Brow signs swapped made a worried face read as angry. Check expressions in a close-up still.
- CSS `transform` on a centred element must keep `translateX(-50%)`.
- `StoryHUD` title: opacity on the outer box (a bug once hid every title).
- With `CONFIG.edit`, a title window that starts exactly at the first kept second is invisible on frame 0. Start it
  before.
- `installFog` runs once; the first call wins (environment.js calls it with defaults).
- `Environment.update` is Oxygen-specific. Override it in every subclass.
- In an `Environment` subclass, give your own helper methods a film prefix. The base class already has `_bench`,
  `_tree`, `_trees`, `_cafe` …; a subclass `_bench()` silently replaces the park-bench builder and gets called from the
  base layout code too (No Surface Tension built its potting bench three times this way).
- The Look grime shader paints any large `MeshStandardMaterial` with 1.25 m "replaced slab" cells: on a lawn they show
  as dark rectangles. Opt a material out with `mat.userData.grime = 0`.
- A test page inside `films/<slug>/` breaks relative paths. Test pages go in the root as `zz_*.html` and are deleted
  before committing.
- Google Fonts fail in headless and from `file://` (proxy/cert). Fonts are bundled.

- **A cut keyed as two camera keys at the same time shows one frame of the old shot.** `Track.value(t)` at exactly a
  duplicated key time returns the first (pre-cut) key's value, while sets switched by `t >= T` are already on the new
  shot: one broken frame per cut whenever T lands on a frame (no-surface-tension v2). Put the pre-cut key 0.01 s
  before the cut: `[T - 0.01, old], [T, new]`.
- **To lift one dark object, light the object, not the scene.** A small point light added to make a wet duck read lit
  the pond's underside next to the camera: a blown-out glare (no-surface-tension v2). A self-light term in the object's
  own material (`totalEmissiveRadiance += diffuseColor.rgb * k` via `onBeforeCompile`) only touches that object.
- **A fast time-lapse flips day/night in two frames.** At about a day per second, a daylight curve that switches over
  an hour of sun angle lasts two frames: a strobe. Average the light over half a second of story time.

**Audio** (see `SOUND_GUIDE.md` § 6): offline exponential-ramp spikes; noise before its envelope; quiet/loud mixes;
sub-only drones; cues running past their scene; editing `audioEngine.js` invalidates all bakes; changing SCRIPT after
baking.

**Shell / container**
- **`pkill -f <pattern>` killed my own shell** (exit 144) three times: the pattern matched the command line itself.
  Use `ps -eo pid,args | awk '$2=="node" && $3 ~ /render-frames/ {print $1}' | xargs -r kill`.
- Foreground `sleep` is blocked. Wait with a background job / until-loop or a monitor.
- `rm` of relative globs after `cd` is blocked by the safety check. Use absolute paths, or a new output directory per
  round.
- Python edit scripts: write them to a file (heredocs with stray brackets or backticks broke); `assert old in s` before
  every replace. Quote heredocs (`<<'EOF'`) or backticks execute.
- `page.goto` / `waitForFunction` time out under CPU load. Use 300–900 s timeouts (already in the tools).
- **Container restarts kill background renders.** The frame workers skip existing frames, so re-run them.
- 4 cores: two full renders at once double both times. JPEG q95 screenshots are ≈ 0.9 s/frame faster than PNG.

## RETENTION MISTAKES

- **A late hook:** Friction's friction loss at 3.0 s was moved to 1.5 s; reviewers swiped at 1–2 s when nothing had
  happened under the title.
- **A "0 %" moment with nothing visibly changing** (Oxygen v1: after 0.0 % only one tiny flame went out).
- **Static stretches:**
  - Friction's 13 s hill section with the truck behind trees;
  - an 11 s aftermath of a clean street;
  - a static lull before 3-2-1;
  - the Game film's 18 s with no viewer task;
  - Slip's walk, sky hold, pebble wait, static globe and 12 s of mud.
  All cut or reworked.
- **Peaking early** (the Crossover override: the final 12 s must be the best).
- **The obsolete formats:** see `RETENTION_RULES.md` § 6.
- **Explaining instead of showing:** labels and long captions.
- **A disclaimer before the payoff, or a note stepping on the punchline.** Put notes last, small, 1.2 s after the
  punchline.

## PERFORMANCE MISTAKES

- **Friction sim too slow at load:** static bounding + sorted posts brought it to 4–9 s (8–11 s under load). Keep
  load-time sims under ~10 s.
- **Live soundtrack render on load took minutes** (Before Screens took 170 s for 55 s of audio, made worse by dense
  chatter). Bake it.
- **Final renders take hours** on software WebGL: ~0.3–0.6 fps per worker at 1080×1920. Use 540×960 stills and
  270×480 @ 15 fps previews for iteration; render 1080 once.
- **Heavy features cost render time, not playback quality:** shadow maps 4096 → 2048 per film where possible; mirror
  resolution capped (480–900); instanced billboards instead of individual sprites; batching static scenery.

## GOOD SHORTCUTS

- **Cinematic illusion over simulation:** the airliner crash = a flight path → disappears behind buildings → delayed
  thud → dust column (no crash simulation).
- **City lights going out** via a shader threshold on a per-patch hash; the grid "failing" via emissive ramps.
- **Camera-relative hero objects** (the Moon, sky domes).
- **Analytic fields shared by JS and GLSL** (Slip's seabed height used for both placement and shading).
- **Deterministic replays** for "déjà vu" (Sim): the same pure function re-evaluated at a shifted clock.
- **Copy-then-own** film modules instead of generalising shared code mid-episode.
- **A dip to black / white flash / match-cut** to change worlds instead of building a continuous transition.
- **Story tracks** (`SCRIPT.tracks` → `SCRIPT_TRACKS`) for every scalar that changes over time (O₂, hypoxia, sea level,
  wave height); the HUD, grade, sound and world all read the same track.

## BAD SHORTCUTS

- Fog or darkness to hide weak assets (it doesn't).
- Labels/HUD to explain what the image doesn't show.
- Blur and white-outs to cover transitions or effects.
- Thousands of particles or "random" debris instead of a few readable hero pieces.
- Reusing the same framing for different beats.
- Letting an unconstrained sim choreograph hero moments.
- Splitting deliverables or skipping the bake "for now".

## THINGS WE SHOULD NEVER HAVE TO REDISCOVER

1. Default format = Oxygen/Friction structure, 60–72 s, centred title on frame 1 over a moving scene, rule change
   ≤ 3 s, a new consequence every 5–8 s, the biggest payoff last.
2. Muted world + few strong accents; fog grey-green and capped; selective gloss; rounded vignette; Lora serif
   captions; top-left label/value HUD.
3. No hand is better than a bad hand; people need authored silhouettes; trees are faceted crowns, not spheres or
   shards.
4. Everything is a pure function of time. Use `hash1`, never `Math.random()`.
5. Author on story time; cut with `CONFIG.edit`; the title starts before the first kept second.
6. Bake the soundtrack last; never edit `audioEngine.js` casually; `check-page` before committing.
7. Final delivery = one MP4 under 30 MiB (two-pass) + a runnable ZIP. Never parts.
8. Render in the background with resumable workers; don't block; give status lines.
9. Verify that sightlines, sizes and safe zones show every hero beat on a phone.
10. `pkill -f` kills your shell. Absolute paths for `rm`. Assert your text edits.
11. Science honesty: isolate the rule, compute the numbers, disclaim fiction after the payoff.
12. The owner is a beginner and wants finished videos. Build everything; report honestly; don't inflate scores.

## OBSOLETE DECISIONS (kept here so nobody revives them as rules)

| Obsolete | Replaced by |
|---|---|
| Omaha-only "dark PS2/Source" target | 70 % POV What If / 30 % Omaha hybrid |
| Cormorant Garamond thin display serif; centred thin-sans O₂ readout | Lora book serif; top-left label/value block |
| Blocky procedural first-person hand | the authored `smoothLoft` arm (or no hand) |
| "Bring in GLB characters/arms" as the plan | authored procedural assets (GLB loading not implemented) |
| 75–90 s films | 60–72 s |
| Cold open + rewind; 42–50 s ultra-short | centred question over a normal world |
| Google Fonts links | `fonts/fonts.css` data URIs |
| `tools/render-preview.cjs` for finals (single process, PNG) | `tools/render-parallel.sh` + `encode-final.sh` |
| Oxygen's bespoke wiring (`js/scene/*`, `js/ui/hud.js`, `audioManager.js`) as a template | `templates/episode/` + StoryHUD + an AudioEngine subclass |
