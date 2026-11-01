#!/bin/bash
# Master the premix to -15 LUFS / -1.5 dBTP (two-pass loudnorm, linear), write mix.wav, the 192k AAC for the video and
# ../soundtrack.js (MP3 160k, base64) for the page.
set -e; cd "$(dirname "$0")"
J=$(ffmpeg -hide_banner -i out/premaster.wav -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$J" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i out/premaster.wav -af "loudnorm=I=-15:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,alimiter=limit=0.79:attack=2:release=60:level=disabled,aresample=48000" -c:a pcm_s24le out/mix.wav
ffmpeg -v error -y -i out/mix.wav -c:a aac -b:a 192k out/mix.m4a
ffmpeg -v error -y -i out/mix.wav -c:a libmp3lame -b:a 160k out/mix.mp3
python3 - <<'PY'
import base64
b = base64.b64encode(open('out/mix.mp3', 'rb').read()).decode()
open('../soundtrack.js', 'w').write("/* The film's mixed soundtrack (MP3 160k), written by sound/master.sh from sound/mix.py. */\nwindow.FILM_SOUNDTRACK = { mime: 'audio/mpeg', b64: '" + b + "' };\n")
PY
for f in out/mix.wav out/mix.m4a; do echo "$f"; ffmpeg -hide_banner -i $f -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|LRA:|Peak:)"; done
