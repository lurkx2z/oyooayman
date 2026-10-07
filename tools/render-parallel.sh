#!/usr/bin/env bash
# =====================================================================
# RENDER PARALLEL — start N background workers (tools/render-frames.cjs) that together
# render every frame of a film. Returns immediately; logs go to <outdir>/worker_<from>.log.
#
#   tools/render-parallel.sh slip.html /tmp/slfull 1080 1920 [workers=4] [fps=30]
#
# Watch progress:   ls /tmp/slfull/f_*.jpg | wc -l      (total = round(film length × fps) + 1)
# All done when:    grep -c DONE /tmp/slfull/worker_*.log  shows one DONE per worker
# Re-running the same command resumes (existing frames are skipped). DRY=1 prints the plan without starting.
# Stop workers:     ps -eo pid,args | awk '$2=="node" && $3 ~ /render-frames/ {print $1}' | xargs -r kill
#                   (never `pkill -f render` — it matches and kills your own shell)
# =====================================================================
set -euo pipefail
PAGE=$1; OUT=$2; W=${3:-1080}; H=${4:-1920}; N=${5:-4}; FPS=${6:-30}
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
mkdir -p "$OUT"
# film length (cut length when the film has CONFIG.edit) read from the page itself
DUR=$(node -e "
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 270, height: 480 } });
  await p.goto('file://$ROOT/$PAGE?capture&w=270&h=480', { timeout: 300000 });
  await p.waitForFunction(() => window.SIM_READY === true, null, { timeout: 900000 });
  console.log(await p.evaluate(() => Edit.duration())); await b.close(); })();")
LAST=$(python3 -c "print(round($DUR * $FPS))")
echo "film $DUR s → frames 0..$LAST at ${W}x${H}, $N workers → $OUT"
CHUNK=$(( (LAST + N) / N ))
[[ "${DRY:-0}" == 1 ]] && { echo "(dry run: chunks of $CHUNK frames)"; exit 0; }
for ((k = 0; k < N; k++)); do
  A=$(( k * CHUNK )); B=$(( A + CHUNK - 1 )); (( B > LAST )) && B=$LAST
  (( A > LAST )) && break
  nohup node "$ROOT/tools/render-frames.cjs" "$PAGE" "$A" "$B" "$OUT" "$W" "$H" "$FPS" > "$OUT/worker_$A.log" 2>&1 &
  echo "worker $A..$B started"
done
