#!/usr/bin/env bash
# =====================================================================
# ENCODE FINAL — frames + soundtrack → one H.264/AAC MP4, two-pass, sized to fit a byte budget
# (the delivery limit in this workflow is ONE file under 30 MiB — never split a film into parts).
#
#   tools/encode-final.sh /tmp/slfull /tmp/slip.wav 57.28 out.mp4 [target_MiB=27]
#
# The duration must be the FILM length (Edit.duration(); the cut length when CONFIG.edit is set).
# Video bitrate is computed from the budget (160 kbps AAC reserved). Typical results: 57 s → ~3600k,
# 68 s → ~3200k, 52 s → ~4100k, all visually clean at 1080×1920.
# Afterwards it writes <out>_check.jpg: 8 frames across the film, for a quick visual sanity check.
# =====================================================================
set -euo pipefail
FRAMES=$1; WAV=$2; DUR=$3; OUT=$4; MIB=${5:-27}
VK=$(python3 -c "print(int(($MIB * 1048576 * 8 / $DUR - 160000 - 60000) / 1000))")
echo "duration $DUR s · budget $MIB MiB → video ${VK}k + audio 160k"
LOG=$(mktemp -u /tmp/x264pass_XXXX)
EXT=$(ls "$FRAMES" | grep -m1 -o '\.\(jpg\|png\)$')
ffmpeg -loglevel error -y -framerate 30 -i "$FRAMES/f_%05d$EXT" -c:v libx264 -preset slow -b:v ${VK}k -pix_fmt yuv420p \
  -pass 1 -passlogfile "$LOG" -t "$DUR" -an -f mp4 /dev/null
ffmpeg -loglevel error -y -framerate 30 -i "$FRAMES/f_%05d$EXT" -i "$WAV" -c:v libx264 -preset slow -b:v ${VK}k -pix_fmt yuv420p \
  -pass 2 -passlogfile "$LOG" -c:a aac -b:a 160k -t "$DUR" -movflags +faststart "$OUT"
rm -f "$LOG"*
ls -la "$OUT"; ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUT"
N=$(python3 -c "print(int($DUR * 30))")
SEL=$(python3 -c "print('+'.join('eq(n\\\\,%d)' % int($N * k / 8 + 15) for k in range(8)))")
ffmpeg -loglevel error -y -i "$OUT" -vf "select='$SEL',scale=200:-1,tile=8x1" -frames:v 1 "${OUT%.*}_check.jpg"
echo "check strip: ${OUT%.*}_check.jpg"
