# Production report: "The Boy Who Returned"

Status: proof of concept, version 1 (2026-10-21). This report is kept honest: what works, what is weak, and what was
not verified.

## What was made

- A 45 s scene (1920x1080, 24 fps target) built entirely from code in Blender 5.2: Aren (about 14), his father
  (about 44) and three villagers, a prehistoric village at dawn, six story shots in ten camera set-ups, synthesised
  sound, subtitles for the five lines.
- A reusable pipeline for the series: character library (JSON specs on MakeHuman CC0 bodies), facial rig with 60 pose
  units, named expressions and visemes, foot-planted walking and IK, hand shapes, head and eye aiming, set pieces,
  render, sound, encode and contact-sheet tools, and one command (`immortal/tools/make_film.py`) that rebuilds the
  whole film.

## Verified

- The scene builds deterministically in about 20 s; every frame is a pure function of time.
- Stills from every shot were rendered and checked; framing was checked numerically (`blender/tests/framing.py`).
- The key moment (12-26.5 s) was rendered as a 480x270, 12 fps preview on the cloud CPU and watched frame by frame.
- Sound mix: -15.0 LUFS integrated, true peak -1.3 dBTP, about 10 LU loudness range, near silence while the father
  steps back.

## Not verified yet

- The full 45 s at 1080p (needs a GPU; cloud CPU renders take 15-30 s per small frame).
- Recorded voices: the ElevenLabs key has hit its 10,000-credit quota and has no sound/music permission, so the lines
  are subtitles for now.

## Known weaknesses

(Filled in after the full preview review.)
