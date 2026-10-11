# Narration timing: "What If Gravity Doubled? Episode 01" (3-minute test)

Seven Charlie clips, one per narrated scene (1, 3, 4, 6, 8, 10, 12), generated from `../NARRATION.md` word for word
(ElevenLabs, voice IKne3meq5aSn9XLyUdCD, model eleven_v4, stability 0.4, similarity 0.75, MP3 44.1 kHz 128 kb/s).
Every word was then re-timed with ElevenLabs forced alignment. The scenes marked NO NARRATION (2, 5, 7, 9, 11) have
no clip.

- `NN-sXX-*.mp3`: the clip.
- `NN-sXX-*.align.json`: every word with its start and end, in seconds from the start of the MP3.
- `timing.json`: per clip, the measured length, the first and last word, the pauses, the loudness and the fit
  against the script's suggested slot. Built from the files by measurement.
- `manifest.json`: written by the generator. Its `seconds` include MP3 padding (about 0.06 s); use
  `decoded_seconds` from `timing.json`.

| Scene | Clip | Length | Speech (first → last word) | Script slot | Fits? |
|---|---|---|---|---|---|
| 1 | `01-s01-moment.mp3` | 10.64 s | 0.14 → 10.22 s | 0:00–0:16 (16 s) | yes, 5.4 s spare |
| 3 | `02-s03-mass.mp3` | 13.44 s | 0.06 → 12.84 s | 0:25–0:43 (18 s) | yes, 4.6 s spare |
| 4 | `03-s04-experiment.mp3` | 19.04 s | 0.08 → 18.52 s | 0:43–1:05 (22 s) | yes, 3.0 s spare |
| 6 | `04-s06-body.mp3` | 16.16 s | 0.06 → 15.70 s | 1:15–1:36 (21 s) | yes, 4.8 s spare |
| 8 | `05-s08-city.mp3` | 22.88 s | 0.06 → 22.46 s | 1:47–2:10 (23 s) | only just (0.1 s spare) |
| 10 | `06-s10-question.mp3` | 20.24 s | 0.04 → 19.74 s | 2:24–2:43 (19 s) | **no, 1.2 s too long** |
| 12 | `07-s12-final.mp3` | 6.96 s | 0.06 → 6.60 s | 2:52–3:00 (8 s) | yes, 1.0 s spare |

Total: 109.4 s of clips, 105.6 s from first to last word.

## For the timeline

- **Scene 10 needs at least 20.3 s, not 19 s.** Per the script's rule ("never cut narration short"), extend the scene
  rather than trim the clip. Moving scenes 11 and 12 later by about 1.5 s makes the film about 3:01.5.
- **Scene 8 has no room for a lead-in.** The clip fills its 23 s slot, so if the plaza needs a beat before the first
  word, scene 8 has to grow too.
- **Clip 02 ends with a click** in its last 30 ms (peak −29.8 dBFS at 13.43 s, after a quiet tail). Fade every clip
  out at `fade_out_after` in `timing.json` (last word + 0.3 s). The other six clips have clean heads and tails.
- **The clips are quiet**: −28.3 to −29.3 LUFS, true peak −8.5 to −10.7 dBTP. Normalise them in the mix (the
  narrated film's voice chain brings them to about −14.6 LUFS per line).
- Pauses longer than 0.25 s inside each clip are listed in `timing.json` (`pauses_over_0_25s`). They are good cut
  points for picture changes.

Measured from the files, not listened to by ear.
