# Episode report: What If Gravity Doubled? Episode 01, The Day Everything Became Heavy

Page `gravity-doubled-3min.html` · 1920×1080 · 30 fps · 179.7 s · branch `episode/gravity-doubled-3min-*` (no PR).
Built around the owner's approved 12-scene script and the seven existing Charlie narration clips (never regenerated,
never cut). Master timeline, physics and shot list: `PLAN.md`.

## Deliverables (in the project files, `gravity-doubled-3min/`)

| File | What it is |
|---|---|
| `gravity-doubled-3min_final_1080p.mp4` | the film: 179.7 s, 1920×1080, 30 fps, H.264 1.13 Mbps + AAC 160k, 28.2 MiB; −15.0 LUFS, −1.8 dBTP in the MP4 |
| `gravity-doubled-3min_film.zip` | runnable copy: unzip, open `gravity-doubled-3min.html`, press Space |
| `gravity-doubled-3min_mix.wav` | the mastered soundtrack (48 kHz) |
| `timeline.json` | master timeline: narration clips with every word, shots, beats, drop physics, speech-free sections |
| `subtitles.srt` / `subtitles.vtt` | word-timed subtitles from the real audio |
| `narration/` | the seven narration clips (untouched) |

## Narration fit

Every clip plays complete; each fades 0.3 s after its last word (this also removes clip 02's end click). Scene 10's
clip (20.3 s) is longer than its 19 s slot, so scene 10 runs 20.6 s and the film is 179.7 s. Scenes 2, 5, 7, 9 and 11
have no narration.

## Mix (measured, not listened to)

- Integrated −14.9 LUFS, true peak −2.1 dBTP, loudness range 5.4 LU (the 60 s v2 mix was 2.9).
- Five stems (voice, music, ambience, foley, effects). Music ducks 8 dB and ambience 7 dB under the narrator; ducking is
  driven by the real word times.
- Punch (short-term loudness above the second before):
  - Cup set-down: 13.8 LU.
  - 2 g ball impact: 12.9 LU.
  - 1 g ball impact: 9.6 LU.
  - First stair: 5.7 LU.
  - Clamps opening: 5.2 LU.
  - The doubling: 4.4 LU (it lands under the narrator's "heavy").
- Quiet anticipation before the set-down, the drop (music cut to silence about 0.5 s before release) and the second
  stair.
- Silent scene 11 is the fullest moment of the score (−14.1 LUFS), on purpose.

## Independent reviews (before fixes)

Two reviewers looked at a 60-frame sheet (one frame every 3 s), the script and the plan.

- Visual and pacing reviewer: visual quality 6.5, cinematography 5.5, pacing and storytelling 5, phone clarity 4.5.
- Physics and script reviewer: physics accuracy 8, script compliance 8.5. Every number recomputed and correct:
  - 0.452 / 0.319 s fall times.
  - 4.43 / 6.26 m/s impact speeds.
  - 6.3 / 12.6 J impact energies.
  - Cup weight 2.45 → 4.9 N.
  - Body weight 736 → 1,472 N.
  - 30 cm bounce.
  - Half-height fountain.
  - Pendulum √2 faster.

These fixes were made after the reviews. They were not re-scored.

- Labels are about 1.5× larger on darker plates, and the subtitle words not yet spoken are brighter (phone clarity).
- Depth of field is halved everywhere (soft hands and faces). The outdoor haze is thinner and outdoor contrast higher.
- The hologram weight label no longer counts through in-between values (it read as weight still rising). It now shows
  2.45 N at 1 g, then "4.9 N ×2 (was 2.45 N at 1 g)".
- The experiment's two lane shots are now different angles: from the left on the 1 g lane, and low from the right
  looking up the 2 g lane.
- "Pushing blood upward toward your brain" now shows the climber from above: her face, then her hand on her chest.
- Reframed shots that were blocked or too close:
  - The plaza and fountain shots (121–138 s).
  - The skyline and engineer shots.
  - The final close-up (157 s, now a longer lens and in focus).
  - The final wide, from behind him.
- In the last shot, the shopper and the jogger now stand apart, looking across the square.
- Physics caveats are now on screen: "same restitution assumed" under the bounce result, and "this bracket: rated
  2.5×" on the balcony gauge.

## Physics simplifications (stated)

- No air drag in the drop. For an 8 cm ceramic ball over 1 m it is under 1 %.
- The coefficient of restitution is the same in both lanes. That is why both first bounces reach 30 cm.
- The fountain nozzle speed is unchanged, so the jet height v²/2g halves. The narration states this assumption.
- The car uses linear springs (about 10 cm lower). A real car could reach its bump stops first.
- The balcony's 2.5× margin is illustrative and generous. Typical design factors are about 1.35–1.6.
- The body's responses (trembling, breathing, heart strain) are illustrative, not measured.

## What is still weak (honest)

- The second half repeats the plaza/fountain setting: about seven setups in the same square. The script keeps
  scenes 8–12 outside, so the shots vary the angle but not the place.
- Character animation is serviceable rather than expressive: stiff hands, and simple faces.
- The climber turns to sit in the last 0.4 s of the heart shot, so it ends on the back of her head.
- The hologram still overlaps his face for part of scene 3.
- Phone clarity improved, but it was the lowest score and has not been re-reviewed.
- 30 MiB over 180 s leaves about 1.1 Mbps for the video. Fine detail (fountain spray, grain) is softer than in the
  frames.
- The mix was checked by measurement, not by ear.
