# Face test brief: Aren's 5-8 second performance on a real character rig

Context: the owner rejected the procedural characters (built from code on a generic MakeHuman base). Before any
village or scene work, one properly rigged stylized character must carry one emotional beat, chest-up, with no
dialogue. Success = a first-time viewer can say what Aren feels without being told.

This runs on the owner's Windows PC (RTX 3060 Ti) in `C:\Users\ayman\Downloads\render`. Portable Blender 5.2.2 LTS is
in `render\tools\blender-5.2.2-windows-x64` (its Python has numpy/scipy/pillow/imageio-ffmpeg). ffmpeg is on PATH.

## 1. Get the rig (licensed, free)

- **Snow** by Blender Studio, CC-BY 4.0, free download, Blender 3.1+. Page: https://studio.blender.org/characters/snow/v2/
  (Download button, about 106 MB zip). Credit line, required wherever the film is shown:
  `Snow Rig © Blender Foundation | studio.blender.org`.
- Put it in `render\assets\blender-studio\snow\` (outside the git repo; do not commit the rig).
- Also open https://studio.blender.org/characters/storm and record exactly what it takes to download Storm (free,
  free account, or paid subscription) and which Blender version the file needs. Do not log in, sign up or pay.

## 2. Inspect the rig (report this as text)

Open the .blend in Blender 5.2.2 (background Python is fine) and list:
- the armature(s), and the face control bones grouped by area (brows, upper/lower lids, eye target/aim, cheeks,
  lip corners, upper/lower lip, jaw, tongue/teeth), with their custom properties (e.g. sliders, auto-blink, lip zip);
- the shape keys on the head/face mesh and which are driven;
- the pose library / asset-shelf poses (names), especially facial expressions, phonemes and hand poses;
- the character's look: apparent age, gender, hair, clothes, and whether the clothes are modern.
Render a turnaround of the head at 1280x720 (front, three-quarter, profile) with neutral face, plus 4 pose-library
expressions, into `oyooayman\renders\face-test\snow\inspect\`, and look at every image yourself.

## 3. The performance (5-8 s, 24 fps, chest-up)

Aren, about 14, sees his father (off screen, camera left, slightly above his eye line) after everyone believed Aren was
dead. Times are a guide; keep everything continuous, with overlapping action and no expression snapping in or out.

| Time (s) | Beat |
|---|---|
| 0.0-1.0 | Tired, neutral, eyes low and to the side. Breathing visible in the chest and shoulders. |
| 1.0-2.0 | His eyes find his father (a quick eye move first, the head follows 3-4 frames later). Recognition: lids open a little, brows lift, a small intake of breath, lips part. |
| 2.0-3.4 | A small relieved smile grows, one corner slightly first; cheeks lift, lower lids push up, the eyes soften. |
| 3.4-4.4 | He notices his father is afraid. The smile holds a beat too long; tiny eye darts between the father's eyes; the brows start to knit. |
| 4.4-5.8 | The smile fades in stages; inner brows rise and pull together (hurt); one slow blink; lower lip pushes up a touch; a small swallow. |
| 5.8-6.6 | He looks down briefly (eyes first, head dips a few degrees). |
| 6.6-8.0 | Eyes come back up to his father: hurt and confusion, brows tight. Hold, still breathing. |

Rules: use the rig's own controls (bones, sliders, shape keys through their controls) and pose-library poses as
starting points, never sculpted per-frame fixes. Natural blinks (every 2-4 s, plus the slow one), eye saccades, both
eyes converging on the same target, small head and neck motion all the way through. Everything keyed in a script so it
can be re-run: save it as `oyooayman\immortal\face_test\snow_performance.py` (run with
`blender -b <rig.blend> -P snow_performance.py -- --out <folder>`).

Look: Aren is a prehistoric boy at dawn. If the rig wears modern clothes, hide them and give the body a simple worn
hide/leather material, or frame so the garment reads as a plain dark tunic. Skin: warm tan, keep the rig's texture
detail. Hair: dark, messy if the rig allows (otherwise keep the rig's hair and note it). Light: low warm key from camera
right (sun), soft cool fill, a rim; background a soft out-of-focus dawn gradient (no village). Camera about 85 mm,
eyes on the upper third, father's eye line just off camera left.

Render: EEVEE, 1920x1080 (at least 1280x720), 24 fps, 64 samples, motion blur on, AgX. Encode H.264 (CRF 16, yuv420p)
to `renders\face-test\snow\aren_face_test.mp4`.

## 4. Check before reporting

Look at the frames yourself: the smile peak, the hurt peak, the look down, both blinks, and 6 evenly spaced frames.
Check for teeth or tongue through the lips, lids through the eyeballs, eyes not converging, hair or clothes intersecting
the body, texture or material errors (pink), popping between consecutive frames (compare neighbouring frames around
each beat), and anything that looks dead or doll-like. Fix and re-render (up to three rounds), then report.

## 5. Deliverables (in `renders\face-test\snow\`)

- `aren_face_test.mp4` and the PNG frames
- `closeups\`: neutral front, three-quarter, smile peak, hurt peak (full-resolution PNGs)
- `rig_controls.png`: a screenshot of Blender's UI in pose mode with the face controls visible (run Blender with its
  window and use its screenshot operator, or any method that works)
- `CONTROLS.md`: which controls were animated, at which times, and the pose-library poses used
- `LICENSE.txt`: the CC-BY credit line and the source URL

## 6. Report back (text)

Rig facts from step 2; Storm download requirements; render time per frame; file list with sizes; one sentence on each
checked frame; an honest verdict (does the emotion read without dialogue? what still looks wrong?); and whether this
PC can push to GitHub without a sign-in prompt (`git config --get credential.helper`, and whether a credential for
github.com is stored; do not trigger a sign-in).
