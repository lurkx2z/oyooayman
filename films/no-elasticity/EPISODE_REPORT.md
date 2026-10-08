# Episode report — WHAT IF EVERYTHING LOST ITS ELASTICITY? (v2)

**TITLE**
WHAT IF EVERYTHING LOST ITS ELASTICITY? (slug `no-elasticity`, page `no-elasticity.html`)

**BRANCH**
`episode/no-elasticity-w25koa` (PR #1 was opened from the UI; nothing merged).

**VERSION**
v2, the redesign under the owner's creative direction override of 2026-10-08 ("stop making repetitive videos"). v1
(60.2 s, street beats) was delivered that morning; its code is still in the repository, switched off by `NE_STREET`.
Why and how: `REDESIGN.md`. Shot list: `PLAN.md` §3b. Review log: `PLAN.md` §8.

**DURATION**
60.6 s (1818 frames at 30 fps, 1080 × 1920). Film time = story time (no `CONFIG.edit`).

**PHYSICS RULE**
Solids lose elastic recovery. They still resist being deformed (stiffness and strength are unchanged), but once deformed
they never spring back: every solid behaves as perfectly plastic and keeps the running maximum of what it has taken.
Collisions are perfectly inelastic. Unchanged: gravity, mass, momentum, air and water, living tissue (people are fine).
Closing note: "Fictional rule: solids never spring back. People, air and water are unchanged."

## What changed from v1 (the exact scenes)

| v1 (delivered 2026-10-08 morning) | v2 (final) |
|---|---|
| 0–5.6 a teenager dribbles a solid rubber ball in the plaza; low close-up of its flat spot | **0–5.6 a Newton's cradle and a quartz desk clock on a café table.** Three clacks under the title as you lean in toward the clock; it takes its last step at 1.0 s and misses the next at 2.0; at 1.56 the end ball swings back and nothing flies out: the row just shoves along together ("tock", not "clack"). From 2.6 a low insert with a ghost of the ball that should have flown out |
| 5.6–13.4 montage; 13.4–18.2 trampoline | Kept (bigger label lines; the tennis ball now barely leaves the strings, since its air still pushes back) |
| 18.2–23.5 a red hatch over a speed table, low wheel shot | **18.2–21.8 the bow**, first person: draw, aim (target beside the grip), let go. The arrow falls off the bow; the bow turns side-on with its limbs still bent. **21.8–23.4** a low 3/4 shot of the arrow lying on the paving |
| 23.5–30.7 cars scraping over the table; a truck on its bump stops | **23.4–27.3 the tuning fork** at the café table: it goes "tk" and the struck prong stays bent. **27.3–30.9 your watch** stopped at 3:41:52, "one second into this video" |
| 30.7–36.1 the footbridge's 7 mm sag | **30.9–37.3 inside the watch** (macro): the quartz crystal, a tuning fork that should spring back 32,768 times a second, is still |
| 36.1–46.0 a three-car crash at an intersection | **37.3–40.9 the plaza clock**, stopped at the same instant; "So did the clock in your phone." |
| 46.0–50.0 a 5 km/h tap dents a bumper | **40.9–49.6 time-lapse** of the rest of the day: THE CLOCKS SAY 3:41 PM vs THE REAL TIME 3:42 PM onward; inserts of the trampoline (deeper only after a harder landing) and a tree whose lean grows with each stronger gust |
| 50.0–60.2 an empty street, then back to the ball close-up | **49.6–54.4 dusk at the trampoline**: two people climb onto the frame and jump in, and the day's hardest landing takes the mat flat onto the paving, where it stays; **54.4–58.0** a push in on the lit plaza clock at night, still at 3:41, and the note; **58.0–60.6** back to the desk clock on the café table: "Rewatch the red clock: one tick, then never again." (the loop) |

### The v1 problems this answers (the owner's "fix the existing video" list)

- **Three most repetitive sequences (v1):** the car over the speed table and its wheel close-up (18.2–23.5); the scraping
  cars and the truck on the same avenue (23.5–30.7); the three-car crash and the arc round the wreck (36.1–46.0). All three
  are gone.
- **Three most boring stretches (v1):** the footbridge (30.7–36.1, a 7 mm sag that had to be drawn 300× to see); the 5 km/h
  tap (46.0–50.0); the empty street before the loop (50.0–51.9). All gone.
- **Weakest visual demonstration (v1):** the footbridge sag. Replaced by the bow (the arrow drops) and the stopped quartz
  crystal.
- **Weakest part of the ending (v1):** a quiet return to the opening ball close-up after the crash. v2 ends on its biggest
  idea instead: the whole day passes while every clock says 3:41, and the loop back to the desk clock invites a rewatch.

## Systems

**REUSED** (engine `js/`, unchanged): `CameraController` (first person and cinematic shots via the pov track),
`ViewerHands` (the rubber band, the bow, the fork, the watch), `People` / `Person`, `Environment` (subclassed as `NeCity`),
`AudioEngine` (subclassed as `NeAudio`), `StoryHUD`, post-processing, fog, `Look`, timeline tracks, seeded RNG, textures,
the dev controls. Tools: `check-page`, `stills`, `contact-sheet`, `preview-sheets`, `render-parallel`, `render-wav`,
`bake-soundtrack`, `encode-final`.

**NEW in v2** (all in `films/no-elasticity/`, prefixed `Ne` / `NE` / `ne`):
- `cradle.js`: `NeCradle` (five steel balls on V-strings; elastic clacks, then one perfectly inelastic hit that moves the
  whole row as one lump; the ghost ball), `NeDeskClock` (stops at 1.0 s), the café lamp for the last shot.
- `bow.js`: `NeBow` (limbs that bend on the draw and keep the bend; a limp string after the release), `NeArrow` (falls
  off the bow; its resting pose is computed from the release, so any frame can start a render), `NeTarget`, `NeFork`
  (the struck prong stays bent), `NeWatch` (the dial on your wrist, stopped at 3:41:52).
- `clocks.js`: `NeClock` (the plaza clock, lit at dusk), `NeQuartz` (the macro set inside the watch: gears, step motor,
  circuit, the quartz crystal in its can and its ghost vibration), `NeLapse` (the time-lapse: shadows, people, the
  trampoline's running-max depth `NE_PIT`, gust-by-gust tree lean `NE_GUSTS`, dusk lamps, the trunk line).
- `film.js` / `script.js`: the v2 shots, tags, hand poses, captions and readouts.
- `audio.js` / `soundtrack.js`: the v2 sound (below).

**ASSETS ADDED:** none. Everything is procedural. No third-party media.

**ENGINE CHANGES:** none (`git diff` on `js/` is empty; `js/audio/audioEngine.js` untouched).

## Sound

Every sound of something springing back is missing. Three bright cradle clacks, then one dead "tock"; the desk clock's
two ticks, the second its last; the bow's soft creasing, no twang, a slack "fwup" and one clatter; the fork's single "tk";
the watch's silence; inside the watch a thin whine for the normal vibration that stops dead; a low boom on the plaza
clock; the time-lapse's rush, sped-up voices, gusts and dull landings, a plucked pulse that climbs through the afternoon
and slows at dusk; crickets; one last quiet tick under the rewatch line. The bed and music dip for half a second before
each dead hit. WAV: −18.3 LUFS integrated, −1.9 dBFS sample peak. The sound has been level-measured, never listened to.

## Reviews (scores out of 10, exactly as given)

| Round | Cut | Viewer | Retention | Cinematography | Physics | Differentiation |
|---|---|---|---|---|---|---|
| v1 final (round 4) | 60.2 s street cut | 5 | 6 | 6 | 8 | 4 (scored in round 5) |
| v2 round 5 | 59.6 s first redesign preview | 6.5 | 6 | 6 | 7 | 7 |
| v2 round 6 | 60.6 s second preview | 6 | 5 | 6 (with phone clarity) | — | 7 |
| v2 final audit | 60.6 s first 1080 × 1920 render | 6 | 5 | 5 (with phone clarity) | 8 | — |
| v2 re-check | 60.6 s after the audit's fixes | 6 | 6 | 6 (with phone clarity) | 8 | — |

Every row is a fresh, independent reviewer. The re-check's one new finding (the landings at dusk) was fixed after it and
not re-scored.

## Final production audit

A fresh reviewer audited the real output (the 1080 × 1920 MP4, frame by frame and with ffprobe) on style, pacing, physics,
phone clarity, escalation and the technical spec. Its three highest-impact problems, and what was done:

1. **A dead ending (49.6–60.6).** An 8.4 s slow push into a stopped clock, then a cut to another stopped clock. Now the
   dusk wide comes down to the trampoline: two people climb onto the frame and jump in, and the day's hardest landing
   takes the mat flat onto the paving (tag MAT ON THE GROUND · IT STAYS THERE); then a cut to a shorter push on the night
   clock (54.4–58.0); then the loop.
2. **The loop payoff couldn't be checked.** The opening cut away from the desk clock at 1.75 s, before it could miss a
   tick. Now the first-person wide holds to 2.6 s and leans in on the clock (about a third of the frame width by 2.0 s),
   its seconds hand is thicker, the last line says what to look for ("Rewatch the red clock: one tick, then never
   again."), the time readouts stop before that shot, and there is no fade to black, so the loop is seamless.
3. **Six glitch frames.** Hand poses one frame late at three cuts (13.40, 18.20, 23.40), a blur trail across the cut at
   18.20, the café sitter snapping round at 10.13, the quartz macro jumping in scale at 33.47. All fixed at the source
   (snap keys finish on the cut frame, no trail on cuts, a 0.45 s turn, the macro's settle eases out).

Also: the cradle clacks are about 6 dB louder; the video is now converted to and tagged as BT.709.

**Pacing:** no stretch over 4 s without a new event after the fixes (the longest is the night push, 54.4–58.0, which
carries the note and the lamps coming on). **Physics:** 8/10 from both reviewers; nothing contradicts the rule.

**Technical (ffprobe on the delivered MP4):** H.264 High, yuv420p, 1080 × 1920, 30 fps constant, 1818 frames, 60.600 s,
under 30 MiB, BT.709 tagged, fast start, decodes cleanly. AAC 48 kHz stereo, −18.3 LUFS integrated, true peak −2.6 dBTP.
The cradle clacks land within about 20 ms of the hits on screen.

**Still weak (honest):**
- The desk clock's one tick is still a small movement on a phone; the loop works best for viewers told to look.
- The mix is −18.3 LUFS; the sound guide aims at about −16 to −17.
- Tags and HUD sub-labels are small on a phone; the HUD plates pass over the plaza clock at 50.2–51.4; the first
  closing line covers a bystander's head at 51.0–51.5.
- The montage's header plates are a second caption system; the watch dial on black at 30.9 is the only shot in a void;
  the time-lapse's first stretch (41.5–44.9) has little motion.
- The last six seconds are two quiet clock shots: the ending is calm, not a peak.
- The sound has been level-measured and checked for sync, never listened to.

**Creative assessment.** v2 is a different film from v1 and from the rest of the channel: no street, cars or crash, and
its escalation goes from things that bounce, to a bow, to sound, to time itself, which is an idea no other episode has.
Its three signature moments are the cradle that just shoves, the arrow that drops off the bow, and the quartz crystal that
stops every clock on Earth. Reviewers put it at about 6/10 for a normal viewer: clearly better than v1's 5, held back by
small on-phone details and a calm ending. The strongest single moment is "every quartz clock on Earth stopped at the same
instant… so did the clock in your phone".
