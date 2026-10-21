# Rendering "The Boy Who Returned" on a Windows PC with an NVIDIA GPU

These steps are for the Claude session that runs on the owner's PC (Remote Control). The owner only approves
prompts; nothing here is typed by hand. All paths are under `%USERPROFILE%\Downloads\render`.

## 1. Get the code

```powershell
cd $HOME\Downloads\render
if (Test-Path oyooayman) {
  git -C oyooayman fetch origin episode/immortal-village-return-0eivfa
  git -C oyooayman checkout episode/immortal-village-return-0eivfa
  git -C oyooayman pull --ff-only
} else {
  git clone --branch episode/immortal-village-return-0eivfa https://github.com/lurkx2z/oyooayman.git
}
```

(`renders\` is ignored by git, so earlier films' renders in that folder are untouched.)

## 2. Blender 5.2 (portable, no installer, no admin rights)

```powershell
mkdir -Force $HOME\Downloads\render\tools | Out-Null
cd $HOME\Downloads\render\tools
curl.exe -L -o blender.zip https://download.blender.org/release/Blender5.2/blender-5.2.2-windows-x64.zip
Expand-Archive blender.zip -DestinationPath . -Force
.\blender-5.2.2-windows-x64\blender.exe -b --version
```

If that exact file is gone, open https://download.blender.org/release/Blender5.2/ and take the newest
`blender-5.2.*-windows-x64.zip`. The scene was built and tested with 5.2.2 LTS.

## 3. Python packages (into Blender's own Python, so nothing else is installed)

```powershell
$BPY = "$HOME\Downloads\render\tools\blender-5.2.2-windows-x64\5.2\python\bin\python.exe"
& $BPY -m ensurepip
& $BPY -m pip install scipy pyloudnorm soundfile pillow imageio-ffmpeg
```

## 4. Render

From `Downloads\render\oyooayman`:

```powershell
$BL = "$HOME\Downloads\render\tools\blender-5.2.2-windows-x64\blender.exe"
# quick motion check: 960x540, every frame, cheaper lighting (about 10-20 min)
& $BPY immortal\tools\make_film.py --blender $BL --check --out renders\immortal-village-return
# final: 1920x1080, 24 fps, 64 samples, motion blur (roughly 1 hour)
& $BPY immortal\tools\make_film.py --blender $BL --out renders\immortal-village-return
```

Both are resumable: run the same command again after a stop and it skips finished frames. After a `git pull` that
changed the scene, the script notices (a fingerprint in `frames*\STAMP.txt`) and renders those frames again.

## 5. What comes out (`renders\immortal-village-return\`)

| File | What it is |
|---|---|
| `aren_village_return.mp4` | 1920x1080, 24 fps, H.264 + AAC, under 30 MiB, subtitles burned in |
| `aren_village_return_clean.mp4` | the same without subtitles |
| `aren_village_return_check.mp4` | the quick motion check (960x540) |
| `contact_sheet.jpg`, `contact_sheet_check.jpg` | one frame per second |
| `village_return.blend` | the editable scene |
| `frames\`, `frames_check\`, `audio\` | PNG frames, sound stems, `mix.wav`, `loudness.json` |

Report the per-frame time printed by the render, and any error text in full.
