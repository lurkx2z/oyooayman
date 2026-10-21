# Project Immortal (Blender pipeline)

"What If You Could Never Die?": the story of Aren. This folder is a separate production pipeline from the Three.js
films in the rest of the repository. Everything here is built **from code** in Blender: characters, rigs, faces,
village, performances, cameras, lights and sound. Nothing is hand-keyed, so every build is identical and every
choice can be edited in a text file.

First scene: **"The Boy Who Returned"** (45 s, 16:9, 24 fps). Aren walks back into his village at dawn; his father
recognises him and steps back. Beat sheet and shot list: [`blender/scenes/PLAN.md`](blender/scenes/PLAN.md).

## One command

From the repository root, with Blender 5.2 installed:

```bash
python immortal/tools/make_film.py --blender "<path to blender>"            # final 1920x1080, 24 fps
python immortal/tools/make_film.py --blender "<path to blender>" --preview  # 640 wide, 12 fps check
```

It builds `village_return.blend`, renders every frame (resumable), synthesises the sound, and encodes
`aren_village_return.mp4` (subtitles burned in) plus `aren_village_return_clean.mp4` and a contact sheet, into
`renders/immortal-village-return/`. On an RTX-class GPU the final render takes roughly 1-2 hours; on a CPU-only
machine it is ~15-30 s per frame at preview size.

Python packages for the sound and encode steps: `pip install numpy scipy pyloudnorm soundfile pillow imageio-ffmpeg`.

## Folder map

| Path | What it is |
|---|---|
| `blender/imm/` | The reusable library (works for every future scene) |
| `blender/imm/mh.py` | Reads the vendored MakeHuman CC0 assets: base mesh, targets, skeleton, weights, face pose units |
| `blender/imm/character.py` | Body mesh from a character spec, 163-bone armature with face bones, skin weights, eyes |
| `blender/imm/build.py` | One call builds a full character: body, skin look, eyes, hair, brows, beard, outfit |
| `blender/imm/face.py` | Facial rig: 60 pose units blended in rotation space, named expressions, visemes |
| `blender/imm/anim.py` | Performance toolkit: foot-planted walking, pelvis from feet, IK targets, baking to F-curves |
| `blender/imm/body.py` | Pose vocabulary: hand shapes (per-hand curl axes), arm hang, breathing, head aim |
| `blender/imm/hair.py`, `clothes.py`, `materials.py` | Stylized hair clumps, hide clothing from fitting helpers, shaders |
| `blender/imm/village.py` | The village set: ground, forest, dome huts, fires, smoke, mist, dawn sky and sun |
| `blender/characters/*.json` | The character library: Aren, his father, three villagers (shape, skin, eyes, hair, outfit) |
| `blender/scenes/village_return.py` | The scene: blocking, every performance, cameras, per-shot lights, events for sound |
| `blender/scenes/dialogue.json` | Line timings and mouth shapes |
| `blender/render.py` | Frame renderer (ranges, stills, every Nth frame, split across processes) |
| `blender/tests/face_lab.py`, `framing.py` | Expression lab renders; where characters land in each shot camera |
| `audio/sound_design.py` | Synthesised ambience, fire, foley, breath, whispers and score; mix to -15 LUFS, TP < -1 dBTP |
| `audio/AUDIO_SPEC.json`, `tools/elevenlabs-assets.cjs` | Voice design + lines + effects via ElevenLabs (GitHub Action) |
| `tools/make_film.py`, `encode.py`, `contact_sheet.py` | Orchestration, MP4 encode (size-capped), contact sheets |
| `tools/fetch_makehuman.py`, `assets/` | Fetches and vendors the MakeHuman CC0 files used (`assets/makehuman/MANIFEST.json`) |

## Editing

- **Timing of a beat**: the numbers in `Aren.pose`, `Father.pose` (`K(t, [(time, value), ...])` curves) and the
  `SHOTS` table at the top of `village_return.py`. Rebuild (about 20 s) and render the affected range.
- **A character's look**: `blender/characters/<id>.json` (age, build, face shape targets, skin, eyes, hair).
  Check it with `blender -b -P immortal/blender/tests/face_lab.py -- --char aren --exprs neutral,hope_smile,hurt`.
- **An expression**: `EXPRESSIONS` in `blender/imm/face.py` (mixes of the 60 MakeHuman face units).
- **A camera**: the `s1` ... `s6c` functions in `build_cameras()`; each returns position, subject, framing
  offsets, lens, focus and f-stop for a frame.
- **In Blender**: open the `.blend`; the cameras switch with the timeline markers; everything is ordinary keyframes,
  IK targets (empties named `<id>_foot_L`, `_hand_R`, `_look` ...) and materials, so it can be hand-tweaked there.

## Voices

The lines are subtitled until recorded voices exist. `audio/AUDIO_SPEC.json` describes both voices (Aren, about 14;
his father, about 40) and every line; pushing a change to it runs the `immortal-audio` GitHub workflow, which
designs the voices, records two takes per line, checks them with speech-to-text and commits the files to
`audio/generated/`. `sound_design.py` then places them automatically (and ducks the score under them); update
`dialogue.json` start/end times to the recorded lengths.

## Rules kept

Pure function of time (seeded noise, no clocks); no third-party media (see [`ASSETS.md`](ASSETS.md)); the
Three.js engine and other films are untouched.
