# Episode report: What If You Went Blind… And Learned to See With Sound?

The channel's first long-form film: a 16:9 animated science documentary, 1920×1080, 30 fps, **8:23 (503.14 s)**.
Page: `blind-echolocation.html`. Plan: [`PLAN.md`](PLAN.md). Approved screenplay: [`SCREENPLAY.md`](SCREENPLAY.md).

## Why it is 8:23, not 7:00

The fourteen narration clips (Charlie, made once by the narration thread, 408 s of voice) are longer than the
screenplay's estimate in twelve of the fourteen scenes. The owner's rules: the voice is never cut or sped up, and every
NO NARRATION section stays. So each scene runs a short lead-in, its clip, then its silent section, and the scenes
grew to fit. Every picture beat is keyed to a real word time.

## How it was made

1. Narration first (the other thread), then this thread built the film around it: `build-timing.cjs` turns the clips'
   word times into the scene clock; `script.js` exposes `bnE(scene, 'word')` for every beat.
2. Fourteen scenes, one file each (`shots.js` for scene 1, `scene2.js` … `scene14.js`), each with its shot list in
   words at the top. Eight sets, built procedurally (bedroom and hallway, training centre, practice room, test room,
   street with rain and arcade, drill hall, the sound-field city, the void with the brain).
3. Sound: five stems (voice, music, ambience, foley, sfx), every place with its own acoustics (an image-source impulse
   response from the set's geometry plus the explicit echoes of the surfaces that matter), no click reused.
   `mix.js` is the gravity films' v3 dynamic approach: music ducks 8 dB under the voice (attack 0.22 s, release
   0.8 s), ambience less, a dynamics map lifts the street, the rain, the café and the silences.
4. Checkpoint 1 (the first 33 s) was shared early; the full film was then built scene by scene with stills checks.
5. Three independent reviews from contact sheets (a frame every 2.5 s), the transcript and the timeline; then two
   fix passes (below).
6. Final: frames rendered at 1920×1080 (4 workers), the mix rendered from the page, mastered to −15 LUFS with a
   true-peak limiter, encoded H.264 + AAC.

## Independent reviews (scores as given, before the fixes)

| Reviewer | Scores |
|---|---|
| Viewer / retention | viewer 6, retention 5, story 7, phone/desktop clarity 4 |
| Director of photography | visual 5, cinematography 5, character 4, acoustic visualisation 6, continuity 6 |
| Science / representation | science 8, representation 8, clarity 8 |

The fixes were not re-scored by the reviewers.

## What was fixed after the reviews

- **Clarity of the sound view**: stronger, slower pulses in scene 1 (the alarm, the car, the steps); the room comes back
  faintly on "Your room hasn't disappeared"; the leftover picture in every sound view is greyed (sound carries no
  colour) and the street views are darker (a shop sign was legible, which contradicted scene 6).
- **Labels**: bigger label type; the "slowed" tag fades in and out once per run of shots instead of popping per cut; the
  cut-away in scene 1 says it is a cut-away; scene 13's tags say "A METAPHOR".
- **Science**: the hallway trace card now peaks where the wall really is (4.1 ms, flutter at 8.2 and 12.3 ms); the final
  click's echoes match the hallway's geometry (far wall 1.18 m ≈ 7 ms); the "5.8 ms at the wall" box leaves before the
  narrator says "twelve"; the ten-week study card shows both groups improving equally; the cues card says
  "stronger = closer, bigger or harder"; no face drawn in the sound view of the practice room; the "perfect picture"
  moment in scene 6 is now really the picture, labelled "what sight gives, not what an echo gives"; the vision region
  lights on the word "regions".
- **The climax (scene 12)**: brighter, longer-lived returns, and a memory map that keeps what each click found (the
  obstacle, the bay, the opening) until she walks through; a label for "lights out for us, nothing changes for her".
- **Framing**: the phone stays in view when she silences it (scene 14), heads no longer cut in the wall-tap close-up
  (scene 2), the anechoic room and the column insert; the café door two-shot now shows their faces; the final hallway
  shot shows the cane unfolding.
- **Weather**: the sky starts closing at the end of scene 9, so "Then it starts raining" plays under grey light; the
  macro drop lands at the start of its shot; the sheet of heavier rain reads as a grey veil sweeping the street.
- **Scene 13**: the sound city about one stop brighter; the camera comes closer to the man on the bridge.
- **Costumes**: the friend, a passer-by and the rain extras no longer wear colours close to hers.
- **Mix**: ambience beds that sat at the voice's level in scenes 7, 9, 10 and 11 pulled under it; the silences of
  scenes 12 and 13 lifted (music, sfx); the door to the warm hallway opens louder in scene 14.

## What is still weak (honest)

- Character animation is stiff (walks, the sighted-guide arm, a crouched walk in the test room); hands and faces are
  simple.
- Some sound views still lean on abstract shells and discs; the "three surfaces" lesson repeats between scenes 3, 4 and 6.
- The brain cutaway shows the two brains at different angles, and the amber-to-cyan stream could be read as a literal
  pathway (the label says it is an illustration of imaging findings).
- In scene 11 the friend lights up as a whole body in the sound view.
- Small artefacts: the cardigan hem flickers against the top in a few wide shots (it is the shared character's
  geometry, which this film does not change), a little shadow acne on a sleeve, one plain navy rectangle in scene 1.
- Labels sometimes sit close to the subtitle band.
- The mix was checked by measurement, not by ear.
- Long-form retention is unproven: the reviewers' retention score (5) was the lowest before the fixes.

## Deliverables

Everything is in the project's shared folder `blind-echolocation/` (and the source on this branch):

| What | Where |
|---|---|
| Final film, 1920×1080, 30 fps, H.264 + AAC | `blind-echolocation_final_1080p.mp4` |
| A small copy under 30 MiB (for sending from a phone) | `blind-echolocation_final_small.mp4` |
| Playable film (unzip, open `blind-echolocation.html`, press Space; sound baked in) | `blind-echolocation_film.zip` |
| Final mix (stereo, mastered) and the narration track as it sits in the mix | `audio/blind-echolocation_final_mix.flac`, `audio/blind-echolocation_narration_track.flac` |
| The fourteen voice clips with their word timings (made by the narration thread, untouched) | `narration/` |
| Screenplay, transcript, subtitles (SRT, VTT), master timeline (MD, JSON) | `docs/` (also in this folder of the repo) |
| Contact sheets, one per scene, a frame every 2.5 s from the final render | `contact-sheets/scene01.jpg … scene14.jpg` |
| This report | `docs/EPISODE_REPORT.md` |

Mix as delivered: −15.1 LUFS integrated, −1.7 dBTP true peak, loudness range 5.5 LU; the narrator sits at about the same loudness in every scene, the street, rain and café beds 8–10 LU under it, the silent sections from near-silence (the anechoic room) to the rain taking over (about 2 LU above the voice).

## Render note

The final frames are rendered in software WebGL (no GPU in the cloud container): 15,094 frames at 1920×1080 with four
workers, about 0.3 frames a second, so the render takes most of a night. The sound-view shader was made 2–3× faster for
this (its loops now stop at the slots in use; the frames are pixel-identical to before).
On a PC with a graphics card the same film renders in one command, `node films/blind-echolocation/render-gpu.cjs`
(steps in [`RENDER_ON_PC.md`](RENDER_ON_PC.md)). It uses the mastered soundtrack committed as `final-soundtrack.m4a`
(AAC 256k, −15.1 LUFS, −2.0 dBTP); the small copy copies `small-soundtrack.m4a` (AAC 128k, −15.2 LUFS, −1.6 dBTP).
