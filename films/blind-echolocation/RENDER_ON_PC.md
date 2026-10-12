# Render the final film on a PC with a graphics card

The cloud renders this film in software graphics, which takes many hours. On a PC with a graphics card,
`render-gpu.cjs` renders the same frames on the GPU. The frames go straight into the video, so there are no
15,000 image files on disk. One command does everything.

Output, in `renders/blind-echolocation/` inside the repo folder (that folder is git-ignored):

| File | What |
|---|---|
| `blind-echolocation_final_1080p.mp4` | The film: 1920×1080, 30 fps, 8:23, H.264 + the mastered soundtrack (−15 LUFS, −2 dBTP) |
| `blind-echolocation_final_small.mp4` | A 1280×720 copy under 30 MiB, for sending from a phone |
| `check.jpg` | Eight frames across the film, to check the picture at a glance |

## Steps (Windows, PowerShell; the same on macOS or Linux with that system's installer)

1. **Tools.** Check `node --version` (18 or newer) and `ffmpeg -version`. If either is missing, install it, then
   open a new terminal so the PATH updates:
   - `winget install -e --id OpenJS.NodeJS.LTS`
   - `winget install -e --id Gyan.FFmpeg`
2. **Get the branch.**
   - With Git: `git clone --depth 1 --branch episode/blind-echolocation-1jaj5x https://github.com/lurkx2z/oyooayman.git`
   - Without Git: download
     `https://github.com/lurkx2z/oyooayman/archive/refs/heads/episode/blind-echolocation-1jaj5x.zip` and unzip it.

   Then `cd` into the folder.
3. **Browser for rendering.**
   `npm install --no-save playwright`, then `npx playwright install chromium`.
4. **Quick test, about a minute.**
   ```
   node films/blind-echolocation/render-gpu.cjs --to 119 --final --out renders/gpu-test
   ```
   The first line must name the real graphics card, for example `graphics: ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Ti …)`.
   Open `renders/gpu-test/check.jpg`: it should show the bedroom with the title.
5. **The film.** Run `node films/blind-echolocation/render-gpu.cjs`.
   - Every minute it prints the frames done, the speed and the time left.
   - Keep the PC awake and plugged in while it runs.
   - If it stops (sleep, a closed window), run the same command again: finished 15-second segments are kept.
6. **When it prints `ALL DONE`**, the two MP4s and `check.jpg` are in `renders/blind-echolocation/`.

## If something goes wrong

- **`no GPU browser`**: update the graphics driver, then try `--gpu headed`. A browser window opens; leave it alone
  while it renders. Don't use `--gpu software`, which is the slow cloud path.
- **The speed is lower than expected**: try `--workers 6` on a CPU with 8 or more cores, or `--workers 3` if
  the PC struggles.
- **`ffmpeg not found`**: open a new terminal after installing it, or pass `--ffmpeg "C:\path\to\ffmpeg.exe"`.

The script only reads the repo and writes inside `renders/`. It changes nothing else.
