#!/usr/bin/env bash
# =====================================================================
# CONTACT SHEET — tile the stills from tools/stills.cjs (t_*.jpg) into one labelled image,
# in time order. Use it to review a whole film at a glance, and as the main input for
# independent reviewer agents (they cannot watch video; they read images).
#
#   tools/contact-sheet.sh /tmp/stills 6 /tmp/sheet.jpg
# =====================================================================
set -euo pipefail
d=$1; c=$2; o=$3; i=0; tmp=$(mktemp -d)
for f in $(ls "$d"/t_*.jpg | sort -t_ -k2 -g); do
  n=$(printf "%03d" $i); lab=$(basename "$f" .jpg | sed 's/t_//')
  ffmpeg -v error -y -i "$f" -vf "scale=270:480,drawtext=text='$lab':x=6:y=6:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6" "$tmp/$n.jpg"
  i=$((i + 1))
done
ffmpeg -v error -y -framerate 1 -i "$tmp/%03d.jpg" -vf "tile=${c}x$(( (i + c - 1) / c )):padding=4" -frames:v 1 "$o"
rm -rf "$tmp"; echo "wrote $o ($i frames)"
