# Narration — ElevenLabs text-to-speech

> Status (2026-10-11): **pipeline built, real ElevenLabs call not yet verified.** The tools are tested offline (MP3
> verifier, script parsing, request shape against a local stand-in server). The first real check is
> `node tools/test-narration.cjs` on a machine that has the API key. Update this line once it passes.

Voice-over is a separate audio file made from an **approved** narration script. It does not change the engine, the
film pages or `js/audio/audioEngine.js`, and it is not part of the baked soundtrack. Narration is mixed onto the
finished MP4 at the very end (§ 5).

Files:

| File | What it does |
|---|---|
| `tools/narrate.cjs` | approved script → one MP3 per paragraph + `narration.mp3` (joined) + `manifest.json` (clip start times and durations) |
| `tools/test-narration.cjs` | the end-to-end test: one sentence → MP3 → checks it is a real, playable, non-silent MP3 |
| `.github/workflows/narration-test.yml` | runs that test on GitHub Actions (no local setup) and attaches `sample.mp3` to the run |
| `.agents/skills/text-to-speech/` | ElevenLabs' official text-to-speech skill (installed with `npx skills add elevenlabs/skills --skill text-to-speech`; `.claude/skills/text-to-speech` links to it) |

No `npm install` is needed: the tools call the documented REST endpoint
(`POST https://api.elevenlabs.io/v1/text-to-speech/<voice_id>`, header `xi-api-key`) with Node's built-in `fetch`
(Node 18+). ffmpeg on PATH adds the full decode/silence check and the joined file.

## 1. Set up the API key (once, on your Windows PC)

The key lives only in a Windows **user environment variable** named `ELEVENLABS_API_KEY`. Never paste it into a chat,
a file in this repo (the repo is public), or a web page / browser JavaScript.

1. Get the key: log in at elevenlabs.io → your profile (bottom left) → **API Keys** → **Create API key**. Copy it.
   (If it asks for permissions, *Text to Speech* access is enough.)
2. Press the **Windows key**, type `environment`, click **Edit environment variables for your account**.
3. In the top box (*User variables for …*) click **New…**
   - Variable name: `ELEVENLABS_API_KEY`
   - Variable value: paste the key
   - **OK**, then **OK** again to close the window.
4. **Close every open terminal / PowerShell / VS Code window** and open a new one (old windows don't see the new
   variable).
5. Check it without showing the key:

   ```powershell
   node -e "console.log(process.env.ELEVENLABS_API_KEY ? 'key found' : 'key MISSING')"
   ```

To change or remove the key later, use the same window (**Edit…** or **Delete**). If a key ever leaks, delete it on
elevenlabs.io and make a new one.

**Cloud sessions** (Claude Code on the web) don't see your PC's variables. To let a cloud session run narration, the
project needs a cloud environment that has `ELEVENLABS_API_KEY` as an environment variable **and** allows the domain
`api.elevenlabs.io` in its network access settings.

## 1b. Or run it on GitHub (nothing to install)

The workflow **Narration test** runs the same test on GitHub's servers with the key stored as a GitHub secret.

1. Add the key once: repo page → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
   → Name `ELEVENLABS_API_KEY`, Secret = the key → **Add secret**. GitHub hides it in logs; nobody can read it back.
2. Run it: **Actions** tab → **Narration test** → open the latest run → **Re-run all jobs**
   (or **Run workflow** once the workflow is on the default branch; you can type your own sentence there).
3. Green tick = every check passed. The run page shows a summary table; download **sample-mp3** under **Artifacts**
   (a ZIP containing `sample.mp3`).

It runs only when started by hand or when the narration tools change on a `feature/elevenlabs-narration-*` branch.

## 2. Prove it works (the test)

From the repo folder:

```bash
node tools/test-narration.cjs
```

It sends ~90 characters, saves `renders/narration-test/sample.mp3`, and checks: the file exists, contains valid MP3
frames, is at least 2 s long, decodes with ffmpeg without errors, and is not silent. It prints `TEST PASSED` only when
every check passes; then **listen to the file** (double-click it). `node tools/test-narration.cjs --selftest` checks
the checker itself offline (no key, no credits).

## 3. Write the narration script

`films/<slug>/NARRATION.md`:

```markdown
---
status: draft            # change to: approved   (the tool refuses anything else, so drafts never cost credits)
voice: JBFqnCBsd6RMkjVDRZzb   # George; optional
model: eleven_v4              # optional
gap: 0.35                     # seconds of silence between clips in narration.mp3; optional
---
# Lines starting with # are notes, not spoken.
[hook] What if gravity doubled at breakfast?

[cup] Your coffee cup now weighs twice as much.
```

- Each paragraph (blank line between) becomes one clip. `[name]` at the start names it (`01-hook.mp3`).
- One paragraph per beat in `script.js`, so each clip can be placed on its beat.
- Write numbers the way they should be said if it matters ("two g", "zero point two four seconds").
- Voices: George `JBFqnCBsd6RMkjVDRZzb` (narrative), Daniel `onwK4e9ZLuTAKqWW03F9` (authoritative),
  Sarah `EXAVITQu4vr4xnSDxMaL`, Charlotte `XB0fDUnXU5powFXDhCwa`. `eleven_v4` takes audio tags like `[whispers]`.

## 4. Generate the narration

```bash
node tools/narrate.cjs --script films/<slug>/NARRATION.md --dry-run   # shows clips + character count, sends nothing
node tools/narrate.cjs --script films/<slug>/NARRATION.md             # writes films/<slug>/narration/
node tools/narrate.cjs --text "One quick line." --out renders/line.mp3   # a single line, no script
```

- Output: `films/<slug>/narration/01-hook.mp3 …`, `narration.mp3`, `manifest.json` (each clip's `start` and `seconds`).
- Every file is verified the same way as the test; the tool exits non-zero if any file fails, and says so.
- Re-running only regenerates clips whose text (or neighbouring text, voice, model) changed. `--force` redoes all.
- Consecutive clips are sent with `previous_text`/`next_text` so the voice stays continuous across clips.

## 5. Put the narration on the film (last step, after `encode-final.sh`)

The narration starts at `<start_s>` seconds into the film; the film's own sound is ducked under the voice:

```bash
ffmpeg -i <slug>.mp4 -i films/<slug>/narration/narration.mp3 -filter_complex \
 "[1:a]aresample=48000,adelay=<start_ms>:all=1,asplit=2[vo][key];[0:a][key]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[bed];[bed][vo]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.75[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -movflags +faststart <slug>_narrated.mp4
```

The video is copied untouched. For per-beat placement, use the clip files and `manifest.json` start times instead of
the joined file. Check loudness afterwards (`PRODUCTION_WORKFLOW.md` § 8; target ≈ −16 LUFS, true peak < −1 dBTP).

## Not done yet (on purpose)

- No automation of long-form (10-minute) narration. First prove one real clip end to end.
- Narration is not played inside the HTML pages; the scene and audio systems are unchanged.
