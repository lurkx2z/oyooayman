#!/usr/bin/env bash
# =====================================================================
# PREVIEW SHEETS — 1-frame-per-second contact sheets from a rendered frame folder (f_00000.jpg …,
# as written by tools/render-parallel.sh / render-frames.cjs). This is the main input for reviewer agents.
#
#   tools/preview-sheets.sh /tmp/slip_prev 15 /tmp/slip_rev/sheet [per_sheet=11] [cols=6]
#     → /tmp/slip_rev/sheet_0.jpg, sheet_1.jpg, …  (each frame labelled with its film second)
#   arg 2 = the fps the frames were rendered at (15 for a preview, 30 for a final render)
# (tools/contact-sheet.sh does the same for stills named t_*.jpg)
# =====================================================================
set -euo pipefail
D=$1; FPS=$2; OUT=$3; PER=${4:-11}; COLS=${5:-6}
mkdir -p "$(dirname "$OUT")"
N=$(ls "$D"/f_*.jpg | wc -l)
SECS=$(( (N - 1) / FPS ))
tmp=$(mktemp -d); k=0; sheet=0
for ((s = 0; s <= SECS; s++)); do
  f=$(printf "%s/f_%05d.jpg" "$D" $(( s * FPS )))
  [[ -f "$f" ]] || continue
  ffmpeg -v error -y -i "$f" -vf "scale=270:480,drawtext=text='${s}s':x=6:y=6:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.6" "$tmp/$(printf %03d $k).jpg"
  k=$((k + 1))
  if (( k == PER || s == SECS )); then
    ffmpeg -v error -y -framerate 1 -i "$tmp/%03d.jpg" -vf "tile=${COLS}x$(( (k + COLS - 1) / COLS )):padding=4" -frames:v 1 "${OUT}_${sheet}.jpg"
    echo "wrote ${OUT}_${sheet}.jpg ($k frames)"
    rm -f "$tmp"/*.jpg; k=0; sheet=$((sheet + 1))
  fi
done
rm -rf "$tmp"
