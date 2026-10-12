#!/usr/bin/env bash
# =====================================================================
# MAKE ZIP — packages blind-echolocation.html as a self-contained, runnable folder (unzip, double-click, Space).
#   films/blind-echolocation/make-zip.sh <out.zip> <folder-name> [<cut seconds>] [<mastered wav>]
# With a cut, the packaged page ends the film there (window.BE_CUT: a checkpoint preview). With a WAV, the page's
# soundtrack is baked from that (mastered) file, so the sound plays at once; without one it is rendered and baked
# from the page's live mix.
# =====================================================================
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$(realpath -m "$1")"; NAME="$2"; CUT="${3:-}"; WAV="${4:-}"
TMP="$(mktemp -d)"; D="$TMP/$NAME"; mkdir -p "$D"
cd "$ROOT"
cp style.css "$D/"; cp -r fonts lib "$D/"
mkdir -p "$D/films/blind-echolocation"
cp films/blind-echolocation/*.js "$D/films/blind-echolocation/"
# the engine files the page loads
for f in $(grep -o 'src="js/[^"]*"' blind-echolocation.html | sed 's/src="//; s/"$//'); do mkdir -p "$D/$(dirname "$f")"; cp "$f" "$D/$f"; done
PAGE="$D/blind-echolocation.html"
cp blind-echolocation.html "$PAGE"
if [ -n "$CUT" ]; then
  sed -i "s|<script src=\"lib/three.bundle.min.js\"></script>|<script>window.BE_CUT = $CUT;</script>\n<script src=\"lib/three.bundle.min.js\"></script>|" "$PAGE"
  grep -q "BE_CUT = $CUT" "$PAGE"
fi
# bake the soundtrack for exactly this page (its fingerprint includes the cut)
cp "$PAGE" "$ROOT/.bake-tmp.html"
trap 'rm -f "$ROOT/.bake-tmp.html"; rm -rf "$TMP"' EXIT
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
if [ -z "$WAV" ]; then
  # render the page's mix, set it to -15 LUFS and limit the peaks (-2 dBFS: the MP3 adds a little overshoot)
  node films/blind-echolocation/render-stems.cjs "$TMP/mix" mix --page .bake-tmp.html
  I=$(ffmpeg -hide_banner -nostats -i "$TMP/mix/mix.wav" -af ebur128 -f null - 2>&1 | awk '/I:/{v=$2} END{print v}')
  ffmpeg -y -v error -i "$TMP/mix/mix.wav" -af "volume=$(python3 -c "print(-15.0 - ($I))")dB,alimiter=limit=0.794:attack=1:release=60:level=false" -c:a pcm_s24le "$TMP/master.wav"
  ffmpeg -hide_banner -nostats -i "$TMP/master.wav" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak|LRA):" || true
  WAV="$TMP/master.wav"
fi
node tools/bake-soundtrack.cjs --page .bake-tmp.html --out "$D/films/blind-echolocation/soundtrack.js" ${WAV:+--wav "$WAV"}
cat > "$D/HOW TO RUN.txt" <<EOF
WHAT IF YOU WENT BLIND... AND LEARNED TO SEE WITH SOUND?${CUT:+  (preview: the first $CUT seconds)}

1. Unzip this folder anywhere.
2. Double-click blind-echolocation.html (Chrome works best).
3. Click, or press Space, to play. The sound is built in.

Keys: Space play/pause · R restart · F fullscreen · H hide the buttons · M mute · arrows step
EOF
rm -f "$OUT"; (cd "$TMP" && zip -qr "$OUT" "$NAME")
echo "wrote $OUT ($(du -h "$OUT" | cut -f1))"
